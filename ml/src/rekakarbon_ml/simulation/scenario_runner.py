"""
Scenario Simulation and Auditor Report Card CLI for Enterprise Carbon Report Auditing.
Enables developers, auditors, and MLOps engineers to dry-run Company X filings before production deployment.
"""

import argparse
import glob
import json
import os
import sys
from typing import Any, Dict, List, Optional

from ..inference.predictor import CarbonAnomalyPredictor


def format_report_card(
    company_meta: Dict[str, Any],
    audit_res: Dict[str, Any],
) -> str:
    """Renders a structured, human-readable terminal audit report card for Company X."""
    name = company_meta.get("company_name", "Company X")
    comp_id = company_meta.get("company_id", "UNKNOWN-ID")
    sector = company_meta.get("sector", "unknown").upper()
    production = company_meta.get("production_tonnes", 0.0)
    desc = company_meta.get("description", "")

    diag = audit_res.get("scope_diagnostics", {})
    s1_diag = diag.get("scope1", {})
    s2_diag = diag.get("scope2", {})
    s3_diag = diag.get("scope3", {})
    math_diag = diag.get("math_coherence", {})

    priority = audit_res.get("priority", "medium").upper()
    verdict = audit_res.get("verdict", "MANUAL_REVIEW")
    trust_score = audit_res.get("trust_score", 0.0)
    anomaly_prob = audit_res.get("anomaly_probability", 0.0)
    is_anomaly = audit_res.get("is_anomaly", False)
    flags = audit_res.get("flags", [])
    xai = audit_res.get("xai", {})

    lines: List[str] = []
    lines.append("=" * 80)
    lines.append("  REKAKARBON AUDITOR COPILOT - ENTERPRISE AUDIT REPORT CARD")
    lines.append("=" * 80)
    lines.append(f"  Target Enterprise : {name} ({comp_id})")
    lines.append(f"  Industrial Sector : {sector} | Annual Scale: {production:,.1f} Tonnes")
    if desc:
        lines.append(f"  Scenario Context  : {desc}")
    lines.append("-" * 80)

    # 1. Scope Breakdown Table
    lines.append("  [1] GHG SCOPE STOICHIOMETRIC BALANCES:")
    lines.append(
        f"      {'Scope Category':<24} | {'Reported':>14} | {'Expected':>14} | {'Divergence':>12}"
    )
    lines.append("      " + "-" * 70)

    s1_rep = s1_diag.get("reported_tco2e", 0.0)
    s1_exp = s1_diag.get("expected_tco2e", 0.0)
    s1_div = s1_diag.get("divergence_pct", 0.0)
    lines.append(
        f"      {'Scope 1 (Direct)':<24} | {s1_rep:>11,.1f} t | {s1_exp:>11,.1f} t | {s1_div:>11.1f}%"
    )

    s2_rep = s2_diag.get("reported_tco2e", 0.0)
    s2_exp = s2_diag.get("expected_tco2e", 0.0)
    s2_div = s2_diag.get("divergence_pct", 0.0)
    lines.append(
        f"      {'Scope 2 (Grid PLN)':<24} | {s2_rep:>11,.1f} t | {s2_exp:>11,.1f} t | {s2_div:>11.1f}%"
    )

    s3_rep = s3_diag.get("reported_tco2e", 0.0)
    s3_status = "Reported" if s3_diag.get("is_reported", False) else "Omitted (OK)"
    lines.append(
        f"      {'Scope 3 (Value Chain)':<24} | {s3_rep:>11,.1f} t | {'N/A (Optional)':>14} | {s3_status:>12}"
    )

    rep_tot = audit_res.get(
        "reported_emission_tco2e", audit_res.get("reported_emissions_tco2e", 0.0)
    )
    exp_tot = audit_res.get("expected_emission_tco2e", 0.0)
    tot_div = audit_res.get("divergence_percent", 0.0)
    lines.append("      " + "-" * 70)
    lines.append(
        f"      {'GROSS TOTAL':<24} | {rep_tot:>11,.1f} t | {exp_tot:>11,.1f} t | {tot_div:>11.1f}%"
    )
    lines.append("")

    # 2. Scope Math Coherence & Fiscal Checks
    lines.append("  [2] INTEGRITY & FISCAL CROSS-EXAMINATION:")
    is_coherent = math_diag.get("is_coherent", True)
    scope_sum = math_diag.get("sum_of_scopes", rep_tot)
    disc_pct = math_diag.get("discrepancy_pct", 0.0)
    coherent_str = "PASSED (100% Coherent)" if is_coherent else f"FAILED ({disc_pct:.1f}% Tampered)"
    lines.append(f"      * Scope Math Coherence : {coherent_str}")
    if not is_coherent:
        lines.append(
            f"        Sum of Scopes ({scope_sum:,.1f} t) != Declared Total ({rep_tot:,.1f} t)"
        )

    score_djp = audit_res.get("score_djp", 98.5)
    score_bbm = audit_res.get("score_bbm", 98.5)
    lines.append(
        f"      * Fiscal e-Faktur Index: {score_djp:.1f}% | Combustion Stoichiometry: {score_bbm:.1f}%"
    )
    lines.append("")

    # 3. Verificator Action Box
    lines.append("  [3] VERIFICATOR AUDIT DECISION SUPPORT:")
    lines.append("      +-------------------------------------------------------------+")
    lines.append(f"      | Auditor Action Priority : {priority:<15}                       |")
    lines.append(f"      | Verification Verdict    : {verdict:<15}                       |")
    lines.append(
        f"      | Composite Trust Score   : {trust_score:>5.1f}%                              |"
    )
    lines.append(
        f"      | ML Anomaly Probability  : {anomaly_prob * 100.0:>5.1f}%                              |"
    )
    lines.append(f"      | Anomaly Flagged (ML)    : {str(is_anomaly):<15}                       |")
    lines.append("      +-------------------------------------------------------------+")

    if flags:
        lines.append(f"      Active Audit Warnings: {', '.join(flags)}")
    else:
        lines.append("      Active Audit Warnings: None (Standard Verification Clean)")
    lines.append("")

    # 4. Explainable AI Insights
    recs = xai.get("recommendations", [])
    if not recs and xai.get("recommendation"):
        recs = [xai.get("recommendation")]
    if recs:
        lines.append("  [4] EXPLAINABLE AI (XAI) AUDIT RECOMMENDATIONS:")
        for r in recs:
            lines.append(f"      -> {r}")
    lines.append("=" * 80)
    lines.append("")

    return "\n".join(lines)


