#!/bin/bash

# ESPAREX MASTER ARCHITECTURAL GUARD
# Runs all hardening audits and fails if any violation is detected.

EXIT_CODE=0

echo "🛡️ Starting Master Architectural Audit..."

# 1. Entry Point Integrity
./scripts/verify-entry-points.sh || EXIT_CODE=1

# 2. Alias Drift
./scripts/check-alias-drift.sh || EXIT_CODE=1

# 3. Import Policy (Source)
./scripts/enforce-import-policy.sh || EXIT_CODE=1

# 4. Circular Dependencies
./scripts/check-circular-deps.sh || EXIT_CODE=1

# 5. DIST Integrity
./scripts/guard-aliases.sh || EXIT_CODE=1

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ ARCHITECTURAL INTEGRITY VERIFIED."
else
    echo "🚨 ARCHITECTURAL AUDIT FAILED."
fi

exit $EXIT_CODE
