# AGENTS.md - RekaKarbon AI/ML Engine (`ml/`)

AI Agent Governance & Development Guide for the `ml/` subproject. See root [AGENTS.md](../AGENTS.md) for monorepo-wide rules.

---

## 🛠️ Tech Stack & Environment

| Category               | Details                                                        |
| :--------------------- | :------------------------------------------------------------- |
| **Runtime**            | Python 3.13+                                                   |
| **Package Manager**    | Poetry 2.x                                                     |
| **Data Validation**    | Pydantic v2 & Batch Validation Engine                          |
| **Modeling Core**      | Scikit-Learn (Pipelines, Custom Transformers, IsolationForest) |
| **Deployment Format**  | ONNX (`skl2onnx`, `onnxruntime`, `onnxruntime-node`)           |
| **Linter & Formatter** | Ruff (`ruff check`, `ruff format`)                             |
| **Type Checker**       | Mypy (`mypy src tests app.py`)                                 |
| **Prototyping App**    | Streamlit + Plotly                                             |
| **Data & Math**        | NumPy, Pandas, SciPy                                           |
| **Testing**            | Pytest (7 suites covering 9 MLOps layers, 37 tests)            |

### Key Development Commands

```bash
poetry install               # Install environment and dependencies
poetry run ruff format .     # Format all Python files (PEP 8, 100 cols)
poetry run ruff check .      # Lint check with auto-fixes
poetry run mypy src tests    # Static type analysis across package and tests
poetry run pytest -v         # Run all 37 tests across 7 testing suites
poetry run preprocess        # Run batch schema validation, stratified split & feature registry CLI
poetry run train             # Train IsolationForest on train.csv & export ONNX artifact
poetry run eval              # Run model evaluation on test.csv & quality gate assessment
poetry run pipeline          # Execute end-to-end MLOps workflow orchestrator CLI
poetry run studio            # Launch Streamlit development studio
```

---

## 📁 Package Structure

```
ml/
├── pyproject.toml              # Project metadata, dependencies & script entrypoints
├── README.md                   # Scientific documentation, methodology & user guide
├── AGENTS.md                   # This agent governance document
├── data/                       # PERSISTED DATA ARTIFACTS
│   ├── sectors.json            # Configurable sector thresholds, intensities & fuel priors
│   ├── raw/
│   │   └── raw_emissions.csv   # Raw emission submissions
│   ├── splits/
│   │   ├── train.csv           # Stratified training split
│   │   ├── val.csv             # Stratified validation split
│   │   └── test.csv            # Stratified holdout test split
│   ├── processed/
│   │   └── processed_features.csv # 20-dim feature matrix
│   ├── feature_manifest.json   # Feature store registry specifications
│   └── dataset_summary.json    # Dataset distribution & validation health diagnostics
├── models/                     # MODEL ARTIFACTS & REPORTS
│   ├── anomaly_pipeline.pkl    # Serialized Scikit-Learn pipeline
│   ├── anomaly_pipeline.onnx   # Exported ONNX model artifact
│   ├── model_metadata.json     # Model card manifest & quality gate metrics
│   └── reports/                # Visual plots (ROC, CM, SHAP summary, HTML report)
├── src/
│   └── rekakarbon_ml/
│       ├── __init__.py
│       ├── data/               # DATA PREPARATION & GOVERNANCE MODULE
│       │   ├── __init__.py
│       │   ├── benchmark_loader.py # Dynamic sectors.json loader & stoichiometric factors
│       │   ├── feature_registry.py # 20-Feature specifications & manifest exporter
│       │   ├── generator.py       # Multi-scope synthetic dataset generator
│       │   ├── preprocess.py      # Preprocessing, validation & splitting CLI
│       │   ├── schema.py          # GHG multi-scope Pydantic schema & boundaries
│       │   └── validator.py       # Batch DataFrame validation engine
│       ├── training/           # MODEL TRAINING & SERIALIZATION MODULE
│       │   ├── __init__.py
│       │   ├── transformers.py    # 20-Feature Scikit-Learn custom transformer
│       │   ├── trainer.py         # IsolationForest pipeline trainer CLI
│       │   └── onnx_exporter.py   # ONNX converter & parity verifier
│       ├── evaluation/         # EVALUATION HARNESS & QUALITY GATES
│       │   ├── __init__.py
│       │   ├── evaluator.py       # Evaluation harness & metadata generator CLI
│       │   └── visualizer.py      # Plotly & Matplotlib report generator
│       ├── inference/          # RUNTIME INFERENCE ENGINE FOR SERVER
│       │   ├── __init__.py
│       │   └── predictor.py       # High-level diagnostic predictor
│       ├── pipeline/           # WORKFLOW ORCHESTRATION MODULE
│       │   ├── __init__.py
│       │   └── orchestrator.py    # End-to-end MLOps workflow coordinator CLI
│       └── studio/             # STREAMLIT PROTOTYPING STUDIO
│           ├── __init__.py
│           ├── app.py             # Development studio dashboard
│           └── cli.py             # Studio launcher entrypoint
└── tests/                      # AUTOMATED TEST SUITE (37 Tests)
    ├── __init__.py
    ├── test_config.py                  # Configuration & hyperparameter tests (8 tests)
    ├── test_data_validation.py         # Layer 1: Multi-scope schema & registry tests (9 tests)
    ├── test_pipeline.py                # Layer 2: Preprocessing, 20-dim shape & splits (6 tests)
    ├── test_model_evaluation.py        # Layer 3 & 4: Evaluation metrics & quality gates (2 tests)
    ├── test_behavioral_robustness.py   # Layer 5: Scope 3 optionality & math fraud tests (7 tests)
    ├── test_performance_benchmarks.py  # Layer 6 & 7: Inference latency & throughput (2 tests)
    └── test_onnx_parity.py             # Layer 8 & 9: 20-Feature Scikit-Learn vs ONNX parity (3 tests)
```

