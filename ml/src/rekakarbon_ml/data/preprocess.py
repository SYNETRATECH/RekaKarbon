"""
Standalone Data Preprocessing, Validation & Data Split Pipeline for RekaKarbon ML Engine.
Loads or generates raw reporting datasets, validates Pydantic schema rules,
exports stratified train/val/test splits, feature registry manifests, and dataset summaries.
"""

import argparse
import json
import os
from typing import Any, Dict, Tuple

import pandas as pd

from ..config import get_dataset_config, get_paths_config, get_random_state
from ..data.feature_registry import generate_feature_manifest
from ..data.generator import EmissionDataGenerator
from ..data.validator import validate_raw_dataframe
from ..training.transformers import DERIVED_FEATURE_NAMES, EmissionFeatureEngineer


def generate_dataset_summary(
    raw_df: pd.DataFrame,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    validation_summary: Dict[str, Any],
    output_path: str = "data/dataset_summary.json",
) -> Dict[str, Any]:
    """
    Generates a structured dataset summary manifest detailing record distributions and schema health.
    """
    sector_counts = raw_df["sector"].value_counts().to_dict() if "sector" in raw_df.columns else {}
    anomaly_counts = (
        raw_df["anomaly_type"].value_counts().to_dict() if "anomaly_type" in raw_df.columns else {}
    )

    summary: Dict[str, Any] = {
        "dataset_name": "RekaKarbon Industrial Carbon Emissions Dataset",
        "total_samples": len(raw_df),
        "split_counts": {
            "train": len(train_df),
            "val": len(val_df),
            "test": len(test_df),
        },
        "schema_validation": validation_summary,
        "sector_distribution": sector_counts,
        "anomaly_distribution": anomaly_counts,
    }

    os.makedirs(os.path.dirname(output_path) or "data", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Generated dataset summary manifest -> {output_path}")
    return summary


def preprocess_dataset(
    input_path: str | None = None,
    output_path: str = "data/processed/processed_features.csv",
    splits_dir: str | None = None,
    raw_dir: str | None = None,
    n_samples: int = 2500,
    random_state: int | None = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Preprocesses raw emission reports into stratified train/val/test splits and a derived feature matrix.
    Validates batch schema compliance and exports feature manifest & dataset summary artifacts.

    Returns:
        Tuple of (processed_df, train_df, val_df, test_df)
    """
    paths_cfg = get_paths_config()
    target_raw_dir = raw_dir or paths_cfg.data_raw_dir
    target_splits_dir = splits_dir or paths_cfg.data_splits_dir
    seed = get_random_state(random_state)

    os.makedirs(target_raw_dir, exist_ok=True)
    os.makedirs(target_splits_dir, exist_ok=True)

    if input_path and os.path.exists(input_path):
        print(f"Loading raw dataset from {input_path}...")
        raw_df = (
            pd.read_json(input_path) if input_path.endswith(".json") else pd.read_csv(input_path)
        )
        generator = EmissionDataGenerator(random_state=seed)
        cfg = get_dataset_config()
        # Stratified sampling on input dataset
        from sklearn.model_selection import train_test_split

        stratify_col = raw_df["is_anomaly"] if "is_anomaly" in raw_df.columns else None
        train_df, temp_df = train_test_split(
            raw_df,
            train_size=cfg.train_ratio,
            random_state=generator.rng,
            stratify=stratify_col,
        )
        val_relative_ratio = cfg.val_ratio / (cfg.val_ratio + cfg.test_ratio)
        temp_stratify = temp_df["is_anomaly"] if "is_anomaly" in temp_df.columns else None
        val_df, test_df = train_test_split(
            temp_df,
            train_size=val_relative_ratio,
            random_state=generator.rng,
            stratify=temp_stratify,
        )
        train_df = train_df.reset_index(drop=True)
        val_df = val_df.reset_index(drop=True)
        test_df = test_df.reset_index(drop=True)
    else:
        print(
            f"No input file specified/found. Generating {n_samples} synthetic emission records..."
        )
        generator = EmissionDataGenerator(random_state=seed)
        train_df, val_df, test_df = generator.generate_train_val_test_splits(n_total=n_samples)
        raw_df = pd.concat([train_df, val_df, test_df], ignore_index=True)

    # 1. Batch Schema Validation
    print("Validating raw emissions dataset against Pydantic schema rules...")
    raw_df, val_summary = validate_raw_dataframe(raw_df)
    print(
        f"Validation Complete: {val_summary['valid_records']}/{val_summary['total_records']} valid (Ratio: {val_summary['valid_ratio']})"
    )

    # 2. Save raw emissions dataset artifact
    raw_path = os.path.join(target_raw_dir, "raw_emissions.csv")
    raw_df.to_csv(raw_path, index=False)
    print(f"Saved raw emissions dataset ({len(raw_df)} rows) -> {raw_path}")

    # 3. Save stratified split artifacts
    train_path = os.path.join(target_splits_dir, "train.csv")
    val_path = os.path.join(target_splits_dir, "val.csv")
    test_path = os.path.join(target_splits_dir, "test.csv")

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(
        f"Saved dataset splits -> Train: {len(train_df)} ({train_path}), Val: {len(val_df)} ({val_path}), Test: {len(test_df)} ({test_path})"
    )

    # 4. Export Feature Registry Manifest & Dataset Summary
    generate_feature_manifest()
    generate_dataset_summary(raw_df, train_df, val_df, test_df, val_summary)

    # 5. Transform full raw dataset into derived feature matrix
    print("Executing EmissionFeatureEngineer preprocessing transformer...")
    transformer = EmissionFeatureEngineer()
    engineered_matrix = transformer.transform(raw_df)

    processed_df = pd.DataFrame(engineered_matrix, columns=DERIVED_FEATURE_NAMES)

    if "is_anomaly" in raw_df.columns:
        processed_df["is_anomaly"] = raw_df["is_anomaly"].values
    if "anomaly_type" in raw_df.columns:
        processed_df["anomaly_type"] = raw_df["anomaly_type"].values

    os.makedirs(os.path.dirname(output_path) or "data/processed", exist_ok=True)
    if output_path.endswith(".json"):
        processed_df.to_json(output_path, orient="records", indent=2)
    else:
        processed_df.to_csv(output_path, index=False)

    # Backward-compatible fallback copy at data/processed_features.csv
    fallback_path = "data/processed_features.csv"
    if output_path != fallback_path:
        os.makedirs(os.path.dirname(fallback_path) or "data", exist_ok=True)
        processed_df.to_csv(fallback_path, index=False)

    print(
        f"[SUCCESS] Preprocessed feature matrix ({processed_df.shape[0]} rows, {processed_df.shape[1]} features) saved to {output_path}"
    )
    return processed_df, train_df, val_df, test_df


def main() -> None:
    parser = argparse.ArgumentParser(description="RekaKarbon ML Data Preprocessing & Split CLI")
    parser.add_argument(
        "--input", "-i", type=str, default=None, help="Path to raw dataset CSV/JSON"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="data/processed/processed_features.csv",
        help="Path to output processed CSV/JSON",
    )
    parser.add_argument(
        "--splits-dir",
        type=str,
        default=None,
        help="Directory to save train.csv, val.csv, test.csv",
    )
    parser.add_argument(
        "--raw-dir",
        type=str,
        default=None,
        help="Directory to save raw_emissions.csv",
    )
    parser.add_argument(
        "--n-samples",
        "-n",
        type=int,
        default=2500,
        help="Number of synthetic samples if generating",
    )
    args = parser.parse_args()

    preprocess_dataset(
        input_path=args.input,
        output_path=args.output,
        splits_dir=args.splits_dir,
        raw_dir=args.raw_dir,
        n_samples=args.n_samples,
    )


if __name__ == "__main__":
    main()
