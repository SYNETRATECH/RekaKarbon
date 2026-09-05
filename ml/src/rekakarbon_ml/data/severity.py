"""
Anomaly Severity Ladder for Synthetic Data Injection.

Defines the calibrated injection magnitude bands for each anomaly archetype across
three severity tiers - ``mild``, ``moderate``, and ``strong`` - used by the
synthetic generator to parameterize how far a fraudulent report diverges from a
compliant baseline.

The ``strong`` tier reproduces the legacy injection magnitudes exactly, guaranteeing
backward compatibility for existing datasets, models, and evaluation baselines.
Mild and moderate tiers scale the divergence closer to normal behavior so downstream
ML benchmarks can measure detection sensitivity across a severity gradient.
"""

from typing import Any, Dict, Literal, Tuple, cast

import numpy as np

AnomalySeverity = Literal["mild", "moderate", "strong"]

SEVERITY_ORDER: Tuple[AnomalySeverity, ...] = ("mild", "moderate", "strong")

ANOMALY_TYPES: Tuple[str, ...] = (
    "SCOPE1_UNDERREPORTING_FRAUD",
    "SCOPE2_ELECTRICITY_MISMATCH",
    "SCOPE_MATH_DISCREPANCY",
    "FUEL_PRICE_INVOICE_FRAUD",
    "EXTREME_YOY_COLLAPSE",
    "SECTOR_INTENSITY_ANOMALY",
)

# (low, high) multiplicative reporting gap bands per anomaly archetype and severity.
# "strong" exactly matches the legacy, pre-ladder injection magnitudes.
ANOMALY_INJECTION_LADDER: Dict[AnomalySeverity, Dict[str, Tuple[float, float]]] = {
    "strong": {
        "SCOPE1_UNDERREPORTING_FRAUD": (0.18, 0.42),
        "SCOPE2_ELECTRICITY_MISMATCH": (0.15, 0.38),
        "SCOPE_MATH_DISCREPANCY": (0.40, 0.70),
        "FUEL_PRICE_INVOICE_FRAUD": (500.0, 2000.0),
        "EXTREME_YOY_COLLAPSE": (0.10, 0.25),
        "SECTOR_INTENSITY_ANOMALY": (0.08, 0.22),
    },
    "moderate": {
        "SCOPE1_UNDERREPORTING_FRAUD": (0.45, 0.65),
        "SCOPE2_ELECTRICITY_MISMATCH": (0.45, 0.62),
        "SCOPE_MATH_DISCREPANCY": (0.62, 0.82),
        "FUEL_PRICE_INVOICE_FRAUD": (3000.0, 6000.0),
        "EXTREME_YOY_COLLAPSE": (0.32, 0.48),
        "SECTOR_INTENSITY_ANOMALY": (0.30, 0.55),
    },
    "mild": {
        "SCOPE1_UNDERREPORTING_FRAUD": (0.68, 0.84),
        "SCOPE2_ELECTRICITY_MISMATCH": (0.66, 0.84),
        "SCOPE_MATH_DISCREPANCY": (0.82, 0.92),
        "FUEL_PRICE_INVOICE_FRAUD": (9000.0, 13000.0),
        "EXTREME_YOY_COLLAPSE": (0.55, 0.72),
        "SECTOR_INTENSITY_ANOMALY": (0.60, 0.85),
    },
}


def get_injection_band(
    anomaly_type: str,
    severity: AnomalySeverity,
) -> Tuple[float, float]:
    """Returns the (low, high) injection band for an archetype at a severity tier."""
    return ANOMALY_INJECTION_LADDER[severity][anomaly_type]


def resolve_severity(
    severity: str | None,
    rng: np.random.RandomState,
    severity_distribution: Dict[str, float] | None = None,
) -> AnomalySeverity:
    """
    Resolves the effective severity tier for an individual anomaly sample.

    - If ``severity`` is an explicit tier, it is returned as-is (no RNG draw), which
      keeps the random stream identical to the legacy generator when tier is "strong".
    - If ``severity`` is None and a ``severity_distribution`` mapping is provided,
      tiers are sampled proportionally.
    - Otherwise (severity None, no distribution) all tiers are equally likely.
    """
    if severity is not None:
        if severity not in SEVERITY_ORDER:
            raise ValueError(f"Invalid severity '{severity}'. Expected one of {SEVERITY_ORDER}.")
        return severity

    keys: list[str]
    probs: list[float]
    if severity_distribution:
        keys = [k for k in SEVERITY_ORDER if k in severity_distribution]
        probs = [float(severity_distribution[k]) for k in keys]
        if not keys:
            raise ValueError(
                "severity_distribution must map at least one of mild/moderate/strong to a weight."
            )
    else:
        keys = list(SEVERITY_ORDER)
        probs = [1.0 / len(keys)] * len(keys)

    total = float(sum(probs))
    probs = [p / total for p in probs]
    chosen = str(rng.choice(keys, p=probs))
    return cast(AnomalySeverity, chosen)


def validate_severity_distribution(
    severity_distribution: Dict[str, Any] | None,
) -> Dict[str, float] | None:
    """Validates and normalizes an optional severity distribution mapping."""
    if severity_distribution is None:
        return None
    normalized: Dict[str, float] = {}
    for key, value in severity_distribution.items():
        if key not in SEVERITY_ORDER:
            raise ValueError(f"Unknown severity tier '{key}'. Expected mild/moderate/strong.")
        weight = float(value)
        if weight < 0.0:
            raise ValueError(f"Severity weight for '{key}' must be non-negative.")
        normalized[key] = weight
    if sum(normalized.values()) <= 0.0:
        raise ValueError("severity_distribution weights must sum to a positive value.")
    return normalized
