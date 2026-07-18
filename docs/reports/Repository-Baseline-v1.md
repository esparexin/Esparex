# Repository Baseline (Phase 0.5)

**Date generated:** 2026-07-18
**Target Architecture:** Esparex Platform v1.0

This baseline snapshot was captured prior to the migration of business logic into isolated domains. It serves as the benchmark to measure technical debt reduction, complexity reduction, and boundary enforcement moving forward.

## 1. Codebase Size & Distribution

* **Total Files on Disk**: 1,950
* **Graph Nodes Mapped**: 1,840
* **Total Module Links**: 28,713

**Distribution by Layer:**
* `apps/web`: 608 files
* `apps/admin`: 248 files
* `apps/mobile`: 4 files
* `backend/api`: 288 files
* `core`: 536 files
* `shared`: 90 files
* `tooling`: 24 files
* `scripts`: 57 files
* `root-configs`: 95 files

## 2. Dependencies & Coupling
* **Circular Dependencies**: 0
* **Dependency Violations**: 0 (Initial guardrails applied successfully)

## 3. Workspaces & Tooling
* **Package boundaries enforced**: Yes (All `apps/`, `services/`, `packages/`, and `packages/domain/` contain isolated `package.json` and `tsconfig.json`)
* **TypeScript Compilation**: `tsc --noEmit` passes successfully across all packages.

## 4. Next Steps
As each domain is extracted from `core` and `backend/api` into its respective `packages/domain/*` boundary, we expect to see:
1. Decrease in `core` and `backend/api` file counts.
2. Complete removal of obsolete/dead code associated with the migrated domain.
3. Zero new dependency violations across bounded contexts.
