"""
Simulation and Dry-Run Tools for Enterprise Archetype Carbon Scenarios.
"""

from typing import Any


def __getattr__(name: str) -> Any:
    if name in ("run_company_scenario", "run_all_scenarios"):
        from . import scenario_runner

        return getattr(scenario_runner, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["run_company_scenario", "run_all_scenarios"]
