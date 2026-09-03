"""
Sector Benchmark & Physical Stoichiometry Parameter Loader.
Anchors emission factors, market price indices, and sector baselines in official
Indonesian datasets (BPS, KLHK), client-aligned GHG protocol factors, and dynamic sectors.json.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

# Core Stoichiometric Emission Factors (aligned with client emission-calculator.ts & server calculation.service.ts)
# Unit: tCO2e per physical activity unit
STOICHIOMETRIC_FACTORS: Dict[str, float] = {
    "solar_diesel_tco2e_per_liter": 0.002512,  # ~2.512 kg CO2e/L
    "gasoline_tco2e_per_liter": 0.002105,  # ~2.105 kg CO2e/L
    "coal_tco2e_per_kg": 0.002531,  # ~2.531 kg CO2e/kg
    "natural_gas_tco2e_per_m3": 0.002023,  # ~2.023 kg CO2e/m3
    "lpg_tco2e_per_kg": 0.002939,  # ~2.939 kg CO2e/kg
    "grid_electricity_tco2e_per_kwh": 0.000207,  # ~0.207 kg CO2e/kWh (RekaKarbon factor catalog)
    "grid_electricity_jamali_tco2e_per_kwh": 0.000850,  # PLN Jamali Grid average ~0.85 kg CO2e/kWh
    "cement_clinker_calcination_tco2e_per_ton": 0.525,  # IPPU CaCO3 -> CaO + CO2
    "biomass_net_tco2e_per_ton": 0.020,  # Biogenic residual trace
}

# Indonesian Industrial Fuel Market Price Indices (IDR per unit)
# Calibrated against Pertamina Industrial Diesel, BPS Energy, and ESDM Indices
MARKET_PRICE_RANGES: Dict[str, Dict[str, float]] = {
    "solar_diesel": {"min": 16000.0, "max": 25000.0, "nominal": 20500.0},
    "coal": {"min": 850.0, "max": 1600.0, "nominal": 1200.0},
    "natural_gas": {"min": 7500.0, "max": 13500.0, "nominal": 10000.0},
    "grid_electricity": {"min": 1200.0, "max": 1900.0, "nominal": 1500.0},
}

# Default 6 Sectors aligned with Client Application
DEFAULT_SECTORS_DATA: Dict[str, Dict[str, Any]] = {
    "manufaktur": {
        "id": "manufaktur",
        "name": "Manufaktur & Industri",
        "description": "Pabrik, pengolahan, dan produksi barang",
        "reference_threshold_tco2e": 50000.0,
        "avg_intensity_tco2e_per_ton": 0.28,
        "min_intensity": 0.10,
        "max_intensity": 0.65,
        "std_intensity": 0.08,
        "clinker_ratio": 0.0,
        "has_process_emissions": False,
        "process_emission_factor": 0.0,
        "expected_scope_shares": {"scope1": 0.55, "scope2": 0.40, "scope3": 0.05},
        "fuel_share_priors": {"solar_diesel": 0.35, "coal": 0.30, "natural_gas": 0.35},
        "fuel_share_coal": 0.30,
        "fuel_share_solar": 0.35,
        "fuel_share_electricity": 0.40,
        "fuel_share_gas": 0.35,
    },
    "pertambangan": {
        "id": "pertambangan",
        "name": "Pertambangan & Energi",
        "description": "Pertambangan mineral, batu bara, minyak, dan gas",
        "reference_threshold_tco2e": 100000.0,
        "avg_intensity_tco2e_per_ton": 1.25,
        "min_intensity": 0.60,
        "max_intensity": 2.50,
        "std_intensity": 0.25,
        "clinker_ratio": 0.0,
        "has_process_emissions": True,
        "process_emission_factor": 0.20,
        "expected_scope_shares": {"scope1": 0.80, "scope2": 0.15, "scope3": 0.05},
        "fuel_share_priors": {"solar_diesel": 0.70, "coal": 0.20, "natural_gas": 0.10},
        "fuel_share_coal": 0.20,
        "fuel_share_solar": 0.70,
        "fuel_share_electricity": 0.15,
        "fuel_share_gas": 0.10,
    },
    "perbankan": {
        "id": "perbankan",
        "name": "Perbankan & Jasa Keuangan",
        "description": "Bank, asuransi, fintech, dan sekuritas",
        "reference_threshold_tco2e": 5000.0,
        "avg_intensity_tco2e_per_ton": 0.04,
        "min_intensity": 0.01,
        "max_intensity": 0.12,
        "std_intensity": 0.02,
        "clinker_ratio": 0.0,
        "has_process_emissions": False,
        "process_emission_factor": 0.0,
        "expected_scope_shares": {"scope1": 0.10, "scope2": 0.75, "scope3": 0.15},
        "fuel_share_priors": {"solar_diesel": 0.85, "coal": 0.0, "natural_gas": 0.15},
        "fuel_share_coal": 0.0,
        "fuel_share_solar": 0.10,
        "fuel_share_electricity": 0.75,
        "fuel_share_gas": 0.05,
    },
    "konstruksi": {
        "id": "konstruksi",
        "name": "Konstruksi & Properti",
        "description": "Kontraktor, pengembang, dan infrastruktur",
        "reference_threshold_tco2e": 25000.0,
        "avg_intensity_tco2e_per_ton": 0.42,
        "min_intensity": 0.15,
        "max_intensity": 0.95,
        "std_intensity": 0.12,
        "clinker_ratio": 0.0,
        "has_process_emissions": False,
        "process_emission_factor": 0.0,
        "expected_scope_shares": {"scope1": 0.65, "scope2": 0.25, "scope3": 0.10},
        "fuel_share_priors": {"solar_diesel": 0.75, "coal": 0.05, "natural_gas": 0.20},
        "fuel_share_coal": 0.05,
        "fuel_share_solar": 0.65,
        "fuel_share_electricity": 0.25,
        "fuel_share_gas": 0.10,
    },
    "pertanian": {
        "id": "pertanian",
        "name": "Pertanian & Perkebunan",
        "description": "Sawah, kebun, peternakan, dan perikanan",
        "reference_threshold_tco2e": 15000.0,
        "avg_intensity_tco2e_per_ton": 0.18,
        "min_intensity": 0.05,
        "max_intensity": 0.45,
        "std_intensity": 0.06,
        "clinker_ratio": 0.0,
        "has_process_emissions": False,
        "process_emission_factor": 0.0,
        "expected_scope_shares": {"scope1": 0.70, "scope2": 0.25, "scope3": 0.05},
        "fuel_share_priors": {"solar_diesel": 0.80, "coal": 0.0, "natural_gas": 0.20},
        "fuel_share_coal": 0.0,
        "fuel_share_solar": 0.70,
        "fuel_share_electricity": 0.25,
        "fuel_share_gas": 0.05,
    },
    "perhotelan": {
        "id": "perhotelan",
        "name": "Perhotelan & Pariwisata",
        "description": "Hotel, resort, restoran, dan wisata",
        "reference_threshold_tco2e": 10000.0,
        "avg_intensity_tco2e_per_ton": 0.08,
        "min_intensity": 0.02,
        "max_intensity": 0.22,
        "std_intensity": 0.03,
        "clinker_ratio": 0.0,
        "has_process_emissions": False,
        "process_emission_factor": 0.0,
        "expected_scope_shares": {"scope1": 0.25, "scope2": 0.65, "scope3": 0.10},
        "fuel_share_priors": {"solar_diesel": 0.40, "coal": 0.0, "natural_gas": 0.60},
        "fuel_share_coal": 0.0,
        "fuel_share_solar": 0.25,
        "fuel_share_electricity": 0.65,
        "fuel_share_gas": 0.10,
    },
}

SUPPORTED_SECTORS: List[str] = list(DEFAULT_SECTORS_DATA.keys())


def get_assets_data_path() -> Path:
    """Locates the assets/data directory relative to current file or workspace."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "assets" / "data"
        if candidate.exists() and candidate.is_dir():
            return candidate
    return Path(__file__).resolve().parents[3] / "assets" / "data"


