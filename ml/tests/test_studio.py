"""
Unit Tests for Streamlit Prototyping Studio Domain Logic & Visualizers.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from rekakarbon_ml.data.benchmark_loader import SectorBenchmarkLoader
from rekakarbon_ml.studio.components.charts import (
    build_batch_distribution_scatter,
    build_shap_summary_chart,
    build_stoichiometric_waterfall_chart,
)
from rekakarbon_ml.studio.presets import (
    PRESET_FICTITIOUS_INVOICE,
    PRESET_GREENWASHING,
    PRESET_HIDDEN_CALCINATION,
    PRESET_NORMAL,
    calculate_sector_preset,
)


def test_calculate_sector_preset_normal() -> None:
    """Verifies baseline stoichiometric calculation produces balanced values."""
    benchmarks = SectorBenchmarkLoader().get_sector_emission_factors()
    sector_info = benchmarks["pertambangan"]

    preset_data = calculate_sector_preset(sector_info, preset=PRESET_NORMAL, production=100000.0)

    assert preset_data.production_tonnes == 100000.0
    assert preset_data.scope1 > 0
    assert preset_data.scope2 > 0
    assert preset_data.scope3 > 0
    assert (
        round(preset_data.scope1 + preset_data.scope2 + preset_data.scope3, 2)
        == preset_data.total_reported
    )
    assert preset_data.clinker_tonnes > 0
    assert preset_data.cost_solar_idr > 0


def test_calculate_sector_preset_greenwashing() -> None:
    """Verifies greenwashing anomaly preset scales down reported Scope 1."""
    benchmarks = SectorBenchmarkLoader().get_sector_emission_factors()
    sector_info = benchmarks["manufaktur"]

    normal_data = calculate_sector_preset(sector_info, preset=PRESET_NORMAL)
    fraud_data = calculate_sector_preset(sector_info, preset=PRESET_GREENWASHING)

    assert fraud_data.scope1 < normal_data.scope1
    assert fraud_data.total_reported < normal_data.total_reported
    assert fraud_data.stat_fuel_liters == normal_data.stat_fuel_liters


def test_calculate_sector_preset_fictitious_invoice() -> None:
    """Verifies fictitious invoice anomaly preset severely depresses fuel unit cost."""
    benchmarks = SectorBenchmarkLoader().get_sector_emission_factors()
    sector_info = benchmarks["manufaktur"]

    normal_data = calculate_sector_preset(sector_info, preset=PRESET_NORMAL)
    fraud_data = calculate_sector_preset(sector_info, preset=PRESET_FICTITIOUS_INVOICE)

    assert fraud_data.cost_solar_idr < normal_data.cost_solar_idr
    assert fraud_data.stat_fuel_liters == normal_data.stat_fuel_liters


def test_calculate_sector_preset_hidden_calcination() -> None:
    """Verifies hidden process emissions preset zeroes out clinker."""
    benchmarks = SectorBenchmarkLoader().get_sector_emission_factors()
    sector_info = benchmarks["pertambangan"]

    normal_data = calculate_sector_preset(sector_info, preset=PRESET_NORMAL)
    fraud_data = calculate_sector_preset(sector_info, preset=PRESET_HIDDEN_CALCINATION)

    assert normal_data.clinker_tonnes > 0
    assert fraud_data.clinker_tonnes == 0.0


def test_build_stoichiometric_waterfall_chart() -> None:
    """Verifies that the waterfall builder creates a valid Plotly figure with all energy sources."""
    payload = {
        "stat_fuel_liters": 50000.0,
        "mob_fuel_liters": 10000.0,
        "cost_coal_idr": 10000000.0,
        "cost_gas_idr": 5000000.0,
        "cost_pln_idr": 20000000.0,
        "clinker_tonnes": 1500.0,
    }
    fig = build_stoichiometric_waterfall_chart(
        payload, expected_emission=2500.0, reported_emission=2600.0
    )

    assert isinstance(fig, go.Figure)
    assert len(fig.data) == 1
    assert fig.data[0].type == "waterfall"
    assert "Solar/Diesel" in fig.data[0].x


def test_build_shap_summary_chart() -> None:
    """Verifies that the SHAP bar chart builder correctly formats attributes."""
    feature_names = ["feat_a", "feat_b", "feat_c"]
    shap_vals = np.array([[0.25, -0.42, 0.11]])

    fig = build_shap_summary_chart(shap_vals, feature_names)

    assert isinstance(fig, go.Figure)
    assert len(fig.data) == 1
    assert fig.data[0].type == "bar"


def test_build_batch_distribution_scatter() -> None:
    """Verifies that the batch distribution scatter plot builder configures labels and colors."""
    df = pd.DataFrame(
        {
            "production_tonnes": [100.0, 200.0],
            "reported_emissions_tco2e": [50.0, 150.0],
            "AI_Verdict": ["PASS_VERIFIED", "REJECT_ANOMALY"],
            "sector": ["Semen", "Kimia"],
            "AI_TrustScore": [95.0, 32.0],
            "Divergence_%": [2.1, 45.3],
        }
    )
    fig = build_batch_distribution_scatter(df)

    assert isinstance(fig, go.Figure)
    assert len(fig.data) >= 1
