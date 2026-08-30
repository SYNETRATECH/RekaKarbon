"""
Standalone Data Preprocessing CLI for RekaKarbon ML Engine.
Loads raw reporting datasets, validates schemas, applies EmissionFeatureEngineer,
and exports 15 derived physical/stoichiometric features to CSV/JSON format.
"""

import argparse
import os

import pandas as pd

from ..data.generator import EmissionDataGenerator
from ..pipeline.transformers import DERIVED_FEATURE_NAMES, EmissionFeatureEngineer


def preprocess_dataset(
    input_path: str | None = None,
    output_path: str = "data/processed_features.csv",
    n_samples: int = 500,
    random_state: int | None = None,
) -> pd.DataFrame:
    """
    Preprocesses a raw emission report dataset into a 15-dimensional engineered feature matrix.
    If no input_path is provided, generates a fresh synthetic dataset.
    """
    if input_path and os.path.exists(input_path):
        print(f"Loading raw dataset from {input_path}...")
        if input_path.endswith(".json"):
            raw_df = pd.read_json(input_path)
        else:
            raw_df = pd.read_csv(input_path)
    else:
        print(
            f"No input file specified/found. Generating {n_samples} synthetic emission records..."
        )
        generator = EmissionDataGenerator(random_state=random_state)
        raw_df = generator.generate_dataset(n_samples=n_samples)

    print("Executing EmissionFeatureEngineer preprocessing transformer...")
    transformer = EmissionFeatureEngineer()
    engineered_matrix = transformer.transform(raw_df)

    processed_df = pd.DataFrame(engineered_matrix, columns=DERIVED_FEATURE_NAMES)

    # Preserve key target/label columns if present in raw_df
    if "is_anomaly" in raw_df.columns:
        processed_df["is_anomaly"] = raw_df["is_anomaly"].values
    if "anomaly_type" in raw_df.columns:
        processed_df["anomaly_type"] = raw_df["anomaly_type"].values

    os.makedirs(os.path.dirname(output_path) or "data", exist_ok=True)
    if output_path.endswith(".json"):
        processed_df.to_json(output_path, orient="records", indent=2)
    else:
        processed_df.to_csv(output_path, index=False)

    print(
        f"[SUCCESS] Preprocessed dataset ({processed_df.shape[0]} rows, {processed_df.shape[1]} features) saved to {output_path}"
    )
    return processed_df


def main():
    parser = argparse.ArgumentParser(description="RekaKarbon ML Data Preprocessing CLI")
    parser.add_argument(
        "--input", "-i", type=str, default=None, help="Path to raw dataset CSV/JSON"
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="data/processed_features.csv",
        help="Path to output processed CSV/JSON",
    )
    parser.add_argument(
        "--n-samples", "-n", type=int, default=500, help="Number of synthetic samples if generating"
    )
    args = parser.parse_args()

    preprocess_dataset(
        input_path=args.input,
        output_path=args.output,
        n_samples=args.n_samples,
    )


if __name__ == "__main__":
    main()
