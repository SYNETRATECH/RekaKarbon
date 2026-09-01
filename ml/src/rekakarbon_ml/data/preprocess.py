"""
Standalone Data Preprocessing & Data Split Pipeline for RekaKarbon ML Engine.
Loads or generates raw reporting datasets, exports stratified train/val/test splits,
applies EmissionFeatureEngineer, and exports derived feature matrices to disk.
"""

import argparse
import os
from typing import Tuple

import pandas as pd

from ..config import get_dataset_config, get_paths_config, get_random_state
from ..data.generator import EmissionDataGenerator
from ..pipeline.transformers import DERIVED_FEATURE_NAMES, EmissionFeatureEngineer


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
    Saves artifacts to raw_dir, splits_dir, and output_path.

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
        n_total = len(raw_df)
        n_train = int(n_total * cfg.train_ratio)
        n_val = int(n_total * cfg.val_ratio)
        train_df = raw_df.iloc[:n_train].reset_index(drop=True)
        val_df = raw_df.iloc[n_train : n_train + n_val].reset_index(drop=True)
        test_df = raw_df.iloc[n_train + n_val :].reset_index(drop=True)
    else:
        print(
            f"No input file specified/found. Generating {n_samples} synthetic emission records..."
        )
        generator = EmissionDataGenerator(random_state=seed)
        train_df, val_df, test_df = generator.generate_train_val_test_splits(n_total=n_samples)
        raw_df = pd.concat([train_df, val_df, test_df], ignore_index=True)

    # 1. Save raw emissions dataset artifact
    raw_path = os.path.join(target_raw_dir, "raw_emissions.csv")
    raw_df.to_csv(raw_path, index=False)
    print(f"Saved raw emissions dataset ({len(raw_df)} rows) -> {raw_path}")

    # 2. Save stratified split artifacts
    train_path = os.path.join(target_splits_dir, "train.csv")
    val_path = os.path.join(target_splits_dir, "val.csv")
    test_path = os.path.join(target_splits_dir, "test.csv")

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(
        f"Saved dataset splits -> Train: {len(train_df)} ({train_path}), Val: {len(val_df)} ({val_path}), Test: {len(test_df)} ({test_path})"
    )

    # 3. Transform full raw dataset into derived feature matrix
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

    # Also save backwards-compatible fallback copy at data/processed_features.csv if output_path != data/processed_features.csv
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
