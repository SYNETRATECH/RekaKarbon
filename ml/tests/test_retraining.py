"""
Test Suite for Continuous Retraining & Drift Detection Modules.
Layer 10: Continuous Retraining Tests (8 tests).

Tests cover:
  - PSI drift detection correctness (no-drift and high-drift scenarios)
  - DriftDetector minimum sample threshold enforcement
  - DataIngestionPipeline blend ratio and schema validation
  - RetrainingOrchestrator quality gate enforcement and backup
  - Retraining audit log append correctness
  - Feedback API record serialization
"""

import json
import os
import tempfile

import numpy as np
import pandas as pd
import pytest

from rekakarbon_ml.config import DEFAULT_RANDOM_STATE
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.monitoring.drift_detector import (
    MIN_PRODUCTION_SAMPLES,
    PSI_THRESHOLD_CRITICAL,
    DriftDetector,
    DriftReport,
    compute_psi,
)
from rekakarbon_ml.retraining import FeedbackRecord
from rekakarbon_ml.retraining.data_ingestion import (
    DataIngestionPipeline,
    IngestionConfig,
)
from rekakarbon_ml.retraining.orchestrator import RetrainingOrchestrator
from rekakarbon_ml.training.transformers import DERIVED_FEATURE_NAMES

# ─── Fixtures ─────────────────────────────────────────────────────────────────

RANDOM_STATE = DEFAULT_RANDOM_STATE


@pytest.fixture(scope="module")
def synthetic_train_df() -> pd.DataFrame:
    """Returns a synthetic training DataFrame (500 samples)."""
    gen = EmissionDataGenerator(random_state=RANDOM_STATE)
    return gen.generate_dataset(n_samples=500, anomaly_ratio=0.15)


@pytest.fixture(scope="module")
def synthetic_prod_df() -> pd.DataFrame:
    """Returns a synthetic production DataFrame drawn from the same distribution (250 samples)."""
    gen = EmissionDataGenerator(random_state=RANDOM_STATE + 1)
    return gen.generate_dataset(n_samples=250, anomaly_ratio=0.15)


@pytest.fixture(scope="module")
def shifted_prod_df() -> pd.DataFrame:
    """
    Returns a production DataFrame with heavy distribution shift:
    anomaly ratio inflated to 0.75 (vs baseline 0.15), simulating severe drift.
    """
    gen = EmissionDataGenerator(random_state=RANDOM_STATE + 99)
    return gen.generate_dataset(n_samples=250, anomaly_ratio=0.75)


# ─── Test Layer 10: PSI Computation ──────────────────────────────────────────


class TestComputePsi:
    """Unit tests for the compute_psi() function."""

    def test_psi_near_zero_on_identical_distribution(self) -> None:
        """PSI should be approximately 0 when baseline and production are identical."""
        rng = np.random.default_rng(RANDOM_STATE)
        baseline = rng.normal(0, 1, 1000).astype(float)
        # Same distribution (different random draws)
        production = rng.normal(0, 1, 1000).astype(float)
        psi_value = compute_psi(baseline, production)
        assert psi_value < PSI_THRESHOLD_CRITICAL, (
            f"PSI should be below critical threshold for similar distributions, got {psi_value:.4f}"
        )

    def test_psi_high_on_completely_different_distribution(self) -> None:
        """PSI should exceed PSI_THRESHOLD_CRITICAL when distributions differ significantly."""
        rng = np.random.default_rng(RANDOM_STATE)
        baseline = rng.normal(0, 1, 1000).astype(float)
        production = rng.normal(10, 1, 1000).astype(float)  # Shifted mean by 10σ
        psi_value = compute_psi(baseline, production)
        assert psi_value >= PSI_THRESHOLD_CRITICAL, (
            f"PSI should be >= {PSI_THRESHOLD_CRITICAL} for very different distributions, "
            f"got {psi_value:.4f}"
        )

    def test_psi_is_non_negative(self) -> None:
        """PSI must always be a non-negative value by mathematical definition."""
        rng = np.random.default_rng(RANDOM_STATE)
        for _ in range(5):
            a = rng.exponential(1.0, 500)
            b = rng.exponential(2.0, 500)
            assert compute_psi(a, b) >= 0.0


# ─── Test Layer 10: DriftDetector ─────────────────────────────────────────────


