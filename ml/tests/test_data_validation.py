"""
Layer 1: Data Validation & Schema Integrity Tests.
Validates Pydantic schema enforcement, physical boundaries, and type safety.
"""

import pytest
from pydantic import ValidationError

from rekakarbon_ml.data.schema import (
    BatchEmissionReportInput,
    EmissionReportInput,
    SupportedSector,
    validate_emission_dict,
)


def test_valid_emission_report_all_sectors() -> None:
    for sector in SupportedSector:
        valid_payload = {
            "sector": sector.value,
            "production_tonnes": 50000.0,
            "reported_emissions_tco2e": 12500.0,
            "historical_emissions_tco2e": 12000.0,
            "stat_fuel_liters": 150000.0,
            "mob_fuel_liters": 25000.0,
            "cost_solar_idr": 150000.0 * 20500.0,
        }
        report = EmissionReportInput.model_validate(valid_payload)
        assert report.sector.value == sector.value
        assert report.production_tonnes == 50000.0
        feature_dict = report.to_feature_dict()
        assert feature_dict["sector"] == sector.value
        assert feature_dict["cost_solar_idr"] == 150000.0 * 20500.0


def test_invalid_sector_raises_validation_error() -> None:
    invalid_payload = {
        "sector": "Invalid / Unknown Industrial Sector",
        "production_tonnes": 10000.0,
        "reported_emissions_tco2e": 2000.0,
    }
    with pytest.raises(ValidationError) as exc:
        EmissionReportInput.model_validate(invalid_payload)
    assert "Input should be" in str(exc.value)


def test_zero_or_negative_production_rejected() -> None:
    with pytest.raises(ValidationError):
        EmissionReportInput.model_validate(
            {
                "sector": SupportedSector.MANUFAKTUR.value,
                "production_tonnes": 0.0,
                "reported_emissions_tco2e": 100.0,
            }
        )

    with pytest.raises(ValidationError):
        EmissionReportInput.model_validate(
            {
                "sector": SupportedSector.MANUFAKTUR.value,
                "production_tonnes": -500.0,
                "reported_emissions_tco2e": 100.0,
            }
        )


def test_negative_emissions_or_costs_rejected() -> None:
    with pytest.raises(ValidationError):
        EmissionReportInput.model_validate(
            {
                "sector": SupportedSector.MANUFAKTUR.value,
                "production_tonnes": 1000.0,
                "reported_emissions_tco2e": -50.0,
            }
        )

    with pytest.raises(ValidationError):
        EmissionReportInput.model_validate(
            {
                "sector": SupportedSector.MANUFAKTUR.value,
                "production_tonnes": 1000.0,
                "reported_emissions_tco2e": 50.0,
                "cost_solar_idr": -1000000.0,
            }
        )


def test_cement_clinker_boundary_validation() -> None:
    invalid_cement = {
        "sector": SupportedSector.SEMEN.value,
        "production_tonnes": 100000.0,
        "reported_emissions_tco2e": 65000.0,
        "clinker_tonnes": 150000.0,
    }
    with pytest.raises(ValidationError) as exc:
        EmissionReportInput.model_validate(invalid_cement)
    assert "clinker_tonnes cannot exceed" in str(exc.value)


def test_validate_emission_dict_helper() -> None:
    valid_data = {
        "sector": "Logam & Baja",
        "production_tonnes": 200000.0,
        "reported_emissions_tco2e": 370000.0,
    }
    is_valid, err, model = validate_emission_dict(valid_data)
    assert is_valid is True
    assert err is None
    assert model is not None
    assert model.historical_emissions_tco2e == 370000.0

    invalid_data = {
        "sector": "Logam & Baja",
        "production_tonnes": -100.0,
        "reported_emissions_tco2e": 370000.0,
    }
    is_valid, err, model = validate_emission_dict(invalid_data)
    assert is_valid is False
    assert err is not None
    assert model is None


def test_batch_emission_report_schema() -> None:
    batch = BatchEmissionReportInput(
        reports=[
            EmissionReportInput.model_validate(
                {
                    "sector": SupportedSector.CPO.value,
                    "production_tonnes": 50000.0,
                    "reported_emissions_tco2e": 9000.0,
                }
            ),
            EmissionReportInput.model_validate(
                {
                    "sector": SupportedSector.PULP.value,
                    "production_tonnes": 80000.0,
                    "reported_emissions_tco2e": 36000.0,
                }
            ),
        ]
    )
    assert len(batch.reports) == 2
