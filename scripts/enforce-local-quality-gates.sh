#!/usr/bin/env bash
set -euo pipefail

echo "[governance] Running mandatory local quality gates..."

echo "[governance] backend lint"
npm --workspace backend run lint

echo "[governance] backend typecheck"
npm --workspace backend run typecheck

echo "[governance] backend build"
npm --workspace backend run build

echo "[governance] frontend lint"
npm --workspace frontend run lint

echo "[governance] frontend typecheck"
npm --workspace frontend run typecheck

echo "[governance] frontend build"
npm --workspace frontend run build

echo "[governance] Quality gates passed."
