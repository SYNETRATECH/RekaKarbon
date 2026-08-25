# AGENTS.md - RekaKarbon AI/ML Engine (`ml/`)

AI Agent Governance & Development Guide for the `ml/` subproject. See root [AGENTS.md](../AGENTS.md) for monorepo-wide rules.

---

## 🛠️ Tech Stack & Environment

| Category               | Details                                                        |
| :--------------------- | :------------------------------------------------------------- |
| **Runtime**            | Python 3.13+                                                   |
| **Package Manager**    | Poetry 2.x                                                     |
| **Data Validation**    | Pydantic v2                                                    |
| **Modeling Core**      | Scikit-Learn (Pipelines, Custom Transformers, IsolationForest) |
| **Deployment Format**  | ONNX (`skl2onnx`, `onnxruntime`, `onnxruntime-node`)           |
| **Linter & Formatter** | Ruff (`ruff check`, `ruff format`)                             |
| **Type Checker**       | Mypy (`mypy src tests app.py`)                                 |
| **Prototyping App**    | Streamlit + Plotly                                             |
| **Data & Math**        | NumPy, Pandas, SciPy                                           |
| **Testing**            | Pytest (6 suites covering 9 MLOps layers)                      |

### Key Development Commands

```bash
poetry install               # Install environment and dependencies
poetry run ruff format .     # Format all Python files (PEP 8, 100 cols)
poetry run ruff check .      # Lint check with auto-fixes
poetry run mypy src tests app.py  # Static type analysis
poetry run pytest -v         # Run all 20 tests across 6 testing suites
poetry run streamlit run app.py  # Launch Streamlit development studio
```

---

## 📁 Package Structure

```
ml/
├── pyproject.toml              # Project metadata & dependency definitions
├── README.md                   # Scientific documentation, methodology & user guide
├── AGENTS.md                   # This agent governance document
├── app.py                      # Streamlit interactive development studio
├── models/
│   ├── anomaly_pipeline.pkl    # Serialized Scikit-Learn pipeline
│   ├── anomaly_pipeline.onnx   # Exported ONNX model artifact
│   └── model_metadata.json     # Model card manifest & quality gate metrics
├── src/
│   └── rekakarbon_ml/
│       ├── __init__.py
│       ├── data/               # Ingestion of assets/data and synthetic generators
│       │   ├── __init__.py
│       │   ├── benchmark_loader.py
│       │   ├── generator.py
│       │   └── schema.py       # Pydantic schema validation & physical boundaries
│       ├── pipeline/           # Scikit-Learn pipeline construction & ONNX conversion
│       │   ├── __init__.py
│       │   ├── transformers.py
│       │   ├── build_pipeline.py
│       │   ├── onnx_exporter.py
│       │   └── evaluator.py    # Evaluation harness & quality gate engine
│       └── inference/          # Prediction runners & diagnostic scoring
│           ├── __init__.py
│           └── predictor.py
└── tests/
    ├── __init__.py
    ├── test_data_validation.py         # Layer 1: Schema validation & boundary tests
    ├── test_pipeline.py                # Layer 2: Preprocessing & transformer unit tests
    ├── test_model_evaluation.py        # Layer 3 & 4: Evaluation metrics & quality gates
    ├── test_behavioral_robustness.py   # Layer 5: Metamorphic & noise invariance tests
    ├── test_performance_benchmarks.py  # Layer 6 & 7: Inference latency & throughput benchmarks
    └── test_onnx_parity.py             # Layer 8 & 9: Scikit-Learn vs ONNX parity verification
```

---

## 🔑 Critical Rules for AI Agents (MUST FOLLOW)

### 1. Strict Scikit-Learn Pipeline Encapsulation

- **Rule**: ALL feature engineering and data transformations MUST be encapsulated in Scikit-Learn `BaseEstimator` and `TransformerMixin` classes (located in `src/rekakarbon_ml/pipeline/transformers.py`).
- **Rationale**: Loose pre-processing functions break pipeline serialization and prevent automatic conversion to ONNX format.
- **Prohibited**: Never apply ad-hoc data cleaning or normalization outside the Scikit-Learn pipeline object.

