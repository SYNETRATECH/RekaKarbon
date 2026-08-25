"""
Unit Tests for Scikit-Learn Carbon Anomaly Detection Pipeline.
"""

import numpy as np

from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.pipeline.build_pipeline import build_anomaly_pipeline
from rekakarbon_ml.pipeline.transformers import FEATURE_COLUMNS, EmissionFeatureEngineer


def test_generator_output():
    gen = EmissionDataGenerator(random_state=123)
    df = gen.generate_dataset(n_samples=100, anomaly_ratio=0.10)
    assert len(df) == 100
    assert "is_anomaly" in df.columns
    assert set(FEATURE_COLUMNS).issubset(set(df.columns))


def test_feature_engineer_shape():
    gen = EmissionDataGenerator(random_state=123)
    df = gen.generate_dataset(n_samples=20)
    fe = EmissionFeatureEngineer()
    features = fe.transform(df)
    assert features.shape == (20, 6)
    assert not np.isnan(features).any()


def test_pipeline_fit_predict():
    gen = EmissionDataGenerator(random_state=42)
    df = gen.generate_dataset(n_samples=200)

    pipe = build_anomaly_pipeline(contamination=0.10)
    pipe.fit(df[FEATURE_COLUMNS])

    preds = pipe.predict(df[FEATURE_COLUMNS])
    assert len(preds) == 200
    assert set(preds).issubset({1, -1})
