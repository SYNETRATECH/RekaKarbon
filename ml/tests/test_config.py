"""
Unit Tests for Central ML Engine Configuration Module (rekakarbon_ml.config).
"""

import pytest

from rekakarbon_ml.config import (
    DEFAULT_RANDOM_STATE,
    DatasetConfig,
    IsolationForestConfig,
    MLConfig,
    PathsConfig,
    QualityGateConfig,
    get_dataset_config,
    get_isolation_forest_config,
    get_ml_config,
    get_paths_config,
    get_quality_gate_config,
    get_random_state,
)


def test_default_random_state() -> None:
    """Verifies default random seed and fallback behavior."""
    assert DEFAULT_RANDOM_STATE == 20260830
    assert get_random_state() == DEFAULT_RANDOM_STATE
    assert get_random_state(42) == 42


def test_isolation_forest_config_defaults() -> None:
    """Verifies default parameters for IsolationForestConfig."""
    cfg = IsolationForestConfig()
    assert cfg.n_estimators == 100
    assert cfg.contamination == 0.15
    assert cfg.max_samples == "auto"
    assert cfg.max_features == 1.0
    assert cfg.bootstrap is False
    assert cfg.n_jobs == 1
    assert cfg.random_state == DEFAULT_RANDOM_STATE

    params = cfg.to_dict()
    assert params["n_estimators"] == 100
    assert params["contamination"] == 0.15
    assert params["n_jobs"] == 1


def test_isolation_forest_config_env_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verifies environment variable overrides for IsolationForestConfig."""
    monkeypatch.setenv("ML_N_ESTIMATORS", "200")
    monkeypatch.setenv("ML_CONTAMINATION", "0.08")
    monkeypatch.setenv("ML_N_JOBS", "4")
    monkeypatch.setenv("ML_BOOTSTRAP", "true")

    cfg = IsolationForestConfig()
    assert cfg.n_estimators == 200
    assert cfg.contamination == 0.08
    assert cfg.n_jobs == 4
    assert cfg.bootstrap is True


def test_dataset_config_defaults_and_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verifies DatasetConfig defaults and environment overrides."""
    cfg = get_dataset_config()
    assert cfg.default_n_samples == 2500
    assert cfg.default_anomaly_ratio == 0.15

    monkeypatch.setenv("ML_DEFAULT_N_SAMPLES", "5000")
    monkeypatch.setenv("ML_DEFAULT_ANOMALY_RATIO", "0.20")
    new_cfg = DatasetConfig()
    assert new_cfg.default_n_samples == 5000
    assert new_cfg.default_anomaly_ratio == 0.20


def test_quality_gate_config_defaults() -> None:
    """Verifies QualityGateConfig thresholds and dictionary output."""
    cfg = get_quality_gate_config()
    assert cfg.min_overall_f1 == 0.85
    assert cfg.min_overall_recall == 0.88
    assert cfg.min_under_reporting_recall == 0.92
    assert cfg.max_false_positive_rate == 0.10

    d = cfg.to_dict()
    assert d["min_overall_f1"] == 0.85
    assert d["max_false_positive_rate"] == 0.10


def test_paths_config_defaults() -> None:
    """Verifies PathsConfig defaults."""
    cfg = get_paths_config()
    assert cfg.models_dir == "models"
    assert cfg.reports_dir == "models/reports"


def test_master_ml_config() -> None:
    """Verifies master MLConfig aggregates all sub-configs."""
    master = get_ml_config()
    assert isinstance(master, MLConfig)
    assert isinstance(master.model, IsolationForestConfig)
    assert isinstance(master.dataset, DatasetConfig)
    assert isinstance(master.quality_gate, QualityGateConfig)
    assert isinstance(master.paths, PathsConfig)


def test_isolation_forest_override_helper() -> None:
    """Verifies get_isolation_forest_config helper with direct argument overrides."""
    cfg = get_isolation_forest_config(contamination=0.05, n_estimators=150, random_state=123)
    assert cfg.contamination == 0.05
    assert cfg.n_estimators == 150
    assert cfg.random_state == 123
