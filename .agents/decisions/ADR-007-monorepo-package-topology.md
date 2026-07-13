# ADR-007: Ownership-Driven Monorepo Topology & 5-Stage Enterprise Roadmap

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`

---

## 1. Context & Immutable Architectural Principles

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose regarding directory placement:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located at the repository root alongside deployable end-user applications (`apps/`) and server delivery backends (`backend/`)?"*

While folder organization influences developer onboarding and repository hygiene, **the true architecture of a monorepo is defined by ownership, responsibility, and deployability boundaries—not directory names**.

To ensure our architecture remains immutable across all future evolutionary stages and directory restructuring, Esparex strictly enforces **Five Immutable Architecture Principles**:

### Principle 1: Deployables Never Own Business Logic
Deployable modules (`apps/*`, `backend/api`, or future `services/*`) are strictly delivery engines. They are responsible solely for rendering UIs, routing HTTP requests, parsing payloads, and bootstrapping server infrastructure. They must never contain core business rules, validation algorithms, or direct domain data mutations.

### Principle 2: Business Domains Never Depend on Transport
Domain modules (`@esparex/core` or future `domains/*`) contain 100% pure business logic (`Models`, `Services`, `Policies`, `Events`, `Repositories`). They must be completely ignorant of how they are invoked. They must never import Express, Fastify, Next.js API routers, WebSocket handlers, or CLI transport wrappers.

### Principle 3: Contracts Never Depend on Domains
Universal contract packages (`@esparex/shared` or future `packages/contracts`) define cross-platform data structures (`DTOs`, `Schemas`, `Types`, `Enums`). They must never import from business domain modules (`@esparex/core`), backend transport modules (`@esparex/backend-api`), or frontend client applications.

### Principle 4: Infrastructure is Replaceable
Infrastructure bindings (`database/`, `redis/`, `docker/`, cloud adapters) must depend on abstraction interfaces defined within domain repositories or universal configuration schemas (`P5`, `P6`). Infrastructure implementation details must never leak into domain business logic.

### Principle 5: Every Module Has One Owner
Every package, bounded context, and directory must have exactly one documented ownership boundary (`apps/web` → Frontend Web Team; `core/domains/payments` → Payments Squad). Shared or unowned code blocks are forbidden.

---

## 2. Ownership Archetypes & Current Approved Topology

```text
esparex/ (Stage 1 Approved Baseline)
├── apps/                          # End-user UI deployables (web, admin, mobile)
├── backend/                       # Server delivery mechanisms (api)
├── core/                          # Reusable business domain library (@esparex/core)
└── shared/                        # Universal contracts & schemas (@esparex/shared)
```

| Owner / Archetype | Core Responsibility | Deployable Runtime? | Universal / Platform Neutral? |
|---|---|---|---|
| **`apps/*`** (`web`, `admin`, `mobile`) | End-user presentation & user interface workflows | ✅ **Yes** | ❌ **No** (Browser / Capacitor) |
| **`backend/api`** | HTTP transport, routing, Express middleware, server bootstrapping | ✅ **Yes** | ❌ **No** (Node.js / Render) |
| **`core`** (or future `domains/`) | Pure business rules, domain models, validation, data repositories | ❌ **No** (Library) | ❌ **No** (Backend Node.js library) |
| **`shared`** | Cross-platform contracts, API schemas, shared utilities | ❌ **No** (Library) | ✅ **Yes** (Universal JS/TS) |

### Why Root Placement is Accepted Today (`Stage 1`)
- **`@esparex/core`**: It is an extracted **domain library**, not merely a folder of HTTP controllers (`ADR-005`). Moving `core/` inside `backend/core/` would falsely imply that domain logic is owned solely by HTTP REST delivery (`backend/api`), violating Principle 1.
- **`@esparex/shared`**: It is consumed across both client UI applications (`apps/web`, `apps/admin`) and backend server packages (`core`, `backend/api`). Placing `shared/` under `backend/` would violate clean boundaries (`P3`) by forcing client applications to import from a server-delivery tree. Following our dead-code purge of unused Express middleware (`DF-001` resolved in `commit 9330ba5a`), `@esparex/shared` is 100% platform-neutral (`P4`).

---

## 3. Stage 2 Mandate: Domain Consolidation Inside `core/domains/...`

While `core/` functions as a broad business platform today containing 90+ flat service files under `core/services/`, extracting it into 11 separate packages right now would introduce premature build overhead. Instead, Stage 2 mandates organizing `core/` internally into a **Domain-First Structure under `core/domains/`**:

```text
core/
└── domains/
    ├── catalog/                   # Hierarchy, attributes, search rules
    ├── listings/                  # Ad creation, moderation, repost, lifecycle
    ├── payments/                  # Wallet, orders, Razorpay integration, boost
    ├── users/                     # User profiles, auth rules, status normalization
    ├── chat/                      # Real-time threads, moderation, safety
    ├── alerts/                    # Smart alert mutations, criteria matching
    ├── business/                  # Business directory profiles & verification
    └── moderation/                # Fraud detection, automated reporting rules
```

### Why `core/domains/<name>` instead of `core/<name>`?
Placing bounded contexts inside `core/domains/` ensures that when Stage 5 (Independent Domain Deployment) occurs, the extraction path is 1-to-1 and mechanical:
```text
Mechanical Stage 5 Extraction Path:
core/domains/catalog  ───(git mv)───►  domains/catalog
```

### Bounded-Context Ownership Boundaries
Every bounded context inside `core/domains/*` operates under strict ownership boundaries:

```text
Catalog Domain (`core/domains/catalog`)
├── Owns:
│   ✓ Models (`Category`, `Attribute`)
│   ✓ Services (`CatalogResolutionPolicy`, `SearchGovernanceService`)
│   ✓ Validation (`catalog.validator.ts`)
│   ✓ Policies (`ListingSubmissionPolicy` category checks)
│   ✓ Domain Events (`catalog.updated`, `attribute.created`)
│   ✓ Repositories (`CategoryRepository`)
└── Does NOT Own:
    ✗ HTTP Transport / Express Routes
    ✗ React Components / Hooks
    ✗ Redis Connection Bootstrapping
    ✗ Express Middleware / JWT Decoding
```

---

## 4. The 5-Stage Enterprise Evolutionary Roadmap

To avoid multi-step intermediate rewrites (`core` → `backend/core` → `packages/domain`), repository modernization executes via a structured **5-Stage Enterprise Roadmap** driven by objective business and architectural triggers rather than arbitrary version numbers:

```text
Stage 1: Repository Stabilization (Active Baseline)
   ↓
Stage 2: Domain Consolidation (`core/domains/*` bounded contexts)
   ↓
Stage 3: Service Extraction (`services/*` deployable runtimes)
   ↓
Stage 4: Shared Package Standardization (`packages/contracts`, `packages/ui`)
   ↓
Stage 5: Independent Domain Deployment (`domains/*` autonomous publishing)
```

```text
esparex/ (Target Enterprise Blueprint — Stages 3, 4, and 5)
├── apps/                          # Deployable UI applications
│   ├── web/                       # Customer Web (Next.js)
│   ├── admin/                     # Admin Portal (Vite)
│   └── mobile/                    # Capacitor native shell wrapper
│
├── services/                      # Deployable backend server runtimes
│   ├── api/                       # Express HTTP API (`backend/api` migrated here)
│   ├── worker/                    # BullMQ / Background Processing Jobs (`R-001` extraction)
│   ├── scheduler/                 # Cron / Recurring Task Engine
│   ├── ai/                        # Dedicated AI Integration Runtime
│
├── packages/                      # Reusable cross-cutting libraries
│   ├── contracts/                 # Pure DTOs, Schemas, Types, Enums (`shared/` narrowed & migrated here)
│   ├── ui/                        # Shared UI component design system
│   ├── tooling/                   # Shared build scripts & developer CLI helpers
│   ├── config/                    # Shared ESLint/TypeScript configurations
│   ├── sdk/                       # Public/Internal API SDK library
│   └── testing/                   # Shared test harness & mock utilities
│
├── domains/                       # Extracted autonomous business domains
│   ├── catalog/                   # Extracted from `core/domains/catalog`
│   ├── listings/                  # Extracted from `core/domains/listings`
│   └── payments/                  # Extracted from `core/domains/payments`
│
├── infrastructure/                # Replaceable infrastructure specifications
│   ├── docker/                    # Multi-stage Dockerfiles
│   ├── kubernetes/                # K8s deployment manifests
│   ├── monitoring/                # Prometheus/Grafana telemetry
│   ├── deployment/                # CI/CD CD pipelines
│   ├── database/                  # MongoDB migration & index scripts
│   ├── redis/                     # Redis Cluster configurations
│   └── cloud/                     # AWS/GCP Terraform modules
│
├── docs/                          # Architecture governance, ADRs, system blueprints
└── .agents/                       # Agentic workflows, skills, governance modules
```

### Objective Stage Triggers & Multi-Factor Extraction Metrics
Rather than extracting domains or restructuring directories based on file count alone, migrations between stages are triggered when multi-factor bounded-context metrics indicate necessity:

| Stage Transition | Primary Action | Multi-Factor Trigger Conditions |
|---|---|---|
| **Stage 1 → Stage 2** | Consolidate flat `core/services/` into `core/domains/*`. | Ongoing continuous refactoring during feature sprints (`Domain Consolidation`). |
| **Stage 2 → Stage 3** | Extract `backend/api` → `services/api` and add `services/worker`, `services/scheduler`, `services/ai`. | **Multi-Runtime Requirement (`R-001`)**: HTTP P95 latency requires offloading CPU-intensive image or AI jobs to dedicated worker servers (`services/worker`), or standalone cron engines (`services/scheduler`) must deploy independently. |
| **Stage 3 → Stage 4** | Standardize `shared` into `packages/contracts` (`DTOs, Schemas, Types, Enums — nothing else`) and add `packages/ui`, `packages/config`. | **Contract / UI Growth**: Multiple UI applications require unified design tokens (`packages/ui`), or `shared/` requires strict scope locking (`packages/contracts`) to prevent general utility dumping. |
| **Stage 4 → Stage 5** | Extract `core/domains/<name>` → `domains/<name>` for independent publishing. | **Multi-Squad Autonomy & High Coupling/Frequency**: When a bounded context exhibits high internal cohesion, low external coupling, independent team ownership, high change frequency, and standalone deployment/scaling requirements. |

---

## 5. Migration Churn Analysis & Prerequisite Gate

### Churn & Risk Classification Matrix
Because all source files in Esparex consistently use workspace package imports (`@esparex/core`, `@esparex/shared`) rather than relative filesystem paths (`../../core/src/...`), source code modifications during Stages 3–5 (`git mv`) are minimal. The primary churn lives in build tooling and repository configuration:

| Area | Risk Level | Rationale & Churn Source |
|---|---|---|
| **Business logic** | 🟢 **Very Low** | Zero domain algorithms, schemas, or service handlers change during directory relocation. |
| **Runtime** | 🟢 **Very Low** | Node, Express, Next.js, and Vite runtimes execute identical compiled JavaScript bundles. |
| **Imports (workspace-based)** | 🟢 **Low** | Because packages are imported by workspace name (`@esparex/shared`), internal import statements remain unchanged. |
| **Tooling & CI** | 🟡 **Medium** | Requires updating `pnpm-workspace.yaml`, `tsconfig.json` project references, `.dependency-cruiser.js` regex boundaries, GitHub Actions workflows, and Dockerfile `COPY` paths. |
| **Documentation** | 🟡 **Medium** | Requires updating `README.md` onboarding paths, developer setup guides, and internal architecture diagrams. |

---

### Repository Modernization Readiness Checklist (Pre-Migration Gate)
Before Stages 3, 4, or 5 can begin, the repository must pass the mandatory **Readiness Checklist**:

- [ ] **No relative imports between workspaces**: All cross-package imports use strict workspace identifiers (`@esparex/core`, `@esparex/shared`). Zero instances of `import ... from '../../core/src/...'`.
- [ ] **All packages imported via workspace names**: Every package definition (`package.json`) uses standard `workspace:*` dependencies.
- [ ] **TypeScript project references (`tsconfig.json`) are clean**: Composite build references execute cleanly via `tsc --build` without path resolution warnings.
- [ ] **CI passes without path assumptions**: Linting, type-checking, and testing tasks run via workspace scripts (`npm run test -w @esparex/core`) rather than hardcoded directory loops.
- [ ] **Deployment scripts don't rely on directory names**: Build and deployment automation (`Dockerfile`, Render scripts) resolve targets from workspace metadata rather than hardcoded root strings.
- [ ] **Build is reproducible from workspace metadata**: Every artifact and bundle builds cleanly in an isolated clean-room environment (`npm ci && npm run build`).

---

## 6. Summary & Execution Mandate

With our governance framework (`v1.0`) frozen and our **5-Stage Enterprise Roadmap** published:
1. **Current Baseline (`Stage 1`)**: `apps/`, `backend/api/`, `core/`, and `shared/` (`Status: Approved & Governed`).
2. **Immediate Technical Focus (`Stage 2`)**: Gradually consolidating `core/` into `core/domains/*` (`catalog`, `listings`, `payments`) while shipping core product features and resolving security backlog items (`R-005` Dependabot vulnerabilities).
3. **Future Evolution (`Stages 3–5`)**: Evidence-driven, objective, and mechanical—ready to scale seamlessly whenever telemetry and team growth justify the transition.
