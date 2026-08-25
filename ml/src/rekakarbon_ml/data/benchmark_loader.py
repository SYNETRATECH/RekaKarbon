"""
Loader for Indonesian national & sector greenhouse gas emission benchmarks
from assets/data (BPS & KLHK datasets).
"""

from pathlib import Path
from typing import Dict, Optional
import pandas as pd


def get_assets_data_path() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "assets" / "data"
        if candidate.exists() and candidate.is_dir():
            return candidate
    return Path(__file__).resolve().parents[3] / "assets" / "data"


class SectorBenchmarkLoader:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or get_assets_data_path()

    def load_sector_trends(self) -> pd.DataFrame:
        csv_path = self.data_dir / "emisi-gas-rumah-kaca-menurut-jenis-sektor-2000-2023" / "2000-2023.csv"
        if not csv_path.exists():
            return pd.DataFrame()
        return pd.read_csv(csv_path)

    def load_physical_supply_use_2024(self) -> pd.DataFrame:
        csv_path = self.data_dir / "penyediaan-dan-penggunaan-fisik-grk-di-indonesia" / "2024.csv"
        if not csv_path.exists():
            return pd.DataFrame()
        return pd.read_csv(csv_path, skiprows=2)

    def get_sector_emission_factors(self) -> Dict[str, Dict[str, float]]:
        return {
            "Semen & Bahan Bangunan": {
                "avg_intensity_tco2e_per_ton": 0.65,
                "min_intensity": 0.45,
                "max_intensity": 0.95,
                "fuel_share_coal": 0.75,
                "fuel_share_solar": 0.10,
                "fuel_share_electricity": 0.15,
            },
            "Manufaktur & Pengolahan": {
                "avg_intensity_tco2e_per_ton": 0.28,
                "min_intensity": 0.10,
                "max_intensity": 0.55,
                "fuel_share_coal": 0.30,
                "fuel_share_solar": 0.30,
                "fuel_share_electricity": 0.40,
            },
            "Kelapa Sawit & CPO": {
                "avg_intensity_tco2e_per_ton": 0.18,
                "min_intensity": 0.08,
                "max_intensity": 0.40,
                "fuel_share_coal": 0.05,
                "fuel_share_solar": 0.35,
                "fuel_share_electricity": 0.20,
                "biomass_utilization_ratio": 0.40,
            },
            "Logam & Baja": {
                "avg_intensity_tco2e_per_ton": 1.85,
                "min_intensity": 1.20,
                "max_intensity": 2.80,
                "fuel_share_coal": 0.60,
                "fuel_share_solar": 0.10,
                "fuel_share_electricity": 0.30,
            },
            "Pulp & Kertas": {
                "avg_intensity_tco2e_per_ton": 0.45,
                "min_intensity": 0.25,
                "max_intensity": 0.80,
                "fuel_share_coal": 0.40,
                "fuel_share_solar": 0.15,
                "fuel_share_electricity": 0.25,
                "biomass_utilization_ratio": 0.20,
            },
            "Ketenagalistrikan & PLTU": {
                "avg_intensity_tco2e_per_ton": 0.92,
                "min_intensity": 0.75,
                "max_intensity": 1.25,
                "fuel_share_coal": 0.85,
                "fuel_share_solar": 0.05,
                "fuel_share_electricity": 0.10,
            },
        }
