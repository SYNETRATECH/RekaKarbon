"""
Sector Benchmark & Physical Stoichiometry Parameter Loader.
Anchors emission factors, market price indices, and sector baselines in official
Indonesian datasets (BPS, KLHK) and IPCC 2006/2019 guidelines.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

# Core Stoichiometric Emission Factors (IPCC 2006 & KLHK Pedoman Inventarisasi GRK)
# Unit: tCO2e per physical activity unit
STOICHIOMETRIC_FACTORS: Dict[str, float] = {
    "solar_diesel_tco2e_per_liter": 0.00268,  # Gas/Diesel Oil (B35) ~2.68 kg CO2e/L
    "coal_tco2e_per_kg": 0.00242,  # Sub-bituminous Coal ~2.42 kg CO2e/kg
    "natural_gas_tco2e_per_m3": 0.00190,  # Natural Gas ~1.90 kg CO2e/m3
    "grid_electricity_tco2e_per_kwh": 0.00085,  # PLN Jamali Grid average ~0.85 kg CO2e/kWh
    "cement_clinker_calcination_tco2e_per_ton": 0.525,  # IPPU CaCO3 -> CaO + CO2
    "biomass_net_tco2e_per_ton": 0.020,  # Biogenic residual methane/N2O trace
}

# Indonesian Industrial Fuel Market Price Indices (IDR per unit)
# Calibrated against Pertamina Industrial Diesel, BPS Energy, and ESDM Indices
MARKET_PRICE_RANGES: Dict[str, Dict[str, float]] = {
    "solar_diesel": {"min": 16000.0, "max": 25000.0, "nominal": 20500.0},  # IDR / Liter
    "coal": {"min": 850.0, "max": 1600.0, "nominal": 1200.0},  # IDR / kg
    "natural_gas": {"min": 7500.0, "max": 13500.0, "nominal": 10000.0},  # IDR / m3
    "grid_electricity": {"min": 1350.0, "max": 1900.0, "nominal": 1600.0},  # IDR / kWh
}

SUPPORTED_SECTORS: List[str] = [
    "Semen & Bahan Bangunan",
    "Manufaktur & Pengolahan",
    "Kelapa Sawit & CPO",
    "Logam & Baja",
    "Pulp & Kertas",
    "Ketenagalistrikan & PLTU",
]


def get_assets_data_path() -> Path:
    """Locates the assets/data directory relative to current file or workspace."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "assets" / "data"
        if candidate.exists() and candidate.is_dir():
            return candidate
    return Path(__file__).resolve().parents[3] / "assets" / "data"


class SectorBenchmarkLoader:
    """Loads national sector trends, IPCC factors, and sector-specific emission parameters."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or get_assets_data_path()

    def load_sector_trends(self) -> pd.DataFrame:
        """Loads historical national GHG emissions by sector (2000-2023)."""
        csv_path = (
            self.data_dir / "emisi-gas-rumah-kaca-menurut-jenis-sektor-2000-2023" / "2000-2023.csv"
        )
        if not csv_path.exists():
            return pd.DataFrame()
        return pd.read_csv(csv_path)

    def load_physical_supply_use_2024(self) -> pd.DataFrame:
        """Loads 2024 Physical Supply and Use Table for Indonesian GHG emissions."""
        csv_path = self.data_dir / "penyediaan-dan-penggunaan-fisik-grk-di-indonesia" / "2024.csv"
        if not csv_path.exists():
            return pd.DataFrame()
        return pd.read_csv(csv_path, skiprows=2)

    def get_stoichiometric_factors(self) -> Dict[str, float]:
        """Returns IPCC/KLHK physical stoichiometric emission factors."""
        return STOICHIOMETRIC_FACTORS.copy()

    def get_market_price_ranges(self) -> Dict[str, Dict[str, float]]:
        """Returns industrial energy market price bounds (IDR)."""
        return MARKET_PRICE_RANGES.copy()

    def get_sector_emission_factors(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns rich domain benchmark profiles for Indonesian industrial sectors.
        Includes emission intensities, process emission ratios, and fuel distribution priors.
        """
        return {
            "Semen & Bahan Bangunan": {
                "avg_intensity_tco2e_per_ton": 0.65,
                "min_intensity": 0.45,
                "max_intensity": 0.95,
                "std_intensity": 0.08,
                "clinker_ratio": 0.72,
                "has_process_emissions": True,
                "process_emission_factor": 0.525,  # Calcination per ton clinker
                "fuel_share_coal": 0.70,
                "fuel_share_solar": 0.08,
                "fuel_share_electricity": 0.15,
                "fuel_share_gas": 0.07,
                "biomass_utilization_ratio": 0.05,
            },
            "Manufaktur & Pengolahan": {
                "avg_intensity_tco2e_per_ton": 0.28,
                "min_intensity": 0.10,
                "max_intensity": 0.55,
                "std_intensity": 0.06,
                "clinker_ratio": 0.0,
                "has_process_emissions": False,
                "process_emission_factor": 0.0,
                "fuel_share_coal": 0.25,
                "fuel_share_solar": 0.25,
                "fuel_share_electricity": 0.35,
                "fuel_share_gas": 0.15,
                "biomass_utilization_ratio": 0.0,
            },
            "Kelapa Sawit & CPO": {
                "avg_intensity_tco2e_per_ton": 0.18,
                "min_intensity": 0.08,
                "max_intensity": 0.40,
                "std_intensity": 0.04,
                "clinker_ratio": 0.0,
                "has_process_emissions": False,
                "process_emission_factor": 0.0,
                "fuel_share_coal": 0.02,
                "fuel_share_solar": 0.40,
                "fuel_share_electricity": 0.18,
                "fuel_share_gas": 0.0,
                "biomass_utilization_ratio": 0.40,  # Shell & Fiber for boilers
            },
            "Logam & Baja": {
                "avg_intensity_tco2e_per_ton": 1.85,
                "min_intensity": 1.20,
                "max_intensity": 2.80,
                "std_intensity": 0.25,
                "clinker_ratio": 0.0,
                "has_process_emissions": True,
                "process_emission_factor": 0.35,  # Coke reduction / graphite electrodes
                "fuel_share_coal": 0.55,
                "fuel_share_solar": 0.08,
                "fuel_share_electricity": 0.27,
                "fuel_share_gas": 0.10,
                "biomass_utilization_ratio": 0.0,
            },
            "Pulp & Kertas": {
                "avg_intensity_tco2e_per_ton": 0.45,
                "min_intensity": 0.25,
                "max_intensity": 0.80,
                "std_intensity": 0.07,
                "clinker_ratio": 0.0,
                "has_process_emissions": False,
                "process_emission_factor": 0.0,
                "fuel_share_coal": 0.35,
                "fuel_share_solar": 0.12,
                "fuel_share_electricity": 0.23,
                "fuel_share_gas": 0.10,
                "biomass_utilization_ratio": 0.20,  # Black liquor / bark
            },
            "Ketenagalistrikan & PLTU": {
                "avg_intensity_tco2e_per_ton": 0.92,
                "min_intensity": 0.75,
                "max_intensity": 1.25,
                "std_intensity": 0.09,
                "clinker_ratio": 0.0,
                "has_process_emissions": False,
                "process_emission_factor": 0.0,
                "fuel_share_coal": 0.85,
                "fuel_share_solar": 0.05,
                "fuel_share_electricity": 0.10,
                "fuel_share_gas": 0.0,
                "biomass_utilization_ratio": 0.03,  # Coal co-firing (sawdust/pellet)
            },
        }
