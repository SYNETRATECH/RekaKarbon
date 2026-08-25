"""
RekaKarbon AI/ML Carbon Emissions Anomaly Detection - Streamlit Prototype App.
Dedicated development & prototyping dashboard for inspecting emissions anomaly detection.
"""

import plotly.express as px
import streamlit as st

from rekakarbon_ml.data.benchmark_loader import SectorBenchmarkLoader
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.pipeline.onnx_exporter import verify_onnx_parity

st.set_page_config(
    page_title="RekaKarbon AI dMRV - Anomaly Detection Studio", page_icon="🌿", layout="wide"
)


@st.cache_resource
def get_predictor():
    return CarbonAnomalyPredictor(
        model_pkl_path="models/anomaly_pipeline.pkl",
        onnx_path="models/anomaly_pipeline.onnx",
        use_onnx=True,
    )


@st.cache_data
def get_benchmarks():
    loader = SectorBenchmarkLoader()
    return loader.get_sector_emission_factors()


predictor = get_predictor()
benchmarks = get_benchmarks()

st.title("🌿 RekaKarbon AI dMRV - Carbon Anomaly Detection Studio")
st.caption("Prototyping & Inspection Suite: Scikit-Learn Pipeline + ONNX Runtime Engine")

tab1, tab2, tab3 = st.tabs(
    [
        "🔬 Single Company Audit Simulator",
        "📁 Batch CSV Auditor & Benchmark Map",
        "⚡ ONNX Runtime Parity & Architecture",
    ]
)

with tab1:
    st.subheader("Simulasi Input Pelaporan Emisi 3 Kategori")
    st.markdown(
        "Sesuaikan parameter di bawah untuk menguji apakah sistem dMRV mendeteksi anomali/greenwashing:"
    )

    col_sec1, col_sec2 = st.columns([1, 2])
    with col_sec1:
        selected_sector = st.selectbox(
            "Sektor Industri Perusahaan", list(benchmarks.keys()), index=0
        )
        sector_info = benchmarks[selected_sector]
        st.info(
            f"**Benchmark Sektor:** Intensitas Emisi Rata-rata: **{sector_info['avg_intensity_tco2e_per_ton']} tCO2e/ton**"
        )

    with col_sec2:
        preset = st.radio(
            "Pilih Preset Uji Coba Cepat:",
            [
                "Normal (Sesuai Standar)",
                "Anomali: Under-Reporting Ekstrim",
                "Anomali: e-Faktur BBM Fiktif / Tidak Wajar",
            ],
            horizontal=True,
        )

    # Preset Values
    if preset == "Normal (Sesuai Standar)":
        default_prod = 450000.0
        default_stat = 4850000.0
        default_mob = 1240000.0
        default_bio = 15200.0
        default_cost_solar = 4850000.0 * 20500.0
        default_cost_coal = 12800000000.0
        default_cost_gas = 3100000000.0
        default_cost_pln = 8950000000.0
        default_reported = 48500.0
        default_hist = 47200.0
    elif preset == "Anomali: Under-Reporting Ekstrim":
        default_prod = 450000.0
        default_stat = 4850000.0
        default_mob = 1240000.0
        default_bio = 15200.0
        default_cost_solar = 4850000.0 * 20500.0
        default_cost_coal = 12800000000.0
        default_cost_gas = 3100000000.0
        default_cost_pln = 8950000000.0
        default_reported = 4850.0  # 10x under-reported
        default_hist = 47200.0
    else:
        default_prod = 450000.0
        default_stat = 8000000.0
        default_mob = 1240000.0
        default_bio = 15200.0
        default_cost_solar = 8000000.0 * 800.0  # Absurd unit price Rp 800/L
        default_cost_coal = 12800000000.0
        default_cost_gas = 3100000000.0
        default_cost_pln = 8950000000.0
        default_reported = 48500.0
        default_hist = 47200.0

    with st.form("audit_form"):
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("##### 1. Aktivitas Fisik (Liter & Ton)")
            stat_fuel = st.number_input(
                "BBM Mesin Stasioner (Liter/Thn)", value=float(default_stat), step=100000.0
            )
            mob_fuel = st.number_input(
                "BBM Armada Pabrik (Liter/Thn)", value=float(default_mob), step=50000.0
            )
            biomass = st.number_input(
                "Biomassa / Residu (Ton/Thn)", value=float(default_bio), step=1000.0
            )

        with c2:
            st.markdown("##### 2. Keuangan Utilitas (Rupiah / DJP)")
            cost_solar = st.number_input(
                "Biaya Solar / HSD (Rp/Thn)", value=float(default_cost_solar), step=1e8
            )
            cost_coal = st.number_input(
                "Biaya Batubara (Rp/Thn)", value=float(default_cost_coal), step=1e8
            )
            cost_gas = st.number_input(
                "Biaya Gas Bumi (Rp/Thn)", value=float(default_cost_gas), step=1e8
            )
            cost_pln = st.number_input(
                "Biaya Listrik PLN (Rp/Thn)", value=float(default_cost_pln), step=1e8
            )

        with c3:
            st.markdown("##### 3. Operasional & Riil")
            prod = st.number_input(
                "Kapasitas Produksi Riil (Ton/Thn)", value=float(default_prod), step=10000.0
            )
            reported = st.number_input(
                "Total Emisi Dilaporkan (tCO2e)", value=float(default_reported), step=1000.0
            )
            hist = st.number_input(
                "Emisi Historis Periode Lalu (tCO2e)", value=float(default_hist), step=1000.0
            )

        submit_btn = st.form_submit_button("🚀 Jalankan Audit AI dMRV", use_container_width=True)

    if submit_btn or "audit_res" not in st.session_state:
        sample_payload = {
            "production_tonnes": prod,
            "reported_emissions_tco2e": reported,
            "historical_emissions_tco2e": hist,
            "stat_fuel_liters": stat_fuel,
            "mob_fuel_liters": mob_fuel,
            "biomass_tonnes": biomass,
            "cost_solar_idr": cost_solar,
            "cost_coal_idr": cost_coal,
            "cost_gas_idr": cost_gas,
            "cost_pln_idr": cost_pln,
        }
        st.session_state.audit_res = predictor.predict_single(sample_payload)

    res = st.session_state.audit_res
    st.divider()

    res_col1, res_col2 = st.columns([1, 2])
    with res_col1:
        if not res["is_anomaly"]:
            st.success(f"### ✅ {res['verdict']}")
        else:
            st.error(f"### 🚨 {res['verdict']}")

        st.metric(
            "Skor Kepercayaan Audit",
            f"{res['trust_score']} %",
            delta=f"Divergensi: {res['divergence_percent']}%",
        )
        st.metric(
            "Estimasi Emisi Fisik (IPCC)",
            f"{res['expected_emission_tco2e']:,.1f} tCO2e",
            delta=f"{res['reported_emission_tco2e'] - res['expected_emission_tco2e']:,.1f} selisih",
        )

    with res_col2:
        st.markdown("#### 🔍 Rincian Skor Dimensi Verifikasi")
        s1, s2, s3 = st.columns(3)
        s1.metric("1. e-Faktur Pajak DJP", f"{res['score_djp']}%")
        s2.metric("2. Korelasi BBM Fisik", f"{res['score_bbm']}%")
        s3.metric("3. Sensor CEMS / Intensitas", f"{res['score_cems']}%")

        st.markdown(f"**Diagnostik AI:** {res['explanation']}")
        if res["flags"]:
            st.warning(f"**Flag Peringatan:** {', '.join(res['flags'])}")

