"""
Model Benchmark Harness: compares anomaly detector candidates across
cross-validation folds, contamination levels, and a holdout set.

The harness generates a synthetic dataset over the severity ladder
(mild/moderate/strong), engineers the 20-dimension feature contract
(``EmissionFeatureEngineer``), and applies leak-free per-fold RobustScaler
scaling to every candidate so model comparisons are fair. Results are written to
``models/benchmark/`` and ranked on the leaderboard (``leaderboard.py``).
"""

import argparse
import json
import os
from dataclasses import asdict, dataclass, field
from typing import Any, Dict, Iterable, List, Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import RobustScaler

from ..config import DEFAULT_RANDOM_STATE, get_dataset_config, get_ml_config
from ..data.generator import EmissionDataGenerator
from ..training.transformers import DERIVED_FEATURE_NAMES, EmissionFeatureEngineer
from .candidates import (
    CANDIDATE_FACTORIES,
    available_candidates,
    build_candidate,
)
from .leaderboard import build_leaderboard, print_leaderboard, save_leaderboard
from .metrics import compute_metrics, decision_threshold

DEFAULT_SEVERITY_DISTRIBUTION: Dict[str, float] = {
    "mild": 0.3,
    "moderate": 0.4,
    "strong": 0.3,
}
DEFAULT_CONTAMINATION_SWEEP: List[float] = [0.05, 0.10, 0.15]


@dataclass
class BenchmarkConfig:
    """Configuration for a benchmark run."""

    n_samples: int = field(default_factory=lambda: int(get_dataset_config().default_n_samples))
    anomaly_ratio: float = field(
        default_factory=lambda: float(get_dataset_config().default_anomaly_ratio)
    )
    n_folds: int = 5
    contamination_sweep: List[float] = field(
        default_factory=lambda: list(DEFAULT_CONTAMINATION_SWEEP)
    )
    candidates: List[str] = field(default_factory=list)
    holdout_ratio: float = 0.15
    random_state: int = field(default_factory=lambda: DEFAULT_RANDOM_STATE)
    severity_distribution: Optional[Dict[str, float]] = field(
        default_factory=lambda: dict(DEFAULT_SEVERITY_DISTRIBUTION)
    )
    severity_tier: Optional[str] = None
    output_dir: str = field(
        default_factory=lambda: os.path.join(get_ml_config().paths.models_dir, "benchmark")
    )

    def resolve_candidate_names(self) -> List[str]:
        """Resolves the candidate list, defaulting to all runtime-available ones."""
        if self.candidates:
            unknown = set(self.candidates) - set(CANDIDATE_FACTORIES)
            if unknown:
                raise ValueError(
                    f"Unknown candidates {sorted(unknown)}. "
                    f"Available: {sorted(CANDIDATE_FACTORIES)}"
                )
            return self.candidates
        return sorted(CANDIDATE_FACTORIES.keys())


def _prepare_data(cfg: BenchmarkConfig) -> tuple[pd.DataFrame, np.ndarray, np.ndarray]:
    """Generates the dataset and returns (labeled_df, features, severity_labels)."""
    generator = EmissionDataGenerator(random_state=cfg.random_state)
    df = generator.generate_dataset(
        n_samples=cfg.n_samples,
        anomaly_ratio=cfg.anomaly_ratio,
        severity=cfg.severity_tier,
        severity_distribution=cfg.severity_distribution,
    )
    transformer = EmissionFeatureEngineer()
    features = np.asarray(transformer.transform(df), dtype=float)
    severity_labels = df["severity_level"].to_numpy().astype(str)
    return df, features, severity_labels


def _score_candidates(
    candidate_names: Iterable[str],
    X_fit: np.ndarray,
    y_fit: np.ndarray,
    X_eval: np.ndarray,
    y_eval: np.ndarray,
    contamination: float,
    anomaly_types_eval: np.ndarray | None,
    severity_eval: np.ndarray | None,
    random_state: int,
) -> Dict[str, Dict[str, Any]]:
    """Fits each candidate, tunes its threshold on the fit fold, and evaluates."""
    results: Dict[str, Dict[str, Any]] = {}
    for name in candidate_names:
        det = build_candidate(name, random_state=random_state)
        det.contamination = contamination
        det.fit(X_fit, y_fit)
        scores = det.score_samples(X_eval)
        threshold = decision_threshold(y_eval, scores)
        metrics = compute_metrics(
            y_eval,
            scores,
            threshold=threshold,
            anomaly_types=anomaly_types_eval,
            severity_levels=severity_eval,
        )
        results[name] = {"metrics": metrics, "info": asdict(det.info)}
    return results


