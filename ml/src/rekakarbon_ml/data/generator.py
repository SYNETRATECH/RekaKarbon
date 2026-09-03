"""
Synthetic Dataset Generator for Multi-Scope GHG Carbon Emissions & Anomalies.
Generates balanced compliant vs anomalous submissions reflecting Indonesian industrial sectors,
incorporating physical fuel stoichiometry, electricity grids, and multi-scope reporting.
"""

from typing import List

import numpy as np
import pandas as pd

from ..config import get_dataset_config, get_random_state
from .benchmark_loader import (
    MARKET_PRICE_RANGES,
    STOICHIOMETRIC_FACTORS,
    SUPPORTED_SECTORS,
    SectorBenchmarkLoader,
)


class EmissionDataGenerator:
    """
    Generates realistic, GHG Protocol-grounded industrial carbon reporting datasets
    with calibrated normal distributions and multi-modal anomaly injections.
    """

    def __init__(self, random_state: int | None = None):
        self.random_state = get_random_state(random_state)
        self.rng = np.random.RandomState(self.random_state)
        self.loader = SectorBenchmarkLoader()
        self.sector_benchmarks = self.loader.get_sector_emission_factors()
        self.factors = STOICHIOMETRIC_FACTORS
        self.prices = MARKET_PRICE_RANGES
        self.dataset_config = get_dataset_config()

    def generate_dataset(
        self,
        n_samples: int | None = None,
        anomaly_ratio: float | None = None,
        sectors: List[str] | None = None,
    ) -> pd.DataFrame:
        self.rng = np.random.RandomState(self.random_state)
        samples = n_samples if n_samples is not None else self.dataset_config.default_n_samples
        ratio = (
            anomaly_ratio
            if anomaly_ratio is not None
            else self.dataset_config.default_anomaly_ratio
        )
        sectors_to_use = sectors or SUPPORTED_SECTORS
        data = []

        n_anomalies = int(samples * ratio)
        n_normals = samples - n_anomalies

        # 1. Generate Normal Compliant Reports
        for _ in range(n_normals):
            sector = self.rng.choice(sectors_to_use)
            bench = self.sector_benchmarks.get(sector, self.sector_benchmarks[sectors_to_use[0]])

            # Production scale based on sector
            if sector == "pertambangan":
                production = float(self.rng.uniform(80000, 800000))
            elif sector == "manufaktur":
                production = float(self.rng.uniform(50000, 500000))
            elif sector == "konstruksi":
                production = float(self.rng.uniform(30000, 350000))
            elif sector == "pertanian":
                production = float(self.rng.uniform(40000, 400000))
            elif sector == "perhotelan":
                production = float(self.rng.uniform(10000, 120000))
            else:  # perbankan
                production = float(self.rng.uniform(5000, 80000))

            intensity = float(
                np.clip(
                    self.rng.normal(bench["avg_intensity_tco2e_per_ton"], bench["std_intensity"]),
                    bench["min_intensity"],
                    bench["max_intensity"],
                )
            )

            expected_total_emissions = production * intensity

            # Scope distribution priors
            scope_shares = bench.get(
                "expected_scope_shares", {"scope1": 0.60, "scope2": 0.35, "scope3": 0.05}
            )
            s1_share = scope_shares.get("scope1", 0.60)
            s2_share = scope_shares.get("scope2", 0.35)
            s3_share = scope_shares.get("scope3", 0.05)

            # Scope 3 is optional: only ~35% of companies report Scope 3
            has_scope3 = self.rng.uniform(0.0, 1.0) < 0.35
            if not has_scope3:
                s1_share += s3_share * 0.6
                s2_share += s3_share * 0.4
                s3_share = 0.0

            emiss_s1 = expected_total_emissions * s1_share
            emiss_s2 = expected_total_emissions * s2_share
            emiss_s3 = expected_total_emissions * s3_share

            # Scope 1 fuels breakdown
            fuel_priors = bench.get(
                "fuel_share_priors", {"solar_diesel": 0.5, "coal": 0.2, "natural_gas": 0.3}
            )
            share_solar = fuel_priors.get("solar_diesel", 0.5)
            share_coal = fuel_priors.get("coal", 0.2)
            share_gas = fuel_priors.get("natural_gas", 0.3)

            # Process emissions (e.g. calcination or metallurgy DRI)
            clinker_tonnes = 0.0
            if bench.get("has_process_emissions", False):
                e_proc = emiss_s1 * bench.get("process_emission_factor", 0.20)
                emiss_s1_combustion = emiss_s1 - e_proc
                clinker_tonnes = e_proc / self.factors["cement_clinker_calcination_tco2e_per_ton"]
            else:
                emiss_s1_combustion = emiss_s1

            emiss_solar = max(0.0, emiss_s1_combustion * share_solar)
            emiss_coal = max(0.0, emiss_s1_combustion * share_coal)
            emiss_gas = max(0.0, emiss_s1_combustion * share_gas)

            stat_fuel_liters = max(
                0.0, (emiss_solar * 0.8) / self.factors["solar_diesel_tco2e_per_liter"]
            )
            mob_fuel_liters = max(
                0.0, (emiss_solar * 0.2) / self.factors["solar_diesel_tco2e_per_liter"]
            )
            coal_kg = max(0.0, emiss_coal / self.factors["coal_tco2e_per_kg"])
            gas_m3 = max(0.0, emiss_gas / self.factors["natural_gas_tco2e_per_m3"])
            elec_kwh = max(0.0, emiss_s2 / self.factors["grid_electricity_tco2e_per_kwh"])

            # Fuel costs (IDR) with realistic market dispersion (+- 5%)
            solar_price = float(
                self.rng.uniform(
                    self.prices["solar_diesel"]["min"], self.prices["solar_diesel"]["max"]
                )
            )
            cost_solar = stat_fuel_liters * solar_price

            coal_price = float(
                self.rng.uniform(self.prices["coal"]["min"], self.prices["coal"]["max"])
            )
            cost_coal = coal_kg * coal_price

            gas_price = float(
                self.rng.uniform(
                    self.prices["natural_gas"]["min"], self.prices["natural_gas"]["max"]
                )
            )
            cost_gas = gas_m3 * gas_price

            pln_price = float(
                self.rng.uniform(
                    self.prices["grid_electricity"]["min"], self.prices["grid_electricity"]["max"]
                )
            )
            cost_pln = elec_kwh * pln_price

            # Slight reporting noise (+- 1.5%)
            noise_s1 = float(self.rng.uniform(0.985, 1.015))
            noise_s2 = float(self.rng.uniform(0.985, 1.015))
            noise_s3 = float(self.rng.uniform(0.985, 1.015)) if emiss_s3 > 0 else 0.0

            rep_s1 = round(emiss_s1 * noise_s1, 2)
            rep_s2 = round(emiss_s2 * noise_s2, 2)
            rep_s3 = round(emiss_s3 * noise_s3, 2) if emiss_s3 > 0 else 0.0
            rep_total = round(rep_s1 + rep_s2 + rep_s3, 2)

            hist_total = round(rep_total * float(self.rng.uniform(0.94, 1.06)), 2)

            data.append(
                {
                    "sector": sector,
                    "production_tonnes": round(production, 2),
                    "reported_scope1_tco2e": rep_s1,
                    "reported_scope2_tco2e": rep_s2,
                    "reported_scope3_tco2e": rep_s3,
                    "reported_emissions_tco2e": rep_total,
                    "historical_emissions_tco2e": hist_total,
                    "stat_fuel_liters": round(stat_fuel_liters, 2),
                    "mob_fuel_liters": round(mob_fuel_liters, 2),
                    "coal_kg": round(coal_kg, 2),
                    "gas_m3": round(gas_m3, 2),
                    "electricity_kwh": round(elec_kwh, 2),
                    "biomass_tonnes": 0.0,
                    "clinker_tonnes": round(clinker_tonnes, 2),
                    "cost_solar_idr": round(cost_solar, 2),
                    "cost_coal_idr": round(cost_coal, 2),
                    "cost_gas_idr": round(cost_gas, 2),
                    "cost_pln_idr": round(cost_pln, 2),
                    "is_anomaly": 0,
                    "anomaly_type": "NORMAL",
                }
            )

        # 2. Generate Labeled Anomalies
        anomaly_types = [
            "SCOPE1_UNDERREPORTING_FRAUD",
            "SCOPE2_ELECTRICITY_MISMATCH",
            "SCOPE_MATH_DISCREPANCY",
            "FUEL_PRICE_INVOICE_FRAUD",
            "EXTREME_YOY_COLLAPSE",
            "SECTOR_INTENSITY_ANOMALY",
        ]

        for _ in range(n_anomalies):
            sector = self.rng.choice(sectors_to_use)
            bench = self.sector_benchmarks.get(sector, self.sector_benchmarks[sectors_to_use[0]])
            atype = self.rng.choice(anomaly_types)

            production = float(self.rng.uniform(50000, 400000))
            normal_intensity = float(
                np.clip(
                    self.rng.normal(bench["avg_intensity_tco2e_per_ton"], bench["std_intensity"]),
                    bench["min_intensity"],
                    bench["max_intensity"],
                )
            )
            real_total = production * normal_intensity

            scope_shares = bench.get(
                "expected_scope_shares", {"scope1": 0.60, "scope2": 0.35, "scope3": 0.05}
            )
            real_s1 = real_total * scope_shares.get("scope1", 0.60)
            real_s2 = real_total * scope_shares.get("scope2", 0.35)
            real_s3 = (
                real_total * scope_shares.get("scope3", 0.05)
                if self.rng.uniform(0, 1) < 0.4
                else 0.0
            )

            stat_fuel_liters = float(self.rng.uniform(2000000, 6000000))
            mob_fuel_liters = float(self.rng.uniform(300000, 1200000))
            coal_kg = float(self.rng.uniform(1000000, 8000000))
            gas_m3 = float(self.rng.uniform(200000, 2000000))
            elec_kwh = float(self.rng.uniform(5000000, 30000000))
            clinker_tonnes = production * 0.2 if bench.get("has_process_emissions", False) else 0.0

            cost_solar = stat_fuel_liters * float(self.rng.uniform(19000, 23000))
            cost_coal = coal_kg * float(self.rng.uniform(1000, 1400))
            cost_gas = gas_m3 * float(self.rng.uniform(8500, 11500))
            cost_pln = elec_kwh * float(self.rng.uniform(1350, 1750))
            hist_total = real_total * float(self.rng.uniform(0.95, 1.05))

            rep_s1 = real_s1
            rep_s2 = real_s2
            rep_s3 = real_s3
            rep_total = real_s1 + real_s2 + real_s3

            if atype == "SCOPE1_UNDERREPORTING_FRAUD":
                # High fuel physical consumption, but Scope 1 reported fraudulently low
                rep_s1 = real_s1 * float(self.rng.uniform(0.18, 0.42))
                rep_total = rep_s1 + rep_s2 + rep_s3
            elif atype == "SCOPE2_ELECTRICITY_MISMATCH":
                # High electricity consumption, but Scope 2 reported tiny
                rep_s2 = real_s2 * float(self.rng.uniform(0.15, 0.38))
                rep_total = rep_s1 + rep_s2 + rep_s3
            elif atype == "SCOPE_MATH_DISCREPANCY":
                # Math fraud: reported total is forged lower than the actual sum of scopes
                rep_total = (rep_s1 + rep_s2 + rep_s3) * float(self.rng.uniform(0.40, 0.70))
            elif atype == "FUEL_PRICE_INVOICE_FRAUD":
                # Subsidized or fictitious invoice unit price (e.g. Rp 800/L vs Rp 20,500 market nominal)
                cost_solar = stat_fuel_liters * float(self.rng.uniform(500, 2000))
            elif atype == "EXTREME_YOY_COLLAPSE":
                # Reported emissions suddenly collapse 80% without output change
                rep_s1 = real_s1 * float(self.rng.uniform(0.10, 0.25))
                rep_s2 = real_s2 * float(self.rng.uniform(0.10, 0.25))
                rep_s3 = 0.0
                rep_total = rep_s1 + rep_s2
            else:  # SECTOR_INTENSITY_ANOMALY
                rep_s1 = production * bench["min_intensity"] * float(self.rng.uniform(0.08, 0.22))
                rep_s2 = rep_s1 * 0.5
                rep_s3 = 0.0
                rep_total = rep_s1 + rep_s2

            data.append(
                {
                    "sector": sector,
                    "production_tonnes": round(production, 2),
                    "reported_scope1_tco2e": round(rep_s1, 2),
                    "reported_scope2_tco2e": round(rep_s2, 2),
                    "reported_scope3_tco2e": round(rep_s3, 2),
                    "reported_emissions_tco2e": round(rep_total, 2),
                    "historical_emissions_tco2e": round(hist_total, 2),
                    "stat_fuel_liters": round(stat_fuel_liters, 2),
                    "mob_fuel_liters": round(mob_fuel_liters, 2),
                    "coal_kg": round(coal_kg, 2),
                    "gas_m3": round(gas_m3, 2),
                    "electricity_kwh": round(elec_kwh, 2),
                    "biomass_tonnes": 0.0,
                    "clinker_tonnes": round(clinker_tonnes, 2),
                    "cost_solar_idr": round(cost_solar, 2),
                    "cost_coal_idr": round(cost_coal, 2),
                    "cost_gas_idr": round(cost_gas, 2),
                    "cost_pln_idr": round(cost_pln, 2),
                    "is_anomaly": 1,
                    "anomaly_type": atype,
                }
            )

        df = pd.DataFrame(data)
        return df.sample(frac=1.0, random_state=self.random_state).reset_index(drop=True)

    def generate_train_val_test_splits(
        self,
        n_total: int | None = None,
        anomaly_ratio: float | None = None,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        from sklearn.model_selection import train_test_split

        total = n_total if n_total is not None else self.dataset_config.default_n_samples
        ratio = (
            anomaly_ratio
            if anomaly_ratio is not None
            else self.dataset_config.default_anomaly_ratio
        )
        full_df = self.generate_dataset(n_samples=total, anomaly_ratio=ratio)

        stratify_col = full_df["is_anomaly"] if "is_anomaly" in full_df.columns else None

        train_df, temp_df = train_test_split(
            full_df,
            train_size=train_ratio,
            random_state=self.random_state,
            stratify=stratify_col,
        )

        val_relative_ratio = val_ratio / (val_ratio + test_ratio)
        temp_stratify = temp_df["is_anomaly"] if "is_anomaly" in temp_df.columns else None

        val_df, test_df = train_test_split(
            temp_df,
            train_size=val_relative_ratio,
            random_state=self.random_state + 1,
            stratify=temp_stratify,
        )

        return (
            train_df.reset_index(drop=True),
            val_df.reset_index(drop=True),
            test_df.reset_index(drop=True),
        )
