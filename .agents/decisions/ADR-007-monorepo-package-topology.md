# ADR-007: Ownership-Driven Monorepo Topology & Timeless Evolutionary Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`
**Related Decisions**: [ADR-005](./ADR-005-package-boundary-enforcement.md), [ADR-008](./ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Context & Immutable Architectural Principles

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose regarding directory placement:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located at the repository root alongside deployable end-user applications (`apps/`) and server delivery backends (`backend/`)?"*

While folder organization influences developer onboarding and repository hygiene, **the true architecture of a monorepo is defined by ownership, responsibility, dependency flow, and deployability boundaries—not directory names**.

To ensure our architecture remains immutable across all future states and directory restructuring without documentation aging, Esparex strictly enforces **Five Immutable Architecture Principles**:

### Principle 1: Deployables Never Own Business Logic
Deployable modules (`apps/*`, `backend/api`, or `services/*`) are strictly delivery engines. They are responsible solely for rendering UIs, routing HTTP requests, parsing payloads, and bootstrapping server infrastructure. They must never contain core business rules, validation algorithms, or direct domain data mutations.

### Principle 2: Business Domains Never Depend on Transport
Domain modules (`@esparex/core` and internal bounded contexts) contain 100% pure business logic. They must be completely ignorant of how they are invoked. They must never import Express, Fastify, Next.js API routers, WebSocket handlers, or CLI transport wrappers.

### Principle 3: Universal Contracts Never Depend on Domains
Universal contract libraries (`@esparex/shared` and future `packages/contracts`) define cross-platform data structures (`DTOs`, `Schemas`, `Types`, `Enums`). They must never import from business domain modules (`@esparex/core`), backend transport modules (`@esparex/backend-api`), or frontend client applications.

### Principle 4: Infrastructure is Replaceable via Ports & Adapters
Infrastructure bindings (`database/`, `redis/`, `docker/`, external vendor SDKs) must depend on abstraction interfaces (`ports/`) defined within domain boundaries or universal configuration schemas (`P5`, `P6`). Infrastructure implementation details (`adapters/`) must never leak into pure domain business logic (`ADR-008`).

### Principle 5: Every Module Has One Owner
Every package, bounded context, and directory must have exactly one documented ownership boundary (`apps/web` → Frontend Web Team; `core/domains/catalog` → Catalog Domain). Shared or unowned code blocks are forbidden.

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
core/ (pure business domain capabilities, ports, adapters, kernel)
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
- **`@esparex/core`**: It is an extracted **domain library**, not merely a folder of HTTP controllers (`ADR-005`). Moving `core/` inside `backend/core/` would falsely imply that domain logic is owned solely by HTTP REST delivery (`backend/api`), violating Principle 1.
- **`@esparex/shared`**: It is consumed across both client UI applications (`apps/web`, `apps/admin`) and backend server packages (`core`, `backend/api`). Placing `shared/` under `backend/` would violate clean boundaries (`P3`). Currently, `@esparex/shared` contains DTOs, schemas, enums, types, constants, and universal utilities (`formatters`, `phoneUtils`). Rather than prematurely renaming `shared/` to `packages/contracts/` while it still contains cross-cutting utilities, `@esparex/shared` remains intact until code naturally splits into specialized `packages/*` (`contracts`, `foundation`, `utils`, `config`).

---

### Target Enterprise Architecture (`Timeless DDD Blueprint`)
```text
esparex/
│
├── apps/                          # Deployable UI applications
│   ├── web/                       # Customer Web (Next.js)
│   ├── admin/                     # Admin Portal (Vite)
│   └── mobile/                    # Capacitor native shell wrapper
│
├── services/                      # Deployable backend server runtimes
│   ├── api/                       # Express HTTP API (`backend/api` migrated here)
│   ├── worker/                    # BullMQ / Background Processing Jobs (`R-001` extraction)
│   ├── scheduler/                 # Cron / Recurring Task Engine
│   └── ai/                        # Dedicated AI Integration Runtime
│
├── core/                          # Hexagonal & Domain-Driven Design (DDD) core (`ADR-008`)
│   ├── domains/                   # Bounded business contexts (`catalog/`, `listings/`, `payments/`)
│   ├── ports/                     # Abstract interfaces (`PaymentGatewayPort`, `StoragePort`, `EmailPort`)
│   ├── adapters/                  # Concrete vendor adapters (`RazorpayAdapter`, `CloudinaryStorageAdapter`)
│   ├── infrastructure/            # Concrete persistence/queues (`persistence/mongo`, `cache/redis`, `messaging/bullmq`)
│   ├── kernel/                    # Shared domain kernel (`primitives/`, `value-objects/`, `policies/`, `errors/`, `ids/`)
│   └── events/                    # Shared domain event definitions & event bus
│
├── packages/                      # Reusable cross-cutting libraries (natural extraction from `shared/`)
│   ├── contracts/                 # Pure DTOs, Schemas, Types, Enums
│   ├── foundation/                # Reusable platform primitives (`Result<T>`, `Either`, `Guard`, `Clock`, `Money`)
│   ├── sdk/                       # Public/Internal API SDK library
│   ├── ui/                        # Shared UI component design system
│   ├── config/                    # Shared configuration bundles
│   ├── utils/                     # Pure cross-platform utilities (`formatters/`, `phoneUtils/`)
│   ├── testing/                   # Shared test harness & mock utilities
│   ├── tooling/                   # Custom build and developer CLI helpers
│   ├── eslint-config/             # Dedicated ESLint rules workspace
│   └── typescript-config/         # Dedicated TypeScript tsconfig bases
│
├── infrastructure/                # Replaceable infrastructure specifications
│   ├── docker/                    # Multi-stage Dockerfiles
│   ├── kubernetes/                # K8s deployment manifests
│   ├── terraform/                 # Infrastructure as Code modules
│   └── monitoring/                # Prometheus/Grafana telemetry
│
├── tooling/                       # Custom internal developer tooling
│   ├── scripts/                   # CI, maintenance, and architecture scorecards (`verify-boundaries.ts`)
│   └── generators/                # Scaffolding and codemod tools
│
├── docs/                          # Architecture governance, ADRs, system blueprints
└── .agents/                       # Agentic workflows, skills, governance modules
```

---

## 4. Graduation Criteria & Migration Strategy

To avoid premature decomposition, structural migrations execute via evidence-driven **Graduation Criteria**:

| Transition Path | Primary Action | Multi-Factor Graduation Criteria |
|---|---|---|
| **Domain Consolidation (`core/services` → `core/domains/*`)** | Consolidate flat service files into `core/domains/*`, `ports/`, `adapters/`, and `infrastructure/` per `ADR-008`. | **Incremental Small PRs**: Executed sprint-by-sprint during normal feature delivery without large one-shot rewrites. |
| **Service Extraction (`backend/api` → `services/api`)** | Move HTTP server delivery to `services/api` and add `services/worker`, `services/scheduler`. | **Multi-Runtime Requirement (`R-001`)**: HTTP P95 latency requires offloading CPU-intensive image/AI jobs to dedicated worker servers (`services/worker`), or standalone cron engines (`services/scheduler`) must deploy independently. |
| **Package Splitting (`shared/` → `packages/*`)** | Naturally extract code from `@esparex/shared` into `packages/contracts`, `packages/foundation`, `packages/utils`, `packages/ui` only when each package has a single, well-defined responsibility. | **Responsibility Narrowing**: Multiple UI applications require unified design tokens (`packages/ui`), or `shared/` requires strict scope locking (`packages/contracts` vs `packages/foundation`) without premature renames. |
| **Autonomous Domain Extraction (`core/domains/<name>` → `domains/<name>`)** | Extract `core/domains/<domain-name>` to a standalone root repository package `domains/<domain-name>`. | **Multi-Squad Autonomy & High Cohesion**: When a bounded context exhibits high internal cohesion, low external coupling, independent squad ownership, high change frequency, and standalone micro-service runtime scaling requirements. Note: The `domains/` root folder is intentionally omitted from the target diagram until an autonomous domain actually graduates (`git mv core/domains/<name> domains/<name>`). |

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

## 6. Summary & Implementation Mandate

With our architecture direction locked and governed (`ADR-001` through `ADR-008`), future structural ADRs are expected only when introducing **new architectural patterns, new deployment models, or new dependency directions**. We transition 100% of engineering bandwidth to **Implementation Governance**:
1. **Incremental Refactoring (`Small PRs`)**: Restructuring `core/` into `domains/`, `ports/`, `adapters/`, and `infrastructure/` sprint-by-sprint alongside product delivery.
2. **Automated Compliance**: Replacing manual documentation checks with CI-enforced architectural fitness scripts (`verify-boundaries.ts`, `verify-public-api.ts`).
3. **High-Return Technical Debt**: Clearing pre-existing security vulnerabilities (`R-005` Dependabot backlog) across our stable, governed codebase.
