"""
Typing and Data Transfer Objects (DTOs) for the Inference Subsystem.
Provides structured contracts for CarbonAnomalyPredictor diagnostic outputs.
"""

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

VerdictType = Literal["REJECT_ANOMALY", "PASS_VERIFIED"]
PriorityType = Literal["HIGH", "MEDIUM", "LOW"]
DirectionType = Literal["MISMATCH", "BELOW_NORMAL", "ABOVE_NORMAL"]


@dataclass
class XAIDriver:
    """Individual feature contribution/driver to anomaly attribution."""

    feature_name: str
    label: str
    user_value: str
    benchmark_value: str
    impact_score: float
    direction: DirectionType | str
    unit: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class XAIBreakdown:
    """Physics and stoichiometry feature delta breakdown."""

    physical_fuel_delta_pct: float
    electricity_delta_pct: float
    fiscal_price_delta_pct: float
    sector_intensity_zscore: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class XAIReport:
    """Explainable AI report with drivers, deltas, and actionable recommendation."""

    top_anomaly_drivers: list[dict[str, Any]] = field(default_factory=list)
    breakdown: dict[str, float] = field(default_factory=dict)
    recommendation: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Scope1Diagnostic:
    reported_tco2e: float
    expected_tco2e: float
    divergence_pct: float
    score: float
    flags: list[str] = field(default_factory=list)


@dataclass
class Scope2Diagnostic:
    reported_tco2e: float
    expected_tco2e: float
    divergence_pct: float
    score: float
    flags: list[str] = field(default_factory=list)


@dataclass
class Scope3Diagnostic:
    reported_tco2e: float
    is_reported: bool
    flags: list[str] = field(default_factory=list)


@dataclass
class MathCoherenceDiagnostic:
    sum_of_scopes: float
    reported_total: float
    discrepancy_pct: float
    is_coherent: bool


@dataclass
class ScopeDiagnosticsReport:
    scope1: dict[str, Any]
    scope2: dict[str, Any]
    scope3: dict[str, Any]
    math_coherence: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PredictionResult:
    """Complete diagnostic prediction result for a single carbon emission report."""

    is_anomaly: bool
    verdict: VerdictType
    priority: PriorityType
    anomaly_score: float
    trust_score: float
    divergence_percent: float
    expected_emission_tco2e: float
    reported_emission_tco2e: float
    score_djp: float
    score_bbm: float
    score_cems: float
    flags: list[str]
    explanation: str
    scope_diagnostics: dict[str, Any]
    xai: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


__all__ = [
    "VerdictType",
    "PriorityType",
    "DirectionType",
    "XAIDriver",
    "XAIBreakdown",
    "XAIReport",
    "Scope1Diagnostic",
    "Scope2Diagnostic",
    "Scope3Diagnostic",
    "MathCoherenceDiagnostic",
    "ScopeDiagnosticsReport",
    "PredictionResult",
]
