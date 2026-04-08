#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[hooks] Not inside a git worktree; skipping hook installation."
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="${REPO_ROOT}/.githooks"

if [ ! -d "${HOOKS_DIR}" ]; then
  echo "[hooks] Missing ${HOOKS_DIR}; skipping hook installation."
  exit 0
fi

chmod +x "${HOOKS_DIR}/pre-commit" "${HOOKS_DIR}/pre-push" || true

if git config core.hooksPath .githooks; then
  echo "[hooks] Installed core.hooksPath=.githooks"
else
  echo "[hooks] Failed to set core.hooksPath; continuing without failing install."
fi

