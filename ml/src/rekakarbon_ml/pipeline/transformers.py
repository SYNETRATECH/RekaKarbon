"""
Scikit-Learn Custom Transformers for Carbon Emission Feature Engineering.
Follows BaseEstimator & TransformerMixin conventions for strict pipeline compatibility.
"""

from typing import List
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

FEATURE_COLUMNS: List[str] = [
    "production_tonnes",
    "reported_emissions_tco2e",
    "historical_emissions_tco2e",
    "stat_fuel_liters",
    "mob_fuel_liters",
    "biomass_tonnes",
    "cost_solar_idr",
    "cost_coal_idr",
    "cost_gas_idr",
    "cost_pln_idr"
]

DERIVED_FEATURE_NAMES: List[str] = [
    "divergence_ratio",
    "solar_unit_cost_log",
    "emission_intensity",
    "yoy_change_ratio",
    "energy_spend_per_ton_product",
    "scope1_to_energy_cost_ratio"
]


class EmissionFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Engineers domain-specific carbon physical & financial features from raw form inputs.
    Converts 10 raw features into 6 core physical-stoichiometric & financial divergence features.
    """

    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            cols = [c for c in FEATURE_COLUMNS if c in X.columns]
            if len(cols) == len(FEATURE_COLUMNS):
                X_mat = X[FEATURE_COLUMNS].to_numpy(dtype=np.float32)
            else:
                X_mat = np.asarray(X, dtype=np.float32)
        else:
            X_mat = np.asarray(X, dtype=np.float32)

        prod = X_mat[:, 0]
        reported = X_mat[:, 1]
        hist = X_mat[:, 2]
        stat_fuel = X_mat[:, 3]
        mob_fuel = X_mat[:, 4]
        biomass = X_mat[:, 5]
        c_solar = X_mat[:, 6]
        c_coal = X_mat[:, 7]
        c_gas = X_mat[:, 8]
        c_pln = X_mat[:, 9]

        eps = 1e-6

        # 1. Stoichiometric expected emissions from fuel & utility spend
        total_fuel_l = stat_fuel + mob_fuel
        e_diesel = total_fuel_l * 0.00268
        e_coal = (c_coal / 1200.0) * 0.00242
        e_gas = (c_gas / 10000.0) * 0.0019
        e_pln = (c_pln / 1600.0) * 0.00085
        e_expected = e_diesel + e_coal + e_gas + e_pln

        # Feature 1: Divergence ratio |expected - reported| / expected
        divergence = np.abs(e_expected - reported) / (e_expected + eps)

        # Feature 2: Solar unit cost log (IDR / Liter)
        solar_unit_cost = c_solar / (stat_fuel + eps)
        solar_unit_cost_log = np.log1p(np.clip(solar_unit_cost, 0, 1e7))

        # Feature 3: Emission intensity (tCO2e / Ton Product)
        emission_intensity = reported / (prod + eps)

        # Feature 4: YoY growth ratio
        yoy_change = (reported - hist) / (hist + eps)

        # Feature 5: Total utility spend per ton of product
        total_cost = c_solar + c_coal + c_gas + c_pln
        cost_per_ton = total_cost / (prod + eps)

        # Feature 6: Scope 1 emissions to total fuel spend ratio
        spend_ratio = reported / (total_cost * 1e-9 + eps)

        engineered = np.column_stack([
            divergence,
            solar_unit_cost_log,
            emission_intensity,
            yoy_change,
            cost_per_ton,
            spend_ratio
        ]).astype(np.float32)

        return engineered