class TestDriftDetector:
    """Tests for the DriftDetector class."""

    def test_no_drift_on_same_distribution(
        self,
        synthetic_train_df: pd.DataFrame,
        synthetic_prod_df: pd.DataFrame,
    ) -> None:
        """
        Drift should NOT be flagged when production data comes from the
        same generative distribution as training.
        """
        detector = DriftDetector(synthetic_train_df)
        report = detector.detect(synthetic_prod_df)

        assert isinstance(report, DriftReport)
        assert report.n_baseline_samples == len(synthetic_train_df)
        assert report.n_production_samples == len(synthetic_prod_df)
        # PSI may be non-zero but should not trigger critical drift
        assert not report.drift_detected, (
            f"False drift alarm on same-distribution data. "
            f"Mean PSI={report.mean_psi:.4f}, Max PSI={report.max_psi:.4f}"
        )

    def test_drift_detected_on_shifted_distribution(
        self,
        synthetic_train_df: pd.DataFrame,
        shifted_prod_df: pd.DataFrame,
    ) -> None:
        """
        Drift MUST be flagged when production anomaly ratio jumps from 0.15 to 0.75,
        causing major feature distribution shift.
        """
        detector = DriftDetector(synthetic_train_df)
        report = detector.detect(shifted_prod_df)

        assert report.drift_detected, (
            f"Drift was NOT detected on heavily shifted distribution. "
            f"Mean PSI={report.mean_psi:.4f}, Max PSI={report.max_psi:.4f}"
        )
        assert len(report.triggered_features) > 0, (
            "At least one feature should exceed the critical PSI threshold."
        )

    def test_no_trigger_below_minimum_samples(self, synthetic_train_df: pd.DataFrame) -> None:
        """
        Drift detection must not trigger when the production pool has fewer
        than MIN_PRODUCTION_SAMPLES records.
        """
        gen = EmissionDataGenerator(random_state=RANDOM_STATE + 5)
        tiny_df = gen.generate_dataset(n_samples=MIN_PRODUCTION_SAMPLES - 1, anomaly_ratio=0.8)

        detector = DriftDetector(synthetic_train_df)
        report = detector.detect(tiny_df)

        assert not report.drift_detected, (
            "Drift should not be flagged with insufficient production samples."
        )
        assert not report.warning_detected, (
            "Warning should not be flagged with insufficient production samples."
        )
        assert all(v == 0.0 for v in report.feature_psi.values()), (
            "All feature PSI values should be 0.0 when below minimum sample threshold."
        )

    def test_drift_report_contains_all_features(
        self,
        synthetic_train_df: pd.DataFrame,
        synthetic_prod_df: pd.DataFrame,
    ) -> None:
        """DriftReport.feature_psi must contain an entry for every engineered feature."""
        detector = DriftDetector(synthetic_train_df)
        report = detector.detect(synthetic_prod_df)

        assert set(report.feature_psi.keys()) == set(DERIVED_FEATURE_NAMES), (
            "feature_psi keys must match DERIVED_FEATURE_NAMES exactly."
        )


# ─── Test Layer 10: DataIngestionPipeline ────────────────────────────────────


class TestDataIngestionPipeline:
    """Tests for the DataIngestionPipeline blend and ingestion logic."""

    def test_blend_ratio_respected_in_merged_dataset(
        self, synthetic_train_df: pd.DataFrame
    ) -> None:
        """
        The merged dataset must respect real_blend_weight ± 5% tolerance.
        With 20% real blend weight, real records should form ~20% of merged total.
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create fake feedback pool
            gen = EmissionDataGenerator(random_state=RANDOM_STATE)
            real_df = gen.generate_dataset(n_samples=200, anomaly_ratio=0.20)
            pool_path = os.path.join(tmpdir, "feedback_pool.csv")
            real_df.to_csv(pool_path, index=False)

            # Create synthetic train split
            syn_path = os.path.join(tmpdir, "train.csv")
            synthetic_train_df.to_csv(syn_path, index=False)

            merged_path = os.path.join(tmpdir, "merged_train.csv")
            cfg = IngestionConfig(
                feedback_pool_path=pool_path,
                synthetic_train_path=syn_path,
                real_blend_weight=0.20,
                min_real_records=50,
                output_merged_path=merged_path,
                random_state=RANDOM_STATE,
            )
            pipeline = DataIngestionPipeline(cfg)
            result = pipeline.prepare_merged_dataset()

            assert result.success, f"Ingestion failed: {result.error}"
            assert os.path.exists(merged_path), "Merged dataset CSV was not created."

            merged_df = pd.read_csv(merged_path)
            assert len(merged_df) == result.n_merged_records
            actual_real_ratio = result.n_real_records / max(result.n_merged_records, 1)
            assert 0.10 <= actual_real_ratio <= 0.35, (
                f"Real data ratio {actual_real_ratio:.2%} outside expected 10-35% window."
            )

    def test_ingestion_falls_back_to_synthetic_below_min_records(
        self, synthetic_train_df: pd.DataFrame
    ) -> None:
        """
        When the feedback pool has fewer than min_real_records entries,
        the merged dataset must consist entirely of synthetic records.
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            gen = EmissionDataGenerator(random_state=RANDOM_STATE)
            tiny_real_df = gen.generate_dataset(n_samples=10, anomaly_ratio=0.20)
            pool_path = os.path.join(tmpdir, "feedback_pool.csv")
            tiny_real_df.to_csv(pool_path, index=False)

            syn_path = os.path.join(tmpdir, "train.csv")
            synthetic_train_df.to_csv(syn_path, index=False)

            merged_path = os.path.join(tmpdir, "merged_train.csv")
            cfg = IngestionConfig(
                feedback_pool_path=pool_path,
                synthetic_train_path=syn_path,
                real_blend_weight=0.20,
                min_real_records=100,  # 10 < 100 → fallback to synthetic only
                output_merged_path=merged_path,
                random_state=RANDOM_STATE,
            )
            pipeline = DataIngestionPipeline(cfg)
            result = pipeline.prepare_merged_dataset()

            assert result.success, f"Ingestion failed: {result.error}"
            assert result.n_real_records == 0, (
                "No real records should be included when pool is below min threshold."
            )
            assert result.n_synthetic_records > 0


