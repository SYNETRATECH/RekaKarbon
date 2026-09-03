"""
Scikit-Learn Custom Transformers for GHG Scope-Calibrated Carbon Emission Feature Engineering.
Follows BaseEstimator & TransformerMixin conventions for strict pipeline and ONNX compatibility.
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
    normalize_sector_key,
)

RAW_FEATURE_COLUMNS: List[str] = [
    "production_tonnes",
    "reported_scope1_tco2e",
    "reported_scope2_tco2e",
    "reported_scope3_tco2e",
    "reported_emissions_tco2e",
    "historical_emissions_tco2e",
    "stat_fuel_liters",
    "mob_fuel_liters",
    "coal_kg",
    "gas_m3",
    "electricity_kwh",
    "cost_solar_idr",
    "cost_coal_idr",
    "cost_gas_idr",
    "cost_pln_idr",
    "clinker_tonnes",
    "sector_idx",
]

FEATURE_COLUMNS = RAW_FEATURE_COLUMNS

DERIVED_FEATURE_NAMES: List[str] = [
    "scope1_stoichiometric_divergence",
    "scope2_grid_divergence",
    "solar_unit_cost_log",
    "electricity_unit_cost_log",
    "emission_intensity",
    "sector_intensity_zscore",
    "scope1_to_total_ratio",
    "scope2_to_total_ratio",
    "scope3_presence_ratio",
    "scope_summation_discrepancy",
    "solar_price_residual_ratio",
    "electricity_price_residual_ratio",
    "yoy_change_ratio",
    "energy_spend_per_ton",
    "sector_is_manufaktur",
    "sector_is_pertambangan",
    "sector_is_perbankan",
    "sector_is_konstruksi",
    "sector_is_pertanian",
    "sector_is_perhotelan",
]

SECTOR_TO_IDX: Dict[str, int] = {name: i for i, name in enumerate(SUPPORTED_SECTORS)}
IDX_TO_SECTOR: Dict[int, str] = {i: name for i, name in enumerate(SUPPORTED_SECTORS)}


class EmissionFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Transforms raw multi-scope carbon reporting inputs into a physics-informed,
    scope-calibrated 20-dimensional feature matrix.
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
            # Map sector column to sector_idx
            if "sector" in df.columns:
                df["sector_idx"] = (
                    df["sector"]
                    .map(lambda s: SECTOR_TO_IDX.get(normalize_sector_key(str(s)), 0))
                    .fillna(0)
                    .astype(float)
                )
            elif "sector_idx" not in df.columns:
                df["sector_idx"] = 0.0

            # Backward compatibility: populate derived physical inputs if missing
            if "coal_kg" not in df.columns and "cost_coal_idr" in df.columns:
                df["coal_kg"] = df["cost_coal_idr"] / max(self.prices["coal"]["nominal"], 1.0)
            if "gas_m3" not in df.columns and "cost_gas_idr" in df.columns:
                df["gas_m3"] = df["cost_gas_idr"] / max(self.prices["natural_gas"]["nominal"], 1.0)
            if "electricity_kwh" not in df.columns and "cost_pln_idr" in df.columns:
                df["electricity_kwh"] = df["cost_pln_idr"] / max(
                    self.prices["grid_electricity"]["nominal"], 1.0
                )

            # Ensure scope allocations if only total was supplied
            if "reported_scope1_tco2e" not in df.columns:
                df["reported_scope1_tco2e"] = df.get("reported_emissions_tco2e", 0.0) * 0.60
            if "reported_scope2_tco2e" not in df.columns:
                df["reported_scope2_tco2e"] = df.get("reported_emissions_tco2e", 0.0) * 0.40
            if "reported_scope3_tco2e" not in df.columns:
                df["reported_scope3_tco2e"] = 0.0

            for col in RAW_FEATURE_COLUMNS:
                if col not in df.columns:
                    df[col] = 0.0

            X_mat = df[RAW_FEATURE_COLUMNS].to_numpy(dtype=np.float32)
        else:
            X_arr = np.asarray(X, dtype=np.float32)
            if X_arr.ndim == 1:
                X_arr = X_arr.reshape(1, -1)
            n_cols = X_arr.shape[1]
            if n_cols < len(RAW_FEATURE_COLUMNS):
                padding = np.zeros(
                    (X_arr.shape[0], len(RAW_FEATURE_COLUMNS) - n_cols), dtype=np.float32
                )
                X_mat = np.hstack([X_arr, padding])
            else:
                X_mat = X_arr[:, : len(RAW_FEATURE_COLUMNS)]

        prod = np.maximum(X_mat[:, 0], 1e-4)
        s1_rep = np.maximum(X_mat[:, 1], 0.0)
        s2_rep = np.maximum(X_mat[:, 2], 0.0)
        s3_rep = np.maximum(X_mat[:, 3], 0.0)
        tot_rep = np.maximum(X_mat[:, 4], 0.0)
        hist = np.maximum(X_mat[:, 5], 1e-4)
        stat_fuel = np.maximum(X_mat[:, 6], 0.0)
        mob_fuel = np.maximum(X_mat[:, 7], 0.0)
        coal_kg = np.maximum(X_mat[:, 8], 0.0)
        gas_m3 = np.maximum(X_mat[:, 9], 0.0)
        elec_kwh = np.maximum(X_mat[:, 10], 0.0)
        c_solar = np.maximum(X_mat[:, 11], 0.0)
        c_coal = np.maximum(X_mat[:, 12], 0.0)
        c_gas = np.maximum(X_mat[:, 13], 0.0)
        c_pln = np.maximum(X_mat[:, 14], 0.0)
        clinker = np.maximum(X_mat[:, 15], 0.0)
        sector_idx = np.clip(np.round(X_mat[:, 16]).astype(int), 0, len(SUPPORTED_SECTORS) - 1)

        eps = 1e-6

        # 1. Scope 1 Stoichiometric Physics (Fuel Combustion + Process IPPU)
        total_diesel_l = stat_fuel + mob_fuel
        e_diesel = total_diesel_l * self.factors["solar_diesel_tco2e_per_liter"]
        e_coal = np.where(
            coal_kg > 0,
            coal_kg * self.factors["coal_tco2e_per_kg"],
            (c_coal / max(self.prices["coal"]["nominal"], 1.0)) * self.factors["coal_tco2e_per_kg"],
        )
        e_gas = np.where(
            gas_m3 > 0,
            gas_m3 * self.factors["natural_gas_tco2e_per_m3"],
            (c_gas / max(self.prices["natural_gas"]["nominal"], 1.0))
            * self.factors["natural_gas_tco2e_per_m3"],
        )
        e_process = clinker * self.factors["cement_clinker_calcination_tco2e_per_ton"]

        e_s1_expected = np.maximum(e_diesel + e_coal + e_gas + e_process, 0.001)
        scope1_divergence = np.abs(e_s1_expected - s1_rep) / (e_s1_expected + eps)

        # 2. Scope 2 Grid Electricity Physics
        e_s2_expected = np.where(
            elec_kwh > 0,
            elec_kwh * self.factors["grid_electricity_tco2e_per_kwh"],
            (c_pln / max(self.prices["grid_electricity"]["nominal"], 1.0))
            * self.factors["grid_electricity_tco2e_per_kwh"],
        )
        e_s2_expected = np.maximum(e_s2_expected, 0.001)
        scope2_divergence = np.abs(e_s2_expected - s2_rep) / (e_s2_expected + eps)

        # 3. Unit Costs (Log-transformed)
        solar_unit_cost = np.where(stat_fuel > 0, c_solar / (stat_fuel + eps), 20500.0)
        solar_unit_cost_log = np.log1p(np.clip(solar_unit_cost, 0.0, 1e7))

        elec_unit_cost = np.where(elec_kwh > 0, c_pln / (elec_kwh + eps), 1500.0)
        elec_unit_cost_log = np.log1p(np.clip(elec_unit_cost, 0.0, 1e7))

        # 4. Emission Intensity & Sector Z-Score
        effective_total = np.where(tot_rep > 0, tot_rep, s1_rep + s2_rep + s3_rep)
        emission_intensity = effective_total / prod

        sector_keys = [SUPPORTED_SECTORS[idx] for idx in sector_idx]
        bench_avgs = np.array(
            [
                self.benchmarks.get(s, {}).get("avg_intensity_tco2e_per_ton", 0.28)
                for s in sector_keys
            ],
            dtype=np.float32,
        )
        bench_stds = np.array(
            [self.benchmarks.get(s, {}).get("std_intensity", 0.08) for s in sector_keys],
            dtype=np.float32,
        )
        sector_intensity_zscore = (emission_intensity - bench_avgs) / (bench_stds + eps)

        # 5. Scope Proportions & Optional Scope 3 Handling
        scope1_ratio = s1_rep / (effective_total + eps)
        scope2_ratio = s2_rep / (effective_total + eps)
        scope3_ratio = s3_rep / (effective_total + eps)

        # 6. Math Summation Discrepancy (Sum of scopes vs reported total)
        scope_sum = s1_rep + s2_rep + s3_rep
        summation_discrepancy = np.abs(scope_sum - effective_total) / (effective_total + eps)

        # 7. Price Residuals
        nom_solar = self.prices["solar_diesel"]["nominal"]
        solar_price_residual = np.abs(solar_unit_cost - nom_solar) / nom_solar

        nom_elec = self.prices["grid_electricity"]["nominal"]
        elec_price_residual = np.abs(elec_unit_cost - nom_elec) / nom_elec

        # 8. YoY Change & Spend per ton
        yoy_change = (effective_total - hist) / hist
        total_energy_cost = c_solar + c_coal + c_gas + c_pln
        energy_spend_per_ton = total_energy_cost / prod

        # 9. One-Hot Sector Encoding (6 columns)
        n_sectors = len(SUPPORTED_SECTORS)
        sector_one_hot = np.zeros((len(X_mat), n_sectors), dtype=np.float32)
        sector_one_hot[np.arange(len(X_mat)), sector_idx] = 1.0

        engineered = np.column_stack(
            [
                scope1_divergence,
                scope2_divergence,
                solar_unit_cost_log,
                elec_unit_cost_log,
                emission_intensity,
                sector_intensity_zscore,
                scope1_ratio,
                scope2_ratio,
                scope3_ratio,
                summation_discrepancy,
                solar_price_residual,
                elec_price_residual,
                yoy_change,
                energy_spend_per_ton,
                sector_one_hot,
            ]
        ).astype(np.float32)

        engineered = np.nan_to_num(engineered, nan=0.0, posinf=1e5, neginf=-1e5)
        return engineered
