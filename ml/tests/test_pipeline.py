"""
Unit & Integration Tests for Scikit-Learn Carbon Anomaly Detection Pipeline & Orchestrator.
"""

import os
import tempfile

import numpy as np

from rekakarbon_ml.config import DEFAULT_RANDOM_STATE
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.data.preprocess import preprocess_dataset
from rekakarbon_ml.pipeline.orchestrator import run_full_pipeline
from rekakarbon_ml.pipeline.trainer import build_anomaly_pipeline
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
    gen = EmissionDataGenerator(random_state=DEFAULT_RANDOM_STATE)
    df = gen.generate_dataset(n_samples=200)

    pipe = build_anomaly_pipeline(contamination=0.10)
    pipe.fit(df)

    preds = pipe.predict(df)
    assert len(preds) == 200
    assert set(preds).issubset({1, -1})


def test_preprocess_and_splits_creation():
    with tempfile.TemporaryDirectory() as tmp_dir:
        raw_dir = os.path.join(tmp_dir, "raw")
        splits_dir = os.path.join(tmp_dir, "splits")
        output_path = os.path.join(tmp_dir, "processed", "processed.csv")

        proc_df, train_df, val_df, test_df = preprocess_dataset(
            output_path=output_path,
            splits_dir=splits_dir,
            raw_dir=raw_dir,
            n_samples=100,
            random_state=42,
        )

        assert os.path.exists(os.path.join(raw_dir, "raw_emissions.csv"))
        assert os.path.exists(os.path.join(splits_dir, "train.csv"))
        assert os.path.exists(os.path.join(splits_dir, "val.csv"))
        assert os.path.exists(os.path.join(splits_dir, "test.csv"))
        assert os.path.exists(output_path)

        assert len(train_df) + len(val_df) + len(test_df) == 100
        assert len(proc_df) == 100


def test_orchestrator_execution():
    eval_results = run_full_pipeline(n_samples=100, save_plots=False)
    assert "summary" in eval_results
    assert "quality_gate" in eval_results
    assert "f1_score" in eval_results["summary"]
