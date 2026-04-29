#!/bin/bash

# ESPAREX IMPORT POLICY ENFORCER
# Prevents relative imports from crossing package boundaries.

EXIT_CODE=0

echo "🔍 Enforcing import policy in src..."

# Patterns that indicate crossing package boundaries from backend packages
# e.g. ../../core, ../../shared
ILLEGAL_PATTERNS=(
    "from '\.\./\.\./core"
    "from \"\.\./\.\./core"
    "require('\.\./\.\./core"
    "require(\"\.\./\.\./core"
    "from '\.\./\.\./shared"
    "from \"\.\./\.\./shared"
    "require('\.\./\.\./shared"
    "require(\"\.\./\.\./shared"
)

for pattern in "${ILLEGAL_PATTERNS[@]}"; do
    MATCHES=$(grep -r "$pattern" user-backend/src admin-backend/src | grep -v "register-aliases")
    if [ ! -z "$MATCHES" ]; then
        echo "❌ ERROR: Detected illegal relative import crossing package boundary!"
        echo "$MATCHES"
        EXIT_CODE=1
    fi
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Import policy enforced successfully."
else
    echo "🚨 Import policy VIOLATION detected."
fi

exit $EXIT_CODE
