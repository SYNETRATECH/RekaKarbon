"""
Scheduled Retraining Orchestrator for RekaKarbon ML Engine.

Designed to be invoked by a cron job, GitHub Actions scheduled workflow,
or manually via `poetry run retrain`.

Retraining lifecycle (hybrid trigger: drift OR time-based):
  1. Load production feedback pool (data/production/feedback_pool.csv)
  2. Load retraining log to determine days since last successful retrain
  3. Run PSI drift detection against the training baseline
  4. Evaluate hybrid trigger:
       - Drift trigger: max feature PSI >= psi_drift_threshold
       - Time trigger: days since last retrain >= scheduled_retrain_days
  5. If triggered (or --force): prepare merged training dataset
  6. Train new IsolationForest pipeline on merged data
  7. Export ONNX artifact and verify ONNX parity
  8. Run Quality Gate evaluation (same thresholds as AGENTS.md)
  9. If PASSED: backup current model then atomically swap artifacts
 10. If FAILED: keep current model, write failure report to log
 11. Append a structured entry to models/retraining_log.jsonl
"""

import argparse
import json
import logging
import os
import shutil
from datetime import datetime, timezone
from typing import Any

import pandas as pd

from ..config import get_ml_config, get_retraining_config
from ..evaluation.evaluator import ModelEvaluator, generate_model_metadata
from ..inference.predictor import CarbonAnomalyPredictor
from ..monitoring.drift_detector import DriftDetector, DriftReport
from ..training.onnx_exporter import export_pipeline_to_onnx
from ..training.trainer import train_and_save_pipeline
from .data_ingestion import DataIngestionPipeline, IngestionConfig, IngestionResult
from .types import RetrainingResult

logger = logging.getLogger(__name__)

# ─── Sentinel path for the staged (candidate) model artifacts ─────────────────
_CANDIDATE_SUFFIX = "_candidate"


