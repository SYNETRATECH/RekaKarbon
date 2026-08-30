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
