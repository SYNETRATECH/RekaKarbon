# Data Validation & Preprocessing

## 4. Data Validation & Data Quality Testing

Data is the foundational dependency of any machine learning system. The ingestion pipeline must reject corrupted, drifted, or unparseable records before training or inference proceeds.

### 4.1 Schema Validation

Validate dataset structures against strict type specifications:

- Ensure all required columns exist with explicit primitive types (`float32`, `int64`, `string`, `datetime64[ns]`).
- Disallow or quarantine unmapped columns that could cause unexpected feature shifts.
- Reject null primary keys, malformed timestamps, or invalid categorical string encodings.

```python
# Example: Declarative Schema Validation with Pandera / Pydantic
import pandera as pa
from pandera.typing import Series

class CarbonIngestionSchema(pa.DataFrameModel):
    project_id: Series[str] = pa.Field(nullable=False, regex=r"^proj-[a-z0-9-]+$")
    canopy_height: Series[float] = pa.Field(ge=0.0, le=120.0, nullable=False)
    vegetation_index: Series[float] = pa.Field(ge=-1.0, le=1.0, nullable=False)
    soil_moisture: Series[float] = pa.Field(ge=0.0, le=100.0, nullable=False)
    recorded_at: Series[pa.DateTime] = pa.Field(nullable=False)

    class Config:
        strict = True  # Disallow unexpected extra columns
        coerce = True  # Attempt safe type coercion
```

### 4.2 Missing-Value & Null-Rate Tolerances

Define explicit null tolerances per feature category:

- **Zero-Tolerance Features:** Critical business identifiers, spatial coordinates, and primary sensor inputs must have exactly $0.0\%$ missing values.
- **Tolerant Features:** Secondary signals may allow up to $1.0\%$ missing values, provided an approved and versioned imputation strategy (e.g., median, forward-fill) is explicitly configured.
- If `missing_rate > threshold`, the ingest pipeline must abort immediately and log detailed diagnostics.

### 4.3 Range, Boundary & Constraint Validation

Enforce domain-specific physical constraints:

- $\text{Relative Humidity} \in [0.0, 100.0]\%$
- $\text{Ambient Temperature} \in [-50.0, 70.0]^\circ\text{C}$
- $\text{Above-Ground Biomass} \ge 0.0\text{ t/ha}$

Values such as $\text{humidity} = 350\%$ or $\text{canopy\_height} = -12\text{ m}$ must trigger validation errors rather than silently propagating through the pipeline.

### 4.4 Deduplication & Anomaly Checks

- **Duplicate Elimination:** Verify that no duplicate primary keys or repeated spatial-temporal observations exist. Duplicate samples bias gradient updates and artificially inflate evaluation metrics if split across train and test sets.
- **Distribution Sanity Check:** Compare mean, standard deviation, and quantile profiles against baseline references:

```text
Reference Baseline:  mean(canopy_height) = 24.2 m,  std = 6.1 m
Incoming Ingestion:  mean(canopy_height) = 58.9 m,  std = 22.4 m  → ACTION: Flag Ingestion Anomaly
```

---

## 5. Data Leakage Prevention & Splitting Strategies

Data leakage occurs when information from the target variable or future observations is inadvertently included in the training process, producing unrealistically optimistic offline evaluation scores.

### 5.1 Common Leakage Vectors

1. **Temporal Leakage:** Using future observations to predict past events in time-dependent data.
2. **Preprocessing Leakage:** Fitting scalers, encoders, or imputers on the entire dataset prior to partitioning.
3. **Group Correlation Leakage:** Distributing records from the same spatial entity, patient, or user across both training and test partitions.

```text
INCORRECT SPLIT (Entity / Spatial Leakage):
Plot A: Sensor 1 → Train | Sensor 2 → Test  (Artificially inflated metrics due to spatial correlation)

CORRECT SPLIT (Grouped by Plot):
Plot A, Plot B → Training | Plot C → Validation | Plot D → Holdout Test
```

### 5.2 Splitting Strategies by Data Modality

```python
# 1. Independent & Identically Distributed (I.I.D.) Tabular Data
from sklearn.model_selection import StratifiedKFold
cv_stratified = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# 2. Grouped / Clustered Data (Zero leakage across entities)
from sklearn.model_selection import GroupKFold
cv_grouped = GroupKFold(n_splits=5)

# 3. Temporal / Time-Series Data (Strict forward-chaining)
from sklearn.model_selection import TimeSeriesSplit
cv_temporal = TimeSeriesSplit(n_splits=5)
```

```text
Temporal Forward-Chaining Partition Structure:
Fold 1: [== Train ==] [= Val =]
Fold 2: [==== Train ====] [= Val =]
Fold 3: [====== Train ======] [= Val =]
Fold 4: [======== Train ========] [= Val =]
Fold 5: [========== Train ==========] [= Val =]
```

---

## 6. Preprocessing & Feature Pipeline Testing

Feature transformation logic must maintain complete mathematical parity between training and real-time inference (Train/Serving Parity).

```text
Training Pipeline:  Raw Data ──→ Scaler.fit_transform() ──→ Save 'scaler.bin' ──→ Model.fit()
                                                                  │
Serving Pipeline:   Live JSON ──→ Scaler.transform()    ←─────────┘          ──→ Model.predict()
```

### 6.1 Core Preprocessing Rules

1. **Never Call `fit()` in Production:** Scalers, normalizers, and encoders must only execute `transform()` using serialized transformation state generated during training.
2. **Feature Ordering Invariance:** Feature pipelines must enforce explicit feature ordering. Passing an unordered dictionary or dataframe must yield identical tensor columns.
3. **Deterministic Imputation:** Missing values must be replaced using static values computed from training splits, never dynamically from small production inference batches.
4. **Out-of-Vocabulary (OOV) Handling:** Categorical encoders must gracefully map unseen categories to an `<UNKNOWN>` index or fallback category without raising runtime exceptions.

### 6.2 ONNX & Serialized Runtime Parity Testing

When exporting models to cross-platform inference runtimes (e.g., ONNX Runtime), automated parity tests must verify that predictions match original framework outputs:

```python
import numpy as np
import onnxruntime as ort

def test_onnx_export_numerical_parity(trained_sklearn_pipeline, sample_test_tensor, onnx_model_path):
    """Verify inference output parity between Scikit-Learn and ONNX Runtime."""
    # 1. Native Framework Prediction
    expected_output = trained_sklearn_pipeline.predict(sample_test_tensor)

    # 2. ONNX Runtime Inference
    session = ort.InferenceSession(onnx_model_path, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    onnx_output = session.run(None, {input_name: sample_test_tensor.astype(np.float32)})[0]

    # 3. Assert Strict Numerical Tolerance
    np.testing.assert_allclose(
        onnx_output.flatten(),
        expected_output.flatten(),
        rtol=1e-4,
        atol=1e-4,
        err_msg="ONNX inference output deviates from native Scikit-Learn baseline"
    )
```

---
