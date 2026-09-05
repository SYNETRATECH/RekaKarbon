"""
RekaKarbon ML Engine Training Module.
Exports Scikit-Learn custom transformers, model builder/trainer functions,
and ONNX serialization utilities.
"""

from .onnx_exporter import export_pipeline_to_onnx, verify_onnx_parity
from .trainer import build_anomaly_pipeline, load_pipeline, train_and_save_pipeline
from .transformers import (
    DERIVED_FEATURE_NAMES,
    FEATURE_COLUMNS,
    RAW_FEATURE_COLUMNS,
    EmissionFeatureEngineer,
)

__all__ = [
    "EmissionFeatureEngineer",
    "RAW_FEATURE_COLUMNS",
    "FEATURE_COLUMNS",
    "DERIVED_FEATURE_NAMES",
    "build_anomaly_pipeline",
    "train_and_save_pipeline",
    "load_pipeline",
    "export_pipeline_to_onnx",
    "verify_onnx_parity",
]
