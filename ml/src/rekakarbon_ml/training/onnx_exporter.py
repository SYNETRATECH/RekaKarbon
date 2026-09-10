"""
ONNX Exporter & Parity Validation for RekaKarbon Anomaly Detection Pipeline.
Converts Scikit-Learn models to ONNX and tests exact numerical parity.
"""

import os
from typing import Optional, Tuple

import numpy as np
import onnxruntime as ort
import pandas as pd
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.pipeline import Pipeline

from ..data.generator import EmissionDataGenerator
from .transformers import DERIVED_FEATURE_NAMES


def export_pipeline_to_onnx(
    pipeline: Pipeline, output_path: str = "models/anomaly_pipeline.onnx"
) -> str:
    """
    Converts the core detector (scaler + IsolationForest) to ONNX.
    Accepts 15 float32 derived features and outputs predictions & decision scores.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    sub_pipeline = Pipeline(
        [("scaler", pipeline.named_steps["scaler"]), ("detector", pipeline.named_steps["detector"])]
    )

    n_features = len(DERIVED_FEATURE_NAMES)
    initial_type = [("float_input", FloatTensorType([None, n_features]))]
    onnx_model = convert_sklearn(
        sub_pipeline, initial_types=initial_type, target_opset={"": 15, "ai.onnx.ml": 3}
    )

    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())

    print(f"Successfully exported ONNX model ({n_features} features) to {output_path}")
    return output_path


def verify_onnx_parity(
    pipeline: Pipeline,
    onnx_path: str = "models/anomaly_pipeline.onnx",
    sample_df: Optional[pd.DataFrame] = None,
) -> Tuple[bool, float]:
    """
    Validates numerical parity between Scikit-Learn decision function and ONNX Runtime.
    """
    if sample_df is None:
        gen = EmissionDataGenerator(random_state=99)
        sample_df = gen.generate_dataset(n_samples=50)

    # 1. Scikit-Learn inference
    feat_engineer = pipeline.named_steps["feature_engineer"]
    engineered_features = feat_engineer.transform(sample_df)

    scaler = pipeline.named_steps["scaler"]
    detector = pipeline.named_steps["detector"]

    scaled_skl = scaler.transform(engineered_features)
    skl_preds = detector.predict(scaled_skl)
    skl_decision = detector.decision_function(scaled_skl)

    # 2. ONNX Runtime inference
    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name

    onnx_inputs = {input_name: engineered_features.astype(np.float32)}
    onnx_outputs = session.run(None, onnx_inputs)

    onnx_preds = onnx_outputs[0]
    onnx_decision = onnx_outputs[1]

    # Check parity
    pred_match = float(np.mean(skl_preds == onnx_preds.flatten()))
    max_score_diff = float(np.max(np.abs(skl_decision - onnx_decision.flatten())))

    parity_ok = (pred_match == 1.0) and (max_score_diff < 1e-4)
    print(f"ONNX Parity: Match={pred_match * 100:.1f}%, Max Score Diff={max_score_diff:.6f}")
    return parity_ok, max_score_diff
