# ADR-007: Ownership-Driven Monorepo Topology & Timeless Evolutionary Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`
**Related Decisions**: [ADR-005](./ADR-005-package-boundary-enforcement.md), [ADR-008](./ADR-008-domain-architecture-and-bounded-contexts.md), [ADR-009](./ADR-009-integration-strategy.md)

---

## 1. Context & Immutable Architectural Principles

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose regarding directory placement:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located at the repository root alongside deployable end-user applications (`apps/`) and server delivery backends (`backend/`)?"*

While folder organization influences developer onboarding and repository hygiene, **the true architecture of a monorepo is defined by ownership, responsibility, dependency flow, and deployability boundaries—not directory names**.

To ensure our architecture remains immutable across all future states and directory restructuring without documentation aging, Esparex strictly enforces **Six Immutable Architecture Principles**:

### Principle 1: Deployables Never Own Business Logic
Deployable modules (`apps/*`, `backend/api`, or `services/*`) are strictly delivery engines. They are responsible solely for rendering UIs, routing HTTP requests, parsing payloads, and bootstrapping server infrastructure. They must never contain core business rules, validation algorithms, or direct domain data mutations.

### Principle 2: Business Domains Never Depend on Transport
Domain modules (`@esparex/core` and internal bounded contexts) contain 100% pure business logic. They must be completely ignorant of how they are invoked. They must never import Express, Fastify, Next.js API routers, WebSocket handlers, or CLI transport wrappers.

### Principle 3: Universal Contracts Never Depend on Domains
Universal contract libraries (`@esparex/shared` and future `packages/contracts`) define cross-platform data structures (`DTOs`, `Schemas`, `Types`, `Enums`). They must never import from business domain modules (`@esparex/core`), backend transport modules (`@esparex/backend-api`), or frontend client applications.

### Principle 4: Infrastructure is Replaceable via Ports & Adapters
Infrastructure bindings (`database/`, `redis/`, `docker/`, external vendor SDKs) must depend on abstraction interfaces (`ports/`) defined within domain boundaries. Infrastructure implementation details (`adapters/`) must never leak into pure domain business logic (`ADR-008`).

### Principle 5: Every Module Has One Owner
Every package, bounded context, and directory must have exactly one documented ownership boundary (`apps/web` → Frontend Web Team; `core/domains/catalog` → Catalog Domain). Shared or unowned code blocks are forbidden.

### Principle 6: Business Domains Must Never Communicate via Direct Database Access
Bounded contexts are strictly isolated database owners. No domain context (e.g. `listings`) may query database tables or collections owned by another domain context (e.g. `catalog`) directly. Cross-domain data and behavior requests must resolve strictly through Port abstractions, Domain Facades, or Domain Events.

---

## 2. Inward Dependency Flow Architecture

To ensure strict decoupling across all present and future repository topologies, dependency arrows must **always point inward downward**:

```text
apps/* (UI Presentation Layer: web, admin, mobile)
   │
   ▼  (prohibits upward imports from apps into services or core)
services/* (Server Delivery Runtimes: api, worker, scheduler, ai)
   │
   ▼  (prohibits transport leakage into domain rules)
core/ (pure business domain capabilities, ports, adapters, foundation)
   │
   ▼  (prohibits domain leakage into universal contracts/foundation)
packages/* / shared/ (Universal cross-platform scope: contracts, foundation, utils, config)
```

### Dependency Rules & Enforcement
1. **Upward imports are strictly prohibited**: A lower layer (e.g., `@esparex/shared` or `core/`) cannot import anything from a higher layer (`services/` or `apps/`). Enforced by CI `dependency-cruiser` rules (`no-frontend-imports-from-core`, `no-shared-imports-from-core`).
2. **Sideways imports are prohibited unless explicitly documented**: Horizontal imports across distinct bounded contexts (`core/domains/<domain-a>` → `core/domains/<domain-b>`) must pass through documented domain event buses or public domain service facades (`ADR-008`). Enforced by `E-006` (zero circular dependencies).
3. **Dependency direction is always inward toward platform-neutral contracts**: Every layer can depend on universal packages (`@esparex/shared` today, `packages/*` in the target architecture), but never vice versa.

---

## 3. Current Architecture vs. Target Enterprise Blueprint

Rather than hardcoding fragile stage numbers, repository evolution transitions smoothly between our **Current Architecture** baseline and our **Target Enterprise Architecture**:

### Current Architecture (`Approved Baseline`)
```text
esparex/
├── apps/                          # End-user UI deployables (web, admin, mobile)
├── backend/                       # Server delivery mechanisms (api)
├── core/                          # Reusable business domain library (@esparex/core)
└── shared/                        # Universal DTOs, schemas, types & utilities (@esparex/shared)
```

### Why Root Placement is Maintained Today
- **`@esparex/core`**: It is an extracted **domain library**, not merely a folder of HTTP controllers (`ADR-005`). Moving `core/` inside `backend/core/` would falsely imply that domain logic is owned solely by HTTP REST delivery (`backend/api`), violating Principle 1. Long-term, as the contents of `@esparex/core` conform fully to our internal DDD architecture, we target renaming this directory to `packages/domain/` or `packages/business/` or `packages/platform/` to reflect its true responsibility as the business core.
- **`@esparex/shared`**: It is consumed across both client UI applications (`apps/web`, `apps/admin`) and backend server packages (`core`, `backend/api`). Placing `shared/` under `backend/` would violate clean boundaries (`P3`). Currently, `@esparex/shared` contains DTOs, schemas, enums, types, constants, and universal utilities (`formatters`, `phoneUtils`). Rather than prematurely renaming `shared/` to `packages/contracts/` while it still contains cross-cutting utilities, `@esparex/shared` remains intact until code naturally splits into specialized `packages/*` (`contracts`, `foundation`, `utils`, `config`).