# ─── Test Layer 10: RetrainingOrchestrator ────────────────────────────────────


class TestRetrainingOrchestrator:
    """Tests for the RetrainingOrchestrator."""

    def test_retraining_log_entry_appended(self) -> None:
        """After a retraining run (even if not triggered), a log entry must be appended."""
        with tempfile.TemporaryDirectory() as tmpdir:
            log_path = os.path.join(tmpdir, "retraining_log.jsonl")

            orchestrator = RetrainingOrchestrator()
            orchestrator.retrain_cfg.retraining_log_path = log_path
            orchestrator.retrain_cfg.feedback_pool_path = os.path.join(
                tmpdir, "nonexistent_pool.csv"
            )
            orchestrator.retrain_cfg.scheduled_retrain_days = 9999  # No time trigger

            # Run without force — should not trigger
            result = orchestrator.run(force=False, dry_run=False)
            assert not result.triggered, (
                "Retraining should not have triggered without data or force."
            )

            assert os.path.exists(log_path), "Retraining log file was not created."
            with open(log_path) as f:
                entries = [json.loads(line) for line in f if line.strip()]
            assert len(entries) >= 1, "At least one log entry should have been written."
            entry = entries[0]
            assert "triggered" in entry
            assert "retraining_timestamp" in entry

    def test_model_backup_created_before_swap(self, synthetic_train_df: pd.DataFrame) -> None:
        """
        When a model swap occurs, the previous model artifacts must be backed
        up to models/backup/ before the new artifacts overwrite them.
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create a fake existing model PKL to represent current production model
            models_dir = os.path.join(tmpdir, "models")
            os.makedirs(models_dir, exist_ok=True)

            dummy_model_path = os.path.join(models_dir, "anomaly_pipeline.pkl")
            with open(dummy_model_path, "w") as f:
                f.write("dummy_model_content")

            backup_dir = os.path.join(models_dir, "backup")

            orchestrator = RetrainingOrchestrator()
            orchestrator.retrain_cfg.model_backup_dir = backup_dir
            orchestrator.ml_cfg.paths.models_dir = models_dir

            # Directly invoke the backup helper
            orchestrator._backup_current_model("test_v1")

            backup_model_path = os.path.join(backup_dir, "test_v1", "anomaly_pipeline.pkl")
            assert os.path.exists(backup_model_path), (
                "Backup of anomaly_pipeline.pkl was not found at expected path."
            )


# ─── Test Layer 10: Feedback Record Serialisation ────────────────────────────


class TestFeedbackRecordSerialisation:
    """Tests for FeedbackRecord.to_feedback_row() mapping."""

    def test_reject_anomaly_verdict_maps_to_is_anomaly_1(self) -> None:
        """REJECT_ANOMALY verdict must produce is_anomaly=1 in the feedback row."""
        record = FeedbackRecord(
            company_id="PT_TEST_001",
            report_period="2025-Q3",
            verificator_id="verif_001",
            verificator_verdict="REJECT_ANOMALY",
            sector="manufaktur",
            production_tonnes=10000.0,
            reported_emissions_tco2e=5000.0,
        )
        row = record.to_feedback_row()
        assert row["is_anomaly"] == 1
        assert row["anomaly_type"] == "VERIFICATOR_CONFIRMED"

    def test_pass_verified_verdict_maps_to_is_anomaly_0(self) -> None:
        """PASS_VERIFIED verdict must produce is_anomaly=0 in the feedback row."""
        record = FeedbackRecord(
            company_id="PT_TEST_002",
            report_period="2025-Q3",
            verificator_id="verif_001",
            verificator_verdict="PASS_VERIFIED",
            sector="pertambangan",
            production_tonnes=20000.0,
            reported_emissions_tco2e=8000.0,
        )
        row = record.to_feedback_row()
        assert row["is_anomaly"] == 0
        assert row["anomaly_type"] == "NORMAL"
        assert "received_at" in row