def run_company_scenario(
    scenario_path: str,
    predictor: Optional[CarbonAnomalyPredictor] = None,
    output_json: bool = False,
) -> Dict[str, Any]:
    """Runs end-to-end evaluation on a single scenario JSON file."""
    if not os.path.exists(scenario_path):
        raise FileNotFoundError(f"Scenario file not found: {scenario_path}")

    with open(scenario_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if predictor is None:
        model_dir = "models"
        predictor = CarbonAnomalyPredictor(
            model_pkl_path=os.path.join(model_dir, "anomaly_pipeline.pkl"),
            onnx_path=os.path.join(model_dir, "anomaly_pipeline.onnx"),
            use_onnx=True,
        )

    # Separate metadata and report input fields
    comp_meta = {
        "company_name": data.get("company_name", os.path.basename(scenario_path)),
        "company_id": data.get("company_id", "COMP-ID-000"),
        "sector": data.get("sector", "manufaktur"),
        "production_tonnes": float(data.get("production_tonnes", 1000.0)),
        "description": data.get("description", ""),
    }

    # Run inference
    audit_res = predictor.predict_single(data, validate=True)

    if output_json:
        combined = dict(comp_meta, audit_result=audit_res)
        print(json.dumps(combined, indent=2))
    else:
        card = format_report_card(comp_meta, audit_res)
        print(card)

    return audit_res


def run_all_scenarios(
    scenarios_dir: str = "data/scenarios",
    predictor: Optional[CarbonAnomalyPredictor] = None,
) -> List[Dict[str, Any]]:
    """Runs evaluation across all scenario JSON fixtures in the specified directory."""
    files = sorted(glob.glob(os.path.join(scenarios_dir, "*.json")))
    if not files:
        # Check relative to repo root or ml folder
        alt_dir = os.path.join("ml", scenarios_dir)
        if os.path.exists(alt_dir):
            files = sorted(glob.glob(os.path.join(alt_dir, "*.json")))

    if not files:
        print(f"No scenario JSON files found in {scenarios_dir} or {alt_dir}")
        return []

    if predictor is None:
        predictor = CarbonAnomalyPredictor(
            model_pkl_path="models/anomaly_pipeline.pkl",
            onnx_path="models/anomaly_pipeline.onnx",
            use_onnx=True,
        )

    results: List[Dict[str, Any]] = []
    print(f"\n[SIMULATION] Running {len(files)} Enterprise Archetype Scenarios...\n")
    for fpath in files:
        res = run_company_scenario(fpath, predictor=predictor, output_json=False)
        results.append(res)

    print(f"[SIMULATION COMPLETE] Successfully audited {len(results)} Company X scenarios.\n")
    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="RekaKarbon ML - Company X Carbon Report Simulation & Auditor CLI"
    )
    parser.add_argument(
        "--scenario",
        type=str,
        help="Path to a single company emission report JSON file",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run audit across all scenario fixtures in data/scenarios/",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable JSON output instead of terminal report card",
    )

    args = parser.parse_args()

    if args.scenario:
        run_company_scenario(args.scenario, output_json=args.json)
    elif args.all or len(sys.argv) == 1:
        run_all_scenarios()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
