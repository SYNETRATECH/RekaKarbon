"""
Central Configuration Module for RekaKarbon ML Engine.
Manages global defaults, model hyperparameters, environment variable overrides, and reproducibility parameters.
"""

import os
from dataclasses import dataclass, field
from typing import Any, Dict

from dotenv import load_dotenv

# Load local .env file automatically
load_dotenv()

# Central Default Random Seed for reproducibility across generation, training, and evaluation
DEFAULT_RANDOM_STATE: int = int(
    os.getenv("RANDOM_STATE") or os.getenv("ML_RANDOM_STATE") or 20260830
)


def get_random_state(override: int | None = None) -> int:
    """
    Returns the provided random_state override if non-None,
    otherwise falls back to the central DEFAULT_RANDOM_STATE.
    """
    return override if override is not None else DEFAULT_RANDOM_STATE


def _parse_max_samples() -> str | float | int:
    val = os.getenv("ML_MAX_SAMPLES")
    if val is None or not val:
        return "auto"
    if val.isdigit():
        return int(val)
    try:
        return float(val)
    except ValueError:
        return val


@dataclass
class IsolationForestConfig:
    """Hyperparameters and configuration for IsolationForest model."""

    n_estimators: int = field(default_factory=lambda: int(os.getenv("ML_N_ESTIMATORS", "100")))
    contamination: float = field(
        default_factory=lambda: float(os.getenv("ML_CONTAMINATION", "0.15"))
    )
    max_samples: str | float | int = field(default_factory=_parse_max_samples)
    max_features: float = field(default_factory=lambda: float(os.getenv("ML_MAX_FEATURES", "1.0")))
    bootstrap: bool = field(
        default_factory=lambda: os.getenv("ML_BOOTSTRAP", "false").lower() in ("true", "1")
    )
    n_jobs: int = field(default_factory=lambda: int(os.getenv("ML_N_JOBS", "1")))
    random_state: int = field(default_factory=lambda: DEFAULT_RANDOM_STATE)

    def to_dict(self) -> Dict[str, Any]:
        """Returns hyperparameters as a dictionary for Scikit-Learn IsolationForest instantiation."""
        return {
            "n_estimators": self.n_estimators,
            "contamination": self.contamination,
            "max_samples": self.max_samples,
            "max_features": self.max_features,
            "bootstrap": self.bootstrap,
            "n_jobs": self.n_jobs,
            "random_state": self.random_state,
        }


@dataclass
class DatasetConfig:
    """Configuration defaults for synthetic data generation and dataset splits."""

    default_n_samples: int = field(
        default_factory=lambda: int(os.getenv("ML_DEFAULT_N_SAMPLES", "2500"))
    )
    default_anomaly_ratio: float = field(
        default_factory=lambda: float(os.getenv("ML_DEFAULT_ANOMALY_RATIO", "0.15"))
    )
    train_ratio: float = 0.70
    val_ratio: float = 0.15
    test_ratio: float = 0.15


@dataclass
class QualityGateConfig:
    """Quality gate thresholds for automated evaluation and model deployment."""

    min_overall_f1: float = field(
        default_factory=lambda: float(os.getenv("ML_MIN_OVERALL_F1", "0.85"))
    )
    min_overall_recall: float = field(
        default_factory=lambda: float(os.getenv("ML_MIN_OVERALL_RECALL", "0.88"))
    )
    min_under_reporting_recall: float = field(
        default_factory=lambda: float(os.getenv("ML_MIN_UNDER_REPORTING_RECALL", "0.92"))
    )
    max_false_positive_rate: float = field(
        default_factory=lambda: float(os.getenv("ML_MAX_FALSE_POSITIVE_RATE", "0.10"))
    )
    min_roc_auc: float = field(default_factory=lambda: float(os.getenv("ML_MIN_ROC_AUC", "0.90")))
    min_avg_precision: float = field(
        default_factory=lambda: float(os.getenv("ML_MIN_AVG_PRECISION", "0.60"))
    )
    max_calibration_error: float = field(
        default_factory=lambda: float(os.getenv("ML_MAX_CALIBRATION_ERROR", "0.15"))
    )
    max_crossfold_f1_std: float = field(
        default_factory=lambda: float(os.getenv("ML_MAX_CROSSFOLD_F1_STD", "0.05"))
    )

    def to_dict(self) -> Dict[str, float]:
        """Returns thresholds dictionary for Quality Gate check."""
        return {
            "min_overall_f1": self.min_overall_f1,
            "min_overall_recall": self.min_overall_recall,
            "min_under_reporting_recall": self.min_under_reporting_recall,
            "max_false_positive_rate": self.max_false_positive_rate,
            "min_roc_auc": self.min_roc_auc,
            "min_avg_precision": self.min_avg_precision,
            "max_calibration_error": self.max_calibration_error,
            "max_crossfold_f1_std": self.max_crossfold_f1_std,
        }


