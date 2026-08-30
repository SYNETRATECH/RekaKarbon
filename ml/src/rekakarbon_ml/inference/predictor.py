"""
High-Level Unified Predictor for Carbon Emissions Anomaly Detection.
Supports Scikit-Learn (.pkl), ONNX Runtime (.onnx), and Multi-Tier Physics & Fiscal Auditing.
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
from ..pipeline.build_pipeline import load_pipeline
from ..pipeline.transformers import (
    RAW_FEATURE_COLUMNS,
    SECTOR_TO_IDX,
    EmissionFeatureEngineer,
)


class CarbonAnomalyPredictor:
    """
    Production-ready carbon report anomaly detector with physics stoichiometry,
    e-Faktur price boundary checks, sector-calibrated scoring, and explainable diagnostics.
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
            from ..pipeline.build_pipeline import train_and_save_pipeline

            self.pipeline, _ = train_and_save_pipeline(
                save_dir=os.path.dirname(model_pkl_path) or "models"
            )
        else:
            self.pipeline = load_pipeline(model_pkl_path)

        if not os.path.exists(onnx_path):
            from ..pipeline.onnx_exporter import export_pipeline_to_onnx

            export_pipeline_to_onnx(self.pipeline, onnx_path)

        self.onnx_path = onnx_path
        self.ort_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

        self._shap_explainer = None

    def compute_shap_values(self, df_raw: pd.DataFrame) -> np.ndarray:
        """
        Computes exact SHAP feature contribution values using official shap.TreeExplainer library.
        Returns shape (N_samples, N_features).
        """
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
        """Runs vectorized anomaly audit on a DataFrame of company reports."""
        df_eval = df.copy()

        # Handle sector string conversion
        if "sector" in df_eval.columns and "sector_idx" not in df_eval.columns:
            df_eval["sector_idx"] = (
                df_eval["sector"]
                .map(lambda s: SECTOR_TO_IDX.get(str(s), 0))
                .fillna(0)
                .astype(float)
            )

        for col in RAW_FEATURE_COLUMNS:
            if col not in df_eval.columns:
                df_eval[col] = 0.0

        # Transform features via sector-aware physics transformer
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
            sector_name = str(row.get("sector", SUPPORTED_SECTORS[0]))
            if sector_name not in self.benchmarks:
                sector_name = SUPPORTED_SECTORS[0]
            bench = self.benchmarks[sector_name]

            decision = float(decisions[i])

            # Logistic mapping of decision score to continuous anomaly probability [0, 1]
            anomaly_prob = float(np.clip(1.0 / (1.0 + np.exp(decision * 10.0)), 0.0, 1.0))

            stat_fuel = float(row.get("stat_fuel_liters", 0.0))
            mob_fuel = float(row.get("mob_fuel_liters", 0.0))
            biomass = float(row.get("biomass_tonnes", 0.0))
            clinker = float(row.get("clinker_tonnes", 0.0))
            c_solar = float(row.get("cost_solar_idr", 0.0))
            c_coal = float(row.get("cost_coal_idr", 0.0))
            c_gas = float(row.get("cost_gas_idr", 0.0))
            c_pln = float(row.get("cost_pln_idr", 0.0))
            reported = float(row.get("reported_emissions_tco2e", 0.0))
            prod = max(float(row.get("production_tonnes", 1.0)), 1e-4)
            hist = max(float(row.get("historical_emissions_tco2e", reported)), 1e-4)

            # --- TIER 1: STOICHIOMETRIC PHYSICAL BALANCE ---
            e_diesel = (stat_fuel + mob_fuel) * self.factors["solar_diesel_tco2e_per_liter"]
            e_coal = (c_coal / self.prices["coal"]["nominal"]) * self.factors["coal_tco2e_per_kg"]
            e_gas = (c_gas / self.prices["natural_gas"]["nominal"]) * self.factors[
                "natural_gas_tco2e_per_m3"
            ]
            e_pln = (c_pln / self.prices["grid_electricity"]["nominal"]) * self.factors[
                "grid_electricity_tco2e_per_kwh"
            ]
            e_biomass = biomass * self.factors["biomass_net_tco2e_per_ton"]

            # Process emission (cement calcination or metallurgy)
            if bench.get("has_process_emissions", False):
                if clinker > 0:
                    e_process = clinker * self.factors["cement_clinker_calcination_tco2e_per_ton"]
                else:
                    e_process = prod * bench.get("process_emission_factor", 0.35)
            else:
                e_process = 0.0

            e_expected = max(
                e_diesel + e_coal + e_gas + e_pln + e_biomass + e_process,
                prod * 0.02,
            )

            divergence_pct = round(abs(e_expected - reported) / (e_expected + 1e-6) * 100.0, 1)

            # --- TIER 1 FISCAL: DJP E-FAKTUR PRICE CHECK ---
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

            # --- TIER 2 PHYSICAL: BBM & COMBUSTION CORRELATION ---
            # Accounts for industrial fuel market price variations (±25% around nominal)
            if divergence_pct < 25.0:
                score_bbm = round(99.0 - (divergence_pct * 0.4), 1)
            elif divergence_pct < 45.0:
                score_bbm = round(89.0 - (divergence_pct - 25.0) * 1.2, 1)
            else:
                score_bbm = max(5.0, round(65.0 - (divergence_pct - 45.0) * 1.5, 1))

            # --- TIER 2 SECTOR: PEER INTENSITY & VOLATILITY ---
            intensity = reported / prod
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
            if score_djp < 70.0:
                flags.append("BIAYA_SOLAR_TIDAK_REALISTIS")
            if divergence_pct > 45.0:
                flags.append("DEVIASI_FISIK_DAN_LAPORAN_TINGGI")
            if reported < e_expected * 0.50:
                flags.append("UNDER_REPORTING_TERINDIKASI")
            if intensity < bench["min_intensity"] * 0.45:
                flags.append("INTENSITAS_EMISI_TERLALU_RENDAH")
            elif intensity > bench["max_intensity"] * 1.6:
                flags.append("INTENSITAS_EMISI_ABERRAN_SEKTOR")
            if (
                bench.get("has_process_emissions", False)
                and clinker == 0
                and reported < e_expected * 0.65
            ):
                flags.append("EMISI_PROSES_TIDAK_DILAPORKAN")
            if abs(reported - hist) / (hist + 1e-6) > 0.65:
                flags.append("VOLATILITAS_HISTORIS_EKSTRIM")

            composite_trust = round((score_djp * 0.30 + score_bbm * 0.40 + score_cems * 0.30), 1)
            is_flagged = (
                (len(flags) > 0)
                or (composite_trust < 68.0)
                or (divergence_pct > 45.0)
                or (anomaly_prob > 0.70 and composite_trust < 80.0)
            )

            # Explanations & XAI Feature Attribution
            drivers = []

            # 1. Stoichiometric Divergence
            impact_div = min(100.0, round(divergence_pct * 1.2, 1))
            is_under = reported < e_expected
            drivers.append(
                {
                    "feature_name": "stoichiometric_divergence",
                    "label": "Divergensi Fisik Stoikiometri",
                    "user_value": f"{reported:,.0f} tCO2e",
                    "benchmark_value": f"{round(e_expected):,.0f} tCO2e",
                    "impact_score": impact_div,
                    "direction": "BELOW_NORMAL" if is_under else "ABOVE_NORMAL",
                    "unit": "tCO2e",
                }
            )

            # 2. Fuel Unit Cost
            unit_solar_val = unit_solar if stat_fuel > 0 else 20500.0
            impact_solar = (
                min(
                    100.0,
                    round(abs(unit_solar_val - self.prices["solar_diesel"]["nominal"]) / 250.0, 1),
                )
                if stat_fuel > 0
                else 0.0
            )
            drivers.append(
                {
                    "feature_name": "solar_unit_cost",
                    "label": "Biaya Unit Solar DJP e-Faktur",
                    "user_value": f"Rp {unit_solar_val:,.0f}/L"
                    if stat_fuel > 0
                    else "N/A (Tidak Menggunakan Solar)",
                    "benchmark_value": f"Rp {self.prices['solar_diesel']['nominal']:,.0f}/L (Rp 16rb-25rb)",
                    "impact_score": impact_solar,
                    "direction": "MISMATCH" if impact_solar > 15.0 else "ABOVE_NORMAL",
                    "unit": "IDR/L",
                }
            )

            # 3. Sector Intensity Z-Score
            is_low = intensity < bench["avg_intensity_tco2e_per_ton"]
            impact_z = min(100.0, round(intensity_z * 22.0, 1))
            drivers.append(
                {
                    "feature_name": "sector_intensity_zscore",
                    "label": f"Intensitas Emisi Sektor {sector_name}",
                    "user_value": f"{intensity:.3f} tCO2e/ton",
                    "benchmark_value": f"{bench['avg_intensity_tco2e_per_ton']:.3f} tCO2e/ton (min: {bench['min_intensity']})",
                    "impact_score": impact_z,
                    "direction": "BELOW_NORMAL" if is_low else "ABOVE_NORMAL",
                    "unit": "tCO2e/ton",
                }
            )

            if "EMISI_PROSES_TIDAK_DILAPORKAN" in flags:
                drivers.append(
                    {
                        "feature_name": "process_emission_ratio",
                        "label": "Pos Emisi Proses Dekarbonasi/Peleburan",
                        "user_value": "0 tCO2e (Tidak Terdata)",
                        "benchmark_value": f"Faktor Dekarbonasi: {bench.get('process_emission_factor', 0.525)} tCO2e/ton",
                        "impact_score": 88.5,
                        "direction": "BELOW_NORMAL",
                        "unit": "tCO2e",
                    }
                )

            drivers.sort(key=lambda d: float(cast(float, d["impact_score"])), reverse=True)

            rec = "Laporan emisi Anda konsisten dan memenuhi standar acuan teknis ESDM & KLHK."
            if is_flagged and drivers:
                top_driver = drivers[0]["feature_name"]
                if top_driver == "stoichiometric_divergence":
                    rec = "Periksa kembali konsumsi BBM dan energi listrik. Angka emisi dilaporkan jauh di bawah batas stoikiometri pembakaran fisik."
                elif top_driver == "solar_unit_cost":
                    rec = "Verifikasi nomor seri DJP e-Faktur dan total belanja Solar HSD. Pembagian harga unit tidak sesuai harga pasar resmi."
                elif top_driver == "process_emission_ratio":
                    rec = "Tambahkan perhitungan emisi proses dekarbonasi batu kapur (clinker) atau reaksi peleburan dalam formulir pelaporan."
                elif top_driver == "sector_intensity_zscore":
                    rec = "Angka intensitas emisi per ton produk berbeda signifikan dari distribusi rata-rata industri sejenis."

            xai = {
                "top_anomaly_drivers": drivers,
                "breakdown": {
                    "physical_fuel_delta_pct": divergence_pct,
                    "fiscal_price_delta_pct": round(abs(unit_solar - 20500.0) / 20500.0 * 100.0, 1)
                    if stat_fuel > 0
                    else 0.0,
                    "sector_intensity_zscore": round(intensity_z, 2),
                },
                "recommendation": rec,
            }

            if not is_flagged:
                explanation = (
                    f"Laporan terverifikasi konsisten. Total emisi dilaporkan {reported:,.0f} tCO2e "
                    f"sesuai dengan estimasi stoikiometri energi ({e_expected:,.0f} tCO2e) "
                    f"dan intensitas sektor {sector_name} ({intensity:.3f} tCO2e/ton)."
                )
            else:
                reasons = []
                if divergence_pct > 25.0:
                    reasons.append(
                        f"Divergensi fisik {divergence_pct}% (dilaporkan: {reported:,.0f} tCO2e vs stoikiometri: {e_expected:,.0f} tCO2e)"
                    )
                if score_djp < 70.0:
                    reasons.append(
                        f"Unit price solar Rp {unit_solar:,.0f}/L menyimpang dari indeks pasar DJP (Rp 16.000-25.000/L)"
                    )
                if "EMISI_PROSES_TIDAK_DILAPORKAN" in flags:
                    reasons.append(
                        "Emisi proses dekarbonasi klinker/peleburan tidak terdata dalam pos pelaporan"
                    )
                if "INTENSITAS_EMISI_TERLALU_RENDAH" in flags:
                    reasons.append(
                        f"Intensitas emisi ({intensity:.3f} tCO2e/ton) berada di bawah ambang batas minimum sektor ({bench['min_intensity']} tCO2e/ton)"
                    )
                if not reasons:
                    reasons.append(
                        "Pola multivariate anomali terdeteksi oleh ensemble Isolation Forest"
                    )

                explanation = f"Anomali terdeteksi: {'; '.join(reasons)}."

            results.append(
                {
                    "is_anomaly": is_flagged,
                    "verdict": "REJECT_ANOMALY" if is_flagged else "PASS_VERIFIED",
                    "anomaly_score": round(anomaly_prob, 4),
                    "trust_score": composite_trust,
                    "divergence_percent": divergence_pct,
                    "expected_emission_tco2e": round(e_expected, 2),
                    "reported_emission_tco2e": round(reported, 2),
                    "score_djp": round(score_djp, 1),
                    "score_bbm": round(score_bbm, 1),
                    "score_cems": round(score_cems, 1),
                    "flags": flags,
                    "explanation": explanation,
                    "xai": xai,
                }
            )

        return results
