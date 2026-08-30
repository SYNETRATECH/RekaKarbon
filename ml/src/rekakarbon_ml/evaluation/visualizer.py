"""
Visual Model Evaluation Engine for RekaKarbon ML.
Generates headless static images (Confusion Matrix, ROC/PR curves, Anomaly Recall, SHAP)
and interactive Plotly HTML reports for human-in-the-loop auditability.
"""

import os
from typing import Any, Dict

# Enforce non-interactive backend for headless CLI / CI execution
import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import seaborn as sns
import shap
from plotly.subplots import make_subplots
from sklearn.metrics import precision_recall_curve, roc_curve


class ModelVisualizer:
    """
    Generates evaluation charts and reports to assist human reviewers in evaluating ML model performance.
    """

    def __init__(self, output_dir: str = "models/reports"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        # Apply clean styling
        sns.set_theme(style="whitegrid")

    def plot_confusion_matrix(
        self,
        cm_data: Dict[str, int],
        filename: str = "confusion_matrix.png",
    ) -> str:
        """
        Plots 2x2 confusion matrix heatmap with count and percentage annotations.
        """
        filepath = os.path.join(self.output_dir, filename)
        tn = cm_data.get("true_negative", 0)
        fp = cm_data.get("false_positive", 0)
        fn = cm_data.get("false_negative", 0)
        tp = cm_data.get("true_positive", 0)

        cm = np.array([[tn, fp], [fn, tp]])
        total = cm.sum() if cm.sum() > 0 else 1

        annot = np.empty_like(cm, dtype=object)
        labels = [["True Normal (TN)", "False Alarm (FP)"], ["Missed Anomaly (FN)", "Detected Anomaly (TP)"]]
        for i in range(2):
            for j in range(2):
                pct = (cm[i, j] / total) * 100
                annot[i, j] = f"{labels[i][j]}\n{cm[i, j]:,} ({pct:.1f}%)"

        fig, ax = plt.subplots(figsize=(7, 6))
        sns.heatmap(
            cm,
            annot=annot,
            fmt="",
            cmap="Blues",
            cbar=False,
            ax=ax,
            annot_kws={"size": 11, "weight": "bold"},
        )
        ax.set_title("RekaKarbon Model Evaluation - Confusion Matrix", fontsize=13, fontweight="bold", pad=12)
        ax.set_xlabel("Predicted Label (0: Normal, 1: Anomaly)", fontsize=11)
        ax.set_ylabel("Actual Ground Truth", fontsize=11)
        ax.set_xticklabels(["Normal", "Anomaly"])
        ax.set_yticklabels(["Normal", "Anomaly"])
        plt.tight_layout()
        plt.savefig(filepath, dpi=300)
        plt.close(fig)
        return filepath

    def plot_roc_pr_curves(
        self,
        y_true: np.ndarray,
        scores: np.ndarray,
        filename: str = "roc_pr_curves.png",
    ) -> str:
        """
        Plots ROC and Precision-Recall curves side by side.
        """
        filepath = os.path.join(self.output_dir, filename)

        fpr, tpr, _ = roc_curve(y_true, scores)
        precision, recall, _ = precision_recall_curve(y_true, scores)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))

        # ROC Curve
        ax1.plot(fpr, tpr, color="#1f77b4", lw=2, label="ROC Curve")
        ax1.plot([0, 1], [0, 1], color="grey", linestyle="--", lw=1, label="Chance")
        ax1.set_xlim([0.0, 1.0])
        ax1.set_ylim([0.0, 1.05])
        ax1.set_xlabel("False Positive Rate (FPR)", fontsize=10)
        ax1.set_ylabel("True Positive Rate (Recall)", fontsize=10)
        ax1.set_title("Receiver Operating Characteristic (ROC)", fontsize=12, fontweight="bold")
        ax1.legend(loc="lower right")

        # PR Curve
        ax2.plot(recall, precision, color="#2ca02c", lw=2, label="PR Curve")
        ax2.set_xlim([0.0, 1.0])
        ax2.set_ylim([0.0, 1.05])
        ax2.set_xlabel("Recall", fontsize=10)
        ax2.set_ylabel("Precision", fontsize=10)
        ax2.set_title("Precision-Recall Curve (Imbalanced Focus)", fontsize=12, fontweight="bold")
        ax2.legend(loc="lower left")

        plt.suptitle("Model Classification Discriminative Ability", fontsize=14, fontweight="bold", y=1.02)
        plt.tight_layout()
        plt.savefig(filepath, dpi=300, bbox_inches="tight")
        plt.close(fig)
        return filepath

    def plot_per_anomaly_type_recall(
        self,
        per_type_metrics: Dict[str, Dict[str, Any]],
        filename: str = "anomaly_type_recall.png",
    ) -> str:
        """
        Bar chart showing model recall performance breakdown for each anomaly type.
        """
        filepath = os.path.join(self.output_dir, filename)
        if not per_type_metrics:
            return ""

        types = list(per_type_metrics.keys())
        recalls = [m["recall"] * 100 for m in per_type_metrics.values()]
        counts = [m["count"] for m in per_type_metrics.values()]

        df = pd.DataFrame({"Anomaly Type": types, "Recall (%)": recalls, "Sample Count": counts})
        df = df.sort_values(by="Recall (%)", ascending=False)

        fig, ax = plt.subplots(figsize=(9, 5))
        bars = sns.barplot(
            data=df,
            x="Recall (%)",
            y="Anomaly Type",
            hue="Anomaly Type",
            palette="crest",
            legend=False,
            ax=ax,
        )

        for i, bar in enumerate(bars.patches):
            val = df.iloc[i]["Recall (%)"]
            cnt = df.iloc[i]["Sample Count"]
            ax.text(
                val + 1.0,
                bar.get_y() + bar.get_height() / 2,
                f"{val:.1f}% (n={cnt})",
                ha="left",
                va="center",
                fontsize=9,
                fontweight="bold",
            )

        ax.set_xlim([0, 115])
        ax.axvline(92.0, color="red", linestyle="--", linewidth=1.5, label="Quality Gate Threshold (92%)")
        ax.set_title("Recall Rate Breakdown by Anomaly Category", fontsize=13, fontweight="bold", pad=12)
        ax.set_xlabel("Detection Recall (%)", fontsize=10)
        ax.set_ylabel("Fraud / Anomaly Category", fontsize=10)
        ax.legend(loc="lower right")

        plt.tight_layout()
        plt.savefig(filepath, dpi=300)
        plt.close(fig)
        return filepath

    def plot_shap_summary(
        self,
        model_pipeline: Any,
        features_df: pd.DataFrame,
        filename: str = "shap_summary.png",
    ) -> str:
        """
        Generates SHAP feature importance summary plot explaining key drivers of anomaly recommendations.
        """
        filepath = os.path.join(self.output_dir, filename)
        try:
            # Extract underlying scikit-learn model or transformer if pipeline
            if hasattr(model_pipeline, "named_steps"):
                model = model_pipeline.named_steps.get("isolation_forest", model_pipeline)
                scaler = model_pipeline.named_steps.get("scaler", None)
                X_trans = scaler.transform(features_df) if scaler else features_df
            elif hasattr(model_pipeline, "model"):
                model = model_pipeline.model
                X_trans = features_df
            else:
                model = model_pipeline
                X_trans = features_df

            explainer = shap.TreeExplainer(model) if hasattr(model, "estimators_") else shap.Explainer(model, X_trans)
            shap_values = explainer(X_trans)

            fig = plt.figure(figsize=(9, 6))
            shap.summary_plot(
                shap_values,
                X_trans,
                feature_names=list(features_df.columns) if isinstance(features_df, pd.DataFrame) else None,
                show=False,
            )
            plt.title("SHAP Feature Importance & Impact on Anomaly Score", fontsize=12, fontweight="bold", pad=12)
            plt.tight_layout()
            plt.savefig(filepath, dpi=300, bbox_inches="tight")
            plt.close(fig)
            return filepath
        except Exception as e:
            print(f"Skipping SHAP plot generation due to exception: {e}")
            return ""

    def generate_html_report(
        self,
        eval_results: Dict[str, Any],
        filename: str = "evaluation_report.html",
    ) -> str:
        """
        Exports an interactive, self-contained HTML evaluation report using Plotly.
        """
        filepath = os.path.join(self.output_dir, filename)

        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Key Evaluation Metrics",
                "Confusion Matrix Breakdown",
                "Recall by Anomaly Type",
                "Quality Gate Status",
            ),
            specs=[[{"type": "bar"}, {"type": "pie"}], [{"type": "bar"}, {"type": "indicator"}]],
        )

        # 1. Summary Metrics Bar
        summary = eval_results["summary"]
        metrics_names = ["Precision", "Recall", "F1 Score", "Accuracy", "ROC-AUC"]
        metrics_vals = [
            summary["precision"],
            summary["recall"],
            summary["f1_score"],
            summary["accuracy"],
            summary["roc_auc"],
        ]
        fig.add_trace(
            go.Bar(x=metrics_names, y=metrics_vals, marker_color="#008080", text=metrics_vals, textposition="auto"),
            row=1,
            col=1,
        )

        # 2. Confusion Matrix Pie
        cm = eval_results["confusion_matrix"]
        fig.add_trace(
            go.Pie(
                labels=["True Normal", "False Alarm", "Missed Anomaly", "Detected Anomaly"],
                values=[cm["true_negative"], cm["false_positive"], cm["false_negative"], cm["true_positive"]],
                hole=0.4,
            ),
            row=1,
            col=2,
        )

        # 3. Anomaly Type Recall
        per_type = eval_results.get("per_anomaly_type", {})
        if per_type:
            types = list(per_type.keys())
            recalls = [per_type[t]["recall"] for t in types]
            fig.add_trace(
                go.Bar(x=recalls, y=types, orientation="h", marker_color="#2E8B57", text=recalls, textposition="auto"),
                row=2,
                col=1,
            )

        # 4. Quality Gate Indicator
        qgate = eval_results.get("quality_gate", {})
        status = qgate.get("status", "UNKNOWN")
        fig.add_trace(
            go.Indicator(
                mode="number+delta",
                value=1 if status == "PASSED" else 0,
                title={"text": f"Gate Status: {status}"},
                number={"prefix": "Status: ", "font": {"color": "green" if status == "PASSED" else "red"}},
            ),
            row=2,
            col=2,
        )

        fig.update_layout(
            title_text="<b>RekaKarbon AI/ML Model Evaluation Report</b>",
            height=750,
            showlegend=False,
            template="plotly_white",
        )

        fig.write_html(filepath, include_plotlyjs="cdn")
        return filepath
