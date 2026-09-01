"""
Batch Data Validation Engine for RekaKarbon ML Datasets.
Applies Pydantic schema validation across raw dataframes, filtering malformed rows
and compiling audit statistics for data ingestion quality control.
"""

from typing import Any, Dict, Tuple

import pandas as pd

from .schema import validate_emission_dict


def validate_raw_dataframe(
    df: pd.DataFrame,
    drop_invalid: bool = False,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Validates a raw pandas DataFrame against EmissionReportInput schema rules.

    Args:
        df: Raw DataFrame containing submission records.
        drop_invalid: If True, invalid rows are dropped from returned DataFrame.
                     If False, invalid rows are kept but flagged in the validation report.

    Returns:
        Tuple of (validated_df, validation_summary_dict)
    """
    total_records = len(df)
    valid_indices = []
    invalid_records = []

    for idx, row in df.iterrows():
        row_dict: Dict[str, Any] = {str(k): v for k, v in row.to_dict().items()}
        is_valid, error_msg, validated_model = validate_emission_dict(row_dict)
        if is_valid and validated_model is not None:
            valid_indices.append(idx)
        else:
            invalid_records.append(
                {
                    "row_index": int(str(idx)),
                    "sector": str(row_dict.get("sector", "UNKNOWN")),
                    "error": str(error_msg),
                }
            )

    valid_count = len(valid_indices)
    invalid_count = len(invalid_records)
    valid_ratio = round(valid_count / max(total_records, 1), 4)

    summary: Dict[str, Any] = {
        "total_records": total_records,
        "valid_records": valid_count,
        "invalid_records": invalid_count,
        "valid_ratio": valid_ratio,
        "status": "PASSED" if invalid_count == 0 else "WARNING_INVALID_ROWS_DETECTED",
        "errors": invalid_records[:10],  # sample top 10 error details
    }

    if drop_invalid and invalid_count > 0:
        clean_df = df.loc[valid_indices].reset_index(drop=True)
    else:
        clean_df = df.copy()

    return clean_df, summary
