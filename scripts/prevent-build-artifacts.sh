#!/usr/bin/env bash
set -euo pipefail

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"
[[ -z "$staged_files" ]] && exit 0

blocked_regex='(^|/)(node_modules|dist|coverage|\.next|playwright-report|test-results)(/|$)|(^|/)\.env(\.|$)|\.log$|(^|/)tsconfig\.tsbuildinfo$'

blocked="$(printf '%s\n' "$staged_files" | grep -E "$blocked_regex" || true)"
if [[ -n "$blocked" ]]; then
  echo "[governance] Blocked generated/sensitive files in staged changes:" >&2
  echo "$blocked" >&2
  echo "[governance] Remove them from the index before committing." >&2
  exit 1
fi
