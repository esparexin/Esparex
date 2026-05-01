#!/usr/bin/env bash
set -euo pipefail

echo "[governance] Running mandatory local quality gates..."

echo "[governance] user-backend lint"
npm --workspace user-backend run lint

echo "[governance] user-backend typecheck"
npm --workspace user-backend run typecheck

echo "[governance] user-backend build"
npm --workspace user-backend run build

echo "[governance] apps/web lint"
npm --workspace apps/web run lint

echo "[governance] apps/web typecheck"
npm --workspace apps/web run typecheck

echo "[governance] apps/web build"
npm --workspace apps/web run build

echo "[governance] Quality gates passed."
