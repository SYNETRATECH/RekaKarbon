"""
Tab 2 View: Batch CSV Auditor & Multi-Sector Distribution Scatter Map.
"""

import streamlit as st

from rekakarbon_ml.config import DEFAULT_RANDOM_STATE
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.studio.components.charts import build_batch_distribution_scatter


def render_batch_auditor_tab(predictor: CarbonAnomalyPredictor) -> None:
    """Renders the Batch CSV Auditor & Benchmark Map tab."""
    st.subheader("Batch Audit & Visualisasi Sebaran Emisi Industri")
    st.caption("Simulasi batch dataset industri Indonesia dari data BPS & KLHK")

    n_batch = st.slider("Jumlah Sampel Batch Simulasi", 50, 500, 150)
    gen = EmissionDataGenerator(random_state=DEFAULT_RANDOM_STATE)
    batch_df = gen.generate_dataset(n_samples=n_batch, anomaly_ratio=0.15)

    batch_preds = predictor.predict_batch(batch_df)
    batch_df["AI_Verdict"] = [r["verdict"] for r in batch_preds]
    batch_df["AI_TrustScore"] = [r["trust_score"] for r in batch_preds]
    batch_df["Divergence_%"] = [r["divergence_percent"] for r in batch_preds]

    fig = build_batch_distribution_scatter(batch_df)
    st.plotly_chart(fig, use_container_width=True)

    st.dataframe(
        batch_df[
            [
                "sector",
                "production_tonnes",
                "reported_emissions_tco2e",
                "AI_Verdict",
                "AI_TrustScore",
                "Divergence_%",
            ]
        ].head(30),
        use_container_width=True,
    )
