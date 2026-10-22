#!/usr/bin/env bash
set -euo pipefail

CUSTOM_PKGS="${1:-}"

cd ml

echo "Ensuring Python ML virtual environment and audit tools are installed..."
poetry install --no-interaction --no-cache

echo "Checking Python ML dependencies dynamically..."
if [ -n "$CUSTOM_PKGS" ]; then
  CLEAN_CUSTOM=$(echo "$CUSTOM_PKGS" | tr ',' ' ')
  echo "Updating specified packages: $CLEAN_CUSTOM"
  # shellcheck disable=SC2086
  poetry update $CLEAN_CUSTOM
fi

echo "Running pip-audit to dynamically extract any vulnerable distributions..."
poetry run pip-audit --format json --skip-editable > pip-audit-findings.json 2>/dev/null || true
VULN_PKGS=$(python3 ../scripts/actions/autofix/extract_python_vulns.py pip-audit-findings.json)

if [ -n "$VULN_PKGS" ]; then
  echo "Tier 1: Dynamically detected vulnerable Python packages: $VULN_PKGS"
  # shellcheck disable=SC2086
  poetry update $VULN_PKGS

  # Re-audit to verify if any packages remain unpatched due to transitive parent constraints
  echo "Checking if any vulnerabilities persist after Tier 1 update..."
  poetry run pip-audit --format json --skip-editable > pip-audit-findings.json 2>/dev/null || true
  REMAINING_VULNS=$(python3 ../scripts/actions/autofix/extract_python_vulns.py pip-audit-findings.json)

  if [ -n "$REMAINING_VULNS" ]; then
    echo "Vulnerabilities still present after leaf update: $REMAINING_VULNS"
    # shellcheck disable=SC2086
    PARENT_PKGS=$(python3 ../scripts/actions/autofix/extract_python_vulns.py --parents-of $REMAINING_VULNS)
    if [ -n "$PARENT_PKGS" ]; then
      echo "Tier 2: Expanding update to include constraining parent packages: $PARENT_PKGS"
      # shellcheck disable=SC2086
      poetry update $REMAINING_VULNS $PARENT_PKGS
    fi
  fi
else
  echo "No additional vulnerable Python packages detected by dynamic extractor."
fi

rm -f pip-audit-findings.json
echo "Auditing again to verify..."
poetry run pip-audit --skip-editable || true
