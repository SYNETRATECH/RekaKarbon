"""
Typing and Data Transfer Objects (DTOs) for the Continuous Retraining Subsystem.
"""

from dataclasses import dataclass
from typing import Any

from ..monitoring.types import DriftReport


@dataclass
class IngestionResult:
    """Summary of the data ingestion and blending operation."""

    success: bool
    n_real_records: int
    n_synthetic_records: int
    n_merged_records: int
    real_anomaly_ratio: float
    merged_anomaly_ratio: float
    validation_summary: dict[str, Any]
    output_path: str
    timestamp: str
    error: str | None = None


@dataclass
class RetrainingResult:
    """Structured result of a single retraining pipeline run."""

    triggered: bool
    trigger_reason: str  # "DRIFT_DETECTED" | "SCHEDULE_DUE" | "MANUAL" | "NOT_TRIGGERED"
    drift_report: dict[str, Any] | None
    ingestion_result: dict[str, Any] | None
    quality_gate_passed: bool | None
    model_swapped: bool
    new_model_version: str | None
    previous_model_version: str | None
    retraining_timestamp: str
    days_since_last_retrain: float | None
    error: str | None = None


__all__ = [
    "DriftReport",
    "IngestionResult",
    "RetrainingResult",
]
