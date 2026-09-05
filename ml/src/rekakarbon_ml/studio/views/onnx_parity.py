"""
Tab 3 View: Scikit-Learn Architecture & ONNX Runtime Parity Inspector.
"""

import streamlit as st

from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.training.onnx_exporter import verify_onnx_parity


def render_onnx_parity_tab(predictor: CarbonAnomalyPredictor) -> None:
    """Renders the ONNX Runtime Parity & Architecture tab with an interactive verification trigger."""
    st.subheader("Arsitektur Scikit-Learn Pipeline & ONNX Runtime")
    st.markdown("""
    - **Pipeline Scikit-Learn**: `EmissionFeatureEngineer` (15 derived dimensions) -> `RobustScaler` -> `IsolationForest`
    - **Ekspor ONNX**: Model diekspor ke format standar `.onnx` dengan opset 15 via `skl2onnx`
    - **Keuntungan Arsitektur**: Backend NestJS/Node.js dapat langsung mengeksekusi model melalui `onnxruntime-node` tanpa overhead server Python terpisah.
    """)

    if st.button("Jalankan Uji Paritas Numerik (Scikit-Learn vs ONNX Runtime)"):
        pipeline = predictor.pipeline
        ok, diff = verify_onnx_parity(pipeline, predictor.onnx_path)
        if ok:
            st.success(
                f"✅ Paritas ONNX Sempurna! Prediksi identik 100% dengan deviasi skor maksimal {diff:.8f}"
            )
        else:
            st.warning(f"⚠️ Terdapat selisih skor: {diff:.8f}")
