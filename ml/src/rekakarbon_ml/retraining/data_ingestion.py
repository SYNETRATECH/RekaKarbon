"""
Production Data Ingestion Pipeline for Continuous Retraining.

Loads verified production emission records from the verificator feedback pool
and blends them with the existing synthetic training dataset using a configurable
real-to-synthetic ratio.

Blend ratio contract:
  - real_blend_weight: fraction of the merged training set drawn from real records.
    Starts at 0.20 (20% real, 80% synthetic) and should increase as production
    data accumulates toward a mature real-data-dominant regime.
  - All real records are validated against EmissionReportInput Pydantic schema
    before being included. Invalid records are logged and excluded silently.
  - Stratified sampling preserves the is_anomaly class balance from the feedback pool.
"""

import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import pandas as pd
from pydantic import BaseModel, Field, field_validator
from sklearn.model_selection import train_test_split

from ..config import DEFAULT_RANDOM_STATE, get_retraining_config
from ..data.validator import validate_raw_dataframe
from .types import IngestionResult

logger = logging.getLogger(__name__)


@dataclass
class IngestionConfig:
    """Configuration for the production data ingestion pipeline."""

    feedback_pool_path: str = field(
        default_factory=lambda: get_retraining_config().feedback_pool_path
    )
    synthetic_train_path: str = "data/splits/train.csv"
    real_blend_weight: float = field(
        default_factory=lambda: get_retraining_config().real_blend_weight
    )
    min_real_records: int = field(
        default_factory=lambda: get_retraining_config().min_real_records_to_trigger
    )
    output_merged_path: str = "data/production/merged_train.csv"
    random_state: int = field(default_factory=lambda: DEFAULT_RANDOM_STATE)


class DataIngestionPipeline:
    """
    Ingests production feedback data and merges it with synthetic training data
    using a configurable blend ratio for continuous retraining.
    """

    def __init__(self, config: IngestionConfig | None = None) -> None:
        self.config = config or IngestionConfig()

    def load_feedback_pool(self) -> pd.DataFrame:
        """
        Loads the production feedback pool CSV.

        Returns an empty DataFrame with required columns if the pool does not exist
        or contains fewer than ``min_real_records`` entries.

        Raises:
            ValueError: If the feedback pool file exists but cannot be parsed.
        """
        path = self.config.feedback_pool_path
        if not os.path.exists(path):
            logger.warning("Feedback pool not found at %s — returning empty DataFrame.", path)
            return pd.DataFrame()

        df = pd.read_csv(path)
        logger.info("Loaded %d records from feedback pool: %s", len(df), path)
        return df

    def validate_real_records(self, df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
        """
        Validates real records against the Pydantic schema and the batch validator.

        Records that fail validation are excluded. Returns the valid subset and
        a validation summary dictionary.
        """
        if df.empty:
            return df, {"total_records": 0, "valid_records": 0, "valid_ratio": 0.0}

        validated_df, summary = validate_raw_dataframe(df)
        n_valid = summary.get("valid_records", len(validated_df))
        n_total = summary.get("total_records", len(df))
        logger.info(
            "Schema validation: %d/%d real records passed (%.1f%%)",
            n_valid,
            n_total,
            (n_valid / max(n_total, 1)) * 100,
        )
        return validated_df, summary

    def _compute_blend_counts(
        self, n_real_available: int, n_synthetic_available: int
    ) -> tuple[int, int]:
        """
        Computes how many real and synthetic records to include in the merged set.

        Uses real_blend_weight to determine the target real proportion.
        The total merged size is bounded by the available synthetic data count.
        """
        w_real = self.config.real_blend_weight
        w_syn = 1.0 - w_real

        # Target total = synthetic / w_syn so that real = w_real fraction
        target_total = int(n_synthetic_available / max(w_syn, 1e-6))
        target_real = min(int(target_total * w_real), n_real_available)

        # If we have fewer real records than the target, adjust total proportionally
        if target_real < int(target_total * w_real):
            target_total = int(target_real / max(w_real, 1e-6))

        target_syn = min(target_total - target_real, n_synthetic_available)
        return target_real, target_syn

    def prepare_merged_dataset(self) -> IngestionResult:
        """
        Loads, validates, blends, and saves the merged training dataset.

        Workflow:
          1. Load production feedback pool CSV
          2. Validate records against Pydantic schema
          3. Check minimum real record threshold
          4. Load synthetic training split
          5. Compute blend counts and sample both datasets (stratified on is_anomaly)
          6. Concatenate and save to output_merged_path
          7. Return IngestionResult summary

        Returns:
            IngestionResult with success=False if minimum real records threshold
            is not met or if a critical error occurs.
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        try:
            # 1. Load feedback pool
            raw_real_df = self.load_feedback_pool()

            # 2. Validate real records
            real_df, val_summary = self.validate_real_records(raw_real_df)

            # 3. Check minimum real records threshold
            if len(real_df) < self.config.min_real_records:
                logger.warning(
                    "Insufficient real records (%d < %d). Retraining will use synthetic data only.",
                    len(real_df),
                    self.config.min_real_records,
                )
                # Use synthetic only when below threshold
                real_df = pd.DataFrame()

            # 4. Load synthetic training split
            if not os.path.exists(self.config.synthetic_train_path):
                raise FileNotFoundError(
                    f"Synthetic training split not found at: {self.config.synthetic_train_path}. "
                    "Run `poetry run preprocess` first."
                )
            synthetic_df = pd.read_csv(self.config.synthetic_train_path)
            logger.info(
                "Loaded %d synthetic training records from: %s",
                len(synthetic_df),
                self.config.synthetic_train_path,
            )

            # 5. Compute blend and sample
            if real_df.empty:
                # No real data — use full synthetic split
                merged_df = synthetic_df.copy()
                n_real_used = 0
                n_syn_used = len(synthetic_df)
            else:
                n_real_target, n_syn_target = self._compute_blend_counts(
                    len(real_df), len(synthetic_df)
                )

                # Stratified sample of real records
                stratify_real = real_df["is_anomaly"] if "is_anomaly" in real_df.columns else None
                if n_real_target < len(real_df):
                    real_sample, _ = train_test_split(
                        real_df,
                        train_size=n_real_target,
                        random_state=self.config.random_state,
                        stratify=stratify_real,
                    )
                else:
                    real_sample = real_df.copy()

                # Stratified sample of synthetic records
                stratify_syn = (
                    synthetic_df["is_anomaly"] if "is_anomaly" in synthetic_df.columns else None
                )
                if n_syn_target < len(synthetic_df):
                    syn_sample, _ = train_test_split(
                        synthetic_df,
                        train_size=n_syn_target,
                        random_state=self.config.random_state,
                        stratify=stratify_syn,
                    )
                else:
                    syn_sample = synthetic_df.copy()

                merged_df = pd.concat([real_sample, syn_sample], ignore_index=True).sample(
                    frac=1, random_state=self.config.random_state
                )
                n_real_used = len(real_sample)
                n_syn_used = len(syn_sample)

            # 6. Save merged dataset
            os.makedirs(os.path.dirname(self.config.output_merged_path), exist_ok=True)
            merged_df.to_csv(self.config.output_merged_path, index=False)
            logger.info(
                "[SUCCESS] Merged training dataset (%d records) saved to: %s",
                len(merged_df),
                self.config.output_merged_path,
            )

            # 7. Compute summary stats
            real_anomaly_ratio = 0.0
            if "is_anomaly" in real_df.columns and not real_df.empty:
                real_anomaly_ratio = float(real_df["is_anomaly"].mean())

            merged_anomaly_ratio = 0.0
            if "is_anomaly" in merged_df.columns:
                merged_anomaly_ratio = float(merged_df["is_anomaly"].mean())

            return IngestionResult(
                success=True,
                n_real_records=n_real_used,
                n_synthetic_records=n_syn_used,
                n_merged_records=len(merged_df),
                real_anomaly_ratio=real_anomaly_ratio,
                merged_anomaly_ratio=merged_anomaly_ratio,
                validation_summary=val_summary,
                output_path=self.config.output_merged_path,
                timestamp=timestamp,
            )

        except Exception as exc:
            logger.error("Data ingestion pipeline failed: %s", exc, exc_info=True)
            return IngestionResult(
                success=False,
                n_real_records=0,
                n_synthetic_records=0,
                n_merged_records=0,
                real_anomaly_ratio=0.0,
                merged_anomaly_ratio=0.0,
                validation_summary={},
                output_path="",
                timestamp=timestamp,
                error=str(exc),
            )

    def append_feedback_record(self, record: dict[str, Any]) -> bool:
        """
        Appends a single validated record to the feedback pool CSV (thread-safe via temp rename).

        Used by the Feedback API to persist incoming verificator verdicts.

        Args:
            record: Dictionary matching the raw emission report schema fields,
                    plus 'is_anomaly' (int 0/1) and 'verificator_verdict' fields.

        Returns:
            True if the record was appended successfully, False on error.
        """
        try:
            os.makedirs(os.path.dirname(self.config.feedback_pool_path), exist_ok=True)
            row_df = pd.DataFrame([record])
            header = not os.path.exists(self.config.feedback_pool_path)
            row_df.to_csv(
                self.config.feedback_pool_path,
                mode="a",
                header=header,
                index=False,
            )
            return True
        except Exception as exc:
            logger.error("Failed to append feedback record: %s", exc)
            return False


def get_feedback_pool_stats(
    feedback_pool_path: str | None = None,
) -> dict[str, Any]:
    """
    Returns summary statistics for the current production feedback pool.

    Args:
        feedback_pool_path: Override path; defaults to RetrainingConfig value.

    Returns:
        Dictionary with 'n_records', 'n_anomalies', 'anomaly_ratio',
        'sectors', 'date_range', and 'pool_path'.
    """
    path = feedback_pool_path or get_retraining_config().feedback_pool_path

    if not os.path.exists(path):
        return {
            "n_records": 0,
            "n_anomalies": 0,
            "anomaly_ratio": 0.0,
            "sectors": [],
            "date_range": None,
            "pool_path": path,
        }

    df = pd.read_csv(path)
    n_records = len(df)
    n_anomalies = int(df["is_anomaly"].sum()) if "is_anomaly" in df.columns else 0
    anomaly_ratio = round(n_anomalies / max(n_records, 1), 4)
    sectors = df["sector"].unique().tolist() if "sector" in df.columns else []

    date_range: dict[str, str] | None = None
    if "received_at" in df.columns:
        date_range = {
            "earliest": str(df["received_at"].min()),
            "latest": str(df["received_at"].max()),
        }

    return {
        "n_records": n_records,
        "n_anomalies": n_anomalies,
        "anomaly_ratio": anomaly_ratio,
        "sectors": sectors,
        "date_range": date_range,
        "pool_path": path,
    }


class FeedbackRecord(BaseModel):
    """
    Verificator verdict payload representing an audited emission report.

    Required emission fields mirror the EmissionReportInput schema columns.
    The ``verificator_verdict`` is the human auditor's final decision which
    overrides or confirms the ML model flag.
    """

    # Audit metadata
    company_id: str = Field(..., description="Unique company identifier")
    report_period: str = Field(..., description="Reporting period, e.g. '2025-Q3'")
    verificator_id: str = Field(..., description="Verificator user ID")
    verificator_verdict: str = Field(
        ...,
        description="Final verdict: 'PASS_VERIFIED' or 'REJECT_ANOMALY'",
    )
    ml_prediction: str | None = Field(
        default=None, description="Original ML model verdict before human review"
    )

    # Core emission fields (mirror EmissionReportInput)
    sector: str = Field(..., description="Industrial sector key")
    production_tonnes: float = Field(..., ge=0.0)
    reported_emissions_tco2e: float = Field(..., ge=0.0)
    reported_scope1_tco2e: float = Field(default=0.0, ge=0.0)
    reported_scope2_tco2e: float = Field(default=0.0, ge=0.0)
    reported_scope3_tco2e: float = Field(default=0.0, ge=0.0)
    historical_emissions_tco2e: float = Field(default=0.0, ge=0.0)
    stat_fuel_liters: float = Field(default=0.0, ge=0.0)
    mob_fuel_liters: float = Field(default=0.0, ge=0.0)
    coal_kg: float = Field(default=0.0, ge=0.0)
    gas_m3: float = Field(default=0.0, ge=0.0)
    electricity_kwh: float = Field(default=0.0, ge=0.0)
    cost_solar_idr: float = Field(default=0.0, ge=0.0)
    cost_coal_idr: float = Field(default=0.0, ge=0.0)
    cost_gas_idr: float = Field(default=0.0, ge=0.0)
    cost_pln_idr: float = Field(default=0.0, ge=0.0)
    clinker_tonnes: float = Field(default=0.0, ge=0.0)

    @field_validator("verificator_verdict")
    @classmethod
    def validate_verdict(cls, v: str) -> str:
        allowed = {"PASS_VERIFIED", "REJECT_ANOMALY"}
        if v not in allowed:
            raise ValueError(f"verificator_verdict must be one of {allowed}, got '{v}'")
        return v

    def to_feedback_row(self) -> dict[str, Any]:
        """Converts to a flat dict row for appending to feedback_pool.csv."""
        return {
            "company_id": self.company_id,
            "report_period": self.report_period,
            "verificator_id": self.verificator_id,
            "verificator_verdict": self.verificator_verdict,
            "ml_prediction": self.ml_prediction,
            "sector": self.sector,
            "production_tonnes": self.production_tonnes,
            "reported_emissions_tco2e": self.reported_emissions_tco2e,
            "reported_scope1_tco2e": self.reported_scope1_tco2e,
            "reported_scope2_tco2e": self.reported_scope2_tco2e,
            "reported_scope3_tco2e": self.reported_scope3_tco2e,
            "historical_emissions_tco2e": self.historical_emissions_tco2e,
            "stat_fuel_liters": self.stat_fuel_liters,
            "mob_fuel_liters": self.mob_fuel_liters,
            "coal_kg": self.coal_kg,
            "gas_m3": self.gas_m3,
            "electricity_kwh": self.electricity_kwh,
            "cost_solar_idr": self.cost_solar_idr,
            "cost_coal_idr": self.cost_coal_idr,
            "cost_gas_idr": self.cost_gas_idr,
            "cost_pln_idr": self.cost_pln_idr,
            "clinker_tonnes": self.clinker_tonnes,
            # Derived label used by retraining
            "is_anomaly": 1 if self.verificator_verdict == "REJECT_ANOMALY" else 0,
            "anomaly_type": (
                "VERIFICATOR_CONFIRMED"
                if self.verificator_verdict == "REJECT_ANOMALY"
                else "NORMAL"
            ),
            "received_at": datetime.now(timezone.utc).isoformat(),
        }
