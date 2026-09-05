"""
RekaKarbon ML Engine Data Preparation & Governance Module.
Contains ingestion schemas, synthetic generators, batch validators, feature registries,
and offline preprocessing tools.
"""

from .benchmark_loader import SectorBenchmarkLoader
from .feature_registry import FEATURE_REGISTRY, FeatureSpec, generate_feature_manifest
from .generator import EmissionDataGenerator
from .preprocess import generate_dataset_summary, preprocess_dataset
from .schema import EmissionReportInput, SupportedSector, validate_emission_dict
from .severity import (
    ANOMALY_INJECTION_LADDER,
    ANOMALY_TYPES,
    SEVERITY_ORDER,
    AnomalySeverity,
    get_injection_band,
    resolve_severity,
    validate_severity_distribution,
)
from .validator import validate_raw_dataframe

__all__ = [
    "SectorBenchmarkLoader",
    "EmissionDataGenerator",
    "EmissionReportInput",
    "SupportedSector",
    "validate_emission_dict",
    "validate_raw_dataframe",
    "FEATURE_REGISTRY",
    "FeatureSpec",
    "generate_feature_manifest",
    "generate_dataset_summary",
    "preprocess_dataset",
    "ANOMALY_TYPES",
    "AnomalySeverity",
    "SEVERITY_ORDER",
    "ANOMALY_INJECTION_LADDER",
    "get_injection_band",
    "resolve_severity",
    "validate_severity_distribution",
]
