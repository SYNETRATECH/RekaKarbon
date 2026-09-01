"""
Model Evaluation, Quality Gates & Metadata Manifest Generator for RekaKarbon ML.
Evaluates classification performance, per-fraud recall, and exports model cards for production.
"""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ..config import get_ml_config, get_quality_gate_config
from ..data.benchmark_loader import (
    MARKET_PRICE_RANGES,
    STOICHIOMETRIC_FACTORS,
    SUPPORTED_SECTORS,
    SectorBenchmarkLoader,
)
from ..pipeline.transformers import DERIVED_FEATURE_NAMES, RAW_FEATURE_COLUMNS
from .visualizer import ModelVisualizer

QUALITY_GATE_THRESHOLDS = get_quality_gate_config().to_dict()


class ModelEvaluator:
    """
    Evaluates anomaly detection pipelines and unified predictors against labeled ground-truth datasets.
    """

    def __init__(self, predictor_or_pipeline: Any, visualizer: Optional[ModelVisualizer] = None):
        self.predictor = predictor_or_pipeline
        self.visualizer = visualizer

    def evaluate(
        self,
        test_df: pd.DataFrame,
        generate_plots: bool = False,
    ) -> Dict[str, Any]:
        """
        Runs comprehensive evaluation against test dataframe with ground-truth 'is_anomaly'.
        """
        y_true = test_df["is_anomaly"].to_numpy().astype(int)

        # Check if predictor has predict_batch or standard sklearn predict
        if hasattr(self.predictor, "predict_batch"):
            results = self.predictor.predict_batch(test_df)
            y_pred = np.array([1 if r["is_anomaly"] else 0 for r in results])
            scores = np.array([r["anomaly_score"] for r in results])
        else:
            raw_preds = self.predictor.predict(test_df)
            # Sklearn IsolationForest outputs 1 (normal) and -1 (anomaly)
            y_pred = np.array([1 if p == -1 else 0 for p in raw_preds])
            if hasattr(self.predictor, "decision_function"):
                dec = self.predictor.decision_function(test_df)
                scores = 1.0 / (1.0 + np.exp(dec * 10.0))
            else:
                scores = y_pred.astype(float)

        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        acc = float(accuracy_score(y_true, y_pred))

        try:
            auc = float(roc_auc_score(y_true, scores))
        except Exception:
            auc = 0.5

        cm = confusion_matrix(y_true, y_pred)
        # Handle 2x2 shape
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = int(cm[0, 0]), 0, 0, 0

        fpr = float(fp / (fp + tn + 1e-6))
        fnr = float(fn / (fn + tp + 1e-6))

        # Per-fraud-type breakdown
        per_type_metrics: Dict[str, Dict[str, float]] = {}
        if "anomaly_type" in test_df.columns:
            for atype in test_df["anomaly_type"].unique():
                if atype == "NORMAL":
                    continue
                subset_mask = (test_df["anomaly_type"] == atype).to_numpy()
                if subset_mask.sum() > 0:
                    type_recall = float((y_pred[subset_mask] == 1).mean())
                    per_type_metrics[str(atype)] = {
                        "count": int(subset_mask.sum()),
                        "recall": round(type_recall, 4),
                    }

        # Quality gate verification
        passed_gates = (
            f1 >= QUALITY_GATE_THRESHOLDS["min_overall_f1"]
            and rec >= QUALITY_GATE_THRESHOLDS["min_overall_recall"]
            and fpr <= QUALITY_GATE_THRESHOLDS["max_false_positive_rate"]
        )

        under_rep_recall = per_type_metrics.get("UNDER_REPORTING_FRAUD", {}).get("recall", 1.0)
        if under_rep_recall < QUALITY_GATE_THRESHOLDS["min_under_reporting_recall"]:
            passed_gates = False

        cm_dict = {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
            "total_samples": len(test_df),
        }

        eval_results: Dict[str, Any] = {
            "summary": {
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "accuracy": round(acc, 4),
                "roc_auc": round(auc, 4),
                "false_positive_rate": round(fpr, 4),
                "false_negative_rate": round(fnr, 4),
            },
            "confusion_matrix": cm_dict,
            "per_anomaly_type": per_type_metrics,
            "quality_gate": {
                "status": "PASSED" if passed_gates else "FAILED",
                "thresholds": QUALITY_GATE_THRESHOLDS,
                "passed": bool(passed_gates),
            },
            "visual_artifacts": {},
        }

        # Generate visual evaluation plots if requested
        if generate_plots and self.visualizer:
            print(f"\nGenerating visual evaluation artifacts in '{self.visualizer.output_dir}'...")
            cm_path = self.visualizer.plot_confusion_matrix(cm_dict)
            roc_path = self.visualizer.plot_roc_pr_curves(y_true, scores)
            recall_path = self.visualizer.plot_per_anomaly_type_recall(per_type_metrics)
            html_path = self.visualizer.generate_html_report(eval_results)

            eval_results["visual_artifacts"] = {
                "confusion_matrix_plot": cm_path,
                "roc_pr_curves_plot": roc_path,
                "per_anomaly_recall_plot": recall_path,
                "interactive_html_report": html_path,
            }
            print(f"  - Confusion Matrix plot saved to: {cm_path}")
            print(f"  - ROC & PR Curves plot saved to: {roc_path}")
            print(f"  - Per-Anomaly Recall plot saved to: {recall_path}")
            print(f"  - Interactive HTML report saved to: {html_path}")

        return eval_results


