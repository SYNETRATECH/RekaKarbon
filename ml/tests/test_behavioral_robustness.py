"""
Layer 5: Behavioral & Metamorphic Robustness Tests.
Validates directional domain expectations, noise resilience, and extreme boundary stability.
"""

import os

import numpy as np
import pytest

from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.training.onnx_exporter import export_pipeline_to_onnx
from rekakarbon_ml.training.trainer import train_and_save_pipeline


@pytest.fixture(scope="module")
def predictor(tmp_path_factory):
    model_dir = str(tmp_path_factory.mktemp("robustness_models"))
    pkl_path = os.path.join(model_dir, "anomaly_pipeline.pkl")
    onnx_path = os.path.join(model_dir, "anomaly_pipeline.onnx")

    pipe, _ = train_and_save_pipeline(save_dir=model_dir, n_samples=300)
    export_pipeline_to_onnx(pipe, onnx_path)

    return CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True,
    )


def test_metamorphic_directional_under_reporting(predictor):
    """
    Directional Expectation:
    Decreasing reported emissions while keeping energy consumption constant
    must strictly increase divergence percentage and decrease composite trust score.
    """
    base_record = {
        "sector": "Manufaktur & Pengolahan",
        "production_tonnes": 400000.0,
        "historical_emissions_tco2e": 45000.0,
        "stat_fuel_liters": 4500000.0,
        "mob_fuel_liters": 1000000.0,
        "biomass_tonnes": 0.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 4500000.0 * 20500.0,
        "cost_coal_idr": 10000000000.0,
        "cost_gas_idr": 2000000000.0,
        "cost_pln_idr": 8000000000.0,
    }

    # Sequence of decreasing reported emissions
    emissions_sequence = [48000.0, 30000.0, 15000.0, 3000.0]
    divergences = []
    trust_scores = []

    for emiss in emissions_sequence:
        rec = dict(base_record, reported_emissions_tco2e=emiss)
        res = predictor.predict_single(rec)
        divergences.append(res["divergence_percent"])
        trust_scores.append(res["trust_score"])

    # Divergence must strictly increase (or stay monotone non-decreasing)
    for i in range(len(divergences) - 1):
        assert divergences[i] < divergences[i + 1], (
            f"Expected divergence to increase: {divergences}"
        )

    # Trust score must strictly decrease (or stay monotone non-increasing)
    for i in range(len(trust_scores) - 1):
        assert trust_scores[i] >= trust_scores[i + 1], (
            f"Expected trust score to decrease: {trust_scores}"
        )

    # Lowest emission report must be flagged as anomaly
    lowest_res = predictor.predict_single(
        dict(base_record, reported_emissions_tco2e=emissions_sequence[-1])
    )
    assert lowest_res["is_anomaly"] is True
    assert lowest_res["verdict"] == "REJECT_ANOMALY"
    assert "UNDER_REPORTING_TERINDIKASI" in lowest_res["flags"]


def test_djp_price_boundary_sensitivity(predictor):
    """
    Fiscal Audit Rule:
    Solar unit price deviating from DJP index (Rp 16,000 - Rp 25,000 / L)
    must lower score_djp and raise 'BIAYA_SOLAR_TIDAK_REALISTIS' flag.
    """
    liters = 2000000.0

    # 1. Normal Market Price: Rp 20,500 / L
    normal_record = {
        "sector": "Kelapa Sawit & CPO",
        "production_tonnes": 300000.0,
        "reported_emissions_tco2e": 12000.0,
        "historical_emissions_tco2e": 12000.0,
        "stat_fuel_liters": liters,
        "mob_fuel_liters": 500000.0,
        "biomass_tonnes": 5000.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": liters * 20500.0,
        "cost_coal_idr": 0.0,
        "cost_gas_idr": 0.0,
        "cost_pln_idr": 2000000000.0,
    }
    res_normal = predictor.predict_single(normal_record)
    assert res_normal["score_djp"] >= 95.0
    assert "BIAYA_SOLAR_TIDAK_REALISTIS" not in res_normal["flags"]

    # 2. Fake Low Price: Rp 800 / L
    fake_low_record = dict(normal_record, cost_solar_idr=liters * 800.0)
    res_low = predictor.predict_single(fake_low_record)
    assert res_low["score_djp"] < 70.0
    assert "BIAYA_SOLAR_TIDAK_REALISTIS" in res_low["flags"]

    # 3. Inflated High Price: Rp 80,000 / L
    fake_high_record = dict(normal_record, cost_solar_idr=liters * 80000.0)
    res_high = predictor.predict_single(fake_high_record)
    assert res_high["score_djp"] < 70.0
    assert "BIAYA_SOLAR_TIDAK_REALISTIS" in res_high["flags"]


