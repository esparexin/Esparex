# Audit Status & Repository Health

**Module**: 5 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Current Commit Evaluated**: `08e50eb9` (on `fix/issue-99-post-ad-stabilization`)

> This document records the **current, transient audit state** of the repository. Unlike Principles (`PRINCIPLES.md`) and Standards (`STANDARDS.md`), this file changes whenever an audit is executed or an observation is resolved.

---

## 1. Package Responsibility Audit (Final Validation)

Evaluates whether each package strictly obeys **Single Responsibility** and **Platform Neutrality (`P4`)**, rather than just checking whether dependencies compile or are legal.

| Package | Single Responsibility? | Platform Neutral? | Assessment & Responsibility Notes |
|---|---|---|---|
| **`@esparex/shared`** | `PASS WITH OBSERVATIONS` | `PASS (100% after DF-001 purge)` | **Pure cross-platform contracts and schemas.**<br>• **Defect `DF-001` (`hmacSignature.ts`) [RESOLVED]**: `shared/src/security/hmacSignature.ts` imported Node `crypto` and exported Express middleware with 0 consumers across the monorepo. **Purged as dead code (`commit e04c21a`)**, restoring 100% Platform Neutrality (`P4`) to `@esparex/shared`.<br>• **Decision Pending `DP-001` (`locationPrimitives.ts`)**: Generates canonical location search slugs (`buildLocationSlug`, `normalizeLocationNameForSearch`). If client apps ever format slugs for SEO routes or pre-validation, keeping it in `shared` is responsible. If slug normalization is strictly a server-side ingestion rule, it belongs in `@esparex/core`. Tracked in `R-004`. |
| **`@esparex/core`** | ✅ `PASS` | N/A (Backend-only) | **100% Domain logic & infrastructure configuration.**<br>Contains 466 files across 60+ models and 80+ services. Zero Express controllers, HTTP routes, or delivery handling (`ADR-005`). Evaluated at the package boundary, it maintains single responsibility (`Domain Layer`). Internally, it functions as a multi-domain monolith (`catalog`, `wallet`, `ads`, `location`, `auth`) subject to Phase 6 fitness monitoring (`S5`). |
| **`@esparex/backend-api`** | ✅ `PASS` | N/A (Backend-only) | **100% Delivery & transport concerns.**<br>Express routes, controllers, request validation, authentication middleware, and server bootstrapping. Controllers strictly delegate domain logic to `@esparex/core` services without direct Mongoose model instantiation. |
| **`apps/web`** | ✅ `PASS` | N/A (Browser / Next.js) | **100% End-user web presentation.**<br>Zero imports from `@esparex/core` or `@esparex/backend-api`. Only imports `@esparex/shared` for schemas, API types, and validation contracts. |
| **`apps/admin`** | ✅ `PASS` | N/A (Browser / Vite) | **100% Internal admin & moderation presentation.**<br>Zero imports from `@esparex/core` or `@esparex/backend-api`. Clean presentation boundary. |

---

## 2. Current Audit Ledger (as of 2026-07-13)

