# Architecture Standards

**Module**: 2 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13

> Standards reference specific packages, tools, and file paths. They are **versioned independently** — a standard can be revised without touching Principles. When a Standard conflicts with a Principle, the Principle takes precedence.

---

## Standard S1 — Package Ownership Standard `v1.0`

Every source directory at the monorepo root must be classified as one of:

| Class | Definition | Current examples |
|---|---|---|
| **Registered workspace** | Declared in root `package.json` `workspaces` array | `core/`, `shared/`, `apps/web/`, `apps/admin/`, `backend/api/` |
| **Infrastructure/runtime wrapper** | Explicitly documented in `README.md` | `apps/mobile/` (Capacitor shell) |

No other top-level directories are permitted. Adding one requires an update to this Standard and documentation in `README.md`.

---

## Standard S2 — Import Boundary Standard `v1.1`

| Import direction | Status | Enforcement |
|---|---|---|
| `apps/*` → `@esparex/shared` | ✅ Permitted | Convention |
| `apps/*` → `@esparex/core` | ❌ Forbidden | CI: `no-frontend-imports-from-core` |
| `apps/*` → `@esparex/backend-api` | ❌ Forbidden | Convention |
| `@esparex/shared` → `@esparex/core` | ❌ Forbidden | CI: `no-shared-imports-from-core` |
| `@esparex/core` → `@esparex/shared` | ✅ Permitted | Convention |
| `@esparex/core` → `@esparex/backend-api` | ❌ Forbidden | CI: `no-upstream-core-to-api` |
| `@esparex/backend-api` → `@esparex/core` | ✅ Permitted | Convention |
| `@esparex/backend-api` → `@esparex/shared` | ✅ Permitted | Convention |
| `*` → `@esparex/contracts` | ✅ Permitted | Convention |
| `@esparex/contracts` → `*` | ❌ Forbidden | CI: `contracts-is-independent` |

Any change to this Standard requires updating `.dependency-cruiser.js` and an ADR.

---

## Standard S3 — Package Content Standard `v1.1`

| Package | Permitted content | Prohibited content |
|---|---|---|
| `@esparex/contracts` | Pure type declarations, Zod DTO schemas, enums, API request/response contracts, event payloads, public type aliases | Business logic, service classes, repositories, database models, Mongoose/MongoDB code, any infrastructure dependencies |
| `@esparex/shared` | Pure TypeScript, Web-API-compatible utility functions, frozen legacy schemas (deprecated) | React hooks, Node.js APIs, Mongoose, Express, core business logic |
| `@esparex/core` | Domain services, Mongoose models, queues, workers, infrastructure config | HTTP routes, Express middleware, HTTP request/response types |
| `@esparex/backend-api` | HTTP routes, Express middleware, controllers, input validators | Direct Mongoose queries bypassing core services |
| `apps/*` | UI components, pages, API client hooks, frontend utilities | Backend imports, direct database access, domain business logic |

---

## Standard S4 — ADR Requirement Standard `v1.0`

An ADR is **required** when any of the following conditions apply:

| Condition | Why |
|---|---|
| New npm workspace or package | Changes the monorepo's architectural surface |
| Bounded context extracted from an existing package | Changes ownership and dependency model |
| New deployment unit or runtime process | Changes runtime topology |
| New external infrastructure dependency | Affects operational model |
| Change to an enforced `dependency-cruiser` rule | Modifies the architectural contract |
| Major framework replacement within a package | Affects the entire package surface |

**Rule of thumb**: If the change requires modifying `dependency-cruiser.js`, the root `workspaces` array, or `tsconfig.json` project references, an ADR is required. See [ADR-006](../../decisions/ADR-006-adr-decision-lifecycle.md).

---

## Standard S5 — Architectural Complexity Trigger Standard `v1.0`

Triggers are **composite signals**, not single metrics. File count is one signal among several. A review is triggered when **two or more signals** apply simultaneously, or when a single critical signal is severe.

### Package-Level Triggers

| Signal | Threshold | Weight |
|---|---|---|
| `@esparex/core` total source files | > 600 files | Primary |
| Single domain subdirectory | > 20% of `core` total file count | Primary |
| Single domain subdirectory | > 500 KB source | Primary |
| Recurring merge conflicts in a domain | > 2 per month | Secondary |
| Domain test suite runtime | > 30s independently | Secondary |
| Domain has a natural ownership split | Team assignment changes | Secondary |

**Escalation rule**: One primary signal → schedule review. Two primary signals → review is mandatory before next major feature in that domain.

### Build & Runtime Triggers

| Signal | Threshold | Action |
|---|---|---|
| Full backend build time (`shared + core + api`) | > 60 seconds | Evaluate incremental build tooling |
| API cold start time | > 5 seconds | Evaluate startup optimization |
| Total test suite runtime | > 5 minutes | Evaluate parallelization |
| Render plan upgrade driven by memory/CPU | Any | Evaluate worker extraction |
| HTTP P95 latency correlated with worker job windows | Measurable correlation | Evaluate worker extraction (`backend/worker/`) |

### Deployment Triggers

| Signal | Threshold | Action |
|---|---|---|
| Distinct runtime deployment units | > 3 | Evaluate deployment model review |
| Traffic or data volume difference between services | > 10× | Evaluate independent scaling |

---

## Standard Version History

| Standard | Version | Date | Summary of Change |
|---|---|---|---|
| S1 Package Ownership | v1.0 | 2026-07-13 | Initial — workspace + infrastructure-wrapper classification |
| S2 Import Boundary | v1.1 | 2026-07-18 | Add @esparex/contracts independent leaf boundary rules |
| S3 Package Content | v1.1 | 2026-07-18 | Add @esparex/contracts permitted/prohibited classification |
| S4 ADR Requirement | v1.0 | 2026-07-13 | Initial — 6 conditions requiring an ADR |
| S5 Complexity Trigger | v1.0 | 2026-07-13 | Initial — composite multi-signal triggers |0 | 2026-07-13 | Initial — composite multi-signal triggers replacing single file-count threshold |
