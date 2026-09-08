"""
Typing and Data Transfer Objects (DTOs) for the Monitoring Subsystem.
"""

from dataclasses import dataclass


@dataclass
class DriftReport:
    """Result of a single drift detection scan."""

    feature_psi: dict[str, float]
    mean_psi: float
    max_psi: float
    drift_detected: bool
    warning_detected: bool
    triggered_features: list[str]
    n_baseline_samples: int
    n_production_samples: int
    recommendation: str
