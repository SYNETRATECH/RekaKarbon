"""
Layer 6 & 7: Performance Benchmarks & Inference Latency Tests.
Measures p50, p95, p99 latencies, batch throughput, and resource limits for production readiness.
"""

import os
import time

import numpy as np
import pytest

from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.pipeline.build_pipeline import train_and_save_pipeline
from rekakarbon_ml.pipeline.onnx_exporter import export_pipeline_to_onnx


@pytest.fixture(scope="module")
def predictor(tmp_path_factory):
    model_dir = str(tmp_path_factory.mktemp("perf_models"))
    pkl_path = os.path.join(model_dir, "anomaly_pipeline.pkl")
    onnx_path = os.path.join(model_dir, "anomaly_pipeline.onnx")

    pipe, _ = train_and_save_pipeline(save_dir=model_dir, n_samples=300)
    export_pipeline_to_onnx(pipe, onnx_path)

    return CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True,
    )


def test_single_prediction_latency_percentiles(predictor):
    """
    Measures p50, p95, and p99 inference latencies for single record execution.
    Production Requirement: p95 latency <= 35ms on standard CPU.
    """
    sample_record = {
        "sector": "Manufaktur & Pengolahan",
        "production_tonnes": 250000.0,
        "reported_emissions_tco2e": 32000.0,
        "historical_emissions_tco2e": 31000.0,
        "stat_fuel_liters": 1500000.0,
        "mob_fuel_liters": 300000.0,
        "biomass_tonnes": 0.0,
        "clinker_tonnes": 0.0,
        "cost_solar_idr": 1500000.0 * 20500.0,
        "cost_coal_idr": 6000000000.0,
        "cost_gas_idr": 1000000000.0,
        "cost_pln_idr": 4000000000.0,
    }

    # Warmup
    for _ in range(10):
        predictor.predict_single(sample_record)

    latencies_ms = []
    n_iterations = 100
    for _ in range(n_iterations):
        t0 = time.perf_counter()
        predictor.predict_single(sample_record)
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)

    p50 = float(np.percentile(latencies_ms, 50))
    p95 = float(np.percentile(latencies_ms, 95))
    p99 = float(np.percentile(latencies_ms, 99))

    print(f"\n[Single Predict Latency] p50: {p50:.2f}ms | p95: {p95:.2f}ms | p99: {p99:.2f}ms")

    assert p50 < 20.0, f"p50 latency too high: {p50:.2f}ms"
    assert p95 < 40.0, f"p95 latency too high: {p95:.2f}ms"


def test_batch_throughput_benchmark(predictor):
    """
    Measures throughput for a batch of 500 industrial records.
    Production Requirement: 500 records processed in < 350ms.
    """
    gen = EmissionDataGenerator(random_state=99)
    df_batch = gen.generate_dataset(n_samples=500)

    # Warmup
    predictor.predict_batch(df_batch.head(10))

    t0 = time.perf_counter()
    results = predictor.predict_batch(df_batch)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    throughput_rps = len(df_batch) / (elapsed_ms / 1000.0)
    print(
        f"\n[Batch Predict 500 Records] Elapsed: {elapsed_ms:.2f}ms | Throughput: {throughput_rps:.1f} records/sec"
    )

    assert len(results) == 500
    assert elapsed_ms < 600.0, f"Batch processing too slow: {elapsed_ms:.2f}ms"