def generate_model_metadata(
    eval_results: Dict[str, Any],
    version: str = "1.0.0",
    output_path: str = "models/model_metadata.json",
) -> Dict[str, Any]:
    """
    Exports a structured JSON model card / metadata manifest for backend & production traceability.
    """
    loader = SectorBenchmarkLoader()
    metadata: Dict[str, Any] = {
        "model_name": "RekaKarbon Carbon Anomaly Detector",
        "version": version,
        "release_timestamp": datetime.now(timezone.utc).isoformat(),
        "framework": "Scikit-Learn (IsolationForest + RobustScaler) & ONNX Runtime",
        "target_opset": {"": 15, "ai.onnx.ml": 3},
        "hyperparameters": get_ml_config().model.to_dict(),
        "raw_features": RAW_FEATURE_COLUMNS,
        "derived_features": DERIVED_FEATURE_NAMES,
        "supported_sectors": SUPPORTED_SECTORS,
        "stoichiometric_factors": STOICHIOMETRIC_FACTORS,
        "market_price_ranges": MARKET_PRICE_RANGES,
        "sector_benchmarks": loader.get_sector_emission_factors(),
        "evaluation_metrics": eval_results["summary"],
        "confusion_matrix": eval_results["confusion_matrix"],
        "fraud_detection_recall": eval_results["per_anomaly_type"],
        "quality_gate": eval_results["quality_gate"],
        "visual_artifacts": eval_results.get("visual_artifacts", {}),
    }

    os.makedirs(os.path.dirname(output_path) or "models", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Generated model metadata manifest at: {output_path}")
    return metadata


def main() -> None:
    import argparse

    from ..config import DEFAULT_RANDOM_STATE, get_dataset_config
    from ..data.generator import EmissionDataGenerator
    from ..inference.predictor import CarbonAnomalyPredictor

    parser = argparse.ArgumentParser(description="RekaKarbon ML Model Evaluation CLI")
    parser.add_argument(
        "--model-pkl",
        type=str,
        default="models/anomaly_pipeline.pkl",
        help="Path to .pkl model pipeline",
    )
    parser.add_argument(
        "--model-onnx",
        type=str,
        default="models/anomaly_pipeline.onnx",
        help="Path to .onnx model artifact",
    )
    parser.add_argument(
        "--test-data", type=str, default=None, help="Path to custom test CSV/JSON dataset"
    )
    parser.add_argument(
        "--output-meta",
        type=str,
        default="models/model_metadata.json",
        help="Path to output model_metadata.json",
    )
    parser.add_argument(
        "--n-samples",
        type=int,
        default=get_dataset_config().default_n_samples,
        help="Number of test samples if generating synthetic test data",
    )
    parser.add_argument(
        "--save-plots",
        action="store_true",
        default=True,
        help="Whether to save visual evaluation plots and HTML report",
    )
    parser.add_argument(
        "--report-dir",
        type=str,
        default="models/reports",
        help="Directory to save visual evaluation artifacts",
    )
    args = parser.parse_args()

    print("Starting Standalone Model Evaluation & Quality Gate Assessment...")

    # Load predictor
    use_onnx = os.path.exists(args.model_onnx)
    predictor = CarbonAnomalyPredictor(
        model_pkl_path=args.model_pkl,
        onnx_path=args.model_onnx,
        use_onnx=use_onnx,
    )

    # Load or generate test data
    if args.test_data and os.path.exists(args.test_data):
        print(f"Loading test dataset from {args.test_data}...")
        test_df = (
            pd.read_json(args.test_data)
            if args.test_data.endswith(".json")
            else pd.read_csv(args.test_data)
        )
    else:
        print(f"Generating synthetic evaluation holdout set ({args.n_samples} samples)...")
        gen = EmissionDataGenerator(random_state=DEFAULT_RANDOM_STATE)
        _, _, test_df = gen.generate_train_val_test_splits(
            n_total=args.n_samples, anomaly_ratio=0.15
        )

    visualizer = ModelVisualizer(output_dir=args.report_dir) if args.save_plots else None
    evaluator = ModelEvaluator(predictor, visualizer=visualizer)
    eval_results = evaluator.evaluate(test_df, generate_plots=args.save_plots)
    generate_model_metadata(eval_results, output_path=args.output_meta)

    summary = eval_results["summary"]
    qgate = eval_results["quality_gate"]

    print("\n================ EVALUATION SUMMARY ================")
    print(f"F1 Score            : {summary['f1_score']}")
    print(f"Recall (Overall)    : {summary['recall']}")
    print(f"Precision           : {summary['precision']}")
    print(f"ROC-AUC             : {summary['roc_auc']}")
    print(f"False Positive Rate : {summary['false_positive_rate']}")
    print("====================================================")

    if qgate["passed"]:
        print("\n[SUCCESS] Model Quality Gate Verification PASSED!")
    else:
        print("\n[FAILED] Model Quality Gate Verification FAILED!")


if __name__ == "__main__":
    main()
