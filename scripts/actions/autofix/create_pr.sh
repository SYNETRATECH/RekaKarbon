#!/usr/bin/env bash
set -euo pipefail

export HUSKY=0

RUN_ID="${1:-$GITHUB_RUN_ID}"
TARGET="${2:-all}"
BASE_BRANCH="${3:-${GITHUB_REF_NAME:-main}}"
REPO="${GITHUB_REPOSITORY:-}"

BRANCH_NAME="autofix/security-patches-${RUN_ID}"
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
# Discard any dirty test runtime artifacts from quality gates
git checkout ml/models/ ml/data/ 2>/dev/null || true

# Explicitly stage only dependency manifests, lockfiles, and slither config
for file in package.json pnpm-lock.yaml ml/pyproject.toml ml/poetry.lock blockchain/slither.config.json; do
  if [ -f "$file" ]; then
    git add "$file"
  fi
done

# If no dependency changes are staged, exit gracefully
if git diff --cached --quiet; then
  echo "No dependency or lockfile changes to commit. Skipping PR creation."
  exit 0
fi

git checkout -B "$BRANCH_NAME"
git commit --no-verify -m "fix(security): dynamic automated vulnerability remediation"
git push --force origin "$BRANCH_NAME"

PYTHON_BIN="python3"
if [ -f "ml/.venv/bin/python" ]; then
  PYTHON_BIN="ml/.venv/bin/python"
elif [ -f "ml/.venv/Scripts/python.exe" ]; then
  PYTHON_BIN="ml/.venv/Scripts/python.exe"
fi

BODY=$("$PYTHON_BIN" scripts/actions/security/templates_engine.py --pr --repo "${REPO}" --run-id "${RUN_ID}" --target "${TARGET}")

echo "Creating pull request with base branch: $BASE_BRANCH..."
if PR_URL=$(gh pr create \
  --repo "$REPO" \
  --title "fix(security): automated dependency vulnerability remediation" \
  --body "$BODY" \
  --base "$BASE_BRANCH" \
  --head "$BRANCH_NAME"); then
  echo "Pull Request successfully created: $PR_URL"
else
  echo "gh pr create exited with error. Checking if PR already exists..."
  PR_URL=$(gh pr view "$BRANCH_NAME" --repo "$REPO" --json url --jq .url || true)
  if [ -n "$PR_URL" ]; then
    echo "Found existing Pull Request: $PR_URL"
  else
    echo "Error: Failed to create Pull Request and no existing PR was found."
    exit 1
  fi
fi

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "PR_URL=$PR_URL" >> "$GITHUB_ENV"
fi

PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$' || true)
if [ -z "$PR_NUMBER" ]; then
  PR_NUMBER=$(gh pr view "$BRANCH_NAME" --repo "$REPO" --json number --jq .number 2>/dev/null || true)
fi

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "PR_NUMBER=$PR_NUMBER" >> "$GITHUB_ENV"
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "pr_url=$PR_URL" >> "$GITHUB_OUTPUT"
  echo "pr_number=$PR_NUMBER" >> "$GITHUB_OUTPUT"
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "## 🚀 Auto-Fix Pull Request Created" >> "$GITHUB_STEP_SUMMARY"
  echo "Successfully created Pull Request: [$PR_URL]($PR_URL)" >> "$GITHUB_STEP_SUMMARY"
fi
