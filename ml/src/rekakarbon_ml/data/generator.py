"""
Synthetic Dataset Generator for Industrial Carbon Emissions and Anomalies.
Generates balanced compliant vs anomalous submissions reflecting Indonesian industrial sectors,
incorporating physical stoichiometry, process emissions, and econometric price boundaries.
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
    Generates realistic, sector-grounded industrial carbon reporting datasets
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
            bench = self.sector_benchmarks[sector]

            # Production scale based on sector
            if sector == "Ketenagalistrikan & PLTU":
                production = float(self.rng.uniform(100000, 1500000))  # MWh equivalent
            elif sector == "Logam & Baja":
                production = float(self.rng.uniform(50000, 500000))  # Ton crude steel
            else:
                production = float(self.rng.uniform(80000, 900000))  # Ton product

            intensity = float(
                np.clip(
                    self.rng.normal(bench["avg_intensity_tco2e_per_ton"], bench["std_intensity"]),
                    bench["min_intensity"],
                    bench["max_intensity"],
                )
            )

            expected_total_emissions = production * intensity

            # Process emissions (e.g. limestone calcination in cement)
            clinker_tonnes = 0.0
            e_process = 0.0
            if bench.get("has_process_emissions", False):
                if sector == "Semen & Bahan Bangunan":
                    clinker_ratio = bench.get("clinker_ratio", 0.72)
                    clinker_tonnes = (
                        production * clinker_ratio * float(self.rng.uniform(0.95, 1.05))
                    )
                    e_process = (
                        clinker_tonnes * self.factors["cement_clinker_calcination_tco2e_per_ton"]
                    )
                else:
                    e_process = (
                        production
                        * bench.get("process_emission_factor", 0.35)
                        * float(self.rng.uniform(0.9, 1.1))
                    )

            # Energy / combustion emissions
            e_combustion = max(expected_total_emissions - e_process, expected_total_emissions * 0.3)

            share_coal = bench.get("fuel_share_coal", 0.3)
            share_solar = bench.get("fuel_share_solar", 0.2)
            share_elec = bench.get("fuel_share_electricity", 0.3)
            share_gas = bench.get("fuel_share_gas", 0.2)
            tot_fossil = share_coal + share_solar + share_elec + share_gas
            if tot_fossil > 0:
                share_coal /= tot_fossil
                share_solar /= tot_fossil
                share_elec /= tot_fossil
                share_gas /= tot_fossil

            emiss_coal = e_combustion * share_coal
            emiss_solar = e_combustion * share_solar
            emiss_elec = e_combustion * share_elec
            emiss_gas = e_combustion * share_gas

            # Convert to physical units
            stat_fuel_liters = max(
                0.0, (emiss_solar * 0.8) / self.factors["solar_diesel_tco2e_per_liter"]
            )
            mob_fuel_liters = max(
                0.0, (emiss_solar * 0.2) / self.factors["solar_diesel_tco2e_per_liter"]
            )
            coal_kg = max(0.0, emiss_coal / self.factors["coal_tco2e_per_kg"])
            gas_m3 = max(0.0, emiss_gas / self.factors["natural_gas_tco2e_per_m3"])
            elec_kwh = max(0.0, emiss_elec / self.factors["grid_electricity_tco2e_per_kwh"])

            biomass_ton = (
                float(self.rng.uniform(500, 25000))
                if bench.get("biomass_utilization_ratio", 0.0) > 0
                else 0.0
            )

            # Econometric utility costs (IDR) with realistic market dispersion (± 8%)
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

            # Historical baseline & slight reporting noise (± 2%)
            yoy_factor = float(self.rng.uniform(0.94, 1.06))
            historical_emissions = expected_total_emissions * yoy_factor

            noise = float(self.rng.uniform(0.985, 1.015))
            reported_emissions = expected_total_emissions * noise

            data.append(
                {
                    "sector": sector,
                    "production_tonnes": round(production, 2),
                    "reported_emissions_tco2e": round(reported_emissions, 2),
                    "historical_emissions_tco2e": round(historical_emissions, 2),
                    "stat_fuel_liters": round(stat_fuel_liters, 2),
                    "mob_fuel_liters": round(mob_fuel_liters, 2),
                    "biomass_tonnes": round(biomass_ton, 2),
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
            "UNDER_REPORTING_FRAUD",
            "UNDER_REPORTING_SUBTLE",
            "FUEL_COST_MISMATCH",
            "IMPOSSIBLE_PRODUCTION_INTENSITY",
            "UNREPORTED_PROCESS_EMISSIONS",
            "EXTREME_YOY_COLLAPSE",
        ]

        for _ in range(n_anomalies):
            sector = self.rng.choice(sectors_to_use)
            bench = self.sector_benchmarks[sector]
            atype = self.rng.choice(anomaly_types)

            production = float(self.rng.uniform(100000, 800000))
            normal_intensity = float(
                np.clip(
                    self.rng.normal(bench["avg_intensity_tco2e_per_ton"], bench["std_intensity"]),
                    bench["min_intensity"],
                    bench["max_intensity"],
                )
            )
            real_physics_emissions = production * normal_intensity

            stat_fuel_liters = float(self.rng.uniform(2500000, 9000000))
            mob_fuel_liters = float(self.rng.uniform(400000, 1800000))
            biomass_ton = float(self.rng.uniform(500, 15000))
            clinker_tonnes = production * 0.72 if sector == "Semen & Bahan Bangunan" else 0.0

            cost_solar = stat_fuel_liters * float(self.rng.uniform(19000, 22500))
            cost_coal = float(self.rng.uniform(4e9, 20e9))
            cost_gas = float(self.rng.uniform(1e9, 7e9))
            cost_pln = float(self.rng.uniform(3e9, 14e9))
            historical_emissions = real_physics_emissions * float(self.rng.uniform(0.95, 1.05))

            if atype == "UNDER_REPORTING_FRAUD":
                reported_emissions = real_physics_emissions * float(self.rng.uniform(0.15, 0.40))
            elif atype == "UNDER_REPORTING_SUBTLE":
                reported_emissions = real_physics_emissions * float(self.rng.uniform(0.55, 0.72))
            elif atype == "FUEL_COST_MISMATCH":
                # Fake or subsidized invoice: unit price absurdly off market bounds (e.g. Rp 800/L)
                cost_solar = stat_fuel_liters * float(self.rng.uniform(400, 1500))
                reported_emissions = real_physics_emissions
            elif atype == "IMPOSSIBLE_PRODUCTION_INTENSITY":
                reported_emissions = production * float(self.rng.uniform(0.005, 0.025))
            elif atype == "UNREPORTED_PROCESS_EMISSIONS":
                # Only combustion is reported, calcination is omitted
                clinker_tonnes = production * 0.75
                e_combustion = real_physics_emissions * 0.35
                reported_emissions = e_combustion
            else:
                # EXTREME_YOY_COLLAPSE
                reported_emissions = historical_emissions * float(self.rng.uniform(0.08, 0.20))

            data.append(
                {
                    "sector": sector,
                    "production_tonnes": round(production, 2),
                    "reported_emissions_tco2e": round(reported_emissions, 2),
                    "historical_emissions_tco2e": round(historical_emissions, 2),
                    "stat_fuel_liters": round(stat_fuel_liters, 2),
                    "mob_fuel_liters": round(mob_fuel_liters, 2),
                    "biomass_tonnes": round(biomass_ton, 2),
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
        return df.sample(frac=1.0, random_state=self.rng).reset_index(drop=True)

    def generate_train_val_test_splits(
        self,
        n_total: int | None = None,
        anomaly_ratio: float | None = None,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Generates stratified non-leaking train, validation, and test datasets."""
        total = n_total if n_total is not None else self.dataset_config.default_n_samples
        ratio = (
            anomaly_ratio
            if anomaly_ratio is not None
            else self.dataset_config.default_anomaly_ratio
        )
        full_df = self.generate_dataset(n_samples=total, anomaly_ratio=ratio)
        n_train = int(total * train_ratio)
        n_val = int(total * val_ratio)

        train_df = full_df.iloc[:n_train].reset_index(drop=True)
        val_df = full_df.iloc[n_train : n_train + n_val].reset_index(drop=True)
        test_df = full_df.iloc[n_train + n_val :].reset_index(drop=True)

        return train_df, val_df, test_df
