#!/usr/bin/env bash
set -euo pipefail

# List of protected file patterns
PROTECTED_PATTERNS=(
    "core/src/services/"
    "core/src/middleware/"
    "core/src/utils/auth.ts"
)

CHANGED_FILES=$(git diff --cached --name-only)
VIOLATIONS=()

for pattern in "${PROTECTED_PATTERNS[@]}"; do
    while read -r file; do
        if [[ "$file" == *"$pattern"* ]]; then
            VIOLATIONS+=("$file")
        fi
    done <<< "$CHANGED_FILES"
done

if [ ${#VIOLATIONS[@]} -ne 0 ]; then
    echo -e "\033[0;31m🚨 WARNING: You are modifying protected architectural files:\033[0m"
    for file in "${VIOLATIONS[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "These changes require extreme caution as they affect the SSOT layer."
    echo "Are you sure you want to proceed? (y/n)"
    
    # In a pre-commit hook, we might not be in a TTY. 
    # If we are not in a TTY, we block by default for safety or allow if CI.
    if [ -t 0 ]; then
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "Commit aborted by user."
            exit 1
        fi
    else
        echo "Non-interactive environment detected. Blocking protected file modification."
        echo "Please commit these changes manually in an interactive terminal to confirm."
        exit 1
    fi
fi

exit 0
