"""
Pipeline Builder and Trainer for Carbon Anomaly Detection.
Follows standard Scikit-Learn Pipeline and RobustScaler + IsolationForest.
"""

import os
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
from ..data.generator import EmissionDataGenerator
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
    save_dir: str = "models",
    n_samples: int | None = None,
    contamination: float | None = None,
    random_state: int | None = None,
    model_config: IsolationForestConfig | None = None,
) -> Tuple[Pipeline, pd.DataFrame]:
    """Generates synthetic training data, trains the pipeline, and saves to disk."""
    ml_cfg = get_ml_config()
    samples = n_samples if n_samples is not None else ml_cfg.dataset.default_n_samples
    contam = contamination if contamination is not None else ml_cfg.model.contamination
    seed = get_random_state(random_state)
    target_dir = save_dir or ml_cfg.paths.models_dir
    os.makedirs(target_dir, exist_ok=True)

    generator = EmissionDataGenerator(random_state=seed)
    df = generator.generate_dataset(n_samples=samples, anomaly_ratio=contam)

    X = df
    pipeline = build_anomaly_pipeline(
        contamination=contam, random_state=seed, model_config=model_config
    )
    pipeline.fit(X)

    model_path = os.path.join(target_dir, "anomaly_pipeline.pkl")
    joblib.dump(pipeline, model_path)
    print(f"Trained and saved pipeline to {model_path}")

    return pipeline, df


def load_pipeline(model_path: str = "models/anomaly_pipeline.pkl") -> Pipeline:
    """Loads an existing pipeline from disk, or trains a new one if not found."""
    if not os.path.exists(model_path):
        pipeline, _ = train_and_save_pipeline(save_dir=os.path.dirname(model_path) or "models")
        return pipeline
    return joblib.load(model_path)


def main() -> None:
    from ..config import DEFAULT_RANDOM_STATE
    from ..evaluation.evaluator import ModelEvaluator, generate_model_metadata
    from ..inference.predictor import CarbonAnomalyPredictor
    from .onnx_exporter import export_pipeline_to_onnx

    print("Starting End-to-End RekaKarbon ML Pipeline Training...")
    pipeline, train_df = train_and_save_pipeline(
        save_dir="models", n_samples=2500, contamination=0.15
    )

    print("\nExporting Pipeline to ONNX...")
    export_pipeline_to_onnx(pipeline, output_path="models/anomaly_pipeline.onnx")

    print("\nEvaluating Retrained Pipeline Quality Gates...")
    predictor = CarbonAnomalyPredictor(
        model_pkl_path="models/anomaly_pipeline.pkl",
        onnx_path="models/anomaly_pipeline.onnx",
        use_onnx=True,
    )
    generator = EmissionDataGenerator(random_state=DEFAULT_RANDOM_STATE)
    _, _, test_df = generator.generate_train_val_test_splits(n_total=1000, anomaly_ratio=0.15)

    evaluator = ModelEvaluator(predictor)
    eval_results = evaluator.evaluate(test_df)
    generate_model_metadata(eval_results, output_path="models/model_metadata.json")

    if eval_results["quality_gate"]["passed"]:
        print("[SUCCESS] Pipeline Retraining and Quality Gate Verification PASSED!")
    else:
        print("[FAILED] Quality Gate Verification FAILED!")


if __name__ == "__main__":
    main()
