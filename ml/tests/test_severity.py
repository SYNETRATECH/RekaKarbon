"""Severity ladder tests for the synthetic dataset generator (Layer: Data Governance)."""

import pytest

from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.data.severity import (
    ANOMALY_INJECTION_LADDER,
    get_injection_band,
    resolve_severity,
    validate_severity_distribution,
)


def test_generated_dataset_exposes_severity_level_column():
    gen = EmissionDataGenerator(random_state=20260830)
    df = gen.generate_dataset(n_samples=400, anomaly_ratio=0.25)
    assert "severity_level" in df.columns
    assert set(df["severity_level"].unique()) <= {"mild", "moderate", "strong", "none"}
    anomalies = df[df["is_anomaly"] == 1]
    normals = df[df["is_anomaly"] == 0]
    assert set(anomalies["severity_level"].unique()) <= {"mild", "moderate", "strong"}
    assert set(normals["severity_level"].unique()) == {"none"}


def test_default_severity_ladder_is_strong():
    gen = EmissionDataGenerator(random_state=123)
    df = gen.generate_dataset(n_samples=400, anomaly_ratio=0.25)
    anomalies = df[df["is_anomaly"] == 1]
    assert set(anomalies["severity_level"].unique()) == {"strong"}


def test_explicit_mild_severity_tier_is_applied():
    gen = EmissionDataGenerator(random_state=123)
    df = gen.generate_dataset(n_samples=400, anomaly_ratio=0.25, severity="mild")
    anomalies = df[df["is_anomaly"] == 1]
    assert set(anomalies["severity_level"].unique()) == {"mild"}


def test_severity_distribution_sampling():
    gen = EmissionDataGenerator(random_state=7)
    df = gen.generate_dataset(
        n_samples=600,
        anomaly_ratio=0.5,
        severity_distribution={"mild": 0.5, "moderate": 0.3, "strong": 0.2},
    )
    anomalies = df[df["is_anomaly"] == 1]
    tiers = anomalies["severity_level"].value_counts(normalize=True)
    assert "mild" in tiers.index and "moderate" in tiers.index and "strong" in tiers.index


def test_mild_underreport_is_closer_to_compliance_than_strong():
    """Mild underreporting retains a larger share of true emissions than strong."""
    for seed in (11, 22, 33):
        gen = EmissionDataGenerator(random_state=seed)
        mild = gen.generate_dataset(n_samples=1200, anomaly_ratio=0.5, severity="mild")
        strong = gen.generate_dataset(n_samples=1200, anomaly_ratio=0.5, severity="strong")
        m = mild[mild["anomaly_type"] == "SCOPE1_UNDERREPORTING_FRAUD"]
        s = strong[strong["anomaly_type"] == "SCOPE1_UNDERREPORTING_FRAUD"]
        if len(m) and len(s):
            mild_ratio = (m["reported_scope1_tco2e"] / m["stat_fuel_liters"]).mean()
            strong_ratio = (s["reported_scope1_tco2e"] / s["stat_fuel_liters"]).mean()
            assert mild_ratio > strong_ratio, f"seed={seed} mild={mild_ratio} strong={strong_ratio}"


def test_injection_band_monotonicity():
    """Strongest tier diverges the most from compliance; mild stays closest to normal."""
    for atype in ANOMALY_INJECTION_LADDER["strong"]:
        mild_lo, mild_hi = get_injection_band(atype, "mild")
        mod_lo, mod_hi = get_injection_band(atype, "moderate")
        s_lo, s_hi = get_injection_band(atype, "strong")
        assert s_lo < mod_lo < mild_lo
        assert s_hi < mod_hi < mild_hi


def test_invalid_severity_rejected():
    gen = EmissionDataGenerator(random_state=1)
    with pytest.raises(ValueError):
        gen.generate_dataset(n_samples=100, severity="catastrophic")
    with pytest.raises(ValueError):
        resolve_severity("extreme", gen.rng)
    with pytest.raises(ValueError):
        validate_severity_distribution({"epic": 0.5})


def test_deterministic_output_for_same_seed():
    df1 = EmissionDataGenerator(random_state=42).generate_dataset(n_samples=200)
    df2 = EmissionDataGenerator(random_state=42).generate_dataset(n_samples=200)
    pd_assert = df1.equals(df2)
    assert pd_assert