---

## 🔑 Critical Rules for AI Agents (MUST FOLLOW)

### 1. Strict Scikit-Learn Pipeline Encapsulation

- **Rule**: ALL feature engineering and data transformations MUST be encapsulated in Scikit-Learn `BaseEstimator` and `TransformerMixin` classes (located in `src/rekakarbon_ml/training/transformers.py`).
- **Rationale**: Loose pre-processing functions break pipeline serialization and prevent automatic conversion to ONNX format.
- **Prohibited**: Never apply ad-hoc data cleaning or normalization outside the Scikit-Learn pipeline object.

### 2. ONNX Exportability Guarantee

- **Rule**: Every model or transformer introduced to the detection pipeline MUST be convertible to ONNX via `skl2onnx` and pass the parity test in `tests/test_onnx_parity.py`.
- **Target Opset Configuration**: When calling `convert_sklearn()`, always specify:
  ```python
  target_opset = {"": 15, "ai.onnx.ml": 3}
  ```
- **Parity Threshold**: Predictions between Scikit-Learn (`predict()`) and ONNX Runtime (`session.run()`) must match **$100.0\%$**, and maximum decision score difference must be $< 10^{-4}$.

### 3. Configurable Sector Governance & Data Preparation

- **Dynamic Sectors**: Industrial sectors MUST NOT be hardcoded in Python code. All sector definitions, reference thresholds, and intensity priors MUST be defined in `ml/data/sectors.json` and loaded via `SectorBenchmarkLoader`.
- **Batch Validation**: All raw batch datasets processed by `preprocess.py` MUST be validated against `validate_raw_dataframe()` in `src/rekakarbon_ml/data/validator.py` to ensure schema compliance before feature derivation.
- **Stratified Dataset Splitting**: Splitting into `train.csv`, `val.csv`, and `test.csv` MUST be stratified on `is_anomaly` and `sector` to eliminate distribution shift between training and test holdouts.
- **Feature Registry & Manifest**: Any new feature added to `transformers.py` MUST be declared in `FEATURE_REGISTRY` in `src/rekakarbon_ml/data/feature_registry.py` with physical units, description, and formula.
- **Dataset Diagnostics**: Preprocessing MUST export `data/dataset_summary.json` recording sample counts, class balance ratios, and schema validation health.