---

### Target Enterprise Architecture (`Timeless DDD Blueprint`)
```text
apps/
├── web/
├── admin/
└── mobile/

services/
├── api/
├── worker/
├── scheduler/
└── ai/

core/
├── domains/
│   ├── catalog/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── handlers/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── services/
│   │   │   ├── policies/
│   │   │   └── events/
│   │   ├── ports/
│   │   └── validation/
│   ├── listings/
│   ├── payments/
│   ├── users/
│   └── moderation/
├── adapters/
│   ├── inbound/
│   └── outbound/
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── queue/
│   ├── storage/
│   ├── mail/
│   ├── search/
│   └── observability/
├── foundation/
└── events/
    ├── domain/
    └── integration/

packages/
├── contracts/
├── foundation/
├── sdk/
├── ui/
├── config/
├── testing/
└── tooling/

infrastructure/
├── docker/
├── kubernetes/
├── terraform/
└── monitoring/

tooling/
docs/
.agents/
```

Note: The `infrastructure/` quadrants inside `core/` represent capabilities, not technology providers. The architecture does not specify Redis, Mongoose, or Cloudinary in its file structure to ensure it remains durable through future platform migration.

---

## 4. Graduation Criteria & Migration Strategy

To avoid premature decomposition, structural migrations execute via evidence-driven **Graduation Criteria**:

| Transition Path | Primary Action | Multi-Factor Graduation Criteria |
|---|---|---|
| **Domain Consolidation (`core/services` → `core/domains/*`)** | Consolidate flat service files into `core/domains/*`, `adapters/`, and `infrastructure/` per `ADR-008`. | **Incremental Small PRs**: Executed sprint-by-sprint during normal feature delivery without large one-shot rewrites. |
| **Service Extraction (`backend/api` → `services/api`)** | Move HTTP server delivery to `services/api` and add `services/worker`, `services/scheduler`. | **Multi-Runtime Requirement (`R-001`)**: HTTP P95 latency requires offloading CPU-intensive image/AI jobs to dedicated worker servers (`services/worker`), or standalone cron engines (`services/scheduler`) must deploy independently. |
| **Package Splitting (`shared/` → `packages/*`)** | Naturally extract code from `@esparex/shared` into `packages/contracts`, `packages/foundation`, `packages/utils`, `packages/ui` only when each package has a single, well-defined responsibility. | **Responsibility Narrowing**: Multiple UI applications require unified design tokens (`packages/ui`), or `shared/` requires strict scope locking (`packages/contracts` vs `packages/foundation`) without premature renames. |
| **Autonomous Domain Extraction (`core/domains/<name>` → `domains/<name>`)** | Extract `core/domains/<domain-name>` to a standalone root repository package `domains/<domain-name>`. | **Multi-Squad Autonomy & High Cohesion**: When a bounded context exhibits high internal cohesion, low external coupling, independent squad ownership, high change frequency, and standalone micro-service runtime scaling requirements. The `domains/` root folder is intentionally omitted from the target diagram until graduation. |

---

## 5. Repository Modernization Readiness Checklist (Pre-Migration Gate)

Before any structural relocation (`services/`, `packages/*`, or `domains/*`) begins, the repository must pass the mandatory **Readiness Checklist**:

- [ ] **No relative imports between workspaces**: All cross-package imports use strict workspace identifiers (`@esparex/core`, `@esparex/shared`). Zero instances of `import ... from '../../core/src/...'`.
- [ ] **All packages imported via workspace names**: Every package definition (`package.json`) uses standard `workspace:*` dependencies.
- [ ] **TypeScript project references (`tsconfig.json`) are clean**: Composite build references execute cleanly via `tsc --build` without path resolution warnings.
- [ ] **CI passes without path assumptions**: Linting, type-checking, and testing tasks run via workspace scripts (`npm run test -w @esparex/core`) rather than hardcoded directory loops.
- [ ] **Deployment scripts don't rely on directory names**: Build and deployment automation (`Dockerfile`, Render scripts) resolve targets from workspace metadata rather than hardcoded root strings.
- [ ] **Build is reproducible from workspace metadata**: Every artifact and bundle builds cleanly in an isolated clean-room environment (`npm ci && npm run build`).

---

## 6. Summary & Execution Mandate

With our architecture direction locked and governed (`ADR-001` through `ADR-009`), future structural ADRs are expected only when introducing **new architectural patterns, new deployment models, or new dependency directions**. The next expected structural ADR is:
- **ADR-010: Eventing & Messaging Strategy** (defining Domain vs. Integration Events, Saga Orchestration, DLQ, and Event Versioning/Replay).

We transition 100% of engineering bandwidth to **Implementation Governance**:
1. **Incremental Refactoring (`Small PRs`)**: Restructuring `core/` into `domains/`, `adapters/`, `infrastructure/`, and `foundation/` sprint-by-sprint alongside product delivery.
2. **Automated Compliance**: Replacing manual documentation checks with CI-enforced architectural fitness scripts under `tooling/architecture/` (`verify-boundaries.ts`, `verify-public-api.ts`).
3. **High-Return Technical Debt**: Clearing pre-existing security vulnerabilities (`R-005` Dependabot backlog) across our stable, governed codebase.