with tab2:
    st.subheader("Batch Audit & Visualisasi Sebaran Emisi Industri")
    st.caption("Simulasi batch dataset industri Indonesia dari data BPS & KLHK")

    n_batch = st.slider("Jumlah Sampel Batch Simulasi", 50, 500, 150)
    gen = EmissionDataGenerator(random_state=42)
    batch_df = gen.generate_dataset(n_samples=n_batch, anomaly_ratio=0.15)

    batch_preds = predictor.predict_batch(batch_df)
    batch_df["AI_Verdict"] = [r["verdict"] for r in batch_preds]
    batch_df["AI_TrustScore"] = [r["trust_score"] for r in batch_preds]
    batch_df["Divergence_%"] = [r["divergence_percent"] for r in batch_preds]

    fig = px.scatter(
        batch_df,
        x="production_tonnes",
        y="reported_emissions_tco2e",
        color="AI_Verdict",
        color_discrete_map={"PASS_VERIFIED": "#10b981", "REJECT_ANOMALY": "#ef4444"},
        hover_data=["sector", "AI_TrustScore", "Divergence_%"],
        title="Peta Distribusi Emisi: Laporan Valid vs Anomali Terdeteksi",
        labels={
            "production_tonnes": "Kapasitas Produksi (Ton)",
            "reported_emissions_tco2e": "Emisi Dilaporkan (tCO2e)",
        },
    )
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

with tab3:
    st.subheader("Arsitektur Scikit-Learn Pipeline & ONNX Runtime")
    st.markdown("""
    - **Pipeline Scikit-Learn**: `EmissionFeatureEngineer` -> `RobustScaler` -> `IsolationForest`
    - **Ekspor ONNX**: Model diekspor ke format standar `.onnx` menggunakan `skl2onnx`
    - **Keuntungan Arsitektur**: Backend NestJS/Node.js dapat langsung mengeksekusi model melalui `onnxruntime-node` tanpa membutuhkan server Python terpisah di production.
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