### 4. Pydantic Schema, Scope 3 Optionality & Math Coherence

- **Rule**: Every incoming raw reporting dict MUST be validated against `EmissionReportInput` in `src/rekakarbon_ml/data/schema.py` before inference or feature derivation.
- **Scope 3 Fully Optional**: Never treat missing or zero Scope 3 emissions as an anomaly. Most companies only report Scope 1 and Scope 2. If Scope 3 is 0, it contributes 0 to expected emissions and must incur zero penalty.
- **Mathematical Summation Integrity**: Cross-validate that $\text{reported\_scope1} + \text{reported\_scope2} + \text{reported\_scope3} \approx \text{reported\_emissions\_tco2e}$. If arithmetic discrepancy exceeds $5\%$, flag `DISKREPANSI_PENJUMLAHAN_SCOPE`.
- **Boundary Checks**: Production output, fuel volumes, and costs must be strictly non-negative, and cement clinker production cannot exceed $120\%$ of finished cement volume.

### 5. Automated Quality Gate Enforcement

- **Rule**: Any retrained model artifact MUST pass the automated acceptance thresholds enforced in `src/rekakarbon_ml/evaluation/evaluator.py`:
  - $F_1 \ge 0.85$
  - $\text{Overall Recall} \ge 0.88$
  - $\text{Under-Reporting Fraud Recall} \ge 0.92$
  - $\text{False Positive Rate} \le 0.10$
- **Metadata Card**: Whenever the model is trained, update `models/model_metadata.json` via `generate_model_metadata()` to record training timestamp, git commit hash, and benchmark parameters.

### 6. Verificator Decision Support Integration Contracts

- The ML engine acts as an auditor copilot and outputs diagnostic metrics that feed into [`client/src/components/modals/LaporanAuditModal.tsx`](../client/src/components/modals/LaporanAuditModal.tsx) and [`server/src/audit/`](../server/src/audit/):
  - `is_anomaly`: Boolean advisory flag.
  - `verdict`: `"PASS_VERIFIED"` | `"REJECT_ANOMALY"`.
  - `priority`: Urgency tier (`"critical"` | `"high"` | `"medium"` | `"low"`).
  - `trust_score`: Float between `0.0` and `100.0`.
  - `score_djp`: Financial & e-Faktur consistency score ($0\text{--}100$).
  - `score_bbm`: Physical fuel consumption correlation score ($0\text{--}100$).
  - `score_cems`: CEMS telemetry & sector intensity consistency score ($0\text{--}100$).
  - `flags`: List of string diagnostic identifiers (e.g., `"DISKREPANSI_PENJUMLAHAN_SCOPE"`, `"UNDER_REPORTING_TERINDIKASI"`).
  - `scope_diagnostics`: Per-scope breakdown (`scope1`, `scope2`, `scope3`, and `math_coherence`).
  - `xai`: SHAP feature attributions and auditor recommendations in Bahasa Indonesia.

---

## ✅ Quality Verification Checklist

Before submitting changes to `ml/`:

1. Run `poetry run ruff format --check .` (or `pnpm ml:format:check`) -> Code formatting must be clean.
2. Run `poetry run ruff check .` (or `pnpm ml:lint`) -> Zero lint errors/warnings.
3. Run `poetry run mypy src tests` (or `pnpm ml:typecheck`) -> Zero typing errors.
4. Run `poetry run pytest -v` (or `pnpm ml:test`) -> All 37 unit, evaluation, behavioral, performance, config, and ONNX parity tests MUST pass.
5. Verify that `models/anomaly_pipeline.onnx` and `models/model_metadata.json` are updated if pipeline architecture changed.
6. Test `poetry run streamlit run src/rekakarbon_ml/studio/app.py` (or `poetry run studio`) to ensure dashboard loads cleanly.
