# ADR-013: Post-Migration RCCA (Root Cause & Corrective Action)

* **Status:** Approved
* **Date:** 2026-07-11
* **Deciders:** Platform Architecture Board, Devops Team, Lead Platform Engineer

---

## 1. Context & Problem Statement

Following the extraction of thin controllers and HTTP utilities from `@esparex/core` to `@esparex/backend-api` (commit `14287a20`), local development builds continued to pass, but stateless CI pipelines and clean container setups failed to compile and startup. This ADR documents the forensic investigation, root causes, and corrective actions taken to stabilize the codebase.

---

## 2. Root Cause Analysis (RCCA)

The forensic investigation identified two primary root causes and three visible symptoms:

### 2.1 Primary Root Cause
The migration was validated against an incremental local workspace rather than a clean workspace, allowing stale build artifacts in the git-ignored `core/dist` directory to mask missing package exports and incorrect import paths.

### 2.2 Secondary Root Causes
* **Legacy Imports Remained:** Dependent source files inside `backend/api` continued importing migrated utilities (`errorResponse`, `respond`, etc.) from `@esparex/core/...`.
* **Incomplete Package Exports:** `core/package.json` exports mapping did not declare active shared folders (`events`, `validators`, `lib`, `queues`, `db`, `jobs`).

### 2.3 Visible Symptoms
* **Typecheck Failures (TS2307):** Unresolved modules on clean builds (e.g. `errorResponse`, `respond`).
* **Catalog Route Compilation Failures (TS2339):** Property `getCategories` not found due to stale catalog index bridge.
* **Production Startup Crashes:** Node.js crashing at startup due to missing `./events` package exports.

---

## 3. Corrective Actions

1. **Refactor Gateway Imports:** Update the 23 files in `backend/api/src/` to use relative paths for HTTP utilities.
2. **Expose Core Exports:** Add missing entries to the `"exports"` map in `core/package.json` for verified public subpaths.
3. **Correct Catalog Bridge:** Re-export catalog category controllers from the local path `../admin/catalog`.
4. **Establish CI Clean Validation:** Ensure CI pipelines run compile cycles starting with clean workspaces (deleting `dist` targets).
5. **Codify Standards:** Write a canonical [Repository Architecture Governance Standard](../../docs/governance/REPOSITORY_ARCHITECTURE_GOVERNANCE.md) to serve as the single source of truth for monorepo dependencies.
