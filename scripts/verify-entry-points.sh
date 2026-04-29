#!/bin/bash

# ESPAREX ENTRY POINT INTEGRITY GUARD
# Ensures alias registration is the first line in backend entry files.

EXIT_CODE=0

echo "🔍 Verifying backend entry point integrity..."

ENTRY_FILES=(
    "user-backend/src/index.ts"
    "admin-backend/src/server.ts"
)

EXPECTED_FIRST_LINE="require('../../scripts/register-aliases');"

for file in "${ENTRY_FILES[@]}"; do
    FIRST_LINE=$(head -n 2 "$file" | grep "register-aliases")
    if [ -z "$FIRST_LINE" ]; then
        echo "❌ ERROR: Entry point '$file' is missing alias registration in the first lines!"
        echo "Actual first lines:"
        head -n 5 "$file"
        EXIT_CODE=1
    fi
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Entry point integrity verified."
else
    echo "🚨 Entry point MISCONFIGURATION detected."
fi

exit $EXIT_CODE
