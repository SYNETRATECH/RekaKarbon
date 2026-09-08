"""
PSI-Based Drift Detector for RekaKarbon Production Monitoring.

Computes Population Stability Index (PSI) across all 20 engineered features
between the training baseline and the live production feedback pool distribution.

PSI Interpretation:
  PSI < 0.10  : No significant shift — model is stable
  PSI 0.10-0.20: Moderate shift — monitor closely, consider scheduling retrain
  PSI > 0.20  : SIGNIFICANT DRIFT — trigger retraining pipeline immediately
"""

import logging

import numpy as np
import pandas as pd

from ..training.transformers import DERIVED_FEATURE_NAMES, EmissionFeatureEngineer
from .types import DriftReport

logger = logging.getLogger(__name__)

PSI_THRESHOLD_WARNING: float = 0.10
PSI_THRESHOLD_CRITICAL: float = 0.20
MIN_PRODUCTION_SAMPLES: int = 50  # Minimum real records before drift is assessed
PSI_BINS: int = 10
PSI_EPSILON: float = 1e-6

__all__ = [
    "DriftReport",
    "DriftDetector",
    "compute_psi",
    "PSI_THRESHOLD_WARNING",
    "PSI_THRESHOLD_CRITICAL",
]


def compute_psi(
    baseline: np.ndarray,
    production: np.ndarray,
    n_bins: int = PSI_BINS,
) -> float:
    """
    Computes the Population Stability Index (PSI) between two 1-D arrays.

    PSI measures how much the distribution of ``production`` has shifted
    relative to ``baseline`` (the training distribution). Higher PSI indicates
    greater distributional shift.

    Algorithm:
      1. Compute equal-frequency bin edges from ``baseline`` using percentiles.
      2. Assign both arrays to bins via ``np.searchsorted``.
      3. Compute proportion arrays p_base and p_prod (ε-stabilised).
      4. PSI = Σ (p_prod - p_base) × ln(p_prod / p_base)

    Args:
        baseline: 1-D float array representing the training distribution.
        production: 1-D float array representing the production distribution.
        n_bins: Number of equal-frequency bins derived from ``baseline``.

    Returns:
        Non-negative PSI float value.
    """
    baseline = np.asarray(baseline, dtype=float).ravel()
    production = np.asarray(production, dtype=float).ravel()

    if len(baseline) == 0 or len(production) == 0:
        return 0.0

    # Equal-frequency bin edges based on the baseline distribution
    percentiles = np.linspace(0, 100, n_bins + 1)
    bin_edges = np.unique(np.percentile(baseline, percentiles))

    if len(bin_edges) < 2:
        # Degenerate case: all values are identical → no distributional information
        return 0.0

    # Assign samples to bins (clip to valid range)
    base_bins = np.searchsorted(bin_edges[1:-1], baseline, side="right")
    prod_bins = np.searchsorted(bin_edges[1:-1], production, side="right")

    n_base = float(len(baseline))
    n_prod = float(len(production))

    psi_total = 0.0
    actual_n_bins = len(bin_edges) - 1

    for b in range(actual_n_bins):
        p_base = (np.sum(base_bins == b) / n_base) + PSI_EPSILON
        p_prod = (np.sum(prod_bins == b) / n_prod) + PSI_EPSILON
        psi_total += (p_prod - p_base) * np.log(p_prod / p_base)

    return float(max(psi_total, 0.0))


