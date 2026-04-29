#!/bin/bash

# ESPAREX CIRCULAR DEPENDENCY GUARD
# Uses madge to detect circular dependencies and fail the build.

EXIT_CODE=0

echo "🔍 Scanning for circular dependencies..."

# We scan src folders of all backend related packages
OUTPUT=$(npx madge --circular --extensions ts core/src shared/observability user-backend/src admin-backend/src 2>&1)

if echo "$OUTPUT" | grep -q "No circular dependency found"; then
    echo "✅ No circular dependencies detected."
else
    echo "❌ ERROR: Circular dependencies detected!"
    echo "$OUTPUT"
    EXIT_CODE=1
fi

exit $EXIT_CODE
