"""
Pydantic Data Schemas and Physical Boundary Validation for Carbon Emissions Reports.
Enforces strict schema constraints, data types, and realistic physical ranges.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator, model_validator


class SupportedSector(str, Enum):
    SEMEN = "Semen & Bahan Bangunan"
    MANUFAKTUR = "Manufaktur & Pengolahan"
    CPO = "Kelapa Sawit & CPO"
    LOGAM = "Logam & Baja"
    PULP = "Pulp & Kertas"
    PLTU = "Ketenagalistrikan & PLTU"


class EmissionReportInput(BaseModel):
    """
    Schema for a single industrial emission report submitted for dMRV auditing.
    """

    sector: SupportedSector = Field(
        ...,
        description="Industrial sector of the reporting company",
    )
    production_tonnes: float = Field(
        ...,
        gt=0.0,
        description="Physical production output volume in metric tonnes (must be > 0)",
    )
    reported_emissions_tco2e: float = Field(
        ...,
        ge=0.0,
        description="Total reported greenhouse gas emissions in metric tonnes of CO2 equivalent",
    )
    historical_emissions_tco2e: Optional[float] = Field(
        None,
        ge=0.0,
        description="Baseline / previous period emissions in tCO2e (defaults to reported if None)",
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
    biomass_tonnes: float = Field(
        default=0.0,
        ge=0.0,
        description="Biomass / biofuel utilization in metric tonnes",
    )
    clinker_tonnes: float = Field(
        default=0.0,
        ge=0.0,
        description="Clinker production in tonnes (required for cement calcination process emissions)",
    )
    cost_solar_idr: float = Field(
        default=0.0,
        ge=0.0,
        description="Total expenditure for industrial solar / diesel fuel in IDR (from e-Faktur)",
    )
    cost_coal_idr: float = Field(
        default=0.0,
        ge=0.0,
        description="Total expenditure for sub-bituminous coal in IDR",
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

    @field_validator("production_tonnes")
    @classmethod
    def validate_production(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("production_tonnes must be strictly greater than 0")
        if v > 100_000_000:
            raise ValueError("production_tonnes exceeds realistic industrial capacity limit")
        return v

    @model_validator(mode="after")
    def validate_cross_field_coherence(self) -> "EmissionReportInput":
        # Default historical emissions if omitted
        if self.historical_emissions_tco2e is None:
            self.historical_emissions_tco2e = self.reported_emissions_tco2e

        # If cement sector reports clinker > production, raise warning/error
        if self.sector == SupportedSector.SEMEN:
            if self.clinker_tonnes > self.production_tonnes * 1.2:
                raise ValueError("clinker_tonnes cannot exceed 120% of finished cement production")

        return self

    def to_feature_dict(self) -> Dict[str, Any]:
        """Converts validated model into a dictionary formatted for feature engineering."""
        return {
            "sector": self.sector.value,
            "production_tonnes": float(self.production_tonnes),
            "reported_emissions_tco2e": float(self.reported_emissions_tco2e),
            "historical_emissions_tco2e": float(
                self.historical_emissions_tco2e
                if self.historical_emissions_tco2e is not None
                else self.reported_emissions_tco2e
            ),
            "stat_fuel_liters": float(self.stat_fuel_liters),
            "mob_fuel_liters": float(self.mob_fuel_liters),
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
