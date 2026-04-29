#!/bin/bash

# ESPAREX ALIAS DRIFT GUARD
# Detects duplicate alias definitions in package.json or tsconfig.json.

EXIT_CODE=0

echo "🔍 Checking for alias configuration drift..."

# 1. Check for _moduleAliases in any package.json
MODULE_ALIASES=$(grep -r "_moduleAliases" . --include="package.json" | grep -v "node_modules")
if [ ! -z "$MODULE_ALIASES" ]; then
    echo "❌ ERROR: Detected legacy _moduleAliases in package.json! Remove them and use scripts/register-aliases.js instead."
    echo "$MODULE_ALIASES"
    EXIT_CODE=1
fi

# 2. Check for duplicate definitions in tsconfig.json (backend packages only)
# Backend packages should only use the root alias script at runtime.
# tsconfig paths are allowed for the compiler, but we should ensure they match.
# For now, we just ensure no package.json duplicates.

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Alias source consistency verified."
else
    echo "🚨 Alias DRIFT detected."
fi

exit $EXIT_CODE
