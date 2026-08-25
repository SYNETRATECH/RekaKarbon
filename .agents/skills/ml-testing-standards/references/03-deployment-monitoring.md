# Deployment & Monitoring

## 11. Application Integration & API Contract Testing

Verify that the model engine, preprocessing transformations, and web serving microservice integrate seamlessly with upstream callers.

### 11.1 API Schema & Payload Specification

```http
POST /api/v1/carbon/estimate
Content-Type: application/json

{
  "project_id": "proj-borneo-04",
  "canopy_height": 28.4,
  "vegetation_index": 0.78,
  "soil_moisture": 42.1
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "prediction": {
    "carbon_stock_tco2e": 215.80,
    "confidence_interval": {
      "lower": 201.20,
      "upper": 230.40
    }
  },
  "metadata": {
    "model_name": "carbon-rf-estimator",
    "version": "2026.08.25",
    "latency_ms": 18.2
  }
}
```

### 11.2 Automated Integration Test Suite

```python
from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)

def test_inference_endpoint_valid_payload():
    payload = {
        "project_id": "proj-borneo-04",
        "canopy_height": 28.4,
        "vegetation_index": 0.78,
        "soil_moisture": 42.1
    }
    response = client.post("/api/v1/carbon/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert data["prediction"]["carbon_stock_tco2e"] > 0.0
    assert data["metadata"]["version"] == "2026.08.25"

def test_inference_endpoint_schema_violation_returns_422():
    payload = {"canopy_height": "invalid_string_type"}
    response = client.post("/api/v1/carbon/estimate", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()

def test_inference_endpoint_out_of_bounds_input_rejected():
    payload = {
        "project_id": "proj-borneo-04",
        "canopy_height": 999.0,  # Physically impossible canopy height
        "vegetation_index": 0.78,
        "soil_moisture": 42.1
    }
    response = client.post("/api/v1/carbon/estimate", json=payload)
    assert response.status_code in [400, 422]
```

---

## 12. Inference Performance, Load & Cold-Start Benchmarking

Offline accuracy is ineffective if serving latency violates operational Service Level Agreements (SLAs) under concurrent production load.

### 12.1 Latency Percentile Profiling

Always monitor latency percentiles ($p50, p95, p99$) rather than simple arithmetic averages:

```text
Latency Distribution Profile:
Average Latency:  48 ms   (Obscures critical tail latency spikes)
p50 (Median):     22 ms   (Typical user experience)
p95:             110 ms   (Acceptable production SLA boundary)
p99:             380 ms   (Tail latency: requires thread pool / GC tuning)
```

### 12.2 Concurrency & Load Stress Testing

Benchmark the inference service against stepped concurrent traffic using load testing tools such as Locust:

```python
# Example: Locust Concurrency Load Test (locustfile.py)
from locust import HttpUser, task, between

class ModelInferenceUser(HttpUser):
    wait_time = between(0.05, 0.2)

    @task(10)
    def predict_carbon_stock(self):
        payload = {
            "project_id": "proj-test-bench",
            "canopy_height": 26.5,
            "vegetation_index": 0.81,
            "soil_moisture": 38.0
        }
        with self.client.post("/api/v1/carbon/estimate", json=payload, catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"HTTP {resp.status_code}: {resp.text}")
            elif resp.elapsed.total_seconds() > 0.300:
                resp.failure(f"Latency SLA breached: {resp.elapsed.total_seconds():.3f}s")
```

### 12.3 Model Startup & Readiness Probes

Model weight deserialization into memory introduces cold-start delays:

- Separate `/healthz` (liveness: container process is active) from `/readyz` (readiness: model weights and feature scalers are loaded into RAM/GPU).
- Container orchestrators (e.g., Kubernetes) must not route production traffic until `/readyz` returns `200 OK`.

---

## 13. Model Lineage, Artifact Versioning & Model Registry

Every deployed model artifact must be strictly reproducible and traceable to its exact training lineage.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          MODEL LINEAGE RECORD                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Artifact ID:          carbon-rf-20260825-v4.onnx                        │
│ Model Registry Tag:   models:/carbon-estimator/Production               │
│ Git Commit Hash:      a81f92c10b42e7d389a9f1a23c8e4d2                  │
│ Training Data Hash:   s3://rekakarbon-data/processed/v1.8.0/data.parquet│
│ Feature Scaler Hash:  s3://rekakarbon-models/scalers/scaler-v1.8.0.bin  │
│ Dependencies:         scikit-learn==1.5.1, onnxruntime==1.19.0          │
│ Random Seed:          42                                                │
│ Evaluation F1 / MAE:  0.924 / 4.12 tCO2e                                │
│ Sign-off MLE:         lead-mle@rekakarbon.id                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Model Registry Lifecycle Stages:

