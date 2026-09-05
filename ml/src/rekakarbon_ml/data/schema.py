"""
Pydantic Data Schemas and Physical Boundary Validation for GHG Carbon Emission Reports.
Enforces strict schema constraints, data types, physical bounds, and scope coherence.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator, model_validator

from .benchmark_loader import DEFAULT_SECTORS_DATA, SectorBenchmarkLoader


class SupportedSector(str, Enum):
    MANUFAKTUR = "manufaktur"
    PERTAMBANGAN = "pertambangan"
    PERBANKAN = "perbankan"
    KONSTRUKSI = "konstruksi"
    PERTANIAN = "pertanian"
    PERHOTELAN = "perhotelan"


class EmissionReportInput(BaseModel):
    """
    Schema for an industrial GHG carbon emission report submitted for dMRV auditing.
    Supports Scope 1 direct, Scope 2 indirect, and fully optional Scope 3 value chain emissions.
    """

    sector: str = Field(
        ...,
        description="Industrial sector identifier (e.g. manufaktur, pertambangan, perbankan)",
    )
    production_tonnes: float = Field(
        ...,
        gt=0.0,
        description="Production output volume in metric tonnes or business scale index (> 0)",
    )
    reported_scope1_tco2e: float = Field(
        default=0.0,
        ge=0.0,
        description="Direct operational GHG emissions (Scope 1) in tCO2e",
    )
    reported_scope2_tco2e: float = Field(
        default=0.0,
        ge=0.0,
        description="Indirect purchased electricity emissions (Scope 2) in tCO2e",
    )
    reported_scope3_tco2e: float = Field(
        default=0.0,
        ge=0.0,
        description="Value chain / portfolio emissions (Scope 3, fully optional) in tCO2e",
    )
    reported_emissions_tco2e: Optional[float] = Field(
        None,
        ge=0.0,
        description="Total reported greenhouse gas emissions in tCO2e (defaults to sum of scopes)",
    )
    historical_emissions_tco2e: Optional[float] = Field(
        None,
        ge=0.0,
        description="Baseline / previous period total emissions in tCO2e",
    )
    stat_fuel_liters: float = Field(
        default=0.0,
        ge=0.0,
        description="Stationary industrial diesel / solar consumption in Liters",
    )
    mob_fuel_liters: float = Field(
        default=0.0,
        ge=0.0,
        description="Mobile fleet diesel consumption in Liters",
    )
    coal_kg: float = Field(
        default=0.0,
        ge=0.0,
        description="Coal consumption in kilograms",
    )
    gas_m3: float = Field(
        default=0.0,
        ge=0.0,
        description="Natural gas consumption in cubic meters",
    )
    electricity_kwh: float = Field(
        default=0.0,
        ge=0.0,
        description="Purchased grid electricity in kWh",
    )
    biomass_tonnes: float = Field(
        default=0.0,
        ge=0.0,
        description="Biomass / biofuel utilization in metric tonnes",
    )
    clinker_tonnes: float = Field(
        default=0.0,
        ge=0.0,
        description="Clinker / process material in tonnes",
    )
    cost_solar_idr: float = Field(
        default=0.0,
        ge=0.0,
        description="Total expenditure for industrial solar / diesel fuel in IDR",
    )
    cost_coal_idr: float = Field(
        default=0.0,
        ge=0.0,
        description="Total expenditure for coal in IDR",
    )
    cost_gas_idr: float = Field(
        default=0.0,
        ge=0.0,
        description="Total expenditure for natural gas in IDR",
    )
    cost_pln_idr: float = Field(
        default=0.0,
        ge=0.0,
        description="Total expenditure for grid electricity (PLN) in IDR",
    )

    @field_validator("sector", mode="before")
    @classmethod
    def validate_sector(cls, v: Any) -> str:
        s_val = str(v).strip().lower()
        for item in SupportedSector:
            if s_val == item.value:
                return item.value
        loader = SectorBenchmarkLoader()
        known = loader.get_sector_emission_factors()
        if s_val in known:
            return s_val
        for sid, sval in known.items():
            if s_val == sval.get("name", "").lower():
                return sid
        legacy_tokens = [
            "manufaktur",
            "tambang",
            "bank",
            "konstruksi",
            "tani",
            "sawit",
            "hotel",
            "semen",
            "baja",
            "pulp",
            "pltu",
        ]
        if any(token in s_val for token in legacy_tokens):
            return loader.normalize_sector_key(s_val)
        raise ValueError(f"Input should be a valid supported sector, got '{v}'")

    @field_validator("production_tonnes")
    @classmethod
    def validate_production(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("production_tonnes must be strictly greater than 0")
        if v > 500_000_000:
            raise ValueError("production_tonnes exceeds realistic industrial capacity limit")
        return v

    @model_validator(mode="after")
    def validate_cross_field_coherence(self) -> "EmissionReportInput":
        if self.clinker_tonnes > self.production_tonnes:
            raise ValueError("clinker_tonnes cannot exceed production_tonnes")

        loader = SectorBenchmarkLoader()
        self.sector = loader.normalize_sector_key(self.sector)

        # If reported_emissions_tco2e is not explicitly provided, sum the scopes
        scope_sum = float(
            self.reported_scope1_tco2e + self.reported_scope2_tco2e + self.reported_scope3_tco2e
        )
        if self.reported_emissions_tco2e is None:
            self.reported_emissions_tco2e = scope_sum
        elif (
            self.reported_scope1_tco2e == 0.0
            and self.reported_scope2_tco2e == 0.0
            and self.reported_emissions_tco2e > 0
        ):
            # Backward compatibility: allocate scopes based on sector priors
            priors = DEFAULT_SECTORS_DATA.get(self.sector, {}).get(
                "expected_scope_shares", {"scope1": 0.6, "scope2": 0.4, "scope3": 0.0}
            )
            self.reported_scope1_tco2e = round(
                self.reported_emissions_tco2e * priors.get("scope1", 0.6), 2
            )
            self.reported_scope2_tco2e = round(
                self.reported_emissions_tco2e * priors.get("scope2", 0.4), 2
            )
            self.reported_scope3_tco2e = round(
                self.reported_emissions_tco2e * priors.get("scope3", 0.0), 2
            )

        # Default historical emissions if omitted
        if self.historical_emissions_tco2e is None:
            self.historical_emissions_tco2e = self.reported_emissions_tco2e

        return self

    def to_feature_dict(self) -> Dict[str, Any]:
        """Converts validated model into a dictionary formatted for feature engineering."""
        return {
            "sector": self.sector,
            "production_tonnes": float(self.production_tonnes),
            "reported_scope1_tco2e": float(self.reported_scope1_tco2e),
            "reported_scope2_tco2e": float(self.reported_scope2_tco2e),
            "reported_scope3_tco2e": float(self.reported_scope3_tco2e),
            "reported_emissions_tco2e": float(
                self.reported_emissions_tco2e
                if self.reported_emissions_tco2e is not None
                else (
                    self.reported_scope1_tco2e
                    + self.reported_scope2_tco2e
                    + self.reported_scope3_tco2e
                )
            ),
            "historical_emissions_tco2e": float(
                self.historical_emissions_tco2e
                if self.historical_emissions_tco2e is not None
                else (self.reported_emissions_tco2e or 0.0)
            ),
            "stat_fuel_liters": float(self.stat_fuel_liters),
            "mob_fuel_liters": float(self.mob_fuel_liters),
            "coal_kg": float(self.coal_kg),
            "gas_m3": float(self.gas_m3),
            "electricity_kwh": float(self.electricity_kwh),
            "biomass_tonnes": float(self.biomass_tonnes),
            "clinker_tonnes": float(self.clinker_tonnes),
            "cost_solar_idr": float(self.cost_solar_idr),
            "cost_coal_idr": float(self.cost_coal_idr),
            "cost_gas_idr": float(self.cost_gas_idr),
            "cost_pln_idr": float(self.cost_pln_idr),
        }


class BatchEmissionReportInput(BaseModel):
    """Schema for a collection of emission reports."""

    reports: List[EmissionReportInput] = Field(..., min_length=1)


def validate_emission_dict(
    data: Dict[str, Any],
) -> Tuple[bool, Optional[str], Optional[EmissionReportInput]]:
    """
    Safely validates a raw emission dictionary.
    Returns: (is_valid, error_message, validated_model_or_none)
    """
    try:
        validated = EmissionReportInput.model_validate(data)
        return True, None, validated
    except Exception as exc:
        return False, str(exc), None
