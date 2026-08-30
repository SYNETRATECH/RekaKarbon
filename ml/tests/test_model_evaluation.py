"""
Layer 3 & 4: Model Evaluation, Baseline Comparison & Quality Gate Tests.
Ensures that the model satisfies production acceptance criteria across all fraud types.
"""

import json
import os

import pytest

from rekakarbon_ml.config import DEFAULT_RANDOM_STATE
from rekakarbon_ml.data.generator import EmissionDataGenerator
from rekakarbon_ml.evaluation import (
    QUALITY_GATE_THRESHOLDS,
    ModelEvaluator,
    ModelVisualizer,
    generate_model_metadata,
)
from rekakarbon_ml.inference.predictor import CarbonAnomalyPredictor
from rekakarbon_ml.pipeline.onnx_exporter import export_pipeline_to_onnx
from rekakarbon_ml.pipeline.trainer import train_and_save_pipeline


@pytest.fixture(scope="module")
def trained_predictor_and_test_data(tmp_path_factory):
    model_dir = str(tmp_path_factory.mktemp("eval_models"))
    pkl_path = os.path.join(model_dir, "anomaly_pipeline.pkl")
    onnx_path = os.path.join(model_dir, "anomaly_pipeline.onnx")

    gen = EmissionDataGenerator(random_state=DEFAULT_RANDOM_STATE)
    train_df, val_df, test_df = gen.generate_train_val_test_splits(n_total=2500, anomaly_ratio=0.15)

    pipe, _ = train_and_save_pipeline(save_dir=model_dir, n_samples=1500)
    export_pipeline_to_onnx(pipe, onnx_path)

    predictor = CarbonAnomalyPredictor(
        model_pkl_path=pkl_path,
        onnx_path=onnx_path,
        use_onnx=True,
    )

    return predictor, train_df, val_df, test_df, model_dir


def test_model_evaluation_metrics_and_quality_gates(trained_predictor_and_test_data):
    predictor, train_df, val_df, test_df, model_dir = trained_predictor_and_test_data

    evaluator = ModelEvaluator(predictor)
    eval_results = evaluator.evaluate(test_df)

    summary = eval_results["summary"]
    cm = eval_results["confusion_matrix"]
    per_type = eval_results["per_anomaly_type"]
    quality_gate = eval_results["quality_gate"]

    # 1. Summary Metrics Verification
    assert summary["f1_score"] >= QUALITY_GATE_THRESHOLDS["min_overall_f1"]
    assert summary["recall"] >= QUALITY_GATE_THRESHOLDS["min_overall_recall"]
    assert summary["precision"] >= 0.70
    assert summary["false_positive_rate"] <= QUALITY_GATE_THRESHOLDS["max_false_positive_rate"]

    # 2. Confusion Matrix Consistency
    assert cm["total_samples"] == len(test_df)
    assert cm["true_positive"] + cm["false_negative"] == (test_df["is_anomaly"] == 1).sum()

    # 3. Critical Fraud Types Detection (Under-reporting must be caught reliably)
    assert "UNDER_REPORTING_FRAUD" in per_type
    assert per_type["UNDER_REPORTING_FRAUD"]["recall"] >= 0.90

    # 4. Quality Gate Verdict
    assert quality_gate["passed"] is True
    assert quality_gate["status"] == "PASSED"

    # 5. Metadata Export Verification
    meta_path = os.path.join(model_dir, "model_metadata.json")
    _ = generate_model_metadata(eval_results, version="1.0.0", output_path=meta_path)
    assert os.path.exists(meta_path)

    with open(meta_path, "r", encoding="utf-8") as f:
        loaded_meta = json.load(f)

    assert loaded_meta["version"] == "1.0.0"
    assert len(loaded_meta["raw_features"]) == 12
    assert len(loaded_meta["derived_features"]) == 15
    assert len(loaded_meta["supported_sectors"]) == 6
    assert "solar_diesel_tco2e_per_liter" in loaded_meta["stoichiometric_factors"]


def test_model_visualizer_artifact_generation(trained_predictor_and_test_data, tmp_path):
    predictor, _, _, test_df, _ = trained_predictor_and_test_data

    report_dir = str(tmp_path / "test_reports")
    visualizer = ModelVisualizer(output_dir=report_dir)
    evaluator = ModelEvaluator(predictor, visualizer=visualizer)

    eval_results = evaluator.evaluate(test_df, generate_plots=True)

    artifacts = eval_results.get("visual_artifacts", {})
    assert os.path.exists(artifacts["confusion_matrix_plot"])
    assert os.path.exists(artifacts["roc_pr_curves_plot"])
    assert os.path.exists(artifacts["per_anomaly_recall_plot"])
    assert os.path.exists(artifacts["interactive_html_report"])