def get_sectors_config_path() -> Path:
    """Locates sectors.json in ml/data or relative to package."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "data" / "sectors.json"
        if candidate.exists() and candidate.is_file():
            return candidate
    return current.parents[2] / "data" / "sectors.json"


def load_sectors_config() -> Dict[str, Dict[str, Any]]:
    """Loads dynamic sector profiles from sectors.json with fallback to default profiles."""
    cfg_path = get_sectors_config_path()
    if cfg_path.exists():
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "sectors" in data and isinstance(data["sectors"], dict):
                    loaded = {}
                    for sid, sval in data["sectors"].items():
                        profile = DEFAULT_SECTORS_DATA.get(sid, {}).copy()
                        profile.update(sval)
                        profile["id"] = sid
                        loaded[sid] = profile
                    return loaded
        except Exception:
            pass
    return DEFAULT_SECTORS_DATA.copy()


class SectorBenchmarkLoader:
    """Loads sector profiles, IPCC factors, and sector-specific emission parameters."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or get_assets_data_path()
        self.sectors_data = load_sectors_config()

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
        """Returns physical stoichiometric emission factors."""
        return STOICHIOMETRIC_FACTORS.copy()

    def get_market_price_ranges(self) -> Dict[str, Dict[str, float]]:
        """Returns industrial energy market price bounds (IDR)."""
        return MARKET_PRICE_RANGES.copy()

    def get_sector_emission_factors(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns domain benchmark profiles for industrial sectors.
        Includes emission intensities, reference thresholds, and fuel distribution priors.
        """
        return self.sectors_data.copy()

    def normalize_sector_key(self, raw_sector: str) -> str:
        """Maps sector string, name, or legacy sector string to canonical sector id."""
        norm = str(raw_sector).strip().lower()
        if norm in self.sectors_data:
            return norm
        for sid, sval in self.sectors_data.items():
            if norm == sval.get("name", "").lower():
                return sid
            if sid in norm or norm in sid:
                return sid
        # Legacy mapping fallbacks
        if "semen" in norm or "logam" in norm or "pltu" in norm or "listrik" in norm:
            return "pertambangan"
        if "cpo" in norm or "sawit" in norm:
            return "pertanian"
        if "pulp" in norm or "kertas" in norm:
            return "manufaktur"
        return SUPPORTED_SECTORS[0]
