#!/usr/bin/env bash
set -euo pipefail

BASE_REF=""

for arg in "$@"; do
  case "$arg" in
    --base=*)
      BASE_REF="${arg#--base=}"
      ;;
  esac
done

resolve_base_ref() {
  if [ -n "$BASE_REF" ]; then
    echo "$BASE_REF"
    return
  fi

  if upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)"; then
    echo "$upstream_ref"
    return
  fi

  if git show-ref --verify --quiet refs/remotes/origin/develop; then
    echo "origin/develop"
    return
  fi

  if git show-ref --verify --quiet refs/remotes/origin/main; then
    echo "origin/main"
    return
  fi

  echo ""
}

TARGET_BASE_REF="$(resolve_base_ref)"

if [ -n "${SKIP_MIGRATION_GATE:-}" ]; then
  echo "[governance] SKIP_MIGRATION_GATE is set; skipping schema migration guard."
  exit 0
fi

if [ -n "$TARGET_BASE_REF" ] && ! git rev-parse --verify --quiet "$TARGET_BASE_REF" >/dev/null; then
  echo "[governance] Base ref '$TARGET_BASE_REF' was not found locally; falling back to HEAD~1."
  TARGET_BASE_REF=""
fi

if [ -n "$TARGET_BASE_REF" ]; then
  CHANGED_FILES="$(git diff --name-only "$TARGET_BASE_REF"...HEAD || true)"
  echo "[governance] Schema migration gate diff base: $TARGET_BASE_REF"
else
  CHANGED_FILES="$(git diff --name-only HEAD~1..HEAD || true)"
  echo "[governance] Schema migration gate diff base: HEAD~1"
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "[governance] No changed files detected for schema migration gate."
  exit 0
fi

SCHEMA_CHANGES="$(echo "$CHANGED_FILES" | grep -E '^backend/src/models/.*\.(ts|js)$' || true)"

if [ -z "$SCHEMA_CHANGES" ]; then
  echo "[governance] No backend model changes detected; migration gate passed."
  exit 0
fi

MIGRATION_EVIDENCE="$(echo "$CHANGED_FILES" | grep -E '^backend/migrations/|^docs/schema-changelog\.md$' || true)"

if [ -n "$MIGRATION_EVIDENCE" ]; then
  echo "[governance] Schema change detected with migration evidence."
  exit 0
fi

echo "❌ Schema migration governance violation."
echo "Changed schema/model files:"
echo "$SCHEMA_CHANGES"
echo ""
echo "Required with backend model changes (pick at least one):"
echo "  1) Add/update a migration under backend/migrations/"
echo "  2) Update docs/schema-changelog.md"
exit 1
