"""
Central Configuration Module for RekaKarbon ML Engine.
Manages global defaults, environment variable overrides, and reproducibility parameters.
"""

import os

from dotenv import load_dotenv

# Load local .env file automatically
load_dotenv()

# Central Default Random Seed for reproducibility across generation, training, and evaluation
DEFAULT_RANDOM_STATE: int = int(
    os.getenv("RANDOM_STATE") or 20260830
)


def get_random_state(override: int | None = None) -> int:
    """
    Returns the provided random_state override if non-None,
    otherwise falls back to the central DEFAULT_RANDOM_STATE.
    """
    return override if override is not None else DEFAULT_RANDOM_STATE
