"""
Pure stoichiometric physics calculation and simulation scenario presets for RekaKarbon Studio.
"""

from dataclasses import dataclass
from typing import Any

from rekakarbon_ml.data.benchmark_loader import MARKET_PRICE_RANGES, STOICHIOMETRIC_FACTORS

PRESET_NORMAL = "Laporan Normal (Sesuai Standar)"
PRESET_GREENWASHING = "Anomali: Under-Reporting Ekstrim (Greenwashing)"
PRESET_FICTITIOUS_INVOICE = "Anomali: e-Faktur Solar Fiktif / Harga Tidak Wajar"
PRESET_HIDDEN_CALCINATION = "Anomali: Emisi Proses Kalsinasi Disembunyikan"

PRESET_OPTIONS = [
    PRESET_NORMAL,
    PRESET_GREENWASHING,
    PRESET_FICTITIOUS_INVOICE,
    PRESET_HIDDEN_CALCINATION,
]


@dataclass(frozen=True)
class PresetEmissionsData:
    """Encapsulates pre-calculated emission parameters for audit form defaults."""

    scope1: float
    scope2: float
    scope3: float
    total_reported: float
    historical_emissions: float
    stat_fuel_liters: float
    mob_fuel_liters: float
    coal_kg: float
    gas_m3: float
    clinker_tonnes: float
    production_tonnes: float
    electricity_kwh: float
    cost_solar_idr: float
    cost_coal_idr: float
    cost_gas_idr: float
    cost_pln_idr: float


def calculate_sector_preset(
    sector_info: dict[str, Any],
    preset: str = PRESET_NORMAL,
    production: float = 150000.0,
) -> PresetEmissionsData:
    """Calculates stoichiometric baseline and scenario deviation parameters for a sector."""
    bench_avg = float(sector_info.get("avg_intensity_tco2e_per_ton", 0.28))
    normal_total = production * bench_avg

    shares = sector_info.get(
        "expected_scope_shares", {"scope1": 0.60, "scope2": 0.35, "scope3": 0.05}
    )
    s1_norm = round(normal_total * shares.get("scope1", 0.60), 2)
    s2_norm = round(normal_total * shares.get("scope2", 0.35), 2)
    s3_norm = round(normal_total * shares.get("scope3", 0.05), 2)

    fuel_priors = sector_info.get(
        "fuel_share_priors", {"solar_diesel": 0.5, "coal": 0.2, "natural_gas": 0.3}
    )
    share_solar = fuel_priors.get("solar_diesel", 0.5)
    share_coal = fuel_priors.get("coal", 0.2)
    share_gas = fuel_priors.get("natural_gas", 0.3)

    clinker_norm = 0.0
    s1_combustion = s1_norm
    if sector_info.get("has_process_emissions"):
        proc_factor = sector_info.get("process_emission_factor", 0.20)
        e_proc = s1_norm * proc_factor
        s1_combustion = s1_norm - e_proc
        clinker_norm = round(
            e_proc / STOICHIOMETRIC_FACTORS["cement_clinker_calcination_tco2e_per_ton"], 2
        )

    default_stat = round(
        (s1_combustion * share_solar * 0.8)
        / STOICHIOMETRIC_FACTORS["solar_diesel_tco2e_per_liter"],
        2,
    )
    default_mob = round(
        (s1_combustion * share_solar * 0.2)
        / STOICHIOMETRIC_FACTORS["solar_diesel_tco2e_per_liter"],
        2,
    )
    default_coal = round(
        (s1_combustion * share_coal) / STOICHIOMETRIC_FACTORS["coal_tco2e_per_kg"], 2
    )
    default_gas = round(
        (s1_combustion * share_gas) / STOICHIOMETRIC_FACTORS["natural_gas_tco2e_per_m3"], 2
    )
    default_elec = round(s2_norm / STOICHIOMETRIC_FACTORS["grid_electricity_tco2e_per_kwh"], 2)

    default_cost_solar = round(
        (default_stat + default_mob) * MARKET_PRICE_RANGES["solar_diesel"]["nominal"], 2
    )
    default_cost_coal = round(default_coal * MARKET_PRICE_RANGES["coal"]["nominal"], 2)
    default_cost_gas = round(default_gas * MARKET_PRICE_RANGES["natural_gas"]["nominal"], 2)
    default_cost_pln = round(default_elec * MARKET_PRICE_RANGES["grid_electricity"]["nominal"], 2)

    default_s1 = s1_norm
    default_s2 = s2_norm
    default_s3 = s3_norm
    default_reported = round(default_s1 + default_s2 + default_s3, 2)
    default_hist = default_reported

    if preset == PRESET_GREENWASHING:
        default_s1 = round(s1_norm * 0.25, 2)
        default_reported = round(default_s1 + default_s2 + default_s3, 2)
    elif preset == PRESET_FICTITIOUS_INVOICE:
        default_cost_solar = round((default_stat + default_mob) * 800.0, 2)
    elif preset == PRESET_HIDDEN_CALCINATION:
        clinker_norm = 0.0
        default_reported = round(s1_combustion + default_s2 + default_s3, 2)

    return PresetEmissionsData(
        scope1=default_s1,
        scope2=default_s2,
        scope3=default_s3,
        total_reported=default_reported,
        historical_emissions=default_hist,
        stat_fuel_liters=default_stat,
        mob_fuel_liters=default_mob,
        coal_kg=default_coal,
        gas_m3=default_gas,
        clinker_tonnes=clinker_norm,
        production_tonnes=production,
        electricity_kwh=default_elec,
        cost_solar_idr=default_cost_solar,
        cost_coal_idr=default_cost_coal,
        cost_gas_idr=default_cost_gas,
        cost_pln_idr=default_cost_pln,
    )
