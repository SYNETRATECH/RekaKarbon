"""
High-Level Unified Predictor for Carbon Emissions Anomaly Detection.
Supports Scikit-Learn (.pkl), ONNX Runtime (.onnx), and Multi-Tier Physics & Fiscal Auditing.
"""

import os
from typing import Any, Dict, List

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

    def predict_single(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Runs end-to-end anomaly audit on a single company report dict."""
        df = pd.DataFrame([record])
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
            preds = onnx_out[0].flatten()
            decisions = onnx_out[1].flatten()
        else:
            scaler = self.pipeline.named_steps["scaler"]
            detector = self.pipeline.named_steps["detector"]
            scaled = scaler.transform(eng_features)
            preds = detector.predict(scaled)
            decisions = detector.decision_function(scaled)

        results = []
        for i in range(len(df_eval)):
            row = df_eval.iloc[i]
            sector_name = str(row.get("sector", SUPPORTED_SECTORS[0]))
            if sector_name not in self.benchmarks:
                sector_name = SUPPORTED_SECTORS[0]
            bench = self.benchmarks[sector_name]

            is_ml_anomaly = bool(preds[i] == -1)
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
            if divergence_pct < 15.0:
                score_bbm = round(99.0 - (divergence_pct * 0.5), 1)
            elif divergence_pct < 30.0:
                score_bbm = round(90.0 - (divergence_pct - 15.0) * 1.5, 1)
            else:
                score_bbm = max(5.0, round(65.0 - (divergence_pct - 30.0) * 1.2, 1))

            # --- TIER 2 SECTOR: PEER INTENSITY & VOLATILITY ---
            intensity = reported / prod
            bench_avg = bench["avg_intensity_tco2e_per_ton"]
            bench_std = bench["std_intensity"]
            intensity_z = abs(intensity - bench_avg) / (bench_std + 1e-6)

            if intensity_z <= 1.5:
                score_cems = 96.0
            elif intensity_z <= 3.0:
                score_cems = max(50.0, round(95.0 - (intensity_z - 1.5) * 25.0, 1))
            else:
                score_cems = max(10.0, round(50.0 - (intensity_z - 3.0) * 15.0, 1))

            # Diagnostic Flags
            flags = []
            if score_djp < 70.0:
                flags.append("BIAYA_SOLAR_TIDAK_REALISTIS")
            if divergence_pct > 25.0:
                flags.append("DEVIASI_FISIK_DAN_LAPORAN_TINGGI")
            if reported < e_expected * 0.60:
                flags.append("UNDER_REPORTING_TERINDIKASI")
            if intensity < bench["min_intensity"] * 0.5:
                flags.append("INTENSITAS_EMISI_TERLALU_RENDAH")
            elif intensity > bench["max_intensity"] * 1.5:
                flags.append("INTENSITAS_EMISI_ABERRAN_SEKTOR")
            if (
                bench.get("has_process_emissions", False)
                and clinker == 0
                and reported < e_expected * 0.70
            ):
                flags.append("EMISI_PROSES_TIDAK_DILAPORKAN")
            if abs(reported - hist) / (hist + 1e-6) > 0.55:
                flags.append("VOLATILITAS_HISTORIS_EKSTRIM")

            composite_trust = round((score_djp * 0.30 + score_bbm * 0.40 + score_cems * 0.30), 1)
            is_flagged = is_ml_anomaly or (composite_trust < 75.0) or (divergence_pct > 30.0)

            # Explanations in Bahasa Indonesia
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
                }
            )

        return results
