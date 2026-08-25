"""
High-Level Unified Predictor for Carbon Emissions Anomaly Detection.
Supports both Scikit-Learn (.pkl) and ONNX Runtime (.onnx).
"""

import os
from typing import Dict, Any, List
import numpy as np
import pandas as pd
import onnxruntime as ort

from ..pipeline.transformers import EmissionFeatureEngineer, FEATURE_COLUMNS
from ..pipeline.build_pipeline import load_pipeline


class CarbonAnomalyPredictor:
    """Production-ready anomaly detector with rich explanations & trust scores."""

    def __init__(
        self,
        model_pkl_path: str = "models/anomaly_pipeline.pkl",
        onnx_path: str = "models/anomaly_pipeline.onnx",
        use_onnx: bool = True
    ):
        self.use_onnx = use_onnx
        self.feature_engineer = EmissionFeatureEngineer()

        if not os.path.exists(model_pkl_path):
            from ..pipeline.build_pipeline import train_and_save_pipeline
            self.pipeline, _ = train_and_save_pipeline(save_dir=os.path.dirname(model_pkl_path) or "models")
        else:
            self.pipeline = load_pipeline(model_pkl_path)

        if not os.path.exists(onnx_path):
            from ..pipeline.onnx_exporter import export_pipeline_to_onnx
            export_pipeline_to_onnx(self.pipeline, onnx_path)

        self.onnx_path = onnx_path
        self.ort_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    def predict_single(self, record: Dict[str, Any]) -> Dict[str, Any]:
        df = pd.DataFrame([record])
        res = self.predict_batch(df)
        return res[0]

    def predict_batch(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        # Ensure all columns exist
        df_eval = df.copy()
        for col in FEATURE_COLUMNS:
            if col not in df_eval.columns:
                df_eval[col] = 0.0

        # Transform features
        X_mat = df_eval[FEATURE_COLUMNS].to_numpy(dtype=np.float32)
        eng_features = self.feature_engineer.transform(X_mat)

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
            is_anomaly = bool(preds[i] == -1)
            decision = float(decisions[i])

            # Logistic mapping of decision score to anomaly probability
            anomaly_score = round(float(np.clip(1.0 / (1.0 + np.exp(decision * 10.0)), 0.0, 1.0)), 4)

            stat_fuel = float(row.get("stat_fuel_liters", 0))
            mob_fuel = float(row.get("mob_fuel_liters", 0))
            c_solar = float(row.get("cost_solar_idr", 0))
            c_coal = float(row.get("cost_coal_idr", 0))
            c_gas = float(row.get("cost_gas_idr", 0))
            c_pln = float(row.get("cost_pln_idr", 0))
            reported = float(row.get("reported_emissions_tco2e", 0))
            prod = float(row.get("production_tonnes", 1))
            hist = float(row.get("historical_emissions_tco2e", reported))

            # Expected physical stoichiometric emission calculation
            e_expected = (
                (stat_fuel + mob_fuel) * 0.00268 +
                (c_coal / 1200.0) * 0.00242 +
                (c_gas / 10000.0) * 0.0019 +
                (c_pln / 1600.0) * 0.00085
            )
            divergence_pct = round(abs(e_expected - reported) / (e_expected + 1e-6) * 100, 1)

            # Score 1: DJP e-Faktur consistency (unit fuel price realism)
            unit_solar = c_solar / (stat_fuel + 1e-6)
            if (15000 <= unit_solar <= 26000) or stat_fuel == 0:
                score_djp = 98.5
            else:
                score_djp = max(10.0, round(100.0 - abs(unit_solar - 20000.0) / 200.0, 1))

            # Score 2: Physical BBM vs emission correlation
            if divergence_pct < 15:
                score_bbm = round(99.0 - (divergence_pct * 0.5), 1)
            else:
                score_bbm = max(5.0, round(100.0 - divergence_pct * 1.8, 1))

            # Score 3: CEMS / Production intensity score
            intensity = reported / (prod + 1e-6)
            if 0.05 <= intensity <= 3.0:
                score_cems = 96.0
            else:
                score_cems = max(15.0, round(100.0 - abs(intensity - 0.5) * 60.0, 1))

            flags = []
            if score_djp < 60:
                flags.append("BIAYA_SOLAR_TIDAK_REALISTIS")
            if divergence_pct > 25:
                flags.append("DEVIASI_FISIK_DAN_LAPORAN_TINGGI")
            if intensity < 0.02:
                flags.append("INTENSITAS_EMISI_TERLALU_RENDAH")
            if abs(reported - hist) / (hist + 1e-6) > 0.6:
                flags.append("VOLATILITAS_HISTORIS_EKSTRIM")

            composite_trust = round((score_djp + score_bbm + score_cems) / 3, 1)
            is_flagged = is_anomaly or (composite_trust < 75.0) or (divergence_pct > 25.0)

            if not is_flagged:
                explanation = f"Laporan konsisten. Total {reported:,.0f} tCO2e sesuai dengan pengeluaran energi dan kapasitas produksi ({prod:,.0f} ton)."
            else:
                explanation = f"Anomali terdeteksi (Divergensi {divergence_pct}%). Terindikasi ketidaksesuaian antara pos biaya e-Faktur dan volume bahan bakar fisik."

            results.append({
                "is_anomaly": is_flagged,
                "verdict": "REJECT_ANOMALY" if is_flagged else "PASS_VERIFIED",
                "anomaly_score": anomaly_score,
                "trust_score": composite_trust,
                "divergence_percent": divergence_pct,
                "expected_emission_tco2e": round(e_expected, 2),
                "reported_emission_tco2e": round(reported, 2),
                "score_djp": round(score_djp, 1),
                "score_bbm": round(score_bbm, 1),
                "score_cems": round(score_cems, 1),
                "flags": flags,
                "explanation": explanation
            })

        return results
