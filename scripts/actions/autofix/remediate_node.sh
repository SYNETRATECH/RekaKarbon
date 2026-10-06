#!/usr/bin/env bash
set -euo pipefail

CUSTOM_PKGS="${1:-}"

echo "Checking Node.js dependencies dynamically..."
if [ -n "$CUSTOM_PKGS" ]; then
  CLEAN_CUSTOM=$(echo "$CUSTOM_PKGS" | tr ',' ' ')
  echo "Updating specified Node packages: $CLEAN_CUSTOM"
  pnpm update $CLEAN_CUSTOM --depth 99 || true
fi

echo "Running pnpm audit to dynamically extract vulnerable packages..."
pnpm audit --json --ignore-unfixable > pnpm-audit-findings.json 2>/dev/null || true
NODE_PKGS=$(node scripts/actions/autofix/extract_node_vulns.js pnpm-audit-findings.json)

if [ -n "$NODE_PKGS" ]; then
  echo "Dynamically detected vulnerable Node packages: $NODE_PKGS"
  pnpm update $NODE_PKGS --depth 99 || true
else
  echo "No additional vulnerable Node packages detected by dynamic extractor."
fi

rm -f pnpm-audit-findings.json
pnpm install
pnpm audit --audit-level high --ignore-unfixable || true
