"""
Explainable AI (XAI) feature attribution and compliance recommendation component.
"""

from typing import Any

import pandas as pd
import streamlit as st

from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.studio.components.charts import build_shap_summary_chart
from rekakarbon_ml.training.transformers import DERIVED_FEATURE_NAMES


def render_xai_section(
    res: dict[str, Any],
    payload: dict[str, Any],
    predictor: CarbonAnomalyPredictor,
) -> None:
    """Renders XAI drivers dataframe, compliance recommendations, and official SHAP bar chart."""
    if "xai" not in res or not res["xai"].get("top_anomaly_drivers"):
        return

    xai = res["xai"]
    st.markdown("##### 💡 Explainable AI (XAI) - Atribusi Fitur Anomali & Official SHAP Values")
    drivers_df = pd.DataFrame(xai["top_anomaly_drivers"])
    if not drivers_df.empty:
        st.dataframe(
            drivers_df[
                ["label", "user_value", "benchmark_value", "impact_score", "direction"]
            ].rename(
                columns={
                    "label": "Faktor Anomali",
                    "user_value": "Input Perusahaan",
                    "benchmark_value": "Acuan Industri (Benchmark)",
                    "impact_score": "Dampak Anomali (%)",
                    "direction": "Arah Deviasi",
                }
            ),
            use_container_width=True,
            hide_index=True,
        )
    st.info(f"**Rekomendasi Kepatuhan:** {xai.get('recommendation', '-')}")

    try:
        shap_vals = predictor.compute_shap_values(pd.DataFrame([payload]))
        if shap_vals is not None and shap_vals.size > 0:
            shap_fig = build_shap_summary_chart(shap_vals, DERIVED_FEATURE_NAMES)
            st.plotly_chart(shap_fig, use_container_width=True)
    except Exception as e:
        st.caption(f"SHAP chart fallback notice: {e}")
