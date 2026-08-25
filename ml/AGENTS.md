# AGENTS.md - RekaKarbon AI/ML Engine (`ml/`)

AI Agent Governance & Development Guide for the `ml/` subproject. See root [AGENTS.md](../AGENTS.md) for monorepo-wide rules.

---

## 🛠️ Tech Stack & Environment

| Category               | Details                                                        |
| :--------------------- | :------------------------------------------------------------- |
| **Runtime**            | Python 3.13+                                                   |
| **Package Manager**    | Poetry 2.x                                                     |
| **Modeling Core**      | Scikit-Learn (Pipelines, Custom Transformers, IsolationForest) |
| **Deployment Format**  | ONNX (`skl2onnx`, `onnxruntime`)                               |
| **Linter & Formatter** | Ruff (`ruff check`, `ruff format`)                             |
| **Type Checker**       | Mypy (`mypy src tests app.py`)                                 |
| **Prototyping App**    | Streamlit + Plotly                                             |
| **Data & Math**        | NumPy, Pandas, SciPy                                           |
| **Testing**            | Pytest                                                         |

### Key Development Commands

```bash
poetry install               # Install environment and dependencies
poetry run ruff format .     # Format all Python files (PEP 8, 100 cols)
poetry run ruff check .      # Lint check with auto-fixes
poetry run mypy src tests app.py  # Static type analysis
poetry run pytest -v         # Run all unit tests and ONNX parity verification
poetry run streamlit run app.py  # Launch Streamlit development studio
```

---

## 📁 Package Structure

```
ml/
├── pyproject.toml              # Project metadata & dependency definitions
├── README.md                   # Scientific documentation, methodology & user guide
├── AGENTS.md                   # This agent governance document
├── app.py                      # Subproject 2: Streamlit Interactive Prototyping Studio
├── models/
│   ├── anomaly_pipeline.pkl    # Serialized Scikit-Learn pipeline
│   └── anomaly_pipeline.onnx   # Exported ONNX model artifact
├── src/
│   └── rekakarbon_ml/
│       ├── __init__.py
│       ├── data/               # Ingestion of assets/data and synthetic generators
│       │   ├── benchmark_loader.py
│       │   └── generator.py
│       ├── pipeline/           # Scikit-Learn pipeline construction & ONNX conversion
│       │   ├── transformers.py
│       │   ├── build_pipeline.py
│       │   └── onnx_exporter.py
│       └── inference/          # Prediction runners & diagnostic scoring
│           └── predictor.py
└── tests/
    ├── test_pipeline.py        # Pipeline & transformer unit tests
    └── test_onnx_parity.py     # Scikit-Learn vs ONNX Runtime parity verification
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

### 4. Code & Naming Conventions

- **Functions & Variables**: MUST use `snake_case` (e.g., `export_pipeline_to_onnx()`, `reported_emissions_tco2e`).
- **Classes & Transformers**: MUST use `PascalCase` (e.g., `EmissionFeatureEngineer`, `CarbonAnomalyPredictor`).
- **Global Constants & Feature Lists**: MUST use `UPPER_SNAKE_CASE` (e.g., `FEATURE_COLUMNS`, `DERIVED_FEATURE_NAMES`).
- **Typing**: Use standard Python type annotations (`typing.Dict`, `typing.List`, `typing.Optional`, `typing.Tuple`).

### 5. Client & Backend Integration Contracts

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
4. Run `poetry run pytest -v` (or `pnpm ml:test`) -> All unit and ONNX parity tests MUST pass.
5. Verify that `models/anomaly_pipeline.onnx` is updated if pipeline architecture changed.
6. Test `poetry run streamlit run app.py` to ensure dashboard loads cleanly.
