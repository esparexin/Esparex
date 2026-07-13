# Audit Status & Repository Health

**Module**: 5 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Current Commit Evaluated**: `6c062ce1` (on `fix/issue-99-post-ad-stabilization`)

> This document records the **current, transient audit state** of the repository. Unlike Principles (`PRINCIPLES.md`) and Standards (`STANDARDS.md`), this file changes whenever an audit is executed or an observation is resolved.

---

## Current Audit Ledger (as of 2026-07-13)

| Phase | Audit | Outcome | Last Run | Next Scheduled | Primary Observations & Exceptions |
|---|---|---|---|---|---|
| 1 | **Repository Topology** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | `core/` root placement documented as accepted tradeoff (ADR-005). `apps/mobile/` documented as infrastructure wrapper (`README.md`). |
| 2 | **Dependency Boundary** | `PASS` | 2026-07-13 | On structural change | 0 violations across 2,000 modules and 7,140 dependencies. Automated rules active (`no-frontend-imports-from-core`, `no-shared-imports-from-core`). |
| 3 | **Architecture Justification** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | Domain/delivery split verified with git history and build pipeline. Formalized in ADR-005. |
| 4 | **Future-State Review** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | Current topology confirmed as optimal greenfield choice. `slugify` dependency in `shared/` noted for classification. |
| 5 | **Architectural Complexity** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | Score **9.6/10**. All packages justified. 8 barrel files in `core/services/` verified as active controller aliases. `locationPrimitives.ts` ownership classification pending. |
| 6 | **Architectural Fitness** | `PASS WITH OBSERVATIONS` | 2026-07-13 | 2027-01 (6 months) | Architecture fit for current scale. `catalog` and `payments` approaching bounded-context thresholds. `backend/worker/` extraction identified as next growth evolution. |
| 7 | **Implementation** | `ONGOING` | Continuous | Per feature/commit | 206 pre-existing `any` / unused variable warnings in `core/` tracked via ESLint. Type-check clean across all 5 workspaces. |
| 8 | **Security** | `FAIL / ACTION REQUIRED` | 2026-07-13 | 2027-01 (6 months) | 47 Dependabot vulnerabilities on default branch (2 critical, 22 high). Tracked in Risk Register `R-005`. Requires dedicated dependency update sprint. |
| 9 | **Performance** | `DEFERRED` | — | When telemetry active | Awaiting production baseline telemetry and P95 latency monitoring. |
| 10 | **Deployment** | `DEFERRED` | — | 2027-07 | Awaiting annual production environment review. |

---

## Active Exceptions Register

Per `AUDIT_PROCESS.md`, any active violation of a Standard must be recorded here with an explicit scope and review trigger/expiry date.

| Exception ID | Standard | Scope / Description | Justification | Expiry / Review Trigger | Status |
|---|---|---|---|---|---|
| **EX-001** | S1 (Package Ownership) | `apps/mobile/` is not a registered npm workspace | Capacitor native shell wrapping `apps/web` via server URL (`https://esparex.in`). No independent TypeScript build pipeline; registering as workspace adds package overhead without tooling value. | Review if `apps/mobile/` adds custom native TypeScript source code | Active (`README.md` documented) |
| **EX-002** | S2/P4 (Platform Neutrality) | `slugify` dependency inside `@esparex/shared` (`locationPrimitives.ts`) | Used for backend location slug normalization (`normalizeLocationNameForSearch`, `buildLocationSlug`). Currently no frontend consumer exists. | Next dependency cleanup sprint or `locationPrimitives.ts` architectural classification (`R-004`) | Active |

---

## Summary of Open Architectural Observations

1. **`locationPrimitives.ts` Classification (`R-004`)**: Must decide whether this is a shared domain utility (`core`) or a universal string helper (`shared`).
2. **Pre-existing Dependabot Vulnerabilities (`R-005`)**: 47 vulnerabilities on the default branch must be cleared via an `npm audit fix` / package upgrade sprint.
3. **ESLint Technical Debt**: 206 warnings (`any` and unused variables) in `@esparex/core/` require incremental cleanup before `eslint` can be elevated to block merges on warnings.
