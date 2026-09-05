"""
Model Benchmark & Experimentation Suite.
Contains the cross-validation benchmark harness, anomaly metrics, detector candidate
registry, and leaderboard ranked model selection.
"""

from .benchmark import BenchmarkConfig, run_benchmark
from .candidates import (
    CANDIDATE_FACTORIES,
    CandidateInfo,
    DetectorAdapter,
    available_candidates,
    build_candidate,
)
from .leaderboard import build_leaderboard, print_leaderboard, save_leaderboard
from .metrics import compute_metrics, decision_threshold, expected_calibration_error

__all__ = [
    "BenchmarkConfig",
    "run_benchmark",
    "CANDIDATE_FACTORIES",
    "CandidateInfo",
    "DetectorAdapter",
    "available_candidates",
    "build_candidate",
    "build_leaderboard",
    "print_leaderboard",
    "save_leaderboard",
    "compute_metrics",
    "decision_threshold",
    "expected_calibration_error",
]