def run_benchmark(cfg: BenchmarkConfig) -> Dict[str, Any]:
    """Executes the full benchmark: CV sweeps plus holdout verification."""
    candidate_names = cfg.resolve_candidate_names()
    df, features, severity_labels = _prepare_data(cfg)
    labels = df["is_anomaly"].to_numpy().astype(int)
    anomaly_types = df["anomaly_type"].to_numpy().astype(str)

    if len(np.unique(labels)) < 2 or int(labels.sum()) == 0:
        raise ValueError(
            "Generated dataset has no anomaly samples; adjust anomaly_ratio or n_samples."
        )

    indices = np.arange(features.shape[0])
    cv_splitter = StratifiedKFold(
        n_splits=cfg.n_folds,
        shuffle=True,
        random_state=cfg.random_state,
    ).split(features, labels)

    fold_results: List[Dict[str, Any]] = []
    fold_index = 0
    for train_idx, val_idx in cv_splitter:
        fold_index += 1
        X_fit = features[train_idx]
        y_fit = labels[train_idx]
        X_val = features[val_idx]
        y_val = labels[val_idx]
        scaler = RobustScaler().fit(X_fit)
        X_fit_s = scaler.transform(X_fit)
        X_val_s = scaler.transform(X_val)

        for contamination in cfg.contamination_sweep:
            scored = _score_candidates(
                candidate_names,
                X_fit_s,
                y_fit,
                X_val_s,
                y_val,
                contamination,
                anomaly_types[val_idx],
                severity_labels[val_idx],
                cfg.random_state + fold_index,
            )
            for name, payload in scored.items():
                record: Dict[str, Any] = {
                    "candidate": name,
                    "family": payload["info"]["family"],
                    "onnx_exportable": payload["info"]["onnx_exportable"],
                    "contamination": contamination,
                    "fold": fold_index,
                }
                record.update(payload["metrics"])
                fold_results.append(record)

    # Holdout verification: best-threshold candidate metrics on held-out data
    holdout_ratio = cfg.holdout_ratio
    n_hold = max(1, int(features.shape[0] * holdout_ratio))
    rng = np.random.RandomState(cfg.random_state)
    hold_idx = rng.choice(indices, size=n_hold, replace=False)
    fit_idx = np.setdiff1d(indices, hold_idx)
    X_fit = features[fit_idx]
    y_fit = labels[fit_idx]
    X_hold = features[hold_idx]
    y_hold = labels[hold_idx]
    scaler = RobustScaler().fit(X_fit)
    X_fit_s = scaler.transform(X_fit)
    X_hold_s = scaler.transform(X_hold)

    holdout_results: Dict[str, Dict[str, Any]] = {}
    for contamination in cfg.contamination_sweep:
        scored = _score_candidates(
            candidate_names,
            X_fit_s,
            y_fit,
            X_hold_s,
            y_hold,
            contamination,
            anomaly_types[hold_idx],
            severity_labels[hold_idx],
            cfg.random_state,
        )
        for name, payload in scored.items():
            holdout_results[f"{name}@{contamination}"] = {
                "metrics": payload["metrics"],
                "info": payload["info"],
            }

    summary_df = _aggregate_folds(fold_results)
    leaderboard = build_leaderboard(summary_df, holdout_results)

    artifacts = {
        "config": {
            "n_samples": cfg.n_samples,
            "anomaly_ratio": cfg.anomaly_ratio,
            "n_folds": cfg.n_folds,
            "contamination_sweep": cfg.contamination_sweep,
            "candidates": candidate_names,
            "holdout_ratio": cfg.holdout_ratio,
            "random_state": cfg.random_state,
            "severity_distribution": cfg.severity_distribution,
            "severity_tier": cfg.severity_tier,
        },
        "feature_dimensions": int(features.shape[1]),
        "feature_names": DERIVED_FEATURE_NAMES,
        "fold_results": fold_results,
        "holdout_results": holdout_results,
        "leaderboard": leaderboard.to_dict(orient="records"),
    }

    os.makedirs(cfg.output_dir, exist_ok=True)
    with open(os.path.join(cfg.output_dir, "benchmark_results.json"), "w", encoding="utf-8") as f:
        json.dump(artifacts, f, indent=2, default=_json_default)
    summary_df.to_csv(os.path.join(cfg.output_dir, "fold_summary.csv"), index=False)
    pd.DataFrame(fold_results).to_csv(os.path.join(cfg.output_dir, "fold_results.csv"), index=False)
    save_leaderboard(leaderboard, cfg.output_dir)

    return artifacts


