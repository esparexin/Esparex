#!/usr/bin/env bash
set -euo pipefail

echo "[governance] Running mandatory local quality gates..."

echo "[governance] backend/user lint"
npm --workspace backend/user run lint

echo "[governance] backend/user typecheck"
npm --workspace backend/user run typecheck

echo "[governance] backend/user build"
npm --workspace backend/user run build

echo "[governance] apps/web lint"
npm --workspace apps/web run lint

echo "[governance] apps/web typecheck"
npm --workspace apps/web run typecheck

echo "[governance] apps/web build"
npm --workspace apps/web run build

echo "[governance] Quality gates passed."
