"""
RekaKarbon AI/ML Carbon Emissions Anomaly Detection - Streamlit Prototype App.
Dedicated development & prototyping dashboard for inspecting emissions anomaly detection,
physics stoichiometry breakdowns, and e-Faktur fiscal integrity cross-checks.
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from rekakarbon_ml.data.benchmark_loader import (
    MARKET_PRICE_RANGES,
    STOICHIOMETRIC_FACTORS,
    SectorBenchmarkLoader,
)
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.pipeline.onnx_exporter import verify_onnx_parity

st.set_page_config(
    page_title="RekaKarbon AI dMRV - Anomaly Detection Studio",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
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
            [
                "Laporan Normal (Sesuai Standar)",
                "Anomali: Under-Reporting Ekstrim (Greenwashing)",
                "Anomali: e-Faktur Solar Fiktif / Harga Tidak Wajar",
                "Anomali: Emisi Proses Kalsinasi Disembunyikan",
            ],
            horizontal=True,
        )

    # Preset Values Calculation based on sector
    if preset == "Laporan Normal (Sesuai Standar)":
        if selected_sector == "Semen & Bahan Bangunan":
            default_prod = 500000.0
            default_clinker = 360000.0
            default_stat = 2500000.0
            default_mob = 600000.0
            default_bio = 5000.0
            default_cost_solar = 2500000.0 * 20500.0
            default_cost_coal = 75000000000.0
            default_cost_gas = 0.0
            default_cost_pln = 22000000000.0
            default_reported = 325000.0
            default_hist = 320000.0
        elif selected_sector == "Kelapa Sawit & CPO":
            default_prod = 150000.0
            default_clinker = 0.0
            default_stat = 1200000.0
            default_mob = 800000.0
            default_bio = 35000.0
            default_cost_solar = 1200000.0 * 20500.0
            default_cost_coal = 500000000.0
            default_cost_gas = 0.0
            default_cost_pln = 3500000000.0
            default_reported = 27000.0
            default_hist = 26500.0
        else:
            default_prod = 450000.0
            default_clinker = 0.0
            default_stat = 4850000.0
            default_mob = 1240000.0
            default_bio = 0.0
            default_cost_solar = 4850000.0 * 20500.0
            default_cost_coal = 12800000000.0
            default_cost_gas = 3100000000.0
            default_cost_pln = 8950000000.0
            default_reported = 48200.0
            default_hist = 47200.0
    elif preset == "Anomali: Under-Reporting Ekstrim (Greenwashing)":
        default_prod = 450000.0
        default_clinker = 300000.0 if selected_sector == "Semen & Bahan Bangunan" else 0.0
        default_stat = 4850000.0
        default_mob = 1240000.0
        default_bio = 0.0
        default_cost_solar = 4850000.0 * 20500.0
        default_cost_coal = 12800000000.0
        default_cost_gas = 3100000000.0
        default_cost_pln = 8950000000.0
        default_reported = 4800.0  # 10x under-reported
        default_hist = 47200.0
    elif preset == "Anomali: e-Faktur Solar Fiktif / Harga Tidak Wajar":
        default_prod = 450000.0
        default_clinker = 0.0
        default_stat = 8000000.0
        default_mob = 1240000.0
        default_bio = 0.0
        default_cost_solar = 8000000.0 * 800.0  # Absurd unit price Rp 800/L
        default_cost_coal = 12800000000.0
        default_cost_gas = 3100000000.0
        default_cost_pln = 8950000000.0
        default_reported = 48500.0
        default_hist = 47200.0
    else:
        # Anomali: Emisi Proses Kalsinasi Disembunyikan
        default_prod = 500000.0
        default_clinker = 0.0  # Clinker omitted
        default_stat = 2500000.0
        default_mob = 600000.0
        default_bio = 5000.0
        default_cost_solar = 2500000.0 * 20500.0
        default_cost_coal = 75000000000.0
        default_cost_gas = 0.0
        default_cost_pln = 22000000000.0
        default_reported = 135000.0  # Only fuel combustion reported, missing 190k process tCO2e
        default_hist = 320000.0

    with st.form("audit_form"):
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("##### 1. Aktivitas Fisik & Biomassa")
            stat_fuel = st.number_input(
                "BBM Mesin Stasioner (Liter/Thn)", value=float(default_stat), step=100000.0
            )
            mob_fuel = st.number_input(
                "BBM Armada Pabrik (Liter/Thn)", value=float(default_mob), step=50000.0
            )
            biomass = st.number_input(
                "Biomassa / Residu (Ton/Thn)", value=float(default_bio), step=1000.0
            )
            clinker = st.number_input(
                "Produksi Klinker Kalsinasi (Ton/Thn)",
                value=float(default_clinker),
                step=10000.0,
                help="Wajib diisi untuk industri Semen & Bahan Bangunan",
            )

        with c2:
            st.markdown("##### 2. Keuangan Utilitas (DJP e-Faktur)")
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
                "Kapasitas Produksi Riil (Ton atau MWh/Thn)",
                value=float(default_prod),
                step=10000.0,
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
            "sector": selected_sector,
            "production_tonnes": prod,
            "reported_emissions_tco2e": reported,
            "historical_emissions_tco2e": hist,
            "stat_fuel_liters": stat_fuel,
            "mob_fuel_liters": mob_fuel,
            "biomass_tonnes": biomass,
            "clinker_tonnes": clinker,
            "cost_solar_idr": cost_solar,
            "cost_coal_idr": cost_coal,
            "cost_gas_idr": cost_gas,
            "cost_pln_idr": cost_pln,
        }
        st.session_state.audit_res = predictor.predict_single(sample_payload)
        st.session_state.last_payload = sample_payload

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
            "Estimasi Emisi Stoikiometri (IPCC)",
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

        # XAI Feature Attribution Breakdown & Official SHAP Plot
        if "xai" in res and res["xai"].get("top_anomaly_drivers"):
            xai = res["xai"]
            st.markdown("##### 💡 Explainable AI (XAI) - Atribusi Fitur Anomali & Official SHAP Values")
            drivers_df = pd.DataFrame(xai["top_anomaly_drivers"])
            if not drivers_df.empty:
                st.dataframe(
                    drivers_df[["label", "user_value", "benchmark_value", "impact_score", "direction"]].rename(
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
            st.info(f"**Rekomendasi Kepatuhan:** {xai['recommendation']}")

            # Compute official SHAP values via predictor.compute_shap_values
            try:
                payload = st.session_state.last_payload
                shap_vals = predictor.compute_shap_values(pd.DataFrame([payload]))
                if shap_vals is not None and shap_vals.size > 0:
                    from rekakarbon_ml.pipeline.transformers import DERIVED_FEATURE_NAMES
                    shap_df = pd.DataFrame({
                        "Fitur": DERIVED_FEATURE_NAMES,
                        "Kontribusi SHAP Value": shap_vals.flatten()[:len(DERIVED_FEATURE_NAMES)],
                    }).sort_values(by="Kontribusi SHAP Value", key=abs, ascending=True)

                    shap_fig = px.bar(
                        shap_df,
                        x="Kontribusi SHAP Value",
                        y="Fitur",
                        orientation="h",
                        title="Grafik Kontribusi SHAP TreeExplainer (Scikit-Learn IsolationForest)",
                        color="Kontribusi SHAP Value",
                        color_continuous_scale="RdBu_r",
                    )
                    st.plotly_chart(shap_fig, use_container_width=True)
            except Exception as e:
                st.caption(f"SHAP chart fallback notice: {e}")

    # Waterfall breakdown chart of expected emissions vs reported
    st.markdown("#### 📊 Rincian Stoikiometri Fisik vs Laporan Emisi")
    payload = st.session_state.last_payload
    e_diesel = (payload["stat_fuel_liters"] + payload["mob_fuel_liters"]) * STOICHIOMETRIC_FACTORS[
        "solar_diesel_tco2e_per_liter"
    ]
    e_coal = (
        payload["cost_coal_idr"] / MARKET_PRICE_RANGES["coal"]["nominal"]
    ) * STOICHIOMETRIC_FACTORS["coal_tco2e_per_kg"]
    e_gas = (
        payload["cost_gas_idr"] / MARKET_PRICE_RANGES["natural_gas"]["nominal"]
    ) * STOICHIOMETRIC_FACTORS["natural_gas_tco2e_per_m3"]
    e_pln = (
        payload["cost_pln_idr"] / MARKET_PRICE_RANGES["grid_electricity"]["nominal"]
    ) * STOICHIOMETRIC_FACTORS["grid_electricity_tco2e_per_kwh"]
    e_process = (
        payload["clinker_tonnes"]
        * STOICHIOMETRIC_FACTORS["cement_clinker_calcination_tco2e_per_ton"]
    )

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
                f"{res['expected_emission_tco2e']:,.0f}",
                f"{res['reported_emission_tco2e']:,.0f}",
            ],
            y=[
                e_diesel,
                e_coal,
                e_gas,
                e_pln,
                e_process,
                res["expected_emission_tco2e"],
                res["reported_emission_tco2e"],
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
    st.plotly_chart(wf_fig, use_container_width=True)

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
        symbol="sector",
        color_discrete_map={"PASS_VERIFIED": "#10b981", "REJECT_ANOMALY": "#ef4444"},
        hover_data=["sector", "AI_TrustScore", "Divergence_%"],
        title="Peta Distribusi Emisi: Laporan Valid vs Anomali Terdeteksi (6 Sektor)",
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
