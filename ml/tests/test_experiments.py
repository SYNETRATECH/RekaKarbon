"""Model benchmark harness, metrics, and candidate registry tests."""

import numpy as np
import pandas as pd
import pytest

from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.experiments import (
    BenchmarkConfig,
    build_candidate,
    build_leaderboard,
    compute_metrics,
    decision_threshold,
    expected_calibration_error,
    run_benchmark,
)
from rekakarbon_ml.experiments.candidates import CANDIDATE_FACTORIES
from rekakarbon_ml.training.transformers import EmissionFeatureEngineer

CORE_CANDIDATES = [
    "isolation_forest",
    "robust_zscore",
    "elliptic_envelope",
    "pca_qresidual",
    "gaussian_mixture",
    "lof",
    "hbos",
    "gradient_boosting_ceiling",
]


@pytest.fixture(scope="module")
def feature_data():
    gen = EmissionDataGenerator(random_state=20260830)
    df = gen.generate_dataset(
        n_samples=500,
        anomaly_ratio=0.2,
        severity_distribution={"mild": 0.3, "moderate": 0.4, "strong": 0.3},
    )
    transformer = EmissionFeatureEngineer()
    X = np.asarray(transformer.transform(df), dtype=float)
    y = df["is_anomaly"].to_numpy().astype(int)
    idx = np.arange(X.shape[0])
    rng = np.random.RandomState(7)
    val_idx = rng.choice(idx, size=150, replace=False)
    train_idx = np.setdiff1d(idx, val_idx)
    return X[train_idx], y[train_idx], X[val_idx], y[val_idx]


def test_metrics_basic_bundle(feature_data):
    _, _, X_val, y_val = feature_data
    scores = np.abs(X_val).sum(axis=1)
    metrics = compute_metrics(
        y_val,
        scores,
        threshold=float(np.quantile(scores, 0.8)),
        anomaly_types=np.array(["NORMAL"] * len(y_val)),
        severity_levels=np.array(["none"] * len(y_val)),
    )
    assert metrics["n_samples"] == len(y_val)
    assert 0.0 <= metrics["roc_auc"] <= 1.0
    assert 0.0 <= metrics["pr_auc"] <= 1.0
    assert 0.0 <= metrics["ece"] <= 1.0
    assert "mild" in metrics["per_severity_recall"]


def test_metrics_perfect_separation():
    y = np.r_[np.zeros(160, dtype=int), np.ones(40, dtype=int)]
    scores = np.r_[
        np.random.RandomState(1).uniform(0.0, 0.4, 160),
        np.random.RandomState(2).uniform(0.6, 1.0, 40),
    ]
    metrics = compute_metrics(y, scores, threshold=0.5)
    assert metrics["roc_auc"] == pytest.approx(1.0, abs=0.05)
    assert metrics["recall"] == pytest.approx(1.0)
    assert metrics["false_positive_rate"] == pytest.approx(0.0)


def test_expected_calibration_error_bounds(feature_data):
    _, _, X_val, y_val = feature_data
    scores = np.abs(X_val).sum(axis=1)
    norm = (scores - scores.min()) / (scores.max() - scores.min() + 1e-9)
    ece = expected_calibration_error(y_val, norm)
    assert 0.0 <= ece <= 1.0


def test_decision_threshold_within_score_range(feature_data):
    _, _, X_val, y_val = feature_data
    scores = np.abs(X_val).sum(axis=1)
    t = decision_threshold(y_val, scores)
    assert np.min(scores) <= t <= np.max(scores)


@pytest.mark.parametrize("name", CORE_CANDIDATES)
def test_core_candidates_fit_and_score(feature_data, name):
    X_train, y_train, X_val, _ = feature_data
    det = build_candidate(name, random_state=42)
    det.contamination = 0.15
    det.fit(X_train, y_train)
    scores = det.score_samples(X_val)
    assert scores.shape == (X_val.shape[0],)
    assert np.all(np.isfinite(scores))


def test_invalid_candidate_rejected():
    with pytest.raises(KeyError):
        build_candidate("does_not_exist")


def test_registry_contains_all_core_candidates():
    for name in CORE_CANDIDATES:
        assert name in CANDIDATE_FACTORIES


