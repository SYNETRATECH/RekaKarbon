"""
Scikit-Learn Custom Transformers for Physics-Informed Carbon Emission Feature Engineering.
Follows BaseEstimator & TransformerMixin conventions for strict pipeline compatibility.
"""

from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from ..data.benchmark_loader import (
    MARKET_PRICE_RANGES,
    STOICHIOMETRIC_FACTORS,
    SUPPORTED_SECTORS,
    SectorBenchmarkLoader,
)

RAW_FEATURE_COLUMNS: List[str] = [
    "production_tonnes",
    "reported_emissions_tco2e",
    "historical_emissions_tco2e",
    "stat_fuel_liters",
    "mob_fuel_liters",
    "biomass_tonnes",
    "cost_solar_idr",
    "cost_coal_idr",
    "cost_gas_idr",
    "cost_pln_idr",
    "clinker_tonnes",
    "sector_idx",
]

# Alias for backward compatibility
FEATURE_COLUMNS = RAW_FEATURE_COLUMNS

DERIVED_FEATURE_NAMES: List[str] = [
    "stoichiometric_divergence",
    "solar_unit_cost_log",
    "emission_intensity",
    "sector_intensity_zscore",
    "yoy_change_ratio",
    "energy_spend_per_ton_product",
    "spend_ratio",
    "process_emission_ratio",
    "solar_price_residual_ratio",
    "sector_is_semen",
    "sector_is_manufaktur",
    "sector_is_cpo",
    "sector_is_logam",
    "sector_is_pulp",
    "sector_is_pltu",
]

SECTOR_TO_IDX: Dict[str, int] = {name: i for i, name in enumerate(SUPPORTED_SECTORS)}
IDX_TO_SECTOR: Dict[int, str] = {i: name for i, name in enumerate(SUPPORTED_SECTORS)}


class EmissionFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Transforms raw company emission & energy reports into physics-informed,
    sector-calibrated feature matrices (15 derived dimensions).
    """

    def __init__(self):
        loader = SectorBenchmarkLoader()
        self.benchmarks = loader.get_sector_emission_factors()
        self.factors = STOICHIOMETRIC_FACTORS
        self.prices = MARKET_PRICE_RANGES

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            df = X.copy()
            # If sector is passed as string column, convert to sector_idx
            if "sector" in df.columns and "sector_idx" not in df.columns:
                df["sector_idx"] = (
                    df["sector"].map(lambda s: SECTOR_TO_IDX.get(str(s), 0)).fillna(0).astype(float)
                )
            if "clinker_tonnes" not in df.columns:
                df["clinker_tonnes"] = 0.0

            for col in RAW_FEATURE_COLUMNS:
                if col not in df.columns:
                    df[col] = 0.0

            X_mat = df[RAW_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
        else:
            X_arr = np.asarray(X, dtype=np.float32)
            if X_arr.ndim == 1:
                X_arr = X_arr.reshape(1, -1)
            # Handle variable input width (10 columns legacy or 12 columns updated)
            n_cols = X_arr.shape[1]
            if n_cols == 10:
                # pad with clinker_tonnes=0 and sector_idx=0
                padding = np.zeros((X_arr.shape[0], 2), dtype=np.float32)
                X_mat = np.hstack([X_arr, padding])
            elif n_cols >= 12:
                X_mat = X_arr[:, :12]
            else:
                padding = np.zeros((X_arr.shape[0], 12 - n_cols), dtype=np.float32)
                X_mat = np.hstack([X_arr, padding])

        prod = np.maximum(X_mat[:, 0], 1e-4)
        reported = np.maximum(X_mat[:, 1], 0.0)
        hist = np.maximum(X_mat[:, 2], 1e-4)
        stat_fuel = np.maximum(X_mat[:, 3], 0.0)
        mob_fuel = np.maximum(X_mat[:, 4], 0.0)
        biomass = np.maximum(X_mat[:, 5], 0.0)
        c_solar = np.maximum(X_mat[:, 6], 0.0)
        c_coal = np.maximum(X_mat[:, 7], 0.0)
        c_gas = np.maximum(X_mat[:, 8], 0.0)
        c_pln = np.maximum(X_mat[:, 9], 0.0)
        clinker = np.maximum(X_mat[:, 10], 0.0)
        sector_idx = np.clip(np.round(X_mat[:, 11]).astype(int), 0, len(SUPPORTED_SECTORS) - 1)

        eps = 1e-6

        # 1. Stoichiometric Physics: Direct Combustion + IPPU Calcination Process Emissions
        total_fuel_l = stat_fuel + mob_fuel
        e_diesel = total_fuel_l * self.factors["solar_diesel_tco2e_per_liter"]
        e_coal = (c_coal / self.prices["coal"]["nominal"]) * self.factors["coal_tco2e_per_kg"]
        e_gas = (c_gas / self.prices["natural_gas"]["nominal"]) * self.factors[
            "natural_gas_tco2e_per_m3"
        ]
        e_pln = (c_pln / self.prices["grid_electricity"]["nominal"]) * self.factors[
            "grid_electricity_tco2e_per_kwh"
        ]
        e_biomass = biomass * self.factors["biomass_net_tco2e_per_ton"]
        e_process = clinker * self.factors["cement_clinker_calcination_tco2e_per_ton"]

        e_expected = np.maximum(
            e_diesel + e_coal + e_gas + e_pln + e_biomass + e_process,
            prod * 0.05,  # physical minimum threshold
        )

        # Derived Feature 1: Stoichiometric Divergence Ratio
        divergence = np.abs(e_expected - reported) / (e_expected + eps)

        # Derived Feature 2: Solar Fuel Unit Cost Log (IDR / L)
        solar_unit_cost = np.where(stat_fuel > 0, c_solar / (stat_fuel + eps), 20500.0)
        solar_unit_cost_log = np.log1p(np.clip(solar_unit_cost, 0, 1e7))

        # Derived Feature 3: Raw Emission Intensity (tCO2e / Ton Product)
        emission_intensity = reported / prod

        # Derived Feature 4: Sector-Normalized Intensity Z-Score
        sector_names = [SUPPORTED_SECTORS[idx] for idx in sector_idx]
        bench_avgs = np.array(
            [self.benchmarks[s]["avg_intensity_tco2e_per_ton"] for s in sector_names],
            dtype=np.float32,
        )
        bench_stds = np.array(
            [self.benchmarks[s]["std_intensity"] for s in sector_names], dtype=np.float32
        )
        sector_intensity_zscore = (emission_intensity - bench_avgs) / (bench_stds + eps)

        # Derived Feature 5: YoY Growth Ratio
        yoy_change = (reported - hist) / hist

        # Derived Feature 6: Energy Cost per Ton Product
        total_cost = c_solar + c_coal + c_gas + c_pln
        cost_per_ton = total_cost / prod

        # Derived Feature 7: Reported Emissions to Energy Cost Ratio
        spend_ratio = reported / (total_cost * 1e-9 + eps)

        # Derived Feature 8: Process Emission to Total Expected Ratio
        process_ratio = e_process / (e_expected + eps)

        # Derived Feature 9: Solar Market Price Residual Ratio
        nominal_solar = self.prices["solar_diesel"]["nominal"]
        solar_price_residual = np.abs(solar_unit_cost - nominal_solar) / nominal_solar

        # Derived Features 10-15: One-Hot Sector Encoding (6 columns)
        n_sectors = len(SUPPORTED_SECTORS)
        sector_one_hot = np.zeros((len(X_mat), n_sectors), dtype=np.float32)
        sector_one_hot[np.arange(len(X_mat)), sector_idx] = 1.0

        engineered = np.column_stack(
            [
                divergence,
                solar_unit_cost_log,
                emission_intensity,
                sector_intensity_zscore,
                yoy_change,
                cost_per_ton,
                spend_ratio,
                process_ratio,
                solar_price_residual,
                sector_one_hot,
            ]
        ).astype(np.float32)

        # Sanitize any unexpected NaNs or infs
        engineered = np.nan_to_num(engineered, nan=0.0, posinf=1e5, neginf=-1e5)

        return engineered