1. **Experimentation:** Model logged with hyperparameter configurations and training metrics.
2. **Candidate:** Passed offline validation thresholds; queued for automated CI testing.
3. **Staging:** Deployed to isolated staging environment for integration and load testing.
4. **Production:** Active champion serving live production requests.
5. **Archived / Retired:** Preserved for audit compliance and emergency rollback.

---

## 14. CI/CD Quality Gates & Automated Pipeline Verification

Continuous Integration pipelines must enforce strict automated quality gates before permitting deployment artifacts to be built.

### 14.1 Automated CI Workflow Example

```yaml
# .github/workflows/ml-quality-gate.yml
name: ML Quality Gate & Validation

on:
  push:
    paths: ['ml/**', 'data/**']
  pull_request:
    paths: ['ml/**', 'data/**']

jobs:
  validate-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install Dependencies
        run: pip install -r requirements-ml.txt

      - name: Run Schema & Data Validation
        run: pytest ml/tests/test_data_validation.py -v

      - name: Run Unit & Transformation Tests
        run: pytest ml/tests/test_preprocessing.py ml/tests/test_units.py -v

      - name: Run Model Metric Quality Gate
        run: python ml/scripts/evaluate_candidate_gate.py --min-f1 0.90 --max-mae 5.0

      - name: Run Metamorphic Behavioral Tests
        run: pytest ml/tests/test_behavioral.py -v

      - name: Verify ONNX Numerical Parity
        run: pytest ml/tests/test_onnx_parity.py -v
```

---

## 15. Deployment Strategies & Safe Rollback Procedures

### 15.1 Deployment Topologies

```text
1. Canary Rollout:
   Inbound Traffic ──┬── 95% Traffic ──→ Model v1 (Current Champion)
                     └──  5% Traffic ──→ Model v2 (Candidate) ──→ (Monitor Telemetry → Scale to 100%)

2. Shadow Deployment:
   Inbound Traffic ──┬── Live Result  ──→ Model v1 (Serves Client Response)
                     └── Shadow Copy  ──→ Model v2 (Executes asynchronously, metrics logged)

3. Blue/Green Switch:
   Traffic Router ──→ [Instant Switch from Blue Cluster (v1) to Green Cluster (v2)]
```

### 15.2 Rollback Automation & Triggers

A model deployment is incomplete without a tested, automated rollback procedure. Rollbacks must trigger automatically when any of the following breach safety thresholds within a 15-minute observation window:

- Service HTTP 5xx error rate $\ge 1.0\%$
- Inference latency $p95 \ge 400\text{ ms}$
- Unhandled runtime exceptions or NaN prediction outputs $> 0$
- Output prediction distribution diverges significantly from baseline ($\text{PSI} \ge 0.25$)

---

## 16. Production Monitoring, Drift Detection & Alerting Policies

Testing continues throughout the entire operational lifecycle in production.

### 16.1 Four Pillars of Production ML Telemetry

```text
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     INFRASTRUCTURE      │       DATA QUALITY      │      MODEL BEHAVIOR     │     BUSINESS IMPACT     │
├─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • CPU / GPU utilization │ • Missing feature rate  │ • Prediction histogram  │ • User conversion rate  │
│ • RAM consumption       │ • Out-of-bounds inputs  │ • Output entropy        │ • Manual override rate  │
│ • p50/p95/p99 latency   │ • Categorical OOV rate  │ • Feature drift (PSI)   │ • Downstream SLA delays │
│ • HTTP 4xx / 5xx rates  │ • Schema violations     │ • Accuracy (when labeled│ • Financial delta       │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### 16.2 Data Drift & Population Stability Index (PSI)

Data drift occurs when the input distribution $P(X)$ changes over time. Measure statistical drift using the Population Stability Index:

$$\text{PSI} = \sum_{b=1}^{B} \left( \text{Actual}_b - \text{Expected}_b \right) \times \ln\left( \frac{\text{Actual}_b}{\text{Expected}_b} \right)$$

```python
# Example: PSI Computation for Continuous Feature Drift Detection
import numpy as np

def calculate_psi(expected_baseline: np.ndarray, actual_production: np.ndarray, num_buckets: int = 10) -> float:
    """Calculate Population Stability Index (PSI) between baseline and production batches."""
    quantiles = np.linspace(0, 100, num_buckets + 1)
    bucket_bounds = np.percentile(expected_baseline, quantiles)
    bucket_bounds[0] = -np.inf
    bucket_bounds[-1] = np.inf

    expected_counts, _ = np.histogram(expected_baseline, bins=bucket_bounds)
    actual_counts, _ = np.histogram(actual_production, bins=bucket_bounds)

    # Convert to proportions with smoothing epsilon to prevent division by zero
    expected_pct = np.maximum(expected_counts / len(expected_baseline), 1e-4)
    actual_pct = np.maximum(actual_counts / len(actual_production), 1e-4)

    psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct - expected_pct + 1e-9 / expected_pct))
    return float(np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct)))
