"""
Layer 8: Industry Archetype & Enterprise Golden Persona Scenario Tests.
Validates end-to-end model behavior, priority tiers, and diagnostics on concrete 'Company X' filings.
"""

import json
import os

import pytest

from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.simulation.scenario_runner import run_all_scenarios


@pytest.fixture(scope="module")
def predictor():
    model_dir = "models"
    pkl_path = os.path.join(model_dir, "anomaly_pipeline.pkl")
    onnx_path = os.path.join(model_dir, "anomaly_pipeline.onnx")

    return CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True,
    )


def load_scenario(filename: str) -> dict:
    scenario_path = os.path.join("data", "scenarios", filename)
    if not os.path.exists(scenario_path):
        scenario_path = os.path.join("ml", "data", "scenarios", filename)
    with open(scenario_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_scenario_semen_heavy_industry_compliant(predictor):
    """
    Company X Archetype: PT Semen Nusantara Tbk (Heavy Industry)
    Expectation:
    - High clinker calcination process emissions and coal combustion are recognized.
    - Scope 1 divergence is minimal.
    - Result is compliant with LOW/MEDIUM priority and HIGH trust score.
    """
    data = load_scenario("company_semen_heavy_industry.json")
    res = predictor.predict_single(data, validate=True)

    # Compliance assertions
    assert res["is_anomaly"] is False
    assert res["priority"] in ["low", "medium"]
    assert res["trust_score"] >= 80.0

    # Stoichiometric process check: Clinker calcination recognized in Scope 1 expected
    s1_diag = res["scope_diagnostics"]["scope1"]
    assert s1_diag["expected_tco2e"] > 250000.0
    assert s1_diag["divergence_pct"] < 15.0

    # Math coherence
    math_diag = res["scope_diagnostics"]["math_coherence"]
    assert math_diag["is_coherent"] is True
    assert math_diag["discrepancy_pct"] < 1.0


def test_scenario_banking_services_scope3_omitted(predictor):
    """
    Company X Archetype: Bank Sejahtera Nasional (Service Sector)
    Expectation:
    - 0 Scope 1 direct combustion, PLN grid power only.
    - Scope 3 is omitted (0 tCO2e), incurring ZERO false-positive penalty.
    - Result is fully compliant with LOW priority.
    """
    data = load_scenario("company_bank_services.json")
    res = predictor.predict_single(data, validate=True)

    assert res["is_anomaly"] is False
    assert res["priority"] == "low"
    assert res["trust_score"] >= 85.0

    # Scope 3 optionality validation
    s3_diag = res["scope_diagnostics"]["scope3"]
    assert s3_diag["is_reported"] is False
    assert s3_diag["reported_tco2e"] == 0.0

    # Grid electricity recognized
    s2_diag = res["scope_diagnostics"]["scope2"]
    assert s2_diag["expected_tco2e"] > 2000.0
    assert s2_diag["divergence_pct"] < 15.0


def test_scenario_sawit_plantation_compliant(predictor):
    """
    Company X Archetype: PT Sawit Lestari Mandiri (Agribusiness)
    Expectation:
    - Large mobile vehicle fleet and mill boilers pass verification.
    - Low/Medium priority and high trust score.
    """
    data = load_scenario("company_sawit_plantation.json")
    res = predictor.predict_single(data, validate=True)

    assert res["is_anomaly"] is False
    assert res["priority"] in ["low", "medium"]
    assert res["trust_score"] >= 80.0
    assert res["scope_diagnostics"]["math_coherence"]["is_coherent"] is True


def test_scenario_greenwashing_underreporting_fraud_detected(predictor):
    """
    Company X Archetype: PT Baja Siluman Mandiri (Greenwashing Evasion)
    Expectation:
    - Burns 5M L diesel and 15M kg coal, but declares only 15,000 tCO2e Scope 1.
    - Engine flags under-reporting fraud with CRITICAL/HIGH priority.
    - Trust score collapses (< 60%).
    """
    data = load_scenario("company_greenwashing_fraud.json")
    res = predictor.predict_single(data, validate=True)

    assert res["is_anomaly"] is True
    assert res["priority"] in ["critical", "high"]
    assert res["trust_score"] < 65.0

    s1_diag = res["scope_diagnostics"]["scope1"]
    assert s1_diag["divergence_pct"] > 50.0

    # Flag verification
    assert any("UNDER_REPORTING" in flag or "DIVERGENSI_SCOPE1" in flag for flag in res["flags"])


def test_scenario_math_tampering_fraud_detected(predictor):
    """
    Company X Archetype: PT Rekayasa Angka Total (Arithmetic Fraud)
    Expectation:
    - Declared total is forged lower than sum of Scopes (7,850 vs 4,200).
    - Scope math coherence check fails definitively.
    - Auditor priority is escalated to CRITICAL.
    """
    data = load_scenario("company_math_tampering_fraud.json")
    res = predictor.predict_single(data, validate=True)

    assert res["is_anomaly"] is True
    assert res["priority"] == "critical"

    math_diag = res["scope_diagnostics"]["math_coherence"]
    assert math_diag["is_coherent"] is False
    assert math_diag["discrepancy_pct"] > 25.0
    assert "DISKREPANSI_PENJUMLAHAN_SCOPE" in res["flags"]


def test_scenario_subsidized_fuel_invoice_fraud_detected(predictor):
    """
    Company X Archetype: PT Tambang Solar Subsidi (Fiscal e-Faktur Fraud)
    Expectation:
    - Claims commercial mining operation at subsidized rate (Rp 6,800/L).
    - DJP fiscal price residual score collapses.
    - Raises BIAYA_SOLAR_TIDAK_REALISTIS warning.
    """
    data = load_scenario("company_subsidized_fuel_fraud.json")
    res = predictor.predict_single(data, validate=True)

    assert res["score_djp"] < 70.0
    assert "BIAYA_SOLAR_TIDAK_REALISTIS" in res["flags"]
    assert res["priority"] in ["critical", "high"]


def test_simulation_runner_batch_execution(predictor):
    """
    Verifies that run_all_scenarios() dry-runs all fixtures without crashing.
    """
    results = run_all_scenarios(predictor=predictor)
    assert len(results) == 6
    for res in results:
        assert "priority" in res
        assert "trust_score" in res
        assert "scope_diagnostics" in res
        assert "xai" in res