def test_benchmark_harness_smoke(tmp_path):
    cfg = BenchmarkConfig(
        n_samples=600,
        anomaly_ratio=0.15,
        n_folds=2,
        contamination_sweep=[0.15],
        candidates=["isolation_forest", "hbos"],
        holdout_ratio=0.2,
        random_state=7,
        output_dir=str(tmp_path),
    )
    artifacts = run_benchmark(cfg)
    leaderboard = pd.DataFrame(artifacts["leaderboard"])
    assert {"candidate", "holdout_auc", "promotable", "onnx_exportable"}.issubset(
        leaderboard.columns
    )
    assert len(leaderboard) == 2
    assert "benchmark_results.json" in {p.name for p in tmp_path.iterdir()}
    assert "leaderboard.csv" in {p.name for p in tmp_path.iterdir()}
    assert set(leaderboard["candidate"]) == {"isolation_forest", "hbos"}


def test_benchmark_registers_severity_recall(tmp_path):
    cfg = BenchmarkConfig(
        n_samples=600,
        anomaly_ratio=0.2,
        n_folds=2,
        contamination_sweep=[0.15],
        candidates=["isolation_forest"],
        holdout_ratio=0.2,
        random_state=3,
        output_dir=str(tmp_path),
    )
    artifacts = run_benchmark(cfg)
    fold_df = pd.DataFrame(artifacts["fold_results"])
    assert "per_severity_recall" in fold_df.columns
    leaderboard = pd.DataFrame(artifacts["leaderboard"])
    assert set(leaderboard["candidate"]) == {"isolation_forest"}


def test_leaderboard_promotable_gating():
    summary = pd.DataFrame(
        [
            {
                "candidate": "isolation_forest",
                "family": "baseline",
                "onnx_exportable": True,
                "contamination": 0.15,
                "roc_auc_mean": 0.95,
                "roc_auc_std": 0.01,
                "f1_mean": 0.8,
                "recall_mild_mean": 0.5,
                "recall_moderate_mean": 0.7,
                "recall_strong_mean": 0.9,
            },
            {
                "candidate": "pca_qresidual",
                "family": "statistical",
                "onnx_exportable": True,
                "contamination": 0.15,
                "roc_auc_mean": 0.93,
                "roc_auc_std": 0.02,
                "f1_mean": 0.75,
                "recall_mild_mean": 0.45,
                "recall_moderate_mean": 0.65,
                "recall_strong_mean": 0.85,
            },
            {
                "candidate": "hbos",
                "family": "statistical",
                "onnx_exportable": False,
                "contamination": 0.15,
                "roc_auc_mean": 0.99,
                "roc_auc_std": 0.01,
                "f1_mean": 0.9,
                "recall_mild_mean": 0.8,
                "recall_moderate_mean": 0.9,
                "recall_strong_mean": 0.98,
            },
            {
                "candidate": "gradient_boosting_ceiling",
                "family": "supervised",
                "onnx_exportable": True,
                "contamination": 0.15,
                "roc_auc_mean": 0.99,
                "roc_auc_std": 0.01,
                "f1_mean": 0.9,
                "recall_mild_mean": 0.8,
                "recall_moderate_mean": 0.9,
                "recall_strong_mean": 0.98,
            },
        ]
    )
    holdout = {
        "isolation_forest@0.15": {"metrics": {"roc_auc": 0.95}},
        "pca_qresidual@0.15": {"metrics": {"roc_auc": 0.97}},
        "hbos@0.15": {"metrics": {"roc_auc": 0.99}},
        "gradient_boosting_ceiling@0.15": {"metrics": {"roc_auc": 0.99}},
    }
    lb = build_leaderboard(summary, holdout)
    elig = lb[lb["candidate"] == "pca_qresidual"]
    assert bool(elig.iloc[0]["promotable"])
    non_onnx = lb[lb["candidate"] == "hbos"]
    assert bool(non_onnx.iloc[0]["promotable"]) is False
    supervised = lb[lb["candidate"] == "gradient_boosting_ceiling"]
    assert bool(supervised.iloc[0]["promotable"]) is False
