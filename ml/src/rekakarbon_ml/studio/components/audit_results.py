"""
Audit results and diagnostic metrics display component for RekaKarbon Studio.
"""

from typing import Any

import streamlit as st


def render_audit_verdict_and_scores(res: dict[str, Any]) -> None:
    """Renders verdict banner, trust scores, IPCC expected emissions, and 3 verification pillars."""
    res_col1, res_col2 = st.columns([1, 2])
    with res_col1:
        if not res.get("is_anomaly", False):
            st.success(f"### ✅ {res.get('verdict', 'PASS_VERIFIED')}")
        else:
            st.error(f"### 🚨 {res.get('verdict', 'REJECT_ANOMALY')}")

        st.metric(
            "Skor Kepercayaan Audit",
            f"{res.get('trust_score', 0.0)} %",
            delta=f"Divergensi: {res.get('divergence_percent', 0.0)}%",
        )
        expected = float(res.get("expected_emission_tco2e", 0.0))
        reported = float(res.get("reported_emission_tco2e", 0.0))
        st.metric(
            "Estimasi Emisi Stoikiometri (IPCC)",
            f"{expected:,.1f} tCO2e",
            delta=f"{reported - expected:,.1f} selisih",
        )

    with res_col2:
        st.markdown("#### 🔍 Rincian Skor Dimensi Verifikasi")
        s1, s2, s3 = st.columns(3)
        s1.metric("1. e-Faktur Pajak DJP", f"{res.get('score_djp', 0.0)}%")
        s2.metric("2. Korelasi BBM Fisik", f"{res.get('score_bbm', 0.0)}%")
        s3.metric("3. Sensor CEMS / Intensitas", f"{res.get('score_cems', 0.0)}%")

        st.markdown(f"**Diagnostik AI:** {res.get('explanation', '-')}")
        flags = res.get("flags", [])
        if flags:
            st.warning(f"**Flag Peringatan:** {', '.join(flags)}")
