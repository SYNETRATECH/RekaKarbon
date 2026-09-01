"""
Parity Tests: Validate that ONNX Runtime matches Scikit-Learn inference.
"""

import os

import pytest

from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.training.onnx_exporter import (
    export_pipeline_to_onnx,
    verify_onnx_parity,
)
from rekakarbon_ml.training.trainer import train_and_save_pipeline


@pytest.fixture(scope="module")
def shared_model_artifacts(tmp_path_factory):
    model_dir = str(tmp_path_factory.mktemp("models"))
    pkl_path = os.path.join(model_dir, "anomaly_pipeline.pkl")
    onnx_path = os.path.join(model_dir, "anomaly_pipeline.onnx")

    pipe, df = train_and_save_pipeline(save_dir=model_dir, n_samples=250)
    export_pipeline_to_onnx(pipe, onnx_path)
    return pipe, df, pkl_path, onnx_path


def test_onnx_export_and_numerical_parity(shared_model_artifacts):
    pipe, df, pkl_path, onnx_path = shared_model_artifacts
    assert os.path.exists(onnx_path)

    parity_ok, max_diff = verify_onnx_parity(pipe, onnx_path, sample_df=df.head(50))
    assert parity_ok is True
    assert max_diff < 1e-4


def test_predictor_unified(shared_model_artifacts):
    pipe, df, pkl_path, onnx_path = shared_model_artifacts

    predictor = CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True,
    )

    # Test normal compliant record (Manufaktur & Pengolahan)
    sample_normal = {
        "sector": "Manufaktur & Pengolahan",
        "production_tonnes": 450000.0,
        "reported_emissions_tco2e": 48200.0,
        "historical_emissions_tco2e": 47200.0,
        "stat_fuel_liters": 4850000.0,
        "mob_fuel_liters": 1240000.0,
        "biomass_tonnes": 0.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 4850000.0 * 20500.0,  # Rp 20,500 / L
        "cost_coal_idr": 12800000000.0,
        "cost_gas_idr": 3100000000.0,
        "cost_pln_idr": 8950000000.0,
    }
    res = predictor.predict_single(sample_normal)
    assert "verdict" in res
    assert "trust_score" in res
    assert res["is_anomaly"] is False
    assert res["trust_score"] > 80.0
    assert res["verdict"] == "PASS_VERIFIED"

    # Test anomalous record (under-reporting: 1,000 tCO2e reported for 48,000 tCO2e spend)
    sample_anomaly = {
        "sector": "Manufaktur & Pengolahan",
        "production_tonnes": 450000.0,
        "reported_emissions_tco2e": 1000.0,  # massive under-reporting
        "historical_emissions_tco2e": 47200.0,
        "stat_fuel_liters": 4850000.0,
        "mob_fuel_liters": 1240000.0,
        "biomass_tonnes": 0.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 500000.0,  # fake low cost
        "cost_coal_idr": 12800000000.0,
        "cost_gas_idr": 3100000000.0,
        "cost_pln_idr": 8950000000.0,
    }
    res_anom = predictor.predict_single(sample_anomaly)
    assert res_anom["is_anomaly"] is True
    assert res_anom["verdict"] == "REJECT_ANOMALY"
    assert len(res_anom["flags"]) > 0


def test_sector_specific_cement_calcination(shared_model_artifacts):
    pipe, df, pkl_path, onnx_path = shared_model_artifacts

    predictor = CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True,
    )

    # Cement plant producing 500,000 ton with clinker calcination
    sample_cement_fraud = {
        "sector": "Semen & Bahan Bangunan",
        "production_tonnes": 500000.0,
        "reported_emissions_tco2e": 20000.0,  # 15x under-reported
        "historical_emissions_tco2e": 320000.0,
        "stat_fuel_liters": 2000000.0,
        "mob_fuel_liters": 500000.0,
        "biomass_tonnes": 10000.0,
        "clinker_tonnes": 375000.0,
        "cost_solar_idr": 2000000.0 * 20500.0,
        "cost_coal_idr": 85000000000.0,
        "cost_gas_idr": 0.0,
        "cost_pln_idr": 25000000000.0,
    }
    res_cement = predictor.predict_single(sample_cement_fraud)
    assert res_cement["is_anomaly"] is True
    assert res_cement["verdict"] == "REJECT_ANOMALY"
