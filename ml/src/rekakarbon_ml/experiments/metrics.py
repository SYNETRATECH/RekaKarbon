"""
Benchmark Metrics for Anomaly Detector Comparison.

Computes threshold-free ranking metrics (ROC-AUC, PR-AUC), threshold-dependent
classification metrics, calibration diagnostics (Brier score and expected
calibration error on min-max normalized anomaly scores), per-fraud-archetype recall,
and per-severity recall. Severity-stratified recall measures detector sensitivity
across the mild/moderate/strong injection ladder.
"""

from typing import Any, Dict

import numpy as np
from sklearn.metrics import (
    average_precision_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

EPB: float = 1e-10


def expected_calibration_error(
    y_true: np.ndarray,
    probas: np.ndarray,
    n_bins: int = 10,
) -> float:
    """
    Expected calibration error on [0,1]-normalized scores (10 equal-width bins).

    Note: anomaly scores are normalized to [0,1] as a calibration proxy; the metric
    only measures how monotone the score-to-outcome relationship is, not absolute
    probability calibration.
    """
    probas = np.clip(np.asarray(probas, dtype=float), 0.0, 1.0)
    y_true = np.asarray(y_true, dtype=int)
    edges = np.linspace(0.0, 1.0, n_bins + 1)
    if probas.size == 0:
        return 0.0
    bin_ids = np.clip(np.searchsorted(edges, probas, side="right") - 1, 0, n_bins - 1)
    ece = 0.0
    n_total = float(max(len(probas), 1))
    for b in range(n_bins):
        mask = bin_ids == b
        n_bin = int(mask.sum())
        if n_bin == 0:
            continue
        conf = float(probas[mask].mean())
        acc = float(y_true[mask].mean())
        ece += (n_bin / n_total) * abs(conf - acc)
    return ece


def decision_threshold(y_true: np.ndarray, scores: np.ndarray) -> float:
    """
    Chooses the score threshold maximizing macro-balanced F1 on held-out labels.
    Used for threshold-dependent metrics in cross-validation only (tuned per fold).
    """
    y_true = np.asarray(y_true, dtype=int)
    scores = np.asarray(scores, dtype=float)
    uniq = np.unique(scores)
    if uniq.size <= 1:
        return float(uniq[0]) if uniq.size == 1 else 0.5
    best_t = float(uniq[0])
    best_f1 = -1.0
    for t in uniq:
        pred = (scores >= t).astype(int)
        p = precision_score(y_true, pred, zero_division=0)
        r = recall_score(y_true, pred, zero_division=0)
        f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
        if f1 > best_f1:
            best_f1 = f1
            best_t = float(t)
    return best_t


def _subgroup_recall(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    groups: np.ndarray | None,
    group_filter: Any,
) -> Dict[str, float]:
    if groups is None:
        return {}
    mask = (groups == group_filter) & (y_true == 1)
    if int(mask.sum()) == 0:
        return {}
    return {"count": int(mask.sum()), "recall": float((y_pred[mask] == 1).mean())}


def compute_metrics(
    y_true: np.ndarray,
    scores: np.ndarray,
    threshold: float | None = None,
    y_pred: np.ndarray | None = None,
    anomaly_types: np.ndarray | None = None,
    severity_levels: np.ndarray | None = None,
) -> Dict[str, Any]:
    """
    Computes the full metric bundle for a single prediction set.

    Args:
        y_true: Ground-truth anomaly labels (1 = anomaly).
        scores: Anomaly scores (higher = more anomalous).
        threshold: Classification threshold on ``scores``. If None, best-F1 threshold
            is derived from the labels (tuning bias only acceptable inside CV folds).
        y_pred: Optional precomputed binary predictions; if None, derived from scores.
        anomaly_types: Per-sample fraud archetype labels (only meaningful for anomalies).
        severity_levels: Per-sample severity tier ('mild'/'moderate'/'strong') or
            'none' for compliant rows.
    """
    y_true = np.asarray(y_true, dtype=int)
    scores = np.asarray(scores, dtype=float)
    n = len(y_true)
    if n == 0:
        raise ValueError("compute_metrics requires at least one sample")

    if threshold is None and y_pred is None:
        threshold = decision_threshold(y_true, scores)
    if y_pred is None:
        y_pred = (scores >= (threshold or 0.0)).astype(int)
    y_pred = np.asarray(y_pred, dtype=int)

    roc_auc = 0.5
    if len(np.unique(y_true)) > 1:
        try:
            roc_auc = float(roc_auc_score(y_true, scores))
        except ValueError:
            roc_auc = 0.5
    pr_auc = 0.0
    if int(y_true.sum()) > 0:
        try:
            pr_auc = float(average_precision_score(y_true, scores))
        except ValueError:
            pr_auc = 0.0

    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0

    fp = int(((y_pred == 1) & (y_true == 0)).sum())
    tn = int(((y_pred == 0) & (y_true == 0)).sum())
    fpr = fp / (fp + tn + EPB)

    if len(np.unique(scores)) > 1:
        norm = (scores - scores.min()) / (scores.max() - scores.min() + EPB)
    else:
        norm = np.zeros_like(scores)
    brier = float(((norm - y_true) ** 2).mean())
    ece = round(expected_calibration_error(y_true, norm), 6)

    per_type_recall: Dict[str, Dict[str, float]] = {}
    if anomaly_types is not None and anomaly_types.size == n:
        for atype in np.unique(anomaly_types):
            atype_str = str(atype)
            if atype_str == "NORMAL":
                continue
            per_type_recall[atype_str] = _subgroup_recall(y_true, y_pred, anomaly_types, atype)

    per_severity_recall: Dict[str, Dict[str, float]] = {}
    if severity_levels is not None and severity_levels.size == n:
        for sev in ("mild", "moderate", "strong"):
            per_severity_recall[sev] = _subgroup_recall(y_true, y_pred, severity_levels, sev)

    return {
        "n_samples": int(n),
        "anomaly_count": int(y_true.sum()),
        "roc_auc": round(roc_auc, 6),
        "pr_auc": round(pr_auc, 6),
        "precision": round(prec, 6),
        "recall": round(rec, 6),
        "f1": round(f1, 6),
        "false_positive_rate": round(fpr, 6),
        "brier": round(brier, 6),
        "ece": ece,
        "threshold": round(float(threshold if threshold is not None else 0.0), 8),
        "per_fraud_type_recall": per_type_recall,
        "per_severity_recall": per_severity_recall,
    }
