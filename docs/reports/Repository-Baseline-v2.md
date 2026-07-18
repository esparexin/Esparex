# Repository Baseline (Phase 1 - Post-Contracts Migration)

**Date generated:** 2026-07-18  
**Target Architecture:** Esparex Platform v1.0 (Modular Contracts)  
**Status:** COMPLETE (Active Baseline)

---

## 1. Quality & Integrity Metrics

This baseline snapshot was captured immediately following the migration of common enums, schemas, and DTOs into the new `@esparex/contracts` leaf package.

* **TypeScript Compilation Errors:** 0 (across all workspaces and applications)
* **Circular Dependencies:** 0 (verified via Madge)
* **Dead Code / Orphan Files:** 0 (verified via script sweep)
* **Dependency Violations:** 0 errors (348 warnings remaining from the temporary proxy re-export warning rule)

---

## 2. Build & Test Metrics

* **Full Build Duration:** 116.8 seconds (`shared` + `core` + `api` + `admin` + `web`)
* **Total Tests Executed:** 566 tests passing (100% green)
  - `core` package: **246 tests passing** (39 suites)
  - `backend/api` package: **320 tests passing** (64 suites)

---

## 3. Package Architecture & Dependency Graph

```text
apps (web/admin)
       ↓
backend/api
       ↓
     core
    /    \
shared  contracts
    \    /
  (nothing)
```

- `@esparex/contracts` is a leaf package (depends on nothing).
- `@esparex/shared` is deprecated as a contract proxy and serves only as a utility/helper layer.
- Core, backend/api, and apps resolve types exclusively from `@esparex/contracts`.
