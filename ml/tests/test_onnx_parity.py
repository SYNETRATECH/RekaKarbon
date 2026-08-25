"""
Parity Tests: Validate that ONNX Runtime matches Scikit-Learn inference.
"""

import os
import pytest
from rekakarbon_ml.pipeline.build_pipeline import train_and_save_pipeline
from rekakarbon_ml.pipeline.onnx_exporter import export_pipeline_to_onnx, verify_onnx_parity
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor


def test_onnx_export_and_numerical_parity(tmp_path):
    pkl_path = str(tmp_path / "anomaly_pipeline.pkl")
    onnx_path = str(tmp_path / "anomaly_pipeline.onnx")

    pipe, df = train_and_save_pipeline(save_dir=str(tmp_path), n_samples=300)
    exported = export_pipeline_to_onnx(pipe, onnx_path)
    assert os.path.exists(exported)

    parity_ok, max_diff = verify_onnx_parity(pipe, onnx_path, sample_df=df.head(50))
    assert parity_ok is True
    assert max_diff < 1e-4


def test_predictor_unified(tmp_path):
    pkl_path = str(tmp_path / "anomaly_pipeline.pkl")
    onnx_path = str(tmp_path / "anomaly_pipeline.onnx")

    predictor = CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True
    )

    # Test normal compliant record (47,500 tCO2e aligns with fuel & utility inputs)
    sample_normal = {
        "production_tonnes": 450000.0,
        "reported_emissions_tco2e": 47500.0,
        "historical_emissions_tco2e": 46200.0,
        "stat_fuel_liters": 4850000.0,
        "mob_fuel_liters": 1240000.0,
        "biomass_tonnes": 15200.0,
        "cost_solar_idr": 97000000000.0,  # ~20,000 / L
        "cost_coal_idr": 12800000000.0,
        "cost_gas_idr": 3100000000.0,
        "cost_pln_idr": 8950000000.0
    }
    res = predictor.predict_single(sample_normal)
    assert "verdict" in res
    assert "trust_score" in res
    assert res["is_anomaly"] is False
    assert res["trust_score"] > 85.0
    assert res["verdict"] == "PASS_VERIFIED"

    # Test anomalous record (under-reporting: 1,000 tCO2e reported for 47,500 tCO2e spend)
    sample_anomaly = {
        "production_tonnes": 450000.0,
        "reported_emissions_tco2e": 1000.0,  # massive under-reporting
        "historical_emissions_tco2e": 46200.0,
        "stat_fuel_liters": 4850000.0,
        "mob_fuel_liters": 1240000.0,
        "biomass_tonnes": 15200.0,
        "cost_solar_idr": 500000.0,  # fake low cost
        "cost_coal_idr": 12800000000.0,
        "cost_gas_idr": 3100000000.0,
        "cost_pln_idr": 8950000000.0
    }
    res_anom = predictor.predict_single(sample_anomaly)
    assert res_anom["is_anomaly"] is True
    assert res_anom["verdict"] == "REJECT_ANOMALY"
    assert len(res_anom["flags"]) > 0