@dataclass
class RetrainingConfig:
    """Configuration for the scheduled continuous retraining pipeline."""

    feedback_pool_path: str = field(
        default_factory=lambda: os.getenv(
            "ML_FEEDBACK_POOL_PATH", "data/production/feedback_pool.csv"
        )
    )
    min_real_records_to_trigger: int = field(
        default_factory=lambda: int(os.getenv("ML_MIN_REAL_RECORDS", "100"))
    )
    real_blend_weight: float = field(
        default_factory=lambda: float(os.getenv("ML_REAL_BLEND_WEIGHT", "0.20"))
    )
    psi_drift_threshold: float = field(
        default_factory=lambda: float(os.getenv("ML_PSI_DRIFT_THRESHOLD", "0.20"))
    )
    psi_warning_threshold: float = field(
        default_factory=lambda: float(os.getenv("ML_PSI_WARNING_THRESHOLD", "0.10"))
    )
    model_backup_dir: str = field(
        default_factory=lambda: os.getenv("ML_MODEL_BACKUP_DIR", "models/backup")
    )
    retraining_log_path: str = field(
        default_factory=lambda: os.getenv("ML_RETRAINING_LOG_PATH", "models/retraining_log.jsonl")
    )
    scheduled_retrain_days: int = field(
        default_factory=lambda: int(os.getenv("ML_SCHEDULED_RETRAIN_DAYS", "7"))
    )

    def to_dict(self) -> Dict[str, Any]:
        """Returns retraining configuration as a serializable dictionary."""
        return {
            "feedback_pool_path": self.feedback_pool_path,
            "min_real_records_to_trigger": self.min_real_records_to_trigger,
            "real_blend_weight": self.real_blend_weight,
            "psi_drift_threshold": self.psi_drift_threshold,
            "psi_warning_threshold": self.psi_warning_threshold,
            "model_backup_dir": self.model_backup_dir,
            "retraining_log_path": self.retraining_log_path,
            "scheduled_retrain_days": self.scheduled_retrain_days,
        }


@dataclass
class PathsConfig:
    """Paths configuration for model artifacts, data directories, and report outputs."""

    models_dir: str = field(default_factory=lambda: os.getenv("ML_MODELS_DIR", "models"))
    reports_dir: str = field(default_factory=lambda: os.getenv("ML_REPORTS_DIR", "models/reports"))
    data_raw_dir: str = field(default_factory=lambda: os.getenv("ML_DATA_RAW_DIR", "data/raw"))
    data_splits_dir: str = field(
        default_factory=lambda: os.getenv("ML_DATA_SPLITS_DIR", "data/splits")
    )
    data_processed_dir: str = field(
        default_factory=lambda: os.getenv("ML_DATA_PROCESSED_DIR", "data/processed")
    )


@dataclass
class MLConfig:
    """Master ML engine configuration holding all sub-configurations."""

    model: IsolationForestConfig = field(default_factory=IsolationForestConfig)
    dataset: DatasetConfig = field(default_factory=DatasetConfig)
    quality_gate: QualityGateConfig = field(default_factory=QualityGateConfig)
    paths: PathsConfig = field(default_factory=PathsConfig)
    retraining: RetrainingConfig = field(default_factory=RetrainingConfig)


def get_ml_config() -> MLConfig:
    """Factory function returning active master MLConfig instance."""
    return MLConfig()


def get_isolation_forest_config(
    contamination: float | None = None,
    n_estimators: int | None = None,
    random_state: int | None = None,
) -> IsolationForestConfig:
    """Returns an IsolationForestConfig with optional parameter overrides."""
    cfg = IsolationForestConfig()
    if contamination is not None:
        cfg.contamination = contamination
    if n_estimators is not None:
        cfg.n_estimators = n_estimators
    if random_state is not None:
        cfg.random_state = random_state
    return cfg


def get_dataset_config() -> DatasetConfig:
    """Returns active DatasetConfig instance."""
    return DatasetConfig()


def get_quality_gate_config() -> QualityGateConfig:
    """Returns active QualityGateConfig instance."""
    return QualityGateConfig()


def get_paths_config() -> PathsConfig:
    """Returns active PathsConfig instance."""
    return PathsConfig()


def get_retraining_config() -> RetrainingConfig:
    """Returns active RetrainingConfig instance."""
    return RetrainingConfig()