def test_sensor_perturbation_noise_invariance(predictor):
    """
    Robustness:
    Adding ±1% random noise to physical measurements of a compliant company
    should preserve the 'PASS_VERIFIED' verdict.
    """
    base_compliant = {
        "sector": "Pulp & Kertas",
        "production_tonnes": 95000.0,
        "reported_emissions_tco2e": 42000.0,
        "historical_emissions_tco2e": 41000.0,
        "stat_fuel_liters": 2200000.0,
        "mob_fuel_liters": 450000.0,
        "biomass_tonnes": 12000.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 2200000.0 * 20500.0,
        "cost_coal_idr": 15727000000.0,
        "cost_gas_idr": 1500000000.0,
        "cost_pln_idr": 5000000000.0,
    }

    rng = np.random.RandomState(42)
    numeric_keys = [
        "production_tonnes",
        "reported_emissions_tco2e",
        "historical_emissions_tco2e",
        "stat_fuel_liters",
        "mob_fuel_liters",
        "biomass_tonnes",
        "cost_solar_idr",
        "cost_coal_idr",
        "cost_gas_idr",
        "cost_pln_idr",
    ]

    for _ in range(25):
        perturbed = base_compliant.copy()
        for k in numeric_keys:
            factor = float(rng.uniform(0.99, 1.01))
            val = base_compliant[k]
            if isinstance(val, (int, float)):
                perturbed[k] = float(val) * factor

        res = predictor.predict_single(perturbed)
        assert res["is_anomaly"] is False
        assert res["verdict"] == "PASS_VERIFIED"
        assert res["trust_score"] >= 80.0


def test_extreme_and_edge_inputs_stability(predictor):
    """
    Edge Cases:
    Extreme scales, zero fuel, or boundary values must not crash or produce NaNs.
    """
    # 1. Zero fuel and electricity only
    zero_fuel_record = {
        "sector": "Manufaktur & Pengolahan",
        "production_tonnes": 100000.0,
        "reported_emissions_tco2e": 500.0,
        "historical_emissions_tco2e": 500.0,
        "stat_fuel_liters": 0.0,
        "mob_fuel_liters": 0.0,
        "biomass_tonnes": 0.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 0.0,
        "cost_coal_idr": 0.0,
        "cost_gas_idr": 0.0,
        "cost_pln_idr": 1000000000.0,
    }
    res_zero = predictor.predict_single(zero_fuel_record)
    assert not np.isnan(res_zero["trust_score"])
    assert not np.isnan(res_zero["divergence_percent"])
    assert isinstance(res_zero["explanation"], str)

    # 2. Gigantic mega-plant scale (10,000,000 tonnes)
    mega_record = {
        "sector": "Ketenagalistrikan & PLTU",
        "production_tonnes": 10000000.0,
        "reported_emissions_tco2e": 9200000.0,
        "historical_emissions_tco2e": 9100000.0,
        "stat_fuel_liters": 5000000.0,
        "mob_fuel_liters": 1000000.0,
        "biomass_tonnes": 50000.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 5000000.0 * 20500.0,
        "cost_coal_idr": 4500000000000.0,
        "cost_gas_idr": 0.0,
        "cost_pln_idr": 500000000.0,
    }
    res_mega = predictor.predict_single(mega_record)
    assert res_mega["verdict"] in ["PASS_VERIFIED", "REJECT_ANOMALY"]
    assert 0.0 <= res_mega["trust_score"] <= 100.0


def test_xai_feature_attribution_diagnostics(predictor):
    """
    XAI Audit Rule:
    Every single prediction result must contain a valid 'xai' dictionary
    with top anomaly drivers, breakdown metrics, and recommendation guidance.
    """
    anomaly_record = {
        "sector": "Semen & Bahan Bangunan",
        "production_tonnes": 500000.0,
        "reported_emissions_tco2e": 20000.0,
        "historical_emissions_tco2e": 320000.0,
        "stat_fuel_liters": 2000000.0,
        "mob_fuel_liters": 500000.0,
        "biomass_tonnes": 10000.0,
        "clinker_tonnes": 0.0,  # Unreported calcination
        "cost_solar_idr": 2000000.0 * 20500.0,
        "cost_coal_idr": 85000000000.0,
        "cost_gas_idr": 0.0,
        "cost_pln_idr": 25000000000.0,
    }

    res = predictor.predict_single(anomaly_record)
    assert "xai" in res
    xai = res["xai"]
    assert "top_anomaly_drivers" in xai
    assert "breakdown" in xai
    assert "recommendation" in xai
    assert len(xai["top_anomaly_drivers"]) > 0
    assert xai["top_anomaly_drivers"][0]["impact_score"] > 0.0