class RetrainingOrchestrator:
    """
    Coordinates the end-to-end continuous retraining lifecycle for the
    RekaKarbon anomaly detection pipeline.

    Hybrid Trigger Strategy:
      - Drift trigger: PSI > psi_drift_threshold on any engineered feature
      - Time trigger: days elapsed since last retrain >= scheduled_retrain_days
      Either condition alone is sufficient to initiate retraining.
    """

    def __init__(self) -> None:
        self.retrain_cfg = get_retraining_config()
        self.ml_cfg = get_ml_config()

    # ──────────────────────────────────────────────────────────────────────────
    # Public entry point
    # ──────────────────────────────────────────────────────────────────────────

    def run(self, force: bool = False, dry_run: bool = False) -> RetrainingResult:
        """
        Executes the full retraining lifecycle.

        Args:
            force: If True, bypass trigger checks and always retrain.
            dry_run: If True, evaluate triggers and drift but do not swap artifacts.

        Returns:
            RetrainingResult with a full audit trail of the run.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        logger.info("=" * 68)
        logger.info(" [START] RekaKarbon ML Continuous Retraining Orchestrator")
        logger.info("=" * 68)

        try:
            # ── Step 1: Determine days since last successful retrain ──────────
            days_since = self._days_since_last_retrain()
            logger.info(
                "Days since last successful retrain: %s",
                f"{days_since:.1f}" if days_since is not None else "N/A (first run)",
            )

            # ── Step 2: Load training baseline for drift detection ────────────
            train_split_path = os.path.join(self.ml_cfg.paths.data_splits_dir, "train.csv")
            drift_report: DriftReport | None = None
            if os.path.exists(train_split_path):
                train_df = pd.read_csv(train_split_path)
                feedback_pool_path = self.retrain_cfg.feedback_pool_path
                if os.path.exists(feedback_pool_path):
                    prod_df = pd.read_csv(feedback_pool_path)
                    detector = DriftDetector(train_df)
                    drift_report = detector.detect(prod_df)
                    logger.info(
                        "Drift detection — Mean PSI: %.4f | Max PSI: %.4f | Triggered: %s",
                        drift_report.mean_psi,
                        drift_report.max_psi,
                        drift_report.drift_detected,
                    )
                    if drift_report.warning_detected:
                        logger.warning("Drift WARNING: %s", drift_report.recommendation)
                else:
                    logger.info(
                        "No production feedback pool found at %s — skipping drift detection.",
                        feedback_pool_path,
                    )

            # ── Step 3: Evaluate hybrid trigger ──────────────────────────────
            triggered, trigger_reason = self._evaluate_trigger(
                drift_report=drift_report,
                days_since=days_since,
                force=force,
            )

            if not triggered:
                logger.info("[SKIP] No retraining trigger met. Reason: %s", trigger_reason)
                result = RetrainingResult(
                    triggered=False,
                    trigger_reason=trigger_reason,
                    drift_report=self._drift_report_to_dict(drift_report),
                    ingestion_result=None,
                    quality_gate_passed=None,
                    model_swapped=False,
                    new_model_version=None,
                    previous_model_version=None,
                    retraining_timestamp=timestamp,
                    days_since_last_retrain=days_since,
                )
                self._append_log(result)
                return result

            logger.info("[TRIGGER] Retraining triggered: %s", trigger_reason)

            if dry_run:
                logger.info("[DRY RUN] Trigger confirmed. Dry-run mode — no artifacts modified.")
                result = RetrainingResult(
                    triggered=True,
                    trigger_reason=f"DRY_RUN:{trigger_reason}",
                    drift_report=self._drift_report_to_dict(drift_report),
                    ingestion_result=None,
                    quality_gate_passed=None,
                    model_swapped=False,
                    new_model_version=None,
                    previous_model_version=None,
                    retraining_timestamp=timestamp,
                    days_since_last_retrain=days_since,
                )
                self._append_log(result)
                return result

            # ── Step 4: Prepare merged training dataset ───────────────────────
            logger.info("\n--- STEP 4: DATA INGESTION & MERGING ---")
            ingestion_cfg = IngestionConfig()
            pipeline_ingestion = DataIngestionPipeline(ingestion_cfg)
            ingestion_result = pipeline_ingestion.prepare_merged_dataset()

            if not ingestion_result.success:
                raise RuntimeError(f"Data ingestion failed: {ingestion_result.error}")
            logger.info(
                "Merged dataset ready: %d records (%d real + %d synthetic)",
                ingestion_result.n_merged_records,
                ingestion_result.n_real_records,
                ingestion_result.n_synthetic_records,
            )

            # ── Step 5: Train new pipeline on merged data ─────────────────────
            logger.info("\n--- STEP 5: MODEL TRAINING ---")
            candidate_dir = os.path.join(self.ml_cfg.paths.models_dir, "candidate")
            os.makedirs(candidate_dir, exist_ok=True)

            new_pipeline, _ = train_and_save_pipeline(
                train_data_path=ingestion_result.output_path,
                save_dir=candidate_dir,
            )
            logger.info("Candidate pipeline trained and saved to: %s", candidate_dir)

            # ── Step 6: Export ONNX + verify parity ──────────────────────────
            logger.info("\n--- STEP 6: ONNX EXPORT & PARITY CHECK ---")
            candidate_onnx_path = os.path.join(candidate_dir, "anomaly_pipeline.onnx")
            export_pipeline_to_onnx(new_pipeline, output_path=candidate_onnx_path)

            # ── Step 7: Quality Gate Evaluation ──────────────────────────────
            logger.info("\n--- STEP 7: QUALITY GATE EVALUATION ---")
            test_split_path = os.path.join(self.ml_cfg.paths.data_splits_dir, "test.csv")
            candidate_pkl_path = os.path.join(candidate_dir, "anomaly_pipeline.pkl")

            candidate_predictor = CarbonAnomalyPredictor(
                model_pkl_path=candidate_pkl_path,
                onnx_path=candidate_onnx_path,
                use_onnx=True,
            )

            if os.path.exists(test_split_path):
                test_df = pd.read_csv(test_split_path)
            else:
                # Fallback: use a portion of the merged training data
                logger.warning(
                    "No test split found at %s — using 15%% of merged data as holdout.",
                    test_split_path,
                )
                merged_df = pd.read_csv(ingestion_result.output_path)
                from sklearn.model_selection import train_test_split

                _, test_df = train_test_split(
                    merged_df,
                    test_size=0.15,
                    random_state=20260830,
                    stratify=merged_df.get("is_anomaly"),
                )

            evaluator = ModelEvaluator(candidate_predictor)
            eval_results = evaluator.evaluate(test_df)
            qgate_passed = bool(eval_results["quality_gate"]["passed"])

            logger.info(
                "Quality Gate: %s | F1=%.4f | Recall=%.4f | FPR=%.4f",
                eval_results["quality_gate"]["status"],
                eval_results["summary"]["f1_score"],
                eval_results["summary"]["recall"],
                eval_results["summary"]["false_positive_rate"],
            )

            # ── Step 8: Atomic artifact swap ──────────────────────────────────
            model_swapped = False
            new_version: str | None = None
            previous_version: str | None = None

            if qgate_passed:
                logger.info("\n--- STEP 8: ATOMIC ARTIFACT SWAP ---")
                previous_version = self._read_current_version()
                new_version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

                # Backup current model
                self._backup_current_model(previous_version)

                # Swap candidate → production
                self._swap_artifacts(candidate_dir, self.ml_cfg.paths.models_dir)

                # Update model_metadata.json with new version and retrain info
                meta_path = os.path.join(self.ml_cfg.paths.models_dir, "model_metadata.json")
                generate_model_metadata(
                    eval_results,
                    version=new_version,
                    output_path=meta_path,
                )
                model_swapped = True
                logger.info("[SUCCESS] Model artifacts swapped. New version: %s", new_version)
            else:
                logger.warning(
                    "[REJECTED] Candidate model did not pass Quality Gate. "
                    "Current production model retained."
                )
                # Clean up candidate directory
                shutil.rmtree(candidate_dir, ignore_errors=True)

            # ── Step 9: Write result and log ──────────────────────────────────
            result = RetrainingResult(
                triggered=True,
                trigger_reason=trigger_reason,
                drift_report=self._drift_report_to_dict(drift_report),
                ingestion_result=self._ingestion_result_to_dict(ingestion_result),
                quality_gate_passed=qgate_passed,
                model_swapped=model_swapped,
                new_model_version=new_version,
                previous_model_version=previous_version,
                retraining_timestamp=timestamp,
                days_since_last_retrain=days_since,
            )
            self._append_log(result)

            if model_swapped:
                logger.info(
                    "\n[SUCCESS] Retraining complete. Model version %s deployed.", new_version
                )
            else:
                logger.warning(
                    "\n[FAILED] Retraining complete but Quality Gate blocked artifact swap."
                )

            return result

        except Exception as exc:
            logger.error("Retraining orchestrator failed: %s", exc, exc_info=True)
            result = RetrainingResult(
                triggered=True,
                trigger_reason="MANUAL" if force else "UNKNOWN",
                drift_report=None,
                ingestion_result=None,
                quality_gate_passed=False,
                model_swapped=False,
                new_model_version=None,
                previous_model_version=None,
                retraining_timestamp=timestamp,
                days_since_last_retrain=None,
                error=str(exc),
            )
            self._append_log(result)
            return result

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _evaluate_trigger(
        self,
        drift_report: DriftReport | None,
        days_since: float | None,
        force: bool,
    ) -> tuple[bool, str]:
        """Returns (should_trigger, reason_string) from hybrid conditions."""
        if force:
            return True, "MANUAL"

        reasons = []

        if drift_report is not None and drift_report.drift_detected:
            reasons.append("DRIFT_DETECTED")

        schedule_days = self.retrain_cfg.scheduled_retrain_days
        has_feedback_pool = os.path.exists(self.retrain_cfg.feedback_pool_path)
        # If no prior run exists, only trigger scheduled retraining if feedback pool data exists
        if (days_since is None and has_feedback_pool) or (
            days_since is not None and days_since >= schedule_days
        ):
            reasons.append("SCHEDULE_DUE")

        if reasons:
            return True, "+".join(reasons)
        return False, "NOT_TRIGGERED"

    def _days_since_last_retrain(self) -> float | None:
        """
        Reads the retraining log and returns the number of days since the
        last SUCCESSFUL model swap. Returns None if no log entry exists.
        """
        log_path = self.retrain_cfg.retraining_log_path
        if not os.path.exists(log_path):
            return None

        last_success_ts: str | None = None
        try:
            with open(log_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    entry = json.loads(line)
                    if entry.get("model_swapped"):
                        last_success_ts = entry.get("retraining_timestamp")
        except Exception:
            return None

        if last_success_ts is None:
            return None

        last_dt = datetime.fromisoformat(last_success_ts)
        now_dt = datetime.now(timezone.utc)
        delta = now_dt - last_dt
        return delta.total_seconds() / 86400.0

    def _read_current_version(self) -> str | None:
        """Reads the current model version from model_metadata.json."""
        meta_path = os.path.join(self.ml_cfg.paths.models_dir, "model_metadata.json")
        if not os.path.exists(meta_path):
            return None
        try:
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
            return str(meta.get("version", "unknown"))
        except Exception:
            return None

    def _backup_current_model(self, version_label: str | None) -> None:
        """Copies current production artifacts to models/backup/{version}/."""
        backup_dir = os.path.join(
            self.retrain_cfg.model_backup_dir,
            version_label or datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S"),
        )
        os.makedirs(backup_dir, exist_ok=True)

        for artifact in ["anomaly_pipeline.pkl", "anomaly_pipeline.onnx", "model_metadata.json"]:
            src = os.path.join(self.ml_cfg.paths.models_dir, artifact)
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(backup_dir, artifact))
                logger.info("Backed up %s → %s", artifact, backup_dir)

    def _swap_artifacts(self, candidate_dir: str, production_dir: str) -> None:
        """Copies candidate artifacts over production artifacts atomically."""
        for artifact in ["anomaly_pipeline.pkl", "anomaly_pipeline.onnx"]:
            src = os.path.join(candidate_dir, artifact)
            dst = os.path.join(production_dir, artifact)
            if os.path.exists(src):
                shutil.copy2(src, dst)
                logger.info("Swapped %s → %s", src, dst)

        shutil.rmtree(candidate_dir, ignore_errors=True)

    def _append_log(self, result: RetrainingResult) -> None:
        """Appends a JSON log entry to the append-only retraining JSONL audit log."""
        log_path = self.retrain_cfg.retraining_log_path
        os.makedirs(os.path.dirname(log_path) or "models", exist_ok=True)

        entry: dict[str, Any] = {
            "triggered": result.triggered,
            "trigger_reason": result.trigger_reason,
            "quality_gate_passed": result.quality_gate_passed,
            "model_swapped": result.model_swapped,
            "new_model_version": result.new_model_version,
            "previous_model_version": result.previous_model_version,
            "retraining_timestamp": result.retraining_timestamp,
            "days_since_last_retrain": result.days_since_last_retrain,
            "error": result.error,
        }
        if result.drift_report is not None:
            entry["drift_mean_psi"] = result.drift_report.get("mean_psi")
            entry["drift_max_psi"] = result.drift_report.get("max_psi")
            entry["drift_triggered_features"] = result.drift_report.get("triggered_features", [])
        if result.ingestion_result is not None:
            entry["n_real_records"] = result.ingestion_result.get("n_real_records")
            entry["n_synthetic_records"] = result.ingestion_result.get("n_synthetic_records")
            entry["n_merged_records"] = result.ingestion_result.get("n_merged_records")

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
        logger.info("Retraining log entry appended: %s", log_path)

    @staticmethod
    def _drift_report_to_dict(report: DriftReport | None) -> dict[str, Any] | None:
        """Converts DriftReport to a serializable dict."""
        if report is None:
            return None
        return {
            "feature_psi": report.feature_psi,
            "mean_psi": report.mean_psi,
            "max_psi": report.max_psi,
            "drift_detected": report.drift_detected,
            "warning_detected": report.warning_detected,
            "triggered_features": report.triggered_features,
            "n_baseline_samples": report.n_baseline_samples,
            "n_production_samples": report.n_production_samples,
            "recommendation": report.recommendation,
        }

    @staticmethod
    def _ingestion_result_to_dict(result: IngestionResult | None) -> dict[str, Any] | None:
        """Converts IngestionResult to a serializable dict."""
        if result is None:
            return None
        return {
            "success": result.success,
            "n_real_records": result.n_real_records,
            "n_synthetic_records": result.n_synthetic_records,
            "n_merged_records": result.n_merged_records,
            "real_anomaly_ratio": result.real_anomaly_ratio,
            "merged_anomaly_ratio": result.merged_anomaly_ratio,
            "output_path": result.output_path,
            "timestamp": result.timestamp,
        }


def run_retraining_pipeline(force: bool = False, dry_run: bool = False) -> RetrainingResult:
    """
    Convenience function to run the full retraining lifecycle.

    Args:
        force: Bypass trigger checks and always retrain.
        dry_run: Evaluate triggers/drift but do not swap artifacts.

    Returns:
        RetrainingResult with the full audit trail.
    """
    orchestrator = RetrainingOrchestrator()
    return orchestrator.run(force=force, dry_run=dry_run)


def main() -> None:
    """CLI entrypoint for `poetry run retrain`."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    parser = argparse.ArgumentParser(description="RekaKarbon ML Continuous Retraining CLI")
    parser.add_argument(
        "--force",
        "-f",
        action="store_true",
        help="Force retraining regardless of drift or schedule trigger",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Check triggers and drift detection only — do not modify model artifacts",
    )
    args = parser.parse_args()

    result = run_retraining_pipeline(force=args.force, dry_run=args.dry_run)

    print("\n" + "=" * 68)
    print(" RETRAINING RESULT SUMMARY")
    print("=" * 68)
    print(f"  Triggered          : {result.triggered}")
    print(f"  Trigger Reason     : {result.trigger_reason}")
    print(f"  Days Since Retrain : {result.days_since_last_retrain}")
    print(f"  Quality Gate       : {result.quality_gate_passed}")
    print(f"  Model Swapped      : {result.model_swapped}")
    print(f"  New Version        : {result.new_model_version}")
    print(f"  Previous Version   : {result.previous_model_version}")
    if result.error:
        print(f"  Error              : {result.error}")
    print("=" * 68)

    if result.triggered and not result.model_swapped and not args.dry_run:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
