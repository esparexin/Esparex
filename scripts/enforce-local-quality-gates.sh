#!/usr/bin/env bash
set -euo pipefail

echo "[governance] Running mandatory local quality gates..."

echo "[governance] user-backend lint"
npm --workspace user-backend run lint

echo "[governance] user-backend typecheck"
npm --workspace user-backend run typecheck

echo "[governance] user-backend build"
npm --workspace user-backend run build

echo "[governance] user-frontend lint"
npm --workspace user-frontend run lint

echo "[governance] user-frontend typecheck"
npm --workspace user-frontend run typecheck

echo "[governance] user-frontend build"
npm --workspace user-frontend run build

echo "[governance] Quality gates passed."