| Phase | Audit | Outcome | Last Run | Next Scheduled | Primary Observations & Exceptions |
|---|---|---|---|---|---|
| 1 | **Repository Topology** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | Current topology (`core` and `shared` at root) is the accepted baseline for `v1.0` (`ADR-005`, `ADR-007`) and remains valid until a future restructuring is approved through an ADR. `apps/mobile/` documented as infrastructure wrapper (`EX-001`). |
| 2 | **Dependency Boundary** | `PASS` | 2026-07-13 | On structural change | 0 violations across 2,000 modules and 7,140 dependencies. Automated rules active (`no-frontend-imports-from-core`, `no-shared-imports-from-core`). |
| 3 | **Architecture Justification & Responsibility** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | Domain/delivery split verified with git history and build pipeline (ADR-005). Defect `DF-001` (`hmacSignature.ts`) purged. Decision Pending `DP-001` logged. |
| 4 | **Future-State Review** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | `v2.0` Enterprise Blueprint (`apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, `tooling/`) documented in `ADR-007` as roadmap target for multi-runtime worker scaling (`R-001`). |
| 5 | **Architectural Complexity** | `PASS WITH OBSERVATIONS` | 2026-07-13 | On structural change | Score **9.6/10**. All packages justified. 8 barrel files in `core/services/` verified as active controller aliases. |
| 6 | **Architectural Fitness** | `PASS WITH OBSERVATIONS` | 2026-07-13 | 2027-01 (6 months) | Architecture fit for current scale. `catalog` and `payments` approaching bounded-context thresholds. `backend/worker/` extraction identified as next growth evolution. |
| 7 | **Implementation** | `ONGOING` | Continuous | Per feature/commit | 206 pre-existing `any` / unused variable warnings in `core/` tracked via ESLint. Type-check clean across all 5 workspaces. |
| 8 | **Security** | `FAIL / ACTION REQUIRED` | 2026-07-13 | 2027-01 (6 months) | 47 Dependabot vulnerabilities on default branch (2 critical, 22 high). Tracked in Risk Register `R-005`. Requires dedicated dependency update sprint. |
| 9 | **Performance** | `DEFERRED` | — | When telemetry active | Awaiting production baseline telemetry and P95 latency monitoring. |
| 10 | **Deployment** | `DEFERRED` | — | 2027-07 | Awaiting annual production environment review. |

---

## 3. Active Exceptions, Decisions Pending & Defects Ledger

Separates four distinct governance concepts per `AUDIT_PROCESS.md`:
- **Exception (`EX-NNN`)**: Knowingly violating a standard temporarily with defined justification and expiry.
- **Observation (`OB-NNN`)**: An audit finding to investigate or monitor without blocking builds.
- **Decision Pending (`DP-NNN`)**: The repository state is valid, but ownership must be formally classified.
- **Defect (`DF-NNN`)**: A violation of a standard or principle requiring remediation.

| ID | Type | Standard / Principle | Scope / Description | Justification / Action | Expiry / Review Trigger | Status |
|---|---|---|---|---|---|---|
| **EX-001** | `Exception` | S1 (Package Ownership) | `apps/mobile/` is not a registered npm workspace | Capacitor native shell wrapping `apps/web` via server URL (`https://esparex.in`). No independent TypeScript build pipeline; registering as workspace adds package overhead without tooling value. | Review if `apps/mobile/` adds custom native TypeScript source code | Active (`README.md` documented) |
| **DP-001** | `Decision Pending` | S2/P4 (Platform Neutrality) | `slugify` dependency inside `@esparex/shared` (`locationPrimitives.ts`) | Used for backend location slug normalization (`normalizeLocationNameForSearch`, `buildLocationSlug`). Currently no frontend consumer exists. Repository state is valid, but ownership (`shared` vs `core`) must be classified. | Next dependency cleanup sprint or `locationPrimitives.ts` architectural classification (`R-004`) | Active (`Decision Pending`) |
| **DF-001** | `Defect` | P4 (Platform Neutrality) / S3 | `hmacSignature.ts` inside `@esparex/shared/src/security/` | Imported Node `crypto` (`import crypto from 'crypto'`) and exported Express middleware with 0 consumers. | Purged as dead code (`shared/src/security/hmacSignature.ts` removed and unexported from `index.ts`). | **CLOSED / RESOLVED** (`v1.0` Freeze) |

---

## 4. Summary of Open Architectural Action Items

1. **`locationPrimitives.ts` Classification (`DP-001` / `R-004`)**: Decide whether canonical location search slug normalization represents domain logic (`core`) or a universal string utility (`shared`).
2. **Pre-existing Dependabot Vulnerabilities (`R-005`)**: 47 vulnerabilities on the default branch must be cleared via an `npm audit fix` / package upgrade sprint.
3. **ESLint Technical Debt (`OB-001`)**: 206 warnings (`any` and unused variables) in `@esparex/core/` require incremental cleanup before `eslint` can be elevated to block merges on warnings.
