# ADR 001: Single Source of Truth (SSOT)

## Status
Accepted

## Context
Multiple environments and tools (GitHub Actions, Husky, PM2) require execution of the same validation logic. Disparate configurations lead to drift.

## Decision
All validation, linting, and structural governance must reside inside `npm run` scripts. CI/CD and Git Hooks merely invoke these scripts.

## Consequences
- Prevents drift.
- Eases local testing.
- Requires strict adherence to Node.js scripting patterns.
