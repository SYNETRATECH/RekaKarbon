"""
Pipeline Builder and Trainer for Carbon Anomaly Detection.
Follows standard Scikit-Learn Pipeline with RobustScaler + IsolationForest.
Supports training on persisted raw dataset splits (data/splits/train.csv) or input CSVs.
"""

import argparse
import os
import pathlib
import sys
from typing import Tuple

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler

from ..config import (
    IsolationForestConfig,
    get_isolation_forest_config,
    get_ml_config,
    get_random_state,
)
from .onnx_exporter import export_pipeline_to_onnx
from .transformers import EmissionFeatureEngineer


def build_anomaly_pipeline(
    contamination: float | None = None,
    random_state: int | None = None,
    model_config: IsolationForestConfig | None = None,
) -> Pipeline:
    """Builds a scikit-learn pipeline for feature engineering, scaling, and outlier detection."""
    if model_config is not None:
        cfg = model_config
        if contamination is not None:
            cfg.contamination = contamination
        if random_state is not None:
            cfg.random_state = random_state
    else:
        cfg = get_isolation_forest_config(contamination=contamination, random_state=random_state)

    pipeline = Pipeline(
        [
            ("feature_engineer", EmissionFeatureEngineer()),
            ("scaler", RobustScaler()),
            ("detector", IsolationForest(**cfg.to_dict())),
        ]
    )
    return pipeline


def train_and_save_pipeline(
    train_data_path: str | None = None,
    save_dir: str = "models",
    n_samples: int | None = None,
    contamination: float | None = None,
    random_state: int | None = None,
    model_config: IsolationForestConfig | None = None,
) -> Tuple[Pipeline, pd.DataFrame]:
    """
    Loads raw training dataset (or uses default data/splits/train.csv), trains the pipeline,
    and exports serialized .pkl and .onnx model artifacts.
    """
    ml_cfg = get_ml_config()
    samples = n_samples if n_samples is not None else ml_cfg.dataset.default_n_samples
    contam = contamination if contamination is not None else ml_cfg.model.contamination
    seed = get_random_state(random_state)
    target_dir = save_dir or ml_cfg.paths.models_dir
    os.makedirs(target_dir, exist_ok=True)

    default_train_split = os.path.join(ml_cfg.paths.data_splits_dir, "train.csv")

    if train_data_path and os.path.exists(train_data_path):
        print(f"Loading training data from specified path: {train_data_path}")
        df = (
            pd.read_json(train_data_path)
            if train_data_path.endswith(".json")
            else pd.read_csv(train_data_path)
        )
    elif os.path.exists(default_train_split):
        print(f"Loading training data from default split: {default_train_split}")
        df = pd.read_csv(default_train_split)
    else:
        print(
            f"No training split found at {default_train_split}. Triggering preprocessing & split pipeline..."
        )
        from ..data.preprocess import preprocess_dataset

        _, df, _, _ = preprocess_dataset(n_samples=samples, random_state=seed)

    print(f"Fitting IsolationForest Pipeline on {len(df)} training records...")
    pipeline = build_anomaly_pipeline(
        contamination=contam, random_state=seed, model_config=model_config
    )
    pipeline.fit(df)

    model_path = os.path.join(target_dir, "anomaly_pipeline.pkl")
    joblib.dump(pipeline, model_path)
    print(f"[SUCCESS] Trained and saved Scikit-Learn pipeline to {model_path}")

    # Automatically export ONNX model artifact
    onnx_path = os.path.join(target_dir, "anomaly_pipeline.onnx")
    export_pipeline_to_onnx(pipeline, output_path=onnx_path)
    print(f"[SUCCESS] Exported ONNX model artifact to {onnx_path}")

    return pipeline, df


def _enable_cross_platform_unpickling() -> None:
    """Enables unpickling of WindowsPath objects on POSIX/Linux platforms."""
    if sys.platform != "win32":
        try:
            # Map WindowsPath to PureWindowsPath on POSIX to prevent UnsupportedOperation
            pathlib.WindowsPath = pathlib.PureWindowsPath  # type: ignore
        except Exception:
            pass


def load_pipeline(model_path: str = "models/anomaly_pipeline.pkl") -> Pipeline:
    """Loads an existing pipeline from disk, or trains a new one if not found."""
    _enable_cross_platform_unpickling()
    if not os.path.exists(model_path):
        pipeline, _ = train_and_save_pipeline(save_dir=os.path.dirname(model_path) or "models")
        return pipeline
    return joblib.load(model_path)


def main() -> None:
    # Lazy imports inside CLI main to break circular import cycle:
    # predictor.py imports load_pipeline from trainer.py
    from ..evaluation.evaluator import ModelEvaluator, generate_model_metadata
    from ..inference.predictor import CarbonAnomalyPredictor

    parser = argparse.ArgumentParser(description="RekaKarbon ML Pipeline Trainer CLI")
    parser.add_argument(
        "--train-data",
        type=str,
        default=None,
        help="Path to training CSV/JSON (defaults to data/splits/train.csv)",
    )
    parser.add_argument(
        "--save-dir",
        type=str,
        default="models",
        help="Directory to save trained model artifacts",
    )
    parser.add_argument(
        "--n-samples",
        type=int,
        default=2500,
        help="Synthetic samples if generating training split",
    )
    parser.add_argument(
        "--contamination",
        type=float,
        default=0.15,
        help="Expected anomaly ratio for IsolationForest",
    )
    args = parser.parse_args()

    print("Starting RekaKarbon ML Pipeline Training...")
    pipeline, train_df = train_and_save_pipeline(
        train_data_path=args.train_data,
        save_dir=args.save_dir,
        n_samples=args.n_samples,
        contamination=args.contamination,
    )

    print("\nEvaluating Retrained Pipeline Quality Gates...")
    predictor = CarbonAnomalyPredictor(
        model_pkl_path=os.path.join(args.save_dir, "anomaly_pipeline.pkl"),
        onnx_path=os.path.join(args.save_dir, "anomaly_pipeline.onnx"),
        use_onnx=True,
    )

    test_split_path = os.path.join(get_ml_config().paths.data_splits_dir, "test.csv")
    if os.path.exists(test_split_path):
        test_df = pd.read_csv(test_split_path)
    else:
        test_df = train_df

    evaluator = ModelEvaluator(predictor)
    eval_results = evaluator.evaluate(test_df)
    meta_path = os.path.join(args.save_dir, "model_metadata.json")
    generate_model_metadata(eval_results, output_path=meta_path)

    if eval_results["quality_gate"]["passed"]:
        print("[SUCCESS] Retraining and Quality Gate Verification PASSED!")
    else:
        print("[FAILED] Quality Gate Verification FAILED!")


if __name__ == "__main__":
    main()
