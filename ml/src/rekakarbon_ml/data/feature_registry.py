"""
Feature Registry Specification & Manifest Generator for RekaKarbon ML Engine.
Maintains structured metadata (units, descriptions, formulas) for all derived physical features.
"""

import json
import os
from dataclasses import asdict, dataclass
from typing import Any, Dict, List


@dataclass
class FeatureSpec:
    """Specification metadata for a derived model feature."""

    name: str
    data_type: str
    physical_unit: str
    description: str
    formula: str
    is_one_hot: bool = False


FEATURE_REGISTRY: List[FeatureSpec] = [
    FeatureSpec(
        name="stoichiometric_divergence",
        data_type="float32",
        physical_unit="ratio (dimensionless)",
        description="Relative divergence between physics/fuel-expected emissions and reported emissions",
        formula="|E_expected - E_reported| / (E_expected + eps)",
    ),
    FeatureSpec(
        name="solar_unit_cost_log",
        data_type="float32",
        physical_unit="log(IDR / Liter)",
        description="Log-transformed unit purchasing price of industrial solar diesel fuel",
        formula="log(1 + cost_solar / stat_fuel_liters)",
    ),
    FeatureSpec(
        name="emission_intensity",
        data_type="float32",
        physical_unit="tCO2e / Ton Product",
        description="Raw operational carbon intensity per unit of industrial production",
        formula="reported_emissions_tco2e / production_tonnes",
    ),
    FeatureSpec(
        name="sector_intensity_zscore",
        data_type="float32",
        physical_unit="z-score (std deviations)",
        description="Sector-normalized emission intensity z-score relative to BPS/KLHK benchmark trends",
        formula="(emission_intensity - sector_avg_intensity) / sector_std_intensity",
    ),
    FeatureSpec(
        name="yoy_change_ratio",
        data_type="float32",
        physical_unit="ratio (dimensionless)",
        description="Year-over-year reported emission growth or collapse ratio relative to historical baseline",
        formula="(reported - historical) / historical",
    ),
    FeatureSpec(
        name="energy_spend_per_ton_product",
        data_type="float32",
        physical_unit="IDR / Ton Product",
        description="Total utility and fuel expenditure per ton of finished product",
        formula="(cost_solar + cost_coal + cost_gas + cost_pln) / production_tonnes",
    ),
    FeatureSpec(
        name="spend_ratio",
        data_type="float32",
        physical_unit="tCO2e / Billion IDR",
        description="Ratio of reported carbon emissions to total energy monetary expenditure",
        formula="reported_emissions_tco2e / (total_energy_cost_idr * 1e-9)",
    ),
    FeatureSpec(
        name="process_emission_ratio",
        data_type="float32",
        physical_unit="ratio (dimensionless)",
        description="Proportion of expected emissions originating from chemical process reactions (e.g. calcination)",
        formula="e_process_calcination / e_expected",
    ),
    FeatureSpec(
        name="solar_price_residual_ratio",
        data_type="float32",
        physical_unit="ratio (dimensionless)",
        description="Relative price anomaly of solar diesel compared to official BPH Migas market benchmark",
        formula="|solar_unit_price - nominal_market_price| / nominal_market_price",
    ),
    FeatureSpec(
        name="sector_is_semen",
        data_type="float32",
        physical_unit="binary flag (0 or 1)",
        description="One-hot indicator for Semen & Bahan Bangunan sector",
        formula="1.0 if sector == 'Semen & Bahan Bangunan' else 0.0",
        is_one_hot=True,
    ),
    FeatureSpec(
        name="sector_is_manufaktur",
        data_type="float32",
        physical_unit="binary flag (0 or 1)",
        description="One-hot indicator for Manufaktur Tekstil & Kimia sector",
        formula="1.0 if sector == 'Manufaktur Tekstil & Kimia' else 0.0",
        is_one_hot=True,
    ),
    FeatureSpec(
        name="sector_is_cpo",
        data_type="float32",
        physical_unit="binary flag (0 or 1)",
        description="One-hot indicator for Pengolahan Kelapa Sawit (CPO) sector",
        formula="1.0 if sector == 'Pengolahan Kelapa Sawit (CPO)' else 0.0",
        is_one_hot=True,
    ),
    FeatureSpec(
        name="sector_is_logam",
        data_type="float32",
        physical_unit="binary flag (0 or 1)",
        description="One-hot indicator for Logam & Baja sector",
        formula="1.0 if sector == 'Logam & Baja' else 0.0",
        is_one_hot=True,
    ),
    FeatureSpec(
        name="sector_is_pulp",
        data_type="float32",
        physical_unit="binary flag (0 or 1)",
        description="One-hot indicator for Pulp & Kertas sector",
        formula="1.0 if sector == 'Pulp & Kertas' else 0.0",
        is_one_hot=True,
    ),
    FeatureSpec(
        name="sector_is_pltu",
        data_type="float32",
        physical_unit="binary flag (0 or 1)",
        description="One-hot indicator for Ketenagalistrikan & PLTU sector",
        formula="1.0 if sector == 'Ketenagalistrikan & PLTU' else 0.0",
        is_one_hot=True,
    ),
]


def generate_feature_manifest(
    output_path: str = "data/feature_manifest.json",
) -> Dict[str, Any]:
    """
    Exports a structured JSON manifest detailing all derived feature specifications for client/server transparency.
    """
    manifest: Dict[str, Any] = {
        "version": "1.0.0",
        "total_features": len(FEATURE_REGISTRY),
        "derived_feature_names": [f.name for f in FEATURE_REGISTRY],
        "features": [asdict(f) for f in FEATURE_REGISTRY],
    }

    os.makedirs(os.path.dirname(output_path) or "data", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Generated feature registry manifest -> {output_path}")
    return manifest
