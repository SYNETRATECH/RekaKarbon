"""
Model Leaderboard: ranks anomaly detector candidates from benchmark cross-validation
and highlights production-promotable champions.

Champion eligibility for production promotion (Phase 4) requires:
- strictly positive gain over the production baseline ``isolation_forest`` ROC-AUC on
  the holdout set, AND
- an ONNX export path (``onnx_exportable == True``) so the 100% SKLearn/ONNX parity
  gating rule can be guaranteed, AND
- not the ``baseline`` family nor the ``supervised`` diagnostic ceiling family
  (gradient boosting is a labeled diagnostic ceiling and is never promoted).
"""

import os
from typing import Any, Dict

import pandas as pd

BASELINE_NAME = "isolation_forest"
MIN_CHAMPION_AUC_GAIN = 0.01


def _holdout_metric(holdout_results: Dict[str, Dict[str, Any]], marker: str) -> float:
    """Pulls a metric out of the holdout results dict keyed '<candidate>@<contamination>'."""
    payload = holdout_results.get(marker)
    if payload is None:
        return float("nan")
    return float(payload["metrics"].get("roc_auc", float("nan")))


def build_leaderboard(
    summary_df: pd.DataFrame,
    holdout_results: Dict[str, Dict[str, Any]],
) -> pd.DataFrame:
    """
    Builds the leaderboard by merging cross-validated aggregates with holdout ROC-AUC.

    Columns:
        candidate, family, onnx_exportable, contamination,
        cv_auc_mean, cv_auc_std, cv_f1_mean, cv_recall_mild/moderate/strong_mean,
        holdout_auc, promotable
    """
    if summary_df.empty:
        return pd.DataFrame()

    def _cv(col: str) -> str:
        return col if col in summary_df.columns else ""

    best = summary_df.loc[
        summary_df[_cv("roc_auc_mean")].fillna(-1).groupby(summary_df["candidate"]).idxmax()
    ].copy()

    def holdout_for(row: pd.Series) -> float:
        return _holdout_metric(holdout_results, f"{row['candidate']}@{row['contamination']}")

    best["holdout_auc"] = best.apply(holdout_for, axis=1)
    best["cv_recall_mild_mean"] = best.get("recall_mild_mean")
    best["cv_recall_moderate_mean"] = best.get("recall_moderate_mean")
    best["cv_recall_strong_mean"] = best.get("recall_strong_mean")

    baseline_row = best.loc[best["candidate"] == BASELINE_NAME]
    baseline_auc = (
        float(baseline_row["holdout_auc"].iloc[0])
        if not baseline_row.empty and not pd.isna(baseline_row["holdout_auc"].iloc[0])
        else float("nan")
    )

    def is_promotable(row: pd.Series) -> bool:
        if not bool(row["onnx_exportable"]):
            return False
        if row["candidate"] == BASELINE_NAME:
            return False
        if str(row["family"]) == "supervised":
            return False
        if pd.isna(baseline_auc) or pd.isna(row["holdout_auc"]):
            return False
        return float(row["holdout_auc"]) >= baseline_auc + MIN_CHAMPION_AUC_GAIN

    best["promotable"] = best.apply(is_promotable, axis=1)

    cols = [
        "candidate",
        "family",
        "onnx_exportable",
        "contamination",
        "roc_auc_mean",
        "roc_auc_std",
        "f1_mean",
        "cv_recall_mild_mean",
        "cv_recall_moderate_mean",
        "cv_recall_strong_mean",
        "holdout_auc",
        "promotable",
    ]
    leaderboard = best[cols].sort_values(
        by=["promotable", "holdout_auc", "roc_auc_mean"],
        ascending=[False, False, False],
    )
    leaderboard = leaderboard.reset_index(drop=True)
    return leaderboard


def print_leaderboard(leaderboard: pd.DataFrame) -> None:
    """Prints the leaderboard to stdout in a compact table."""
    if leaderboard.empty:
        print("\nLeaderboard is empty - no benchmark results available.")
        return

    print("\n===================== LEADERBOARD =====================")
    display = leaderboard.copy()
    for col in (
        "roc_auc_mean",
        "roc_auc_std",
        "f1_mean",
        "cv_recall_mild_mean",
        "cv_recall_moderate_mean",
        "cv_recall_strong_mean",
        "holdout_auc",
    ):
        if col in display.columns:
            display[col] = display[col].apply(lambda v: f"{float(v):.4f}" if pd.notna(v) else "-")
    display["onnx_exportable"] = display["onnx_exportable"].map({True: "yes", False: "no"})
    display["promotable"] = display["promotable"].map({True: "*", False: ""})
    print(display.to_string(index=False))

    promotable = leaderboard[leaderboard["promotable"]]
    if not promotable.empty:
        top = promotable.iloc[0]
        print("\n[CHAMPION] " + top["candidate"])
        print(f"  Family       : {top['family']}")
        print(f"  Contamination: {top['contamination']}")
        print(f"  Holdout AUROC: {top['holdout_auc']:.4f}")
        print("  Promote to production only after ONNX export & 100% parity checks (Phase 4).")
    else:
        print(
            "\nNo promotable champion: no ONNX-exportable candidate beats "
            f"isolation_forest by >= {MIN_CHAMPION_AUC_GAIN:.2f} AUROC on the holdout."
        )
    print("========================================================")


def save_leaderboard(leaderboard: pd.DataFrame, output_dir: str) -> None:
    """Persists the leaderboard as CSV and Markdown for the benchmark report."""
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "leaderboard.csv")
    leaderboard.to_csv(csv_path, index=False)
    md_path = os.path.join(output_dir, "leaderboard.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Anomaly Detector Leaderboard\n\n")
        f.write(leaderboard.to_string(index=False))
        f.write("\n")
    print(f"Leaderboard saved: {csv_path}")
