"""
RekaKarbon AI/ML Carbon Emissions Anomaly Detection - Streamlit Prototype App.
Dedicated development & prototyping dashboard for inspecting emissions anomaly detection,
physics stoichiometry breakdowns, and e-Faktur fiscal integrity cross-checks.
"""

import streamlit as st

from rekakarbon_ml.studio.state import get_benchmarks, get_predictor
from rekakarbon_ml.studio.views.batch_auditor import render_batch_auditor_tab
from rekakarbon_ml.studio.views.onnx_parity import render_onnx_parity_tab
from rekakarbon_ml.studio.views.single_audit import render_single_audit_tab

st.set_page_config(
    page_title="RekaKarbon AI dMRV - Anomaly Detection Studio",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
)

predictor = get_predictor()
benchmarks = get_benchmarks()

st.title("🌿 RekaKarbon AI dMRV - Carbon Anomaly Detection Studio")
st.caption(
    "Prototyping & Inspection Suite: Physics Stoichiometry + Sector Ensembles + ONNX Runtime"
)

tab1, tab2, tab3 = st.tabs(
    [
        "🔬 Single Company Audit Simulator",
        "📁 Batch CSV Auditor & Benchmark Map",
        "⚡ ONNX Runtime Parity & Architecture",
    ]
)

with tab1:
    render_single_audit_tab(predictor, benchmarks)

with tab2:
    render_batch_auditor_tab(predictor)

with tab3:
    render_onnx_parity_tab(predictor)
