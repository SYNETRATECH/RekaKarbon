# Model Evaluation & Robustness

## 7. Unit Testing for Machine Learning Components

Apply standard software engineering unit testing to all custom mathematical functions, transformations, and post-processing routines.

```python
import numpy as np
import pytest

def calculate_carbon_stock(biomass_tonnes: float, carbon_fraction: float = 0.47) -> float:
    """Calculate carbon stock in tCO2e from biomass."""
    if biomass_tonnes < 0.0:
        raise ValueError("Biomass cannot be negative")
    # Conversion: biomass * carbon_fraction * (44 / 12)
    return biomass_tonnes * carbon_fraction * (44.0 / 12.0)

def test_carbon_stock_calculation_standard_values():
    result = calculate_carbon_stock(100.0, 0.47)
    expected = 100.0 * 0.47 * (44.0 / 12.0)
    assert np.isclose(result, expected, atol=1e-4)

def test_carbon_stock_negative_input_raises_exception():
    with pytest.raises(ValueError, match="Biomass cannot be negative"):
        calculate_carbon_stock(-10.0)

def test_softmax_probabilities_sum_to_one():
    logits = np.array([2.5, 1.0, -0.5])
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)
    assert np.isclose(np.sum(probs), 1.0, atol=1e-6)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)
```

### Unit Test Requirements:

- [x] Edge-case inputs (zero values, extreme values, NaN values) are tested.
- [x] Custom loss functions and gradient computations pass finite-difference checks.
- [x] Post-processing routines (e.g., confidence clipping, Non-Maximum Suppression) produce deterministic results.

---

## 8. Model Evaluation, Baseline Comparison & Slice Analysis

### 8.1 Metric Selection Matrix

#### Classification Tasks

| Metric                | Primary Use Case                                                      | Critical Considerations & Pitfalls                                      |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Accuracy**          | Balanced datasets with equal class misclassification costs            | Highly misleading in imbalanced scenarios (e.g., $99\%$ negative class) |
| **Precision**         | High cost of False Positives (e.g., fraud flagging, automated ban)    | Does not penalize missed positive instances                             |
| **Recall**            | High cost of False Negatives (e.g., fire detection, defect detection) | Ignores elevated false alarm rates                                      |
| **F1-Score / PR-AUC** | Imbalanced classes requiring balanced precision and recall            | F1 is threshold-dependent; PR-AUC evaluates across all thresholds       |
| **ROC-AUC**           | General ranking ability across decision thresholds                    | Overly optimistic when positive instances are extremely sparse          |

#### Regression Tasks

| Metric          | Primary Use Case                                           | Mathematical Property                                        |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| **MAE**         | Robust linear error penalty; directly interpretable        | Treats small and large errors with equal linear weight       |
| **RMSE**        | Heavy penalty on large errors and extreme outliers         | Squaring amplifies sensitivity to anomalous errors           |
| **$R^2$ Score** | Proportion of variance explained relative to mean baseline | Can be negative for models worse than the empirical mean     |
| **MAPE**        | Scale-independent relative percentage error                | Undefined or unstable when ground-truth values approach zero |

### 8.2 Baseline Comparison Protocol

A candidate model must demonstrate measurable superiority over standard baseline references:

1. **Naive Baseline:** Majority-class predictor (classification) or historical mean predictor (regression).
2. **Heuristic Baseline:** Existing deterministic business rule or simple moving average.
3. **Production Champion:** The active model version currently serving production requests.

```text
Model Promotion Evaluation Matrix:
                     F1-Score    Recall (Defects)    p95 Latency    RAM Footprint
Naive Baseline         0.50            0.00             1 ms            10 MB
Production Champion    0.88            0.85            45 ms           350 MB
Candidate Model        0.92            0.91            52 ms           420 MB
Decision: APPROVED for Staging (Statistically significant +4% F1 gain with minimal latency impact)
```

### 8.3 Subgroup & Slice Analysis

Aggregate metrics frequently obscure severe performance degradations within specific metadata slices:

- Evaluate metrics across categorical dimensions (e.g., region, device type, customer tier).
- Enforce hard minimum quality floors per slice to prevent disparate model accuracy.

---

## 9. Model Regression & Metamorphic Behavioral Testing

### 9.1 Model Regression Testing

When updating a model, verify that overall metric gains do not mask catastrophic performance losses on specific subsets:

```text
Slice Performance Comparison:
              Overall F1    Urban Region    Rural Region    Rare Soil Type C
Model v1        0.87            0.90            0.85              0.78
Model v2        0.90            0.95            0.88              0.42  ← SEVERE REGRESSION
```

_Model v2 must be blocked from deployment until the regression on Rare Soil Type C is resolved._

### 9.2 Metamorphic & Directional Testing

Metamorphic testing validates that model behavior conforms to domain logic when inputs are transformed, without requiring true labels:

```python
# Example: Directional and Invariance Testing with Pytest
def test_carbon_prediction_monotonicity(model, base_features):
    """Increasing tree canopy height must not decrease predicted carbon stock."""
    features_low = base_features.copy()
    features_high = base_features.copy()
    features_low["canopy_height"] = 15.0
    features_high["canopy_height"] = 35.0

    pred_low = model.predict(features_low)
    pred_high = model.predict(features_high)
    assert pred_high >= pred_low, "Monotonicity violation: taller canopy produced lower carbon estimate"

def test_prediction_invariance_to_metadata(model, base_features):
    """Prediction must remain invariant when non-predictive metadata changes."""
    features_a = base_features.copy()
    features_b = base_features.copy()
    features_a["sensor_serial_number"] = "SN-1001"
    features_b["sensor_serial_number"] = "SN-9999"

    assert np.isclose(model.predict(features_a), model.predict(features_b), atol=1e-5)
```

---

## 10. Model Robustness, Stress & Adversarial Testing

A production ML system must maintain predictable, safe behavior when subjected to distorted, noisy, or adversarial inputs.

```text
Malformed Input ──→ [Input Validation Layer] ──→ HTTP 400 / Structured Error (Safe Rejection)
                             │
                    (If unhandled by API)
                             ↓
Malformed Input ──→ [Model Native Guard]    ──→ Clamped Output / NaN Guard ──→ Diagnostic Log
```

### Robustness Test Suite:

1. **Gaussian Noise Perturbation:** Add $\pm 5\%$, $\pm 10\%$, and $\pm 25\%$ random Gaussian noise to continuous inputs. Predictions should exhibit smooth variance rather than discontinuous jumps.
2. **Missing Feature Subsets:** Evaluate model and imputer behavior when non-critical features are omitted.
3. **Out-of-Distribution (OOD) Extremes:** Provide extreme input values (e.g., $10\times$ training maximum). The system must clamp values safely or flag high prediction uncertainty.
4. **Adversarial Boundary Probing:** Verify that micro-perturbations near classification boundaries do not cause wild probability swings.

---
