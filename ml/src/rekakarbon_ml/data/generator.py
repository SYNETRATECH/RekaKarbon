"""
Synthetic Dataset Generator for Industrial Carbon Emissions and Anomalies.
Generates balanced compliant vs anomalous submissions reflecting Indonesian industrial sectors.
"""

from typing import Optional
import numpy as np
import pandas as pd
from .benchmark_loader import SectorBenchmarkLoader


class EmissionDataGenerator:
    def __init__(self, random_state: int = 42):
        self.rng = np.random.RandomState(random_state)
        self.loader = SectorBenchmarkLoader()
        self.sector_benchmarks = self.loader.get_sector_emission_factors()

    def generate_dataset(
        self,
        n_samples: int = 1500,
        anomaly_ratio: float = 0.12
    ) -> pd.DataFrame:
        sectors = list(self.sector_benchmarks.keys())
        data = []

        n_anomalies = int(n_samples * anomaly_ratio)
        n_normals = n_samples - n_anomalies

        # 1. Generate Normal Compliant Reports
        for _ in range(n_normals):
            sector = self.rng.choice(sectors)
            bench = self.sector_benchmarks[sector]

            production = float(self.rng.uniform(50000, 800000))
            intensity = float(self.rng.uniform(bench["min_intensity"], bench["max_intensity"]))
            expected_total_emissions = production * intensity

            emiss_coal = expected_total_emissions * bench.get("fuel_share_coal", 0.4)
            emiss_solar = expected_total_emissions * bench.get("fuel_share_solar", 0.25)
            emiss_elec = expected_total_emissions * bench.get("fuel_share_electricity", 0.25)
            emiss_gas = expected_total_emissions * max(
                0.0,
                1.0 - (bench.get("fuel_share_coal", 0.4) + bench.get("fuel_share_solar", 0.25) + bench.get("fuel_share_electricity", 0.25))
            )

            stat_fuel_liters = max(1000.0, (emiss_solar * 0.8) / 0.00268)
            mob_fuel_liters = max(500.0, (emiss_solar * 0.2) / 0.00268)
            coal_kg = max(1000.0, emiss_coal / 0.00242)
            gas_m3 = max(500.0, emiss_gas / 0.0019)
            elec_kwh = max(5000.0, emiss_elec / 0.00085)
            biomass_ton = float(self.rng.uniform(100, 20000)) if "biomass_utilization_ratio" in bench else 0.0

            solar_price = float(self.rng.uniform(18500, 22000))
            cost_solar = stat_fuel_liters * solar_price

            coal_price = float(self.rng.uniform(900, 1400))
            cost_coal = coal_kg * coal_price

            gas_price = float(self.rng.uniform(8000, 12000))
            cost_gas = gas_m3 * gas_price

            pln_price = float(self.rng.uniform(1450, 1750))
            cost_pln = elec_kwh * pln_price

            yoy_factor = float(self.rng.uniform(0.92, 1.08))
            historical_emissions = expected_total_emissions * yoy_factor

            noise = float(self.rng.uniform(0.98, 1.02))
            reported_emissions = expected_total_emissions * noise

            data.append({
                "sector": sector,
                "production_tonnes": round(production, 2),
                "reported_emissions_tco2e": round(reported_emissions, 2),
                "historical_emissions_tco2e": round(historical_emissions, 2),
                "stat_fuel_liters": round(stat_fuel_liters, 2),
                "mob_fuel_liters": round(mob_fuel_liters, 2),
                "biomass_tonnes": round(biomass_ton, 2),
                "cost_solar_idr": round(cost_solar, 2),
                "cost_coal_idr": round(cost_coal, 2),
                "cost_gas_idr": round(cost_gas, 2),
                "cost_pln_idr": round(cost_pln, 2),
                "is_anomaly": 0,
                "anomaly_type": "NORMAL"
            })

        # 2. Generate Labeled Anomalies
        anomaly_types = [
            "UNDER_REPORTING_FRAUD",
            "FUEL_COST_MISMATCH",
            "IMPOSSIBLE_PRODUCTION_INTENSITY",
            "EXTREME_YOY_COLLAPSE",
        ]

        for _ in range(n_anomalies):
            sector = self.rng.choice(sectors)
            bench = self.sector_benchmarks[sector]
            atype = self.rng.choice(anomaly_types)

            production = float(self.rng.uniform(100000, 800000))
            normal_intensity = float(self.rng.uniform(bench["min_intensity"], bench["max_intensity"]))
            real_physics_emissions = production * normal_intensity

            stat_fuel_liters = float(self.rng.uniform(2000000, 10000000))
            mob_fuel_liters = float(self.rng.uniform(500000, 2000000))
            biomass_ton = float(self.rng.uniform(500, 15000))

            cost_solar = stat_fuel_liters * float(self.rng.uniform(19000, 22000))
            cost_coal = float(self.rng.uniform(5e9, 25e9))
            cost_gas = float(self.rng.uniform(1e9, 8e9))
            cost_pln = float(self.rng.uniform(4e9, 15e9))
            historical_emissions = real_physics_emissions * float(self.rng.uniform(0.95, 1.05))

            if atype == "UNDER_REPORTING_FRAUD":
                reported_emissions = real_physics_emissions * float(self.rng.uniform(0.10, 0.35))
            elif atype == "FUEL_COST_MISMATCH":
                cost_solar = stat_fuel_liters * float(self.rng.uniform(200, 1200))
                reported_emissions = real_physics_emissions
            elif atype == "IMPOSSIBLE_PRODUCTION_INTENSITY":
                reported_emissions = production * float(self.rng.uniform(0.005, 0.02))
            else:
                reported_emissions = historical_emissions * 0.10

            data.append({
                "sector": sector,
                "production_tonnes": round(production, 2),
                "reported_emissions_tco2e": round(reported_emissions, 2),
                "historical_emissions_tco2e": round(historical_emissions, 2),
                "stat_fuel_liters": round(stat_fuel_liters, 2),
                "mob_fuel_liters": round(mob_fuel_liters, 2),
                "biomass_tonnes": round(biomass_ton, 2),
                "cost_solar_idr": round(cost_solar, 2),
                "cost_coal_idr": round(cost_coal, 2),
                "cost_gas_idr": round(cost_gas, 2),
                "cost_pln_idr": round(cost_pln, 2),
                "is_anomaly": 1,
                "anomaly_type": atype
            })

        df = pd.DataFrame(data)
        return df.sample(frac=1.0, random_state=self.rng).reset_index(drop=True)