```

| PSI Range                    | Drift Interpretation             | Recommended Engineering Action                             |
| ---------------------------- | -------------------------------- | ---------------------------------------------------------- |
| $\text{PSI} < 0.10$          | Minimal / Negligible Drift       | No action required; routine monitoring                     |
| $0.10 \le \text{PSI} < 0.25$ | Moderate Distribution Shift      | Log warning; queue dataset for scheduled retraining        |
| $\text{PSI} \ge 0.25$        | Significant Concept / Data Drift | Alert ML team; trigger immediate investigation or rollback |

### 16.3 Actionable Alerting Policies

Configure alert routing to distinguish immediate operational emergencies from gradual statistical drift:

- **P1 Critical (Page On-Call Immediately):** Service outage, crash loops, $5\text{xx} \ge 2\%$, latency SLA breach.
- **P2 Warning (Ticket Created for ML Sprint):** Moderate feature drift ($0.1 \le \text{PSI} \le 0.25$), minor null fallback increase.

---

## 17. Operational Runbooks & Incident Response

### 17.1 Incident Response Workflow

When a production anomaly or alert triggers:

```text
[Alert Triggered] ──→ 1. Verify Service Health (/healthz, error rates)
                            │
                            ├── IF 5xx errors or latency breach: EXECUTE INSTANT ROLLBACK
                            │
                            └── IF statistical drift detected:
                                     ↓
                                2. Inspect Ingestion Quality (Null rates, schema changes)
                                     ↓
                                3. Inspect Input Feature Distributions (PSI / KS tests)
                                     ↓
                                4. Quarantine Anomaly Ingest & Route to Fallback Heuristic
                                     ↓
                                5. Schedule Retraining Pipeline with Updated Baseline
```

### 17.2 Model Rollback Protocol

1. Execute rollback command in cluster management CLI or deployment pipeline.
2. Route $100\%$ of traffic back to the previous stable champion model artifact.
3. Validate `/readyz` probe and verify latency and error rates return to normal baseline within 60 seconds.
4. Archive diagnostic logs and payload traces for post-mortem analysis.

---

## 18. Comprehensive Production Readiness Checklist

Before promoting any model artifact to production, verify every item across the six quality dimensions:

### 1. Data Integrity & Validation

- [ ] Training, validation, and test datasets are cleanly partitioned with zero temporal/entity leakage.
- [ ] Automated schema validator enforces column types, null limits, and physical range boundaries.
- [ ] Categorical encoders define deterministic fallback behavior for novel out-of-vocabulary categories.
- [ ] Training data assumptions and dataset version hashes are documented in the experiment log.

### 2. Preprocessing & Feature Engineering

- [ ] Feature transformations are verified for train/serving parity (using serialized artifacts only).
- [ ] Feature ordering and naming invariance is validated with automated unit tests.
- [ ] Missing-value imputation handlers are covered by deterministic unit tests.

### 3. Model Evaluation & Robustness

- [ ] Candidate model satisfies all predefined classification/regression metric acceptance thresholds.
- [ ] Candidate outperforms heuristic, naive, and current production champion baselines.
- [ ] Performance across sensitive sub-populations and domain slices meets minimum quality floors.
- [ ] Metamorphic directional tests and noise perturbation robustness tests pass.

### 4. Integration & Performance

- [ ] API request/response schemas conform to contract specifications with typed serialization.
- [ ] Edge cases (empty arrays, malformed JSON, out-of-bound numbers) fail safely with structured `4xx` errors.
- [ ] Latency percentiles satisfy SLOs under peak load testing ($p95 \le 150\text{ ms}$, $p99 \le 400\text{ ms}$).
- [ ] Model cold start, memory consumption, and `/readyz` probes are verified.

### 5. Deployment & Rollback

- [ ] Model artifact is versioned in the registry and linked to exact Git commit, data hash, and parameters.
- [ ] Canary or shadow rollout deployment configuration is active.
- [ ] Automated one-click or metric-triggered rollback procedure is validated in staging.

### 6. Observability & Monitoring

- [ ] Telemetry dashboards are configured for infrastructure, data quality, and prediction distributions.
- [ ] Drift detection monitors (PSI / KS tests) are scheduled for key input features.
- [ ] Pager and ticketing alerts are linked to actionable runbooks.

---
