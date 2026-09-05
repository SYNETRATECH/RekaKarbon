"""
Audit form input component for Single Company Audit Simulator.
"""

from typing import Any

import streamlit as st

from rekakarbon_ml.studio.presets import PresetEmissionsData


def render_audit_form(
    preset: PresetEmissionsData,
    selected_sector: str,
) -> tuple[bool, dict[str, Any]]:
    """Renders the 3-column input form for emission reporting and returns submission status with payload."""
    with st.form("audit_form"):
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("##### 1. Cakupan Emisi GHG (tCO2e)")
            s1_val = st.number_input(
                "Scope 1 (Emisi Langsung)", value=float(preset.scope1), step=50.0
            )
            s2_val = st.number_input(
                "Scope 2 (Listrik Tidak Langsung)", value=float(preset.scope2), step=50.0
            )
            s3_val = st.number_input(
                "Scope 3 (Opsional - Rantai Pasok)", value=float(preset.scope3), step=10.0
            )
            rep_val = st.number_input(
                "Total Dilaporkan (tCO2e)", value=float(preset.total_reported), step=100.0
            )
            hist_val = st.number_input(
                "Historis Tahun Lalu (tCO2e)", value=float(preset.historical_emissions), step=100.0
            )

        with c2:
            st.markdown("##### 2. Aktivitas Bahan Bakar & Proses Fisik")
            stat_fuel = st.number_input(
                "Solar Stasioner (Liter)", value=float(preset.stat_fuel_liters), step=10000.0
            )
            mob_fuel = st.number_input(
                "Solar Armada (Liter)", value=float(preset.mob_fuel_liters), step=5000.0
            )
            coal_kg = st.number_input("Batubara (kg)", value=float(preset.coal_kg), step=10000.0)
            gas_m3 = st.number_input("Gas Alam (m3)", value=float(preset.gas_m3), step=5000.0)
            clinker = st.number_input(
                "Klinker Kalsinasi (Ton)", value=float(preset.clinker_tonnes), step=1000.0
            )

        with c3:
            st.markdown("##### 3. Data Utilitas & Neraca Finansial (e-Faktur)")
            prod = st.number_input(
                "Output Produksi Riil (Ton / Skala)",
                value=float(preset.production_tonnes),
                step=5000.0,
            )
            elec_kwh = st.number_input(
                "Konsumsi Listrik (kWh)", value=float(preset.electricity_kwh), step=50000.0
            )
            cost_solar = st.number_input(
                "Biaya Solar (Rp)", value=float(preset.cost_solar_idr), step=1e7
            )
            cost_pln = st.number_input(
                "Biaya Listrik PLN (Rp)", value=float(preset.cost_pln_idr), step=1e7
            )

        submit_btn = st.form_submit_button("🚀 Jalankan Audit AI dMRV", use_container_width=True)

    payload = {
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
        "cost_coal_idr": preset.cost_coal_idr,
        "cost_gas_idr": preset.cost_gas_idr,
        "cost_pln_idr": cost_pln,
    }

    return bool(submit_btn), payload