### 2. ONNX Exportability Guarantee

- **Rule**: Every model or transformer introduced to the detection pipeline MUST be convertible to ONNX via `skl2onnx` and pass the parity test in `tests/test_onnx_parity.py`.
- **Target Opset Configuration**: When calling `convert_sklearn()`, always specify:
  ```python
  target_opset = {"": 15, "ai.onnx.ml": 3}
  ```
- **Parity Threshold**: Predictions between Scikit-Learn (`predict()`) and ONNX Runtime (`session.run()`) must match **$100.0\%$**, and maximum decision score difference must be $< 10^{-4}$.

### 3. Data Grounding with `assets/data/`

- **Rule**: Always anchor industrial parameters (emission intensities, fuel mix ratios) in official Indonesian datasets from `assets/data/` (BPS and KLHK trends).
- **Update Protocol**: If new sector datasets are added to `assets/data/`, update `SectorBenchmarkLoader` in `src/rekakarbon_ml/data/benchmark_loader.py` to maintain domain accuracy.

### 4. Pydantic Schema & Data Validation Enforcement

- **Rule**: Every incoming raw reporting dict MUST be validated against `EmissionReportInput` in `src/rekakarbon_ml/data/schema.py` before inference or feature derivation.
- **Boundary Checks**: Production output, fuel volumes, and costs must be strictly non-negative, and cement clinker production cannot exceed $120\%$ of finished cement volume.

### 5. Automated Quality Gate Enforcement

- **Rule**: Any retrained model artifact MUST pass the automated acceptance thresholds enforced in `src/rekakarbon_ml/pipeline/evaluator.py`:
  - $F_1 \ge 0.85$
  - $\text{Overall Recall} \ge 0.88$
  - $\text{Under-Reporting Fraud Recall} \ge 0.92$
  - $\text{False Positive Rate} \le 0.10$
- **Metadata Card**: Whenever the model is trained, update `models/model_metadata.json` via `generate_model_metadata()` to record training timestamp, git commit hash, and benchmark parameters.

### 6. Client & Backend Integration Contracts

- The ML engine outputs diagnostic metrics that directly feed into [`client/src/components/modals/LaporanAuditModal.tsx`](../client/src/components/modals/LaporanAuditModal.tsx) and [`server/src/audit/`](../server/src/audit/):
  - `is_anomaly`: Boolean verdict.
  - `verdict`: `"PASS_VERIFIED"` | `"REJECT_ANOMALY"`.
  - `trust_score`: Float between `0.0` and `100.0`.
  - `score_djp`: Financial & e-Faktur consistency score.
  - `score_bbm`: Physical fuel consumption correlation score.
  - `score_cems`: CEMS telemetry & sector intensity consistency score.
  - `flags`: List of string identifiers (e.g., `"BIAYA_SOLAR_TIDAK_REALISTIS"`).
  - `explanation`: Human-readable summary in Bahasa Indonesia.

---

## ✅ Quality Verification Checklist

Before submitting changes to `ml/`:

1. Run `poetry run ruff format --check .` (or `pnpm ml:format:check`) -> Code formatting must be clean.
2. Run `poetry run ruff check .` (or `pnpm ml:lint`) -> Zero lint errors/warnings.
3. Run `poetry run mypy src tests app.py` (or `pnpm ml:typecheck`) -> Zero typing errors.
4. Run `poetry run pytest -v` (or `pnpm ml:test`) -> All 20 unit, evaluation, behavioral, performance, and ONNX parity tests MUST pass.
5. Verify that `models/anomaly_pipeline.onnx` and `models/model_metadata.json` are updated if pipeline architecture changed.
6. Test `poetry run streamlit run app.py` to ensure dashboard loads cleanly.
