---
id: architecture-governance
owner: architecture
type: governance
version: 1.0
last_updated: 2026-07-13
status: active
review_frequency: semi-annual
---

# Architecture Governance Framework

**Version**: 1.0
**Last Updated**: 2026-07-13
**Review Cadence**: Every 6 months, or after any major structural change

---

## Governance Model

Architecture governance is organized into four distinct layers. These are not the same thing and must not be conflated.

```
Architecture Governance
    ├── Standards       — Rules that define acceptable states
    ├── ADRs            — Records of significant structural decisions
    ├── CI Enforcement  — Automated controls that prevent violations
    └── Audits          — Periodic assessments of compliance with Standards
```

**Standards** define what the architecture must look like.
**ADRs** explain why specific decisions were made.
**CI Enforcement** prevents regressions automatically.
**Audits** verify that the current state complies with Standards and surface drift.

---

## 1. Standards

Standards are the authoritative rules that every architectural decision must satisfy.

### 1.1 Package Ownership Standard

Every source directory at the monorepo root must be one of:

| Type | Definition | Example |
|---|---|---|
| Registered npm workspace | Declared in root `package.json` `workspaces` array | `core/`, `shared/`, `apps/web/`, `apps/admin/`, `backend/api/` |
| Infrastructure/runtime wrapper | Explicitly documented in `README.md` as a non-workspace directory | `apps/mobile/` (Capacitor shell) |

No other top-level directories are permitted without a governance exception.

### 1.2 Import Direction Standard

| Import direction | Permitted |
|---|---|
| `apps/*` → `@esparex/shared` | ✅ |
| `apps/*` → `@esparex/core` | ❌ (enforced by CI) |
| `apps/*` → `@esparex/backend-api` | ❌ |
| `@esparex/shared` → `@esparex/core` | ❌ (enforced by CI) |
| `@esparex/shared` → `@esparex/backend-api` | ❌ |
| `@esparex/core` → `@esparex/shared` | ✅ |
| `@esparex/core` → `@esparex/backend-api` | ❌ (enforced by CI) |
| `@esparex/backend-api` → `@esparex/core` | ✅ |
| `@esparex/backend-api` → `@esparex/shared` | ✅ |

### 1.3 Package Content Standard

| Package | Permitted content | Prohibited content |
|---|---|---|
| `@esparex/shared` | Types, enums, Zod schemas, pure utility functions, constants | React hooks, Node.js-only APIs, Mongoose, Express, business logic |
| `@esparex/core` | Domain services, Mongoose models, queues, workers, jobs, infrastructure config | HTTP routes, Express middleware, request/response types |
| `@esparex/backend-api` | HTTP routes, Express middleware, controllers, validators | Direct Mongoose queries bypassing services (enforced by CI) |
| `apps/*` | UI components, pages, API client functions, hooks | Backend imports, business logic, direct database access |

### 1.4 ADR Requirement Standard

An Architecture Decision Record is required whenever a change meets any of the following criteria:

| Change type | ADR Required |
|---|---|
| New npm workspace / package | ✅ Required |
| New bounded context extracted from an existing package | ✅ Required |
| New deployment unit or runtime process | ✅ Required |
| Addition of a new external infrastructure dependency (database engine, queue system, cache) | ✅ Required |
| Change to an enforced import boundary rule | ✅ Required |
| Major framework replacement (e.g., Express → Fastify, Mongoose → Prisma) | ✅ Required |
| Internal refactor within a single package | ❌ Not required |
| Bug fix | ❌ Not required |
| Feature implementation that follows existing patterns | ❌ Not required |
| Dependency version upgrade without behavior change | ❌ Not required |

When in doubt: if the decision would require changing `dependency-cruiser.js`, the `workspaces` array, or `tsconfig.json` project references, an ADR is required.

### 1.5 Quantitative Complexity Thresholds

The following thresholds trigger a mandatory architectural review (not necessarily a change):

| Metric | Threshold | Action |
|---|---|---|
| `@esparex/core` total source files | > 600 | Evaluate domain extraction |
| Any single domain subdirectory in `core/src/services/` | > 20% of total `core` file count | Evaluate bounded context extraction |
| Any single domain subdirectory in `core/src/services/` | > 500 KB | Evaluate bounded context extraction |
| Full backend build time (`shared + core + backend-api`) | > 60 seconds | Evaluate incremental build tooling (Turborepo/Nx) |
| API cold start time | > 5 seconds | Evaluate startup optimization or service extraction |
| Test suite total runtime | > 5 minutes | Evaluate parallelization or test scoping |
| Number of distinct deployment units | > 3 | Evaluate deployment model review |

These thresholds are measurable at any point and do not require judgment to apply.

---

## 2. ADRs

All Architectural Decision Records live in `.agents/decisions/`.

**Current ADRs**:

| ID | Decision | Date | Status |
|---|---|---|---|
| ADR-001 | Policy Engine Design | 2026-07-12 | Accepted |
| ADR-002 | Knowledge Creation Rule | 2026-07-12 | Accepted |
| ADR-003 | Verification Separation | 2026-07-12 | Accepted |
| ADR-004 | Responsibility Naming | 2026-07-12 | Accepted |
| ADR-005 | Core / Backend-API Package Separation | 2026-07-13 | Accepted |
| ADR-006 | ADR Decision Lifecycle | 2026-07-13 | Accepted |

**ADR Lifecycle**: See [ADR-006](../decisions/ADR-006-adr-decision-lifecycle.md).

---

## 3. CI Enforcement

The following controls are automated and run on every push. A failure blocks merge.

| Control | Tool | Rule enforced |
|---|---|---|
| Import boundary validation | `dependency-cruiser` | All import direction standards from §1.2 |
| No direct model imports in controllers | `dependency-cruiser` | Controllers must use services, not models directly |
| No legacy transport paths | `dependency-cruiser` | Deprecated import paths blocked |
| Circular dependency check | `madge` | No circular imports in `core/` or `backend/api/` |
| Type safety | `tsc --noEmit` | All 5 workspaces must type-check clean |
| Lint | `eslint` | Unused imports, `any` warnings tracked |
| Duplication guard | `jscpd` | Code blocks >10 lines flagged |
| Platform governance | custom script | Forbidden keywords (`legacy`, `compatibility`, `@deprecated`) blocked |
| Unused imports | `eslint-plugin-unused-imports` | Unused imports are errors, not warnings |

---

## 4. Audits

Audits are **periodic assessments** — they answer "is the current state acceptable?" They do not create rules; they verify compliance with existing Standards.

### 4.1 Audit Schedule

| Phase | Audit | Cadence | Last Run |
|---|---|---|---|
| 1 | Repository Topology Audit | Per major structural change | 2026-07-13 |
| 2 | Dependency Boundary Audit | Per major structural change | 2026-07-13 |
| 3 | Architecture Justification Audit | Per major structural change | 2026-07-13 |
| 4 | Future-State Architecture Review | Per major structural change | 2026-07-13 |
| 5 | Architectural Complexity Audit | Per major structural change | 2026-07-13 |
| 6 | Architectural Fitness Audit | Every 6–12 months | 2026-07-13 |
| 7 | Implementation Audit | Per feature / per commit | Ongoing |
| 8 | Security Audit | Every 6 months | Pending |
| 9 | Performance Audit | When runtime telemetry available | Pending |
| 10 | Deployment Audit | Every 12 months | Pending |

### 4.2 Audit Exit Criteria

Every audit must conclude with one of four outcomes:

| Outcome | Definition |
|---|---|
| **PASS** | All checks satisfied. No observations. |
| **PASS WITH OBSERVATIONS** | All critical checks satisfied. Non-blocking findings documented. |
| **FAIL** | One or more critical checks failed. Must be resolved before the next release gate. |
| **BLOCKED** | Audit cannot be completed due to missing evidence, access, or tooling. |

**Current audit outcomes** (2026-07-13):

| Audit | Outcome | Observations |
|---|---|---|
| Repository Topology | PASS WITH OBSERVATIONS | `core/` root placement documented as accepted tradeoff (ADR-005). `apps/mobile` documented as infrastructure wrapper. |
| Dependency Boundary | PASS | 0 violations across 2000 modules, 7140 dependencies. |
| Architecture Justification | PASS WITH OBSERVATIONS | Domain/delivery split intentional and evidenced. No ADR existed pre-audit; ADR-005 created. |
| Future-State Review | PASS WITH OBSERVATIONS | Topology valid for current scale. `slugify`/`locationPrimitives` architectural responsibility unclassified. |
| Complexity Audit | PASS WITH OBSERVATIONS | All package boundaries justified. `locationPrimitives.ts` ownership question open — not a confirmed defect. |
| Fitness Audit | PASS WITH OBSERVATIONS | Architecture fit for current scale. Catalog and payments approaching bounded-context thresholds. Worker extraction is the natural next evolution. |
