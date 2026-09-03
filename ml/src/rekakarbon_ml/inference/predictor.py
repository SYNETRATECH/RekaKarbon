"""
High-Level Unified Predictor for GHG Multi-Scope Carbon Emissions Anomaly Detection.
Outputs transparent decision-support diagnostics, scope-level breakdowns, and XAI feature attributions.
"""

import os
from typing import Any, Dict, List, cast

import numpy as np
import onnxruntime as ort
import pandas as pd

from ..data.benchmark_loader import (
    MARKET_PRICE_RANGES,
    STOICHIOMETRIC_FACTORS,
    SUPPORTED_SECTORS,
    SectorBenchmarkLoader,
)
from ..training.trainer import load_pipeline
from ..training.transformers import (
    RAW_FEATURE_COLUMNS,
    SECTOR_TO_IDX,
    EmissionFeatureEngineer,
)


class CarbonAnomalyPredictor:
    """
    Production-ready carbon report anomaly detector with multi-scope physical stoichiometry,
    e-Faktur price checks, math coherence audits, and explainable decision-support diagnostics.
    """

    def __init__(
        self,
        model_pkl_path: str = "models/anomaly_pipeline.pkl",
        onnx_path: str = "models/anomaly_pipeline.onnx",
        use_onnx: bool = True,
    ):
        self.use_onnx = use_onnx
        self.loader = SectorBenchmarkLoader()
        self.benchmarks = self.loader.get_sector_emission_factors()
        self.factors = STOICHIOMETRIC_FACTORS
        self.prices = MARKET_PRICE_RANGES
        self.feature_engineer = EmissionFeatureEngineer()

        if not os.path.exists(model_pkl_path):
            from ..training.trainer import train_and_save_pipeline

            self.pipeline, _ = train_and_save_pipeline(
                save_dir=os.path.dirname(model_pkl_path) or "models"
            )
        else:
            self.pipeline = load_pipeline(model_pkl_path)

        if not os.path.exists(onnx_path):
            from ..training.onnx_exporter import export_pipeline_to_onnx

            export_pipeline_to_onnx(self.pipeline, onnx_path)

        self.onnx_path = onnx_path
        self.ort_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
        self._shap_explainer = None

    def compute_shap_values(self, df_raw: pd.DataFrame) -> np.ndarray:
        """Computes exact SHAP feature contribution values using TreeExplainer."""
        if self._shap_explainer is None:
            import shap

            detector = self.pipeline.named_steps["detector"]
            self._shap_explainer = shap.TreeExplainer(detector)

        assert self._shap_explainer is not None
        eng_features = self.feature_engineer.transform(df_raw)
        scaler = self.pipeline.named_steps["scaler"]
        scaled_features = scaler.transform(eng_features)
        shap_vals = self._shap_explainer.shap_values(scaled_features)
        return np.asarray(shap_vals)

    def predict_single(self, record: Dict[str, Any], validate: bool = False) -> Dict[str, Any]:
        """Runs end-to-end anomaly audit on a single company report dict."""
        if validate:
            from ..data.schema import validate_emission_dict

            is_valid, err_msg, validated = validate_emission_dict(record)
            if not is_valid or validated is None:
                raise ValueError(f"Input validation error: {err_msg}")
            payload = validated.to_feature_dict()
        else:
            payload = record

        df = pd.DataFrame([payload])
        res = self.predict_batch(df)
        return res[0]

    def predict_batch(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Runs vectorized multi-scope anomaly audit on a DataFrame of company reports."""
        df_eval = df.copy()

        # Map sector
        if "sector" in df_eval.columns and "sector_idx" not in df_eval.columns:
            df_eval["sector_idx"] = (
                df_eval["sector"]
                .map(lambda s: SECTOR_TO_IDX.get(self.loader.normalize_sector_key(str(s)), 0))
                .fillna(0)
                .astype(float)
            )

        for col in RAW_FEATURE_COLUMNS:
            if col not in df_eval.columns:
                df_eval[col] = 0.0

        eng_features = self.feature_engineer.transform(df_eval)

        if self.use_onnx:
            input_name = self.ort_session.get_inputs()[0].name
            onnx_out = self.ort_session.run(None, {input_name: eng_features.astype(np.float32)})
            decisions = onnx_out[1].flatten()
        else:
            scaler = self.pipeline.named_steps["scaler"]
            detector = self.pipeline.named_steps["detector"]
            scaled = scaler.transform(eng_features)
            decisions = detector.decision_function(scaled)

        results = []
        dict_rows = df_eval.to_dict(orient="records")

        for i, row in enumerate(dict_rows):
            raw_sec = str(row.get("sector", SUPPORTED_SECTORS[0]))
            sector_key = self.loader.normalize_sector_key(raw_sec)
            bench = self.benchmarks.get(sector_key, self.benchmarks[SUPPORTED_SECTORS[0]])

            decision = float(decisions[i])
            anomaly_prob = float(np.clip(1.0 / (1.0 + np.exp(decision * 10.0)), 0.0, 1.0))

            prod = max(float(row.get("production_tonnes", 1.0)), 1e-4)
            s1_rep = max(float(row.get("reported_scope1_tco2e", 0.0)), 0.0)
            s2_rep = max(float(row.get("reported_scope2_tco2e", 0.0)), 0.0)
            s3_rep = max(float(row.get("reported_scope3_tco2e", 0.0)), 0.0)
            reported_tot = float(row.get("reported_emissions_tco2e", s1_rep + s2_rep + s3_rep))
            if reported_tot <= 0:
                reported_tot = s1_rep + s2_rep + s3_rep

            # Fallback allocation if scopes were omitted in input payload
            if s1_rep == 0.0 and s2_rep == 0.0 and reported_tot > 0:
                shares = bench.get(
                    "expected_scope_shares", {"scope1": 0.60, "scope2": 0.35, "scope3": 0.05}
                )
                s1_rep = reported_tot * shares.get("scope1", 0.60)
                s2_rep = reported_tot * shares.get("scope2", 0.35)
                s3_rep = reported_tot * shares.get("scope3", 0.05)

            hist = max(float(row.get("historical_emissions_tco2e", reported_tot)), 1e-4)

            stat_fuel = float(row.get("stat_fuel_liters", 0.0))
            mob_fuel = float(row.get("mob_fuel_liters", 0.0))
            coal_kg = float(row.get("coal_kg", 0.0))
            gas_m3 = float(row.get("gas_m3", 0.0))
            elec_kwh = float(row.get("electricity_kwh", 0.0))
            c_solar = float(row.get("cost_solar_idr", 0.0))
            c_coal = float(row.get("cost_coal_idr", 0.0))
            c_gas = float(row.get("cost_gas_idr", 0.0))
            c_pln = float(row.get("cost_pln_idr", 0.0))
            clinker = float(row.get("clinker_tonnes", 0.0))

            # --- TIER 1: SCOPE 1 STOICHIOMETRIC COMBUSTION ---
            tot_diesel = stat_fuel + mob_fuel
            e_diesel = tot_diesel * self.factors["solar_diesel_tco2e_per_liter"]
            e_coal = (
                (coal_kg * self.factors["coal_tco2e_per_kg"])
                if coal_kg > 0
                else (c_coal / max(self.prices["coal"]["nominal"], 1.0))
                * self.factors["coal_tco2e_per_kg"]
            )
            e_gas = (
                (gas_m3 * self.factors["natural_gas_tco2e_per_m3"])
                if gas_m3 > 0
                else (c_gas / max(self.prices["natural_gas"]["nominal"], 1.0))
                * self.factors["natural_gas_tco2e_per_m3"]
            )
            e_proc = clinker * self.factors["cement_clinker_calcination_tco2e_per_ton"]
            e_s1_expected = max(e_diesel + e_coal + e_gas + e_proc, 0.001)

            div_s1_pct = round(abs(e_s1_expected - s1_rep) / (e_s1_expected + 1e-6) * 100.0, 1)

            # --- TIER 2: SCOPE 2 GRID ELECTRICITY ---
            e_s2_expected = (
                (elec_kwh * self.factors["grid_electricity_tco2e_per_kwh"])
                if elec_kwh > 0
                else (c_pln / max(self.prices["grid_electricity"]["nominal"], 1.0))
                * self.factors["grid_electricity_tco2e_per_kwh"]
            )
            e_s2_expected = max(e_s2_expected, 0.001)

            div_s2_pct = round(abs(e_s2_expected - s2_rep) / (e_s2_expected + 1e-6) * 100.0, 1)

            # --- TIER 3: MATH COHERENCE ---
            scope_sum = s1_rep + s2_rep + s3_rep
            math_discrepancy_pct = round(
                abs(scope_sum - reported_tot) / (reported_tot + 1e-6) * 100.0, 1
            )

            # --- TIER 4: FISCAL PRICE CHECK (DJP e-Faktur) ---
            unit_solar = c_solar / (stat_fuel + 1e-6) if stat_fuel > 0 else 20500.0
            solar_min, solar_max = (
                self.prices["solar_diesel"]["min"],
                self.prices["solar_diesel"]["max"],
            )

            if solar_min <= unit_solar <= solar_max or stat_fuel == 0:
                score_djp = 98.5
            else:
                deviation = min(abs(unit_solar - 20500.0), 30000.0)
                score_djp = max(10.0, round(100.0 - (deviation / 250.0), 1))

            # Fuel combustion score (BBM)
            if div_s1_pct < 25.0:
                score_bbm = round(99.0 - (div_s1_pct * 0.4), 1)
            elif div_s1_pct < 45.0:
                score_bbm = round(89.0 - (div_s1_pct - 25.0) * 1.2, 1)
            else:
                score_bbm = max(5.0, round(65.0 - (div_s1_pct - 45.0) * 1.5, 1))

            # CEMS & Sector intensity score
            intensity = reported_tot / prod
            bench_avg = bench["avg_intensity_tco2e_per_ton"]
            bench_std = bench["std_intensity"]
            intensity_z = abs(intensity - bench_avg) / (bench_std + 1e-6)

            if intensity_z <= 2.0:
                score_cems = 96.0
            elif intensity_z <= 3.5:
                score_cems = max(50.0, round(95.0 - (intensity_z - 2.0) * 25.0, 1))
            else:
                score_cems = max(10.0, round(50.0 - (intensity_z - 3.5) * 15.0, 1))

            # Diagnostic Flags
            flags = []
            if math_discrepancy_pct > 6.0:
                flags.append("DISKREPANSI_PENJUMLAHAN_SCOPE")
            if div_s1_pct > 40.0:
                flags.append("DIVERGENSI_SCOPE1_TINGGI")
                if s1_rep < e_s1_expected:
                    flags.append("UNDER_REPORTING_TERINDIKASI")
            if div_s2_pct > 45.0 and elec_kwh > 0:
                flags.append("DIVERGENSI_SCOPE2_TINGGI")
            if score_djp < 70.0:
                flags.append("BIAYA_SOLAR_TIDAK_REALISTIS")
            if intensity < bench["min_intensity"] * 0.40:
                flags.append("INTENSITAS_EMISI_TERLALU_RENDAH")
            elif intensity > bench["max_intensity"] * 1.8:
                flags.append("INTENSITAS_EMISI_ABERRAN_SEKTOR")
            if abs(reported_tot - hist) / (hist + 1e-6) > 0.65:
                flags.append("VOLATILITAS_HISTORIS_EKSTRIM")

            composite_trust = round((score_djp * 0.25 + score_bbm * 0.45 + score_cems * 0.30), 1)
            if math_discrepancy_pct > 15.0:
                composite_trust = min(composite_trust, 45.0)

            is_alert = (
                (len(flags) > 0)
                or (composite_trust < 68.0)
                or (div_s1_pct > 45.0)
                or (anomaly_prob > 0.70 and composite_trust < 80.0)
            )

            # Determine alert priority level for the auditor
            if math_discrepancy_pct > 25.0 or div_s1_pct > 65.0 or composite_trust < 40.0:
                priority = "critical"
            elif is_alert and (composite_trust < 65.0 or anomaly_prob > 0.75):
                priority = "high"
            elif is_alert:
                priority = "medium"
            else:
                priority = "low"

            # Explainable AI (XAI) feature attribution drivers
            drivers = []
            if div_s1_pct > 15.0:
                drivers.append(
                    {
                        "feature_name": "scope1_stoichiometric_divergence",
                        "label": "Divergensi Stoikiometri Bahan Bakar Scope 1",
                        "user_value": f"{s1_rep:,.1f} tCO2e",
                        "benchmark_value": f"{round(e_s1_expected):,.1f} tCO2e",
                        "impact_score": min(100.0, round(div_s1_pct * 1.3, 1)),
                        "direction": "BELOW_NORMAL" if s1_rep < e_s1_expected else "ABOVE_NORMAL",
                        "unit": "tCO2e",
                    }
                )

            if math_discrepancy_pct > 5.0:
                drivers.append(
                    {
                        "feature_name": "scope_summation_discrepancy",
                        "label": "Konsistensi Penjumlahan Scope 1 + 2 + 3",
                        "user_value": f"Total Dilaporkan: {reported_tot:,.1f} tCO2e",
                        "benchmark_value": f"Jumlah Scope: {scope_sum:,.1f} tCO2e",
                        "impact_score": min(100.0, round(math_discrepancy_pct * 2.0, 1)),
                        "direction": "MISMATCH",
                        "unit": "tCO2e",
                    }
                )

            if stat_fuel > 0 and score_djp < 85.0:
                unit_solar_val = unit_solar
                drivers.append(
                    {
                        "feature_name": "solar_unit_cost",
                        "label": "Biaya Satuan Solar DJP e-Faktur",
                        "user_value": f"Rp {unit_solar_val:,.0f}/L",
                        "benchmark_value": "Rp 20.500/L (Pasar: 16rb-25rb)",
                        "impact_score": min(100.0, round(abs(unit_solar_val - 20500.0) / 200.0, 1)),
                        "direction": "MISMATCH",
                        "unit": "IDR/L",
                    }
                )

            if div_s2_pct > 25.0 and elec_kwh > 0:
                drivers.append(
                    {
                        "feature_name": "scope2_grid_divergence",
                        "label": "Divergensi Listrik PLN Scope 2",
                        "user_value": f"{s2_rep:,.1f} tCO2e",
                        "benchmark_value": f"{round(e_s2_expected):,.1f} tCO2e (Katalog: 0.207 kgCO2e/kWh)",
                        "impact_score": min(100.0, round(div_s2_pct * 1.1, 1)),
                        "direction": "BELOW_NORMAL" if s2_rep < e_s2_expected else "ABOVE_NORMAL",
                        "unit": "tCO2e",
                    }
                )

            drivers.append(
                {
                    "feature_name": "sector_intensity_zscore",
                    "label": f"Intensitas Emisi Sektor {bench.get('name', sector_key)}",
                    "user_value": f"{intensity:.3f} tCO2e/ton",
                    "benchmark_value": f"{bench['avg_intensity_tco2e_per_ton']:.3f} tCO2e/ton",
                    "impact_score": min(100.0, round(intensity_z * 20.0, 1)),
                    "direction": "BELOW_NORMAL"
                    if intensity < bench["avg_intensity_tco2e_per_ton"]
                    else "ABOVE_NORMAL",
                    "unit": "tCO2e/ton",
                }
            )

            drivers.sort(key=lambda d: float(cast(float, d["impact_score"])), reverse=True)

            # Recommendations for human verificator
            rec = "Laporan terverifikasi konsisten dengan neraca energi dan standar pelaporan GHG Protocol."
            if is_alert and drivers:
                top = drivers[0]["feature_name"]
                if top == "scope_summation_discrepancy":
                    rec = "Minta revisi kepada emiten: Total emisi yang dilaporkan tidak cocok dengan penjumlahan Scope 1, Scope 2, dan Scope 3."
                elif top == "scope1_stoichiometric_divergence":
                    rec = "Verifikasi dokumen bukti pembelian bahan bakar (e-Faktur/DO). Emisi Scope 1 yang dilaporkan jauh lebih rendah dari batas fisik stoikiometri."
                elif top == "solar_unit_cost":
                    rec = "Minta konfirmasi faktur pajak DJP. Harga satuan solar industri tertera menyimpang dari indeks pasar resmi BPH Migas."
                elif top == "scope2_grid_divergence":
                    rec = "Periksa kembali tagihan rekening listrik PLN. Emisi Scope 2 tidak seimbang dengan konsumsi daya fasilitas produksi."
                else:
                    rec = "Periksa intensitas emisi per ton hasil produksi terhadap rata-rata industri sejenis."

            if not is_alert:
                explanation = (
                    f"Laporan emisi sektor {bench.get('name', sector_key)} memenuhi ambang konsistensi. "
                    f"Scope 1 ({s1_rep:,.1f} tCO2e) dan Scope 2 ({s2_rep:,.1f} tCO2e) sinkron dengan neraca energi fisik."
                )
            else:
                reasons = []
                if "DISKREPANSI_PENJUMLAHAN_SCOPE" in flags:
                    reasons.append(
                        f"Diskrepan penjumlahan scope sebesar {math_discrepancy_pct}% (Total: {reported_tot:,.1f} vs Jumlah: {scope_sum:,.1f} tCO2e)"
                    )
                if "DIVERGENSI_SCOPE1_TINGGI" in flags:
                    reasons.append(
                        f"Divergensi bahan bakar Scope 1 sebesar {div_s1_pct}% (Dilaporkan: {s1_rep:,.1f} vs Fisik: {e_s1_expected:,.1f} tCO2e)"
                    )
                if "DIVERGENSI_SCOPE2_TINGGI" in flags:
                    reasons.append(f"Divergensi listrik Scope 2 sebesar {div_s2_pct}%")
                if "BIAYA_SOLAR_TIDAK_REALISTIS" in flags:
                    reasons.append(
                        f"Harga unit solar Rp {unit_solar:,.0f}/L menyimpang dari acuan DJP"
                    )
                if "INTENSITAS_EMISI_TERLALU_RENDAH" in flags:
                    reasons.append(
                        f"Intensitas emisi ({intensity:.3f} tCO2e/ton) berada di bawah standar wajar"
                    )
                if not reasons:
                    reasons.append(
                        "Pola multivariate anomali terdeteksi oleh ensemble Isolation Forest"
                    )
                explanation = f"Peringatan anomali terdeteksi: {'; '.join(reasons)}."

            scope_diagnostics = {
                "scope1": {
                    "reported_tco2e": round(s1_rep, 2),
                    "expected_tco2e": round(e_s1_expected, 2),
                    "divergence_pct": div_s1_pct,
                    "score": round(score_bbm, 1),
                    "flags": [f for f in flags if "SCOPE1" in f or "SOLAR" in f],
                },
                "scope2": {
                    "reported_tco2e": round(s2_rep, 2),
                    "expected_tco2e": round(e_s2_expected, 2),
                    "divergence_pct": div_s2_pct,
                    "score": round(score_cems, 1),
                    "flags": [f for f in flags if "SCOPE2" in f],
                },
                "scope3": {
                    "reported_tco2e": round(s3_rep, 2),
                    "is_reported": bool(s3_rep > 0),
                    "flags": [f for f in flags if "SCOPE3" in f],
                },
                "math_coherence": {
                    "sum_of_scopes": round(scope_sum, 2),
                    "reported_total": round(reported_tot, 2),
                    "discrepancy_pct": math_discrepancy_pct,
                    "is_coherent": bool(math_discrepancy_pct <= 5.0),
                },
            }

            xai = {
                "top_anomaly_drivers": drivers,
                "breakdown": {
                    "physical_fuel_delta_pct": div_s1_pct,
                    "electricity_delta_pct": div_s2_pct,
                    "fiscal_price_delta_pct": round(abs(unit_solar - 20500.0) / 20500.0 * 100.0, 1)
                    if stat_fuel > 0
                    else 0.0,
                    "sector_intensity_zscore": round(intensity_z, 2),
                },
                "recommendation": rec,
            }

            results.append(
                {
                    "is_anomaly": is_alert,
                    "verdict": "REJECT_ANOMALY" if is_alert else "PASS_VERIFIED",
                    "priority": priority,
                    "anomaly_score": round(anomaly_prob, 4),
                    "trust_score": composite_trust,
                    "divergence_percent": div_s1_pct,
                    "expected_emission_tco2e": round(e_s1_expected + e_s2_expected + s3_rep, 2),
                    "reported_emission_tco2e": round(reported_tot, 2),
                    "score_djp": round(score_djp, 1),
                    "score_bbm": round(score_bbm, 1),
                    "score_cems": round(score_cems, 1),
                    "flags": flags,
                    "explanation": explanation,
                    "scope_diagnostics": scope_diagnostics,
                    "xai": xai,
                }
            )

        return results
