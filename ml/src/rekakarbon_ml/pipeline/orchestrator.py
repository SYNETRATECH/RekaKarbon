"""
End-to-End MLOps Pipeline Orchestrator for RekaKarbon ML Engine.
Executes data preprocessing, stratified dataset splitting, Scikit-Learn training,
ONNX artifact export, quality gate evaluation, and metadata manifest generation in sequence.
"""

import argparse
import os
from typing import Any, Dict

from ..config import DEFAULT_RANDOM_STATE, get_ml_config
from ..data.preprocess import preprocess_dataset
from ..evaluation.evaluator import ModelEvaluator, generate_model_metadata
from ..evaluation.visualizer import ModelVisualizer
from ..inference.predictor import CarbonAnomalyPredictor
from ..training.onnx_exporter import export_pipeline_to_onnx
from ..training.trainer import train_and_save_pipeline


def run_full_pipeline(
    n_samples: int = 2500,
    contamination: float = 0.15,
    random_state: int | None = None,
    save_plots: bool = True,
) -> Dict[str, Any]:
    """
    Executes the end-to-end MLOps pipeline lifecycle sequentially.

    Steps:
    1. Preprocessing & Stratified Splitting -> data/raw/, data/splits/, data/processed/
    2. Model Pipeline Training -> models/anomaly_pipeline.pkl
    3. ONNX Model Export -> models/anomaly_pipeline.onnx
    4. Evaluation & Quality Gate Verification -> models/model_metadata.json & reports/
    """
    seed = random_state if random_state is not None else DEFAULT_RANDOM_STATE
    ml_cfg = get_ml_config()

    print("==================================================================")
    print(" [START] STARTING REKAKARBON ML END-TO-END PIPELINE ORCHESTRATION")
    print("==================================================================")

    # 1. Step 1: Preprocess Data and Create Stratified Splits
    print("\n--- STEP 1: DATA PREPROCESSING & STRATIFIED SPLITTING ---")
    processed_df, train_df, val_df, test_df = preprocess_dataset(
        n_samples=n_samples, random_state=seed
    )

    # 2. Step 2: Train Scikit-Learn Pipeline on Train Split
    print("\n--- STEP 2: MODEL TRAINING ---")
    train_split_path = os.path.join(ml_cfg.paths.data_splits_dir, "train.csv")
    pipeline, fitted_df = train_and_save_pipeline(
        train_data_path=train_split_path,
        save_dir=ml_cfg.paths.models_dir,
        contamination=contamination,
        random_state=seed,
    )

    # 3. Step 3: Export Pipeline to ONNX Artifact
    print("\n--- STEP 3: ONNX MODEL EXPORT & PARITY CHECK ---")
    onnx_path = os.path.join(ml_cfg.paths.models_dir, "anomaly_pipeline.onnx")
    export_pipeline_to_onnx(pipeline, output_path=onnx_path)

    # 4. Step 4: Evaluate Predictor against Holdout Test Split & Quality Gates
    print("\n--- STEP 4: MODEL EVALUATION & QUALITY GATE ASSESSMENT ---")
    predictor = CarbonAnomalyPredictor(
        model_pkl_path=os.path.join(ml_cfg.paths.models_dir, "anomaly_pipeline.pkl"),
        onnx_path=onnx_path,
        use_onnx=True,
    )

    visualizer = ModelVisualizer(output_dir=ml_cfg.paths.reports_dir) if save_plots else None
    evaluator = ModelEvaluator(predictor, visualizer=visualizer)

    eval_results = evaluator.evaluate(test_df, generate_plots=save_plots)
    metadata_path = os.path.join(ml_cfg.paths.models_dir, "model_metadata.json")
    generate_model_metadata(eval_results, output_path=metadata_path)

    summary = eval_results["summary"]
    qgate = eval_results["quality_gate"]

    print("\n==================================================================")
    print(" [SUMMARY] END-TO-END PIPELINE SUMMARY")
    print("==================================================================")
    print(f" Train Split Samples : {len(train_df)}")
    print(f" Test Split Samples  : {len(test_df)}")
    print(f" F1 Score            : {summary['f1_score']}")
    print(f" Recall (Overall)    : {summary['recall']}")
    print(f" Precision           : {summary['precision']}")
    print(f" ROC-AUC             : {summary['roc_auc']}")
    print(f" False Positive Rate : {summary['false_positive_rate']}")
    print(f" Quality Gate Status : {qgate['status']}")
    print("==================================================================")

    if not qgate["passed"]:
        print("[WARNING] Pipeline executed but Quality Gate requirements were not met!")

    return eval_results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="RekaKarbon ML End-to-End Pipeline Orchestrator CLI"
    )
    parser.add_argument(
        "--n-samples",
        "-n",
        type=int,
        default=2500,
        help="Number of samples to generate if creating fresh synthetic dataset",
    )
    parser.add_argument(
        "--contamination",
        "-c",
        type=float,
        default=0.15,
        help="Target contamination ratio for IsolationForest",
    )
    parser.add_argument(
        "--no-plots",
        action="store_true",
        help="Disable visual evaluation plot generation",
    )
    args = parser.parse_args()

    run_full_pipeline(
        n_samples=args.n_samples,
        contamination=args.contamination,
        save_plots=not args.no_plots,
    )


if __name__ == "__main__":
    main()
