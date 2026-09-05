"""
Pure Plotly chart builder functions for RekaKarbon Studio.
"""

from typing import Any

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from rekakarbon_ml.data.benchmark_loader import MARKET_PRICE_RANGES, STOICHIOMETRIC_FACTORS


def build_stoichiometric_waterfall_chart(
    payload: dict[str, Any],
    expected_emission: float,
    reported_emission: float,
) -> go.Figure:
    """Builds interactive Plotly waterfall breakdown comparing physical sources to reported emissions."""
    e_diesel = (
        float(payload.get("stat_fuel_liters", 0.0)) + float(payload.get("mob_fuel_liters", 0.0))
    ) * STOICHIOMETRIC_FACTORS["solar_diesel_tco2e_per_liter"]

    coal_cost = float(payload.get("cost_coal_idr", 0.0))
    e_coal = (coal_cost / MARKET_PRICE_RANGES["coal"]["nominal"]) * STOICHIOMETRIC_FACTORS[
        "coal_tco2e_per_kg"
    ]

    gas_cost = float(payload.get("cost_gas_idr", 0.0))
    e_gas = (gas_cost / MARKET_PRICE_RANGES["natural_gas"]["nominal"]) * STOICHIOMETRIC_FACTORS[
        "natural_gas_tco2e_per_m3"
    ]

    pln_cost = float(payload.get("cost_pln_idr", 0.0))
    e_pln = (
        pln_cost / MARKET_PRICE_RANGES["grid_electricity"]["nominal"]
    ) * STOICHIOMETRIC_FACTORS["grid_electricity_tco2e_per_kwh"]

    clinker_val = float(payload.get("clinker_tonnes", 0.0))
    e_process = clinker_val * STOICHIOMETRIC_FACTORS["cement_clinker_calcination_tco2e_per_ton"]

    wf_fig = go.Figure(
        go.Waterfall(
            name="Emisi Fisik",
            orientation="v",
            measure=["relative", "relative", "relative", "relative", "relative", "total", "total"],
            x=[
                "Solar/Diesel",
                "Batubara",
                "Gas Bumi",
                "Listrik PLN",
                "Proses Kalsinasi",
                "Total Stoikiometri",
                "Laporan Perusahaan",
            ],
            textposition="outside",
            text=[
                f"{e_diesel:,.0f}",
                f"{e_coal:,.0f}",
                f"{e_gas:,.0f}",
                f"{e_pln:,.0f}",
                f"{e_process:,.0f}",
                f"{expected_emission:,.0f}",
                f"{reported_emission:,.0f}",
            ],
            y=[
                e_diesel,
                e_coal,
                e_gas,
                e_pln,
                e_process,
                expected_emission,
                reported_emission,
            ],
            connector={"line": {"color": "rgb(63, 63, 63)"}},
        )
    )
    wf_fig.update_layout(
        title="Dekomposisi Stoikiometri Sumber Emisi (tCO2e)",
        waterfallgap=0.3,
        showlegend=False,
        height=380,
    )
    return wf_fig


def build_shap_summary_chart(
    shap_values: np.ndarray,
    feature_names: list[str],
) -> go.Figure:
    """Builds horizontal bar chart representing SHAP feature attributions."""
    n_features = len(feature_names)
    values = shap_values.flatten()[:n_features]

    shap_df = pd.DataFrame(
        {
            "Fitur": feature_names,
            "Kontribusi SHAP Value": values,
        }
    ).sort_values(by="Kontribusi SHAP Value", key=abs, ascending=True)

    return px.bar(
        shap_df,
        x="Kontribusi SHAP Value",
        y="Fitur",
        orientation="h",
        title="Grafik Kontribusi SHAP TreeExplainer (Scikit-Learn IsolationForest)",
        color="Kontribusi SHAP Value",
        color_continuous_scale="RdBu_r",
    )


def build_batch_distribution_scatter(batch_df: pd.DataFrame) -> go.Figure:
    """Builds scatter plot displaying multi-sector production vs emissions with anomaly labeling."""
    return px.scatter(
        batch_df,
        x="production_tonnes",
        y="reported_emissions_tco2e",
        color="AI_Verdict",
        symbol="sector",
        color_discrete_map={"PASS_VERIFIED": "#10b981", "REJECT_ANOMALY": "#ef4444"},
        hover_data=["sector", "AI_TrustScore", "Divergence_%"],
        title="Peta Distribusi Emisi: Laporan Valid vs Anomali Terdeteksi (6 Sektor)",
        labels={
            "production_tonnes": "Kapasitas Produksi (Ton)",
            "reported_emissions_tco2e": "Emisi Dilaporkan (tCO2e)",
        },
    )