def _aggregate_folds(fold_results: List[Dict[str, Any]]) -> pd.DataFrame:
    """Aggregates fold-level metrics into mean/std summaries per (candidate, contamination)."""
    df = pd.DataFrame(fold_results)
    metric_cols = [
        "roc_auc",
        "pr_auc",
        "precision",
        "recall",
        "f1",
        "false_positive_rate",
        "brier",
        "ece",
    ]
    groups = df.groupby(["candidate", "family", "onnx_exportable", "contamination"])
    rows: List[Dict[str, Any]] = []
    for (cand, fam, onnx, cont), grp in groups:
        row: Dict[str, Any] = {
            "candidate": cand,
            "family": fam,
            "onnx_exportable": bool(onnx),
            "contamination": float(np.asarray(cont, dtype=float)),
            "n_folds": int(len(grp)),
        }
        for col in metric_cols:
            col_vals = grp[col].to_numpy(dtype=float)
            row[f"{col}_mean"] = round(float(np.mean(col_vals)), 6)
            row[f"{col}_std"] = round(float(np.std(col_vals, ddof=0)), 6)
        severity_cols = ["mild", "moderate", "strong"]
        for sev in severity_cols:
            recalls = [
                float(r.get(sev, {}).get("recall", np.nan)) for r in grp["per_severity_recall"]
            ]
            non_null = [r for r in recalls if not np.isnan(r)]
            row[f"recall_{sev}_mean"] = round(float(np.mean(non_null)), 6) if non_null else None
        rows.append(row)
    return pd.DataFrame(rows)


def _json_default(obj: Any) -> Any:
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {str(k): _json_default(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_default(v) for v in obj]
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def main() -> None:
    parser = argparse.ArgumentParser(description="RekaKarbon ML Benchmark CLI")
    parser.add_argument("--n-samples", type=int, default=None, help="Dataset sample count")
    parser.add_argument("--anomaly-ratio", type=float, default=None)
    parser.add_argument("--n-folds", type=int, default=5)
    parser.add_argument(
        "--contamination", type=str, default="0.05,0.10,0.15", help="Comma-separated sweep"
    )
    parser.add_argument("--candidates", type=str, default="", help="Comma-separated subset")
    parser.add_argument("--holdout-ratio", type=float, default=0.15)
    parser.add_argument("--random-state", type=int, default=DEFAULT_RANDOM_STATE)
    parser.add_argument("--severity", type=str, default="", help="Fixed tier: mild|moderate|strong")
    parser.add_argument(
        "--severity-distribution",
        type=str,
        default="mild:0.3,moderate:0.4,strong:0.3",
        help="Tier weights e.g. mild:0.3,moderate:0.4,strong:0.3",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Benchmark artifact output directory (default models/benchmark)",
    )
    args = parser.parse_args()

    defaults = get_ml_config()
    cfg = BenchmarkConfig(
        n_samples=args.n_samples or defaults.dataset.default_n_samples,
        anomaly_ratio=args.anomaly_ratio or defaults.dataset.default_anomaly_ratio,
        n_folds=args.n_folds,
        contamination_sweep=[float(x) for x in args.contamination.split(",")],
        candidates=[c.strip() for c in args.candidates.split(",") if c.strip()],
        holdout_ratio=args.holdout_ratio,
        random_state=args.random_state,
        severity_tier=args.severity or None,
        output_dir=args.output_dir or os.path.join(defaults.paths.models_dir, "benchmark"),
    )
    cfg.severity_distribution = (
        dict(
            (k.strip(), float(v))
            for item in args.severity_distribution.split(",")
            for k, v in [item.split(":")]
        )
        if cfg.severity_tier is None
        else None
    )

    print("=" * 72)
    print("RekaKarbon ML Anomaly Detector Benchmark")
    print("=" * 72)
    available = available_candidates()
    print(f"Runtime-available candidates ({len(available)}):")
    for info in sorted(available, key=lambda i: i.name):
        print(f"  - {info.name:24s} {info.family:12s} onnx={info.onnx_exportable}")
    if cfg.severity_tier is None:
        print(f"Severity ladder: {cfg.severity_distribution}")
    else:
        print(f"Severity tier  : {cfg.severity_tier}")
    print(f"Folds={cfg.n_folds} Contamination sweep={cfg.contamination_sweep}")
    print(f"Samples={cfg.n_samples} Anomaly ratio={cfg.anomaly_ratio}")
    print()

    artifacts = run_benchmark(cfg)
    leaderboard = pd.DataFrame(artifacts["leaderboard"])
    print_leaderboard(leaderboard)
    print(f"\nBenchmark artifacts written to: {cfg.output_dir}")


if __name__ == "__main__":
    main()
