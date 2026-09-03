"""
RekaKarbon AI/ML Carbon Emissions Anomaly Detection - Streamlit Prototype App.
Dedicated development & prototyping dashboard for inspecting emissions anomaly detection,
physics stoichiometry breakdowns, and e-Faktur fiscal integrity cross-checks.
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from rekakarbon_ml.config import DEFAULT_RANDOM_STATE
from rekakarbon_ml.data.benchmark_loader import (
    MARKET_PRICE_RANGES,
    STOICHIOMETRIC_FACTORS,
    SectorBenchmarkLoader,
)
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.training.onnx_exporter import verify_onnx_parity

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

    # Preset Values Calculation dynamically based on sector benchmarks
    bench_avg = float(sector_info.get("avg_intensity_tco2e_per_ton", 0.28))
    default_prod = 150000.0
    normal_total = default_prod * bench_avg
    shares = sector_info.get(
        "expected_scope_shares", {"scope1": 0.60, "scope2": 0.35, "scope3": 0.05}
    )
    s1_norm = round(normal_total * shares.get("scope1", 0.60), 2)
    s2_norm = round(normal_total * shares.get("scope2", 0.35), 2)
    s3_norm = round(normal_total * shares.get("scope3", 0.05), 2)

    fuel_priors = sector_info.get(
        "fuel_share_priors", {"solar_diesel": 0.5, "coal": 0.2, "natural_gas": 0.3}
    )
    share_solar = fuel_priors.get("solar_diesel", 0.5)
    share_coal = fuel_priors.get("coal", 0.2)
    share_gas = fuel_priors.get("natural_gas", 0.3)

    clinker_norm = 0.0
    s1_combustion = s1_norm
    if sector_info.get("has_process_emissions"):
        proc_factor = sector_info.get("process_emission_factor", 0.20)
        e_proc = s1_norm * proc_factor
        s1_combustion = s1_norm - e_proc
        clinker_norm = round(
            e_proc / STOICHIOMETRIC_FACTORS["cement_clinker_calcination_tco2e_per_ton"], 2
        )

    default_stat = round(
        (s1_combustion * share_solar * 0.8)
        / STOICHIOMETRIC_FACTORS["solar_diesel_tco2e_per_liter"],
        2,
    )
    default_mob = round(
        (s1_combustion * share_solar * 0.2)
        / STOICHIOMETRIC_FACTORS["solar_diesel_tco2e_per_liter"],
        2,
    )
    default_coal = round(
        (s1_combustion * share_coal) / STOICHIOMETRIC_FACTORS["coal_tco2e_per_kg"], 2
    )
    default_gas = round(
        (s1_combustion * share_gas) / STOICHIOMETRIC_FACTORS["natural_gas_tco2e_per_m3"], 2
    )
    default_elec = round(s2_norm / STOICHIOMETRIC_FACTORS["grid_electricity_tco2e_per_kwh"], 2)

    default_cost_solar = round(
        (default_stat + default_mob) * MARKET_PRICE_RANGES["solar_diesel"]["nominal"], 2
    )
    default_cost_coal = round(default_coal * MARKET_PRICE_RANGES["coal"]["nominal"], 2)
    default_cost_gas = round(default_gas * MARKET_PRICE_RANGES["natural_gas"]["nominal"], 2)
    default_cost_pln = round(default_elec * MARKET_PRICE_RANGES["grid_electricity"]["nominal"], 2)

    default_s1 = s1_norm
    default_s2 = s2_norm
    default_s3 = s3_norm
    default_reported = round(default_s1 + default_s2 + default_s3, 2)
    default_hist = default_reported

    if preset == "Anomali: Under-Reporting Ekstrim (Greenwashing)":
        default_s1 = round(s1_norm * 0.25, 2)
        default_reported = round(default_s1 + default_s2 + default_s3, 2)
    elif preset == "Anomali: e-Faktur Solar Fiktif / Harga Tidak Wajar":
        default_cost_solar = round((default_stat + default_mob) * 800.0, 2)
    elif preset == "Anomali: Emisi Proses Kalsinasi Disembunyikan":
        clinker_norm = 0.0
        default_reported = round(s1_combustion + default_s2 + default_s3, 2)

    with st.form("audit_form"):
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("##### 1. Cakupan Emisi GHG (tCO2e)")
            s1_val = st.number_input("Scope 1 (Emisi Langsung)", value=float(default_s1), step=50.0)
            s2_val = st.number_input(
                "Scope 2 (Listrik Tidak Langsung)", value=float(default_s2), step=50.0
            )
            s3_val = st.number_input(
                "Scope 3 (Opsional - Rantai Pasok)", value=float(default_s3), step=10.0
            )
            rep_val = st.number_input(
                "Total Dilaporkan (tCO2e)", value=float(default_reported), step=100.0
            )
            hist_val = st.number_input(
                "Historis Tahun Lalu (tCO2e)", value=float(default_hist), step=100.0
            )

        with c2:
            st.markdown("##### 2. Aktivitas Bahan Bakar & Proses Fisik")
            stat_fuel = st.number_input(
                "Solar Stasioner (Liter)", value=float(default_stat), step=10000.0
            )
            mob_fuel = st.number_input(
                "Solar Armada (Liter)", value=float(default_mob), step=5000.0
            )
            coal_kg = st.number_input("Batubara (kg)", value=float(default_coal), step=10000.0)
            gas_m3 = st.number_input("Gas Alam (m3)", value=float(default_gas), step=5000.0)
            clinker = st.number_input(
                "Klinker Kalsinasi (Ton)", value=float(clinker_norm), step=1000.0
            )

        with c3:
            st.markdown("##### 3. Data Utilitas & Neraca Finansial (e-Faktur)")
            prod = st.number_input(
                "Output Produksi Riil (Ton / Skala)", value=float(default_prod), step=5000.0
            )
            elec_kwh = st.number_input(
                "Konsumsi Listrik (kWh)", value=float(default_elec), step=50000.0
            )
            cost_solar = st.number_input(
                "Biaya Solar (Rp)", value=float(default_cost_solar), step=1e7
            )
            cost_pln = st.number_input(
                "Biaya Listrik PLN (Rp)", value=float(default_cost_pln), step=1e7
            )

        submit_btn = st.form_submit_button("🚀 Jalankan Audit AI dMRV", use_container_width=True)

    if submit_btn or "audit_res" not in st.session_state:
        sample_payload = {
            "sector": selected_sector,
            "production_tonnes": prod,
            "reported_scope1_tco2e": s1_val,
            "reported_scope2_tco2e": s2_val,
            "reported_scope3_tco2e": s3_val,
            "reported_emissions_tco2e": rep_val,
            "historical_emissions_tco2e": hist_val,
            "stat_fuel_liters": stat_fuel,
            "mob_fuel_liters": mob_fuel,
            "coal_kg": coal_kg,
            "gas_m3": gas_m3,
            "electricity_kwh": elec_kwh,
            "biomass_tonnes": 0.0,
            "clinker_tonnes": clinker,
            "cost_solar_idr": cost_solar,
            "cost_coal_idr": default_cost_coal,
            "cost_gas_idr": default_cost_gas,
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
            st.markdown(
                "##### 💡 Explainable AI (XAI) - Atribusi Fitur Anomali & Official SHAP Values"
            )
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
            st.info(f"**Rekomendasi Kepatuhan:** {xai['recommendation']}")

            # Compute official SHAP values via predictor.compute_shap_values
            try:
                payload = st.session_state.last_payload
                shap_vals = predictor.compute_shap_values(pd.DataFrame([payload]))
                if shap_vals is not None and shap_vals.size > 0:
                    from rekakarbon_ml.training.transformers import DERIVED_FEATURE_NAMES

                    shap_df = pd.DataFrame(
                        {
                            "Fitur": DERIVED_FEATURE_NAMES,
                            "Kontribusi SHAP Value": shap_vals.flatten()[
                                : len(DERIVED_FEATURE_NAMES)
                            ],
                        }
                    ).sort_values(by="Kontribusi SHAP Value", key=abs, ascending=True)

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
    gen = EmissionDataGenerator(random_state=DEFAULT_RANDOM_STATE)
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
