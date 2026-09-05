"""
Streamlit resource caching and session state management for RekaKarbon ML Studio.
"""

from typing import Any

import streamlit as st

from rekakarbon_ml.data.benchmark_loader import SectorBenchmarkLoader
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor


@st.cache_resource
def get_predictor() -> CarbonAnomalyPredictor:
    """Loads and caches the central carbon anomaly predictor with ONNX preference."""
    return CarbonAnomalyPredictor(
        model_pkl_path="models/anomaly_pipeline.pkl",
        onnx_path="models/anomaly_pipeline.onnx",
        use_onnx=True,
    )


@st.cache_data
def get_benchmarks() -> dict[str, Any]:
    """Loads and caches dynamic sector benchmark factors from sectors.json."""
    loader = SectorBenchmarkLoader()
    return loader.get_sector_emission_factors()
