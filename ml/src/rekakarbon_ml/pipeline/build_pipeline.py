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

from ..config import get_random_state
from ..data.generator import EmissionDataGenerator
from .transformers import EmissionFeatureEngineer


def build_anomaly_pipeline(
    contamination: float = 0.10, random_state: int | None = None
) -> Pipeline:
    """Builds a scikit-learn pipeline for feature engineering, scaling, and outlier detection."""
    seed = get_random_state(random_state)
    pipeline = Pipeline(
        [
            ("feature_engineer", EmissionFeatureEngineer()),
            ("scaler", RobustScaler()),
            (
                "detector",
                IsolationForest(
                    n_estimators=100,
                    contamination=contamination,
                    random_state=seed,
                    n_jobs=1,
                ),
            ),
        ]
    )
    return pipeline


def train_and_save_pipeline(
    save_dir: str = "models",
    n_samples: int = 2000,
    contamination: float = 0.10,
    random_state: int | None = None,
) -> Tuple[Pipeline, pd.DataFrame]:
    """Generates synthetic training data, trains the pipeline, and saves to disk."""
    seed = get_random_state(random_state)
    os.makedirs(save_dir, exist_ok=True)
    generator = EmissionDataGenerator(random_state=seed)
    df = generator.generate_dataset(n_samples=n_samples, anomaly_ratio=contamination)

    X = df
    pipeline = build_anomaly_pipeline(contamination=contamination, random_state=seed)
    pipeline.fit(X)

    model_path = os.path.join(save_dir, "anomaly_pipeline.pkl")
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
    from ..inference.predictor import CarbonAnomalyPredictor
    from .evaluator import ModelEvaluator, generate_model_metadata
    from .onnx_exporter import export_pipeline_to_onnx

    print("Starting End-to-End RekaKarbon ML Pipeline Training...")
    pipeline, train_df = train_and_save_pipeline(save_dir="models", n_samples=2500, contamination=0.15)

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
    meta = generate_model_metadata(eval_results, output_path="models/model_metadata.json")

    if eval_results["quality_gate"]["passed"]:
        print("[SUCCESS] Pipeline Retraining and Quality Gate Verification PASSED!")
    else:
        print("[FAILED] Quality Gate Verification FAILED!")



if __name__ == "__main__":
    main()