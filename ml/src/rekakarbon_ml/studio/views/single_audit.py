"""
Tab 1 View: Single Company Audit Simulator & Stoichiometric Physics Inspection.
"""

from typing import Any

import streamlit as st

from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.studio.components.audit_form import render_audit_form
from rekakarbon_ml.studio.components.audit_results import render_audit_verdict_and_scores
from rekakarbon_ml.studio.components.charts import build_stoichiometric_waterfall_chart
from rekakarbon_ml.studio.components.xai_view import render_xai_section
from rekakarbon_ml.studio.presets import PRESET_OPTIONS, calculate_sector_preset


def render_single_audit_tab(
    predictor: CarbonAnomalyPredictor,
    benchmarks: dict[str, Any],
) -> None:
    """Renders the Single Company Audit Simulator tab with dynamic presets and diagnostic visuals."""
    st.subheader("Simulasi Input Pelaporan Emisi & Audit Sektoral")
    st.markdown(
        "Sesuaikan parameter di bawah untuk menguji apakah sistem dMRV mendeteksi "
        "fraud under-reporting, deviasi fiskal e-Faktur, atau anomali proses industri:"
    )

    col_sec1, col_sec2 = st.columns([1, 2])
    with col_sec1:
        selected_sector = st.selectbox(
            "Sektor Industri Perusahaan", list(benchmarks.keys()), index=0
        )
        sector_info = benchmarks[selected_sector]
        st.info(
            f"**Benchmark Sektor ({selected_sector}):**\n\n"
            f"- Intensitas Rata-rata: **{sector_info['avg_intensity_tco2e_per_ton']} tCO2e/ton** "
            f"(Range: {sector_info['min_intensity']} - {sector_info['max_intensity']})\n"
            f"- Emisi Proses: **{'Ya (Kalsinasi/Peleburan)' if sector_info.get('has_process_emissions') else 'Tidak (Hanya Pembakaran)'}**"
        )

    with col_sec2:
        preset = st.radio(
            "Pilih Skenario Pengujian Cepat:",
            PRESET_OPTIONS,
            horizontal=True,
        )

    preset_data = calculate_sector_preset(sector_info, preset=preset)
    submitted, sample_payload = render_audit_form(preset_data, selected_sector)

    if submitted or "audit_res" not in st.session_state:
        st.session_state.audit_res = predictor.predict_single(sample_payload)
        st.session_state.last_payload = sample_payload

    res = st.session_state.audit_res
    payload = st.session_state.last_payload
    st.divider()

    render_audit_verdict_and_scores(res)
    render_xai_section(res, payload, predictor)

    st.markdown("#### 📊 Rincian Stoikiometri Fisik vs Laporan Emisi")
    wf_fig = build_stoichiometric_waterfall_chart(
        payload=payload,
        expected_emission=float(res.get("expected_emission_tco2e", 0.0)),
        reported_emission=float(res.get("reported_emission_tco2e", 0.0)),
    )
    st.plotly_chart(wf_fig, use_container_width=True)
