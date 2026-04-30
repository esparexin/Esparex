#!/bin/bash

# Esparex Architecture Guard: No Legacy Paths
# This script ensures that legacy "frontend/" and "backend/" paths are not reintroduced.

EXIT_CODE=0

echo "🔍 Scanning for legacy path references..."

# 1. Check for legacy folders existence
if [ -d "frontend" ]; then
    echo "❌ FAIL: Legacy 'frontend' directory found. Architecture must use 'user-frontend' or 'admin-frontend'."
    EXIT_CODE=1
fi

if [ -d "backend" ]; then
    echo "❌ FAIL: Legacy 'backend' directory found. Architecture must use 'user-backend' or 'admin-backend'."
    EXIT_CODE=1
fi

# 2. Check for legacy path strings in code/config (excluding node_modules, .git, etc.)
# We check for "frontend/" and "backend/" but ignore "user-frontend", "admin-frontend", etc.
LEGACY_PATHS=$(grep -rE "(^|[^a-zA-Z])(frontend/|backend/)" . --exclude-dir={node_modules,.git,.next,scripts,dist,build,.idea,.gradle} --exclude="*.log" --exclude="*.txt" | grep -vE "(user-frontend|admin-frontend|user-backend|admin-backend)")

if [ ! -z "$LEGACY_PATHS" ]; then
    echo "❌ FAIL: Legacy path references found in files:"
    echo "$LEGACY_PATHS"
    EXIT_CODE=1
fi

# 3. Verify workspace folders
REQUIRED_FOLDERS=("user-frontend" "admin-frontend" "user-backend" "admin-backend" "core" "shared")
for FOLDER in "${REQUIRED_FOLDERS[@]}"; do
    if [ ! -d "$FOLDER" ]; then
        echo "❌ FAIL: Required architecture folder '$FOLDER' is missing."
        EXIT_CODE=1
    fi
done

# 4. Repo Hygiene: Ensure temporary folders are not tracked
HYGIENE_FOLDERS=(".next" "build" "test-results" "logs")
for FOLDER in "${HYGIENE_FOLDERS[@]}"; do
    if git ls-files --error-unmatch "$FOLDER" > /dev/null 2>&1; then
        echo "❌ FAIL: Temporary folder '$FOLDER' is being tracked by git. Please remove it from the index."
        EXIT_CODE=1
    fi
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Architecture check passed: No legacy paths found and all required folders present."
else
    echo "🛑 Architecture check failed. Please remove legacy references and ensure correct folder naming."
fi

exit $EXIT_CODE
