"""
Continuous Retraining Module for RekaKarbon ML Engine.
Provides data ingestion from production feedback pools and the scheduled
retraining orchestrator with quality-gated atomic model artifact swapping.
"""

from .data_ingestion import (
    DataIngestionPipeline,
    FeedbackRecord,
    IngestionConfig,
)
from .orchestrator import RetrainingOrchestrator, run_retraining_pipeline
from .types import DriftReport, IngestionResult, RetrainingResult

__all__ = [
    "DataIngestionPipeline",
    "DriftReport",
    "FeedbackRecord",
    "IngestionConfig",
    "IngestionResult",
    "RetrainingOrchestrator",
    "RetrainingResult",
    "run_retraining_pipeline",
]
