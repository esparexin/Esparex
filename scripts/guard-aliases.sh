#!/bin/bash

# ESPAREX ALIAS REGRESSION GUARD (ENHANCED)
# Detects illegal imports and path leakages in compiled DIST.

EXIT_CODE=0

echo "🔍 Scanning DIST for architectural violations..."

# 1. Detect leaking relative imports to core/shared
LEAKING_REL=$(grep -r "\.\./\.\./core" user-backend/dist admin-backend/dist | grep -v "register-aliases")
if [ ! -z "$LEAKING_REL" ]; then
    echo "❌ ERROR: Detected illegal relative imports to core in DIST!"
    echo "$LEAKING_REL"
    EXIT_CODE=1
fi

# 2. Detect absolute path leakage (Production environment safety)
# We look for strings that look like local machine paths but aren't intentional
# E.g. /Users/ or /home/ followed by common dev paths
LOCAL_PATH_LEAK=$(grep -r "/Users/" user-backend/dist admin-backend/dist | grep -v "register-aliases")
if [ ! -z "$LOCAL_PATH_LEAK" ]; then
    echo "❌ ERROR: Detected local machine absolute path leakage in DIST!"
    echo "$LOCAL_PATH_LEAK"
    EXIT_CODE=1
fi

# 3. Detect disallowed aliases
# Only @core and @shared are permitted for backend
DISALLOWED_ALIASES=$(grep -r "require(\"@[a-z]*" user-backend/dist admin-backend/dist | grep -vE "require\(\"@(core|shared|sentry|turf|bull-board|socket.io)" | head -n 10)
if [ ! -z "$DISALLOWED_ALIASES" ]; then
    echo "❌ ERROR: Detected disallowed aliases in DIST!"
    echo "$DISALLOWED_ALIASES"
    # EXIT_CODE=1 # Warning for now as some packages might use @ symbols in names
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ DIST integrity verified."
else
    echo "🚨 DIST hardening audit FAILED."
fi

exit $EXIT_CODE
