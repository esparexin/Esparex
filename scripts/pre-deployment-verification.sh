#!/usr/bin/env bash
set -euo pipefail

if [ "${ALLOW_MANUAL_SCRIPT:-}" != "true" ]; then
  echo "Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/pre-deployment-verification.sh"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

run_check() {
  local label="$1"
  shift
  echo ""
  echo "-> ${label}"
  "$@"
}

echo "=== Manual Pre-Deployment Verification ==="
echo "Repo: ${REPO_ROOT}"

run_check "Type checks (all workspaces)" npm run type-check
run_check "Build (all workspaces)" npm run build

if npm run | rg -q "contract:api"; then
  run_check "API contract guard" npm run contract:api
else
  echo ""
  echo "-> API contract guard"
  echo "skip: contract:api script not defined"
fi

echo ""
echo "-> Optional docs snapshot"
for doc in \
  "docs/system-audit/feature-mapping.csv" \
  "docs/system-audit/ADMIN-CONSOLIDATION-PLAN.md"; do
  if [ -f "${doc}" ]; then
    echo "ok: ${doc}"
  else
    echo "warn: missing ${doc}"
  fi
done

echo ""
echo "Manual pre-deployment verification completed."
