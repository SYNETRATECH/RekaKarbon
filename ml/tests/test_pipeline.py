"""
Unit Tests for Scikit-Learn Carbon Anomaly Detection Pipeline.
"""

import numpy as np

from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.pipeline.build_pipeline import build_anomaly_pipeline
from rekakarbon_ml.pipeline.transformers import (
    DERIVED_FEATURE_NAMES,
    EmissionFeatureEngineer,
)


def test_generator_output():
    gen = EmissionDataGenerator(random_state=123)
    df = gen.generate_dataset(n_samples=100, anomaly_ratio=0.10)
    assert len(df) == 100
    assert "is_anomaly" in df.columns
    # Check essential columns are present
    assert "sector" in df.columns
    assert "production_tonnes" in df.columns
    assert "reported_emissions_tco2e" in df.columns
    assert "cost_solar_idr" in df.columns


def test_feature_engineer_shape():
    gen = EmissionDataGenerator(random_state=123)
    df = gen.generate_dataset(n_samples=20)
    fe = EmissionFeatureEngineer()
    features = fe.transform(df)
    assert features.shape == (20, len(DERIVED_FEATURE_NAMES))
    assert features.shape == (20, 15)
    assert not np.isnan(features).any()
    assert not np.isinf(features).any()


def test_pipeline_fit_predict():
    gen = EmissionDataGenerator(random_state=42)
    df = gen.generate_dataset(n_samples=200)

    pipe = build_anomaly_pipeline(contamination=0.10)
    pipe.fit(df)

    preds = pipe.predict(df)
    assert len(preds) == 200
    assert set(preds).issubset({1, -1})