class DriftDetector:
    """
    Monitors production input distribution drift against the training baseline
    using Population Stability Index (PSI) computed over all 20 engineered features.

    Usage:
        detector = DriftDetector(train_df)
        report = detector.detect(production_feedback_df)
        if report.drift_detected:
            trigger_retraining()
    """

    def __init__(self, train_df: pd.DataFrame) -> None:
        """
        Initializes the detector and pre-computes the baseline feature matrix.

        Args:
            train_df: The training split DataFrame used to establish the
                      reference distribution. Should be the same split used
                      to train the current production model.
        """
        self._engineer = EmissionFeatureEngineer()
        self._feature_names = DERIVED_FEATURE_NAMES
        self._baseline_features: np.ndarray = np.asarray(
            self._engineer.transform(train_df), dtype=float
        )
        self._n_baseline = len(train_df)
        logger.info(
            "DriftDetector initialized with %d baseline samples, %d features.",
            self._n_baseline,
            len(self._feature_names),
        )

    def detect(self, production_df: pd.DataFrame) -> DriftReport:
        """
        Runs PSI drift detection across all engineered features.

        If ``len(production_df) < MIN_PRODUCTION_SAMPLES``, returns a safe
        no-drift report with all PSI values set to 0.0 and an explanatory
        recommendation — we cannot reliably estimate a distribution from too
        few samples.

        Args:
            production_df: DataFrame of production records from the feedback pool.
                           Must contain the same raw columns as the training split.

        Returns:
            DriftReport with per-feature PSI values, aggregated statistics,
            drift flags, and a human-readable recommendation in Bahasa Indonesia.
        """
        n_prod = len(production_df)

        if n_prod < MIN_PRODUCTION_SAMPLES:
            logger.info(
                "Drift detection skipped: only %d production samples (minimum: %d).",
                n_prod,
                MIN_PRODUCTION_SAMPLES,
            )
            return DriftReport(
                feature_psi={name: 0.0 for name in self._feature_names},
                mean_psi=0.0,
                max_psi=0.0,
                drift_detected=False,
                warning_detected=False,
                triggered_features=[],
                n_baseline_samples=self._n_baseline,
                n_production_samples=n_prod,
                recommendation=(
                    f"Sampel produksi tidak mencukupi ({n_prod} < {MIN_PRODUCTION_SAMPLES}). "
                    "Kumpulkan lebih banyak data sebelum deteksi drift dapat dievaluasi."
                ),
            )

        # Engineer production features
        prod_features = np.asarray(self._engineer.transform(production_df), dtype=float)

        # Compute PSI per feature
        feature_psi: dict[str, float] = {}
        for i, name in enumerate(self._feature_names):
            baseline_col = self._baseline_features[:, i]
            prod_col = prod_features[:, i]
            psi_val = compute_psi(baseline_col, prod_col)
            feature_psi[name] = round(float(psi_val), 6)
            if psi_val >= PSI_THRESHOLD_CRITICAL:
                logger.warning("DRIFT CRITICAL | Feature: %-40s | PSI: %.4f", name, psi_val)
            elif psi_val >= PSI_THRESHOLD_WARNING:
                logger.info("DRIFT WARNING  | Feature: %-40s | PSI: %.4f", name, psi_val)

        psi_values = list(feature_psi.values())
        mean_psi = float(np.mean(psi_values))
        max_psi = float(np.max(psi_values))
        triggered = [name for name, psi in feature_psi.items() if psi >= PSI_THRESHOLD_CRITICAL]

        drift_detected = max_psi >= PSI_THRESHOLD_CRITICAL
        warning_detected = mean_psi >= PSI_THRESHOLD_WARNING

        if drift_detected:
            recommendation = (
                f"Drift kritis terdeteksi pada {len(triggered)} fitur: "
                f"{triggered[:3]}{'...' if len(triggered) > 3 else ''}. "
                "Segera lakukan retraining model dengan data produksi terbaru."
            )
        elif warning_detected:
            recommendation = (
                f"Drift moderat terdeteksi (Mean PSI={mean_psi:.4f}). "
                "Pantau distribusi data produksi dan pertimbangkan retraining dalam waktu dekat."
            )
        else:
            recommendation = (
                f"Distribusi data produksi stabil (Mean PSI={mean_psi:.4f}). "
                "Model masih relevan dengan karakteristik data lapangan."
            )

        logger.info(
            "Drift scan complete — Mean PSI: %.4f | Max PSI: %.4f | "
            "Drift: %s | Warning: %s | Triggered features: %d",
            mean_psi,
            max_psi,
            drift_detected,
            warning_detected,
            len(triggered),
        )

        return DriftReport(
            feature_psi=feature_psi,
            mean_psi=round(mean_psi, 6),
            max_psi=round(max_psi, 6),
            drift_detected=drift_detected,
            warning_detected=warning_detected,
            triggered_features=triggered,
            n_baseline_samples=self._n_baseline,
            n_production_samples=n_prod,
            recommendation=recommendation,
        )
