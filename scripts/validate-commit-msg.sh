#!/usr/bin/env bash
set -euo pipefail

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Regex for Conventional Commits with required scope
# Format: type(scope): message
PATTERN="^(feat|fix|chore|refactor|docs|style|test|perf|ci)\(.+\): .+$"

if [[ ! "$COMMIT_MSG" =~ $PATTERN ]]; then
    echo -e "\033[0;31m🚨 INVALID COMMIT MESSAGE FORMAT\033[0m"
    echo "Expected: type(scope): message"
    echo "Example: feat(core): add audit logging service"
    echo ""
    echo "Allowed types: feat, fix, chore, refactor, docs, style, test, perf, ci"
    echo "Scope is MANDATORY (e.g., core, auth, ci, ui)"
    exit 1
fi

# Content validation: Prevent generic messages
SUBJECT=$(echo "$COMMIT_MSG" | cut -d':' -f2 | xargs)
GENERIC_WORDS="update|changes|fix|fixed|modified|patch"

if [[ "$(echo "$SUBJECT" | tr '[:upper:]' '[:lower:]')" =~ ^($GENERIC_WORDS)$ ]]; then
    echo -e "\033[0;31m🚨 COMMIT MESSAGE IS TOO GENERIC\033[0m"
    echo "Message '$SUBJECT' is not descriptive enough."
    echo "Please provide a meaningful summary of the changes."
    exit 1
fi

if [ ${#SUBJECT} -lt 5 ]; then
    echo -e "\033[0;31m🚨 COMMIT MESSAGE IS TOO SHORT\033[0m"
    echo "Minimum 5 characters required for the message part."
    exit 1
fi

exit 0
