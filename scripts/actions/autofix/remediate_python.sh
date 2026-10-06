#!/usr/bin/env bash
set -euo pipefail

CUSTOM_PKGS="${1:-}"

cd ml

echo "Ensuring Python ML virtual environment and audit tools are installed..."
poetry install --no-interaction

echo "Checking Python ML dependencies dynamically..."
if [ -n "$CUSTOM_PKGS" ]; then
  CLEAN_CUSTOM=$(echo "$CUSTOM_PKGS" | tr ',' ' ')
  echo "Updating specified packages: $CLEAN_CUSTOM"
  poetry update $CLEAN_CUSTOM
fi

echo "Running pip-audit to dynamically extract any vulnerable distributions..."
poetry run pip-audit --format json --skip-editable > pip-audit-findings.json 2>/dev/null || true
VULN_PKGS=$(python3 ../scripts/actions/autofix/extract_python_vulns.py pip-audit-findings.json)

if [ -n "$VULN_PKGS" ]; then
  echo "Dynamically detected vulnerable Python packages: $VULN_PKGS"
  poetry update $VULN_PKGS
else
  echo "No additional vulnerable Python packages detected by dynamic extractor."
fi

rm -f pip-audit-findings.json
echo "Auditing again to verify..."
poetry run pip-audit --skip-editable || true
