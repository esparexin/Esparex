# ADR-007: Ownership-Driven Monorepo Topology & 4-Stage Enterprise Roadmap

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`

---

## 1. Context & Architectural Philosophy: Continuous Evolution & Ownership

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose regarding physical directory placement:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located at the repository root alongside deployable end-user applications (`apps/`) and server delivery backends (`backend/`)?"*

While physical folder structure influences developer onboarding clarity, **the true architecture of a monorepo is defined by ownership, responsibility, and deployability boundaries—not folder names**.

| Owner / Archetype | Core Responsibility | Deployable Runtime? | Universal / Platform Neutral? |
|---|---|---|---|
| **`apps/*`** (`web`, `admin`, `mobile`) | End-user presentation & user interface workflows | ✅ **Yes** | ❌ **No** (Browser / Capacitor) |
| **`backend/api`** | HTTP transport, routing, Express middleware, server bootstrapping | ✅ **Yes** | ❌ **No** (Node.js / Render) |
| **`core`** (or future `domains/`) | Pure business rules, domain models, validation, data repositories | ❌ **No** (Library) | ❌ **No** (Backend Node.js library) |
| **`shared`** | Cross-platform contracts, API schemas, shared utilities | ❌ **No** (Library) | ✅ **Yes** (Universal JS/TS) |

Furthermore, **architecture is never "concluded" for a growing platform**. As our product capabilities expand (currently spanning 11 distinct domains: *Listings, Catalog, Payments, Chat, Notifications, Alerts, Business, Analytics, AI, Fraud, Authentication*), our physical topology must continuously evolve from our stable `v1.x` baseline toward an enterprise target structure driven by objective metrics.

This decision record evaluates our **Current Approved Topology** against the **Target Enterprise Blueprint**, establishes internal domain hygiene inside `core/`, and defines a **4-Stage Evolutionary Roadmap** triggered by objective operational milestones.

---

## 2. Decision: The Approved Baseline & Stage 1 Execution

### A. Accepted Baseline Topology (`Stage 1` — Active & Validated)
The current repository topology (`core/` and `shared/` at the repository root) is the **approved baseline** (`ADR-005`, `ADR-007`) and remains stable while engineering focuses on Stage 1 internal domain organization.

```text
esparex/ (Stage 1 Approved Baseline)
├── apps/                          # End-user UI deployables (web, admin, mobile)
├── backend/                       # Server delivery mechanisms (api)
├── core/                          # Reusable business domain library (@esparex/core)
└── shared/                        # Universal contracts & schemas (@esparex/shared)
```

### B. Stage 1 Mandate: Domain-First Internal Organization (`core/`)
While `core/` currently functions as a broad business platform containing 90+ flat service files under `core/services/`, extracting it into 11 separate packages today would introduce premature build overhead. Instead, Stage 1 mandates organizing `core/` internally by strict **Bounded Contexts**:

```text
core/ (Domain-First Bounded Contexts)
├── catalog/                       # Hierarchy, attributes, search rules
├── listings/                      # Ad creation, moderation, repost, lifecycle
├── payments/                      # Wallet, orders, Razorpay integration, boost
├── chat/                          # Real-time threads, moderation, safety
├── alerts/                        # Smart alert mutations, criteria matching
├── business/                      # Business directory profiles & verification
├── users/                         # User profiles, auth rules, status normalization
└── moderation/                    # Fraud detection, automated reporting rules
```

Organizing code inside `core/` by domain folder (rather than layer folder) reduces merge conflicts, improves discoverability, and prepares bounded contexts for future Stage 4 extraction.

### C. Why `shared` is at the Root (and Not Under `backend/`)
- `@esparex/shared` is consumed across both client UI applications (`apps/web`, `apps/admin`) and backend server packages (`core`, `backend/api`).
- Placing `shared/` under `backend/` would violate clean boundaries (`P3`) by forcing client applications to import from a server-delivery directory tree.
- Following our dead-code purge of unused Express middleware (`DF-001` resolved in `commit 9330ba5a`), `@esparex/shared` is 100% platform-neutral (`P4`) and properly positioned as a root universal library.

---

## 3. The 4-Stage Enterprise Topology Roadmap

To avoid multi-step intermediate rewrites (such as `core` → `backend/core` → `packages/domain`), repository restructuring will execute via a structured **4-Stage Evolutionary Roadmap** triggered by objective operational requirements:

```text
esparex/ (Target Enterprise Blueprint — Stages 2, 3, and 4)
├── apps/                          # Deployable UI applications (web, admin, mobile)
├── services/                      # Deployable backend server runtimes (api, worker, scheduler, ai)
├── packages/                      # Reusable cross-cutting libraries (shared, ui, config, sdk)
├── domains/                       # Extracted autonomous business domains (catalog, payments, ads)
├── infrastructure/                # Docker, Kubernetes, Terraform, monitoring
├── tooling/                       # Custom internal CLI scripts & build automation
├── docs/                          # Architecture governance, ADRs, system blueprints
└── .agents/                       # Agentic workflows, skills, governance modules
```

### Stage Summary & Objective Triggers

| Stage | Focus & Action | Objective Trigger Condition |
|---|---|---|
| **Stage 1**<br>*(Active)* | **Internal Core Hygiene**: Keep root stable (`apps/`, `backend/`, `core/`, `shared/`). Refactor flat `core/services/` into domain-first bounded folders (`core/catalog/`, `core/listings/`). | Current engineering baseline (`PASS WITH OBSERVATIONS`). |
| **Stage 2** | **Server Runtime Extraction**: Move `backend/api` → `services/api` (preserving `@esparex/backend-api` package name initially). Add standalone `services/worker`, `services/scheduler`, or `services/ai`. | HTTP API server (`backend/api`) requires standalone background worker extraction (`services/worker`) to protect HTTP P95 latency (`R-001`). |
| **Stage 3** | **Reusable Package Categorization**: Move `shared` → `packages/shared`. Add `packages/ui`, `packages/config`, `packages/sdk`, and `packages/testing`. | Multiple apps require shared UI design tokens/components (`packages/ui`), or public SDK distribution (`packages/sdk`) is initiated. |
| **Stage 4** | **Autonomous Domain Extraction**: Extract bounded contexts from `core/` into `domains/catalog`, `domains/payments`, and `domains/listings`. | Multiple autonomous engineering squads own distinct domain boundaries, requiring independent publishing, versioning, or micro-service deployment. |

---

## 4. Migration Churn Analysis & Prerequisite Gate

### Churn & Risk Classification Matrix
Because all source files in Esparex consistently use workspace package imports (`@esparex/core`, `@esparex/shared`) rather than relative filesystem paths (`../../core/src/...`), source code modifications during Stages 2–4 (`git mv`) are minimal. The primary churn lives in build tooling and repository configuration:

| Area | Risk Level | Rationale & Churn Source |
|---|---|---|
| **Business logic** | 🟢 **Very Low** | Zero domain algorithms, schemas, or service handlers change during directory relocation. |
| **Runtime** | 🟢 **Very Low** | Node, Express, Next.js, and Vite runtimes execute identical compiled JavaScript bundles. |
| **Imports (workspace-based)** | 🟢 **Low** | Because packages are imported by workspace name (`@esparex/shared`), internal import statements remain unchanged. |
| **Tooling & CI** | 🟡 **Medium** | Requires updating `pnpm-workspace.yaml`, `tsconfig.json` project references, `.dependency-cruiser.js` regex boundaries, GitHub Actions workflows, and Dockerfile `COPY` paths. |
| **Documentation** | 🟡 **Medium** | Requires updating `README.md` onboarding paths, developer setup guides, and internal architecture diagrams. |

---

### Repository Modernization Readiness Checklist (Pre-Migration Gate)
Before Stages 2, 3, or 4 can begin, the repository must pass the mandatory **Readiness Checklist**:

- [ ] **No relative imports between workspaces**: All cross-package imports use strict workspace identifiers (`@esparex/core`, `@esparex/shared`). Zero instances of `import ... from '../../core/src/...'`.
- [ ] **All packages imported via workspace names**: Every package definition (`package.json`) uses standard `workspace:*` dependencies.
- [ ] **TypeScript project references (`tsconfig.json`) are clean**: Composite build references execute cleanly via `tsc --build` without path resolution warnings.
- [ ] **CI passes without path assumptions**: Linting, type-checking, and testing tasks run via workspace scripts (`npm run test -w @esparex/core`) rather than hardcoded directory loops.
- [ ] **Deployment scripts don't rely on directory names**: Build and deployment automation (`Dockerfile`, Render scripts) resolve targets from workspace metadata rather than hardcoded root strings.
- [ ] **Build is reproducible from workspace metadata**: Every artifact and bundle builds cleanly in an isolated clean-room environment (`npm ci && npm run build`).

---

## 5. Summary & Strategic Direction

With our governance framework (`v1.0`) complete and our **4-Stage Enterprise Roadmap** established, engineering bandwidth is allocated to three immediate, high-return product and operational priorities:
1. **Stage 1 Domain Hygiene**: Gradually organizing `core/services/` into domain-first folders (`core/catalog/`, `core/listings/`, `core/payments/`) during normal feature development.
2. **Security & Dependency Remediation**: Clearing pre-existing Dependabot vulnerabilities on the default branch (`R-005`).
3. **Product Feature Velocity**: Leveraging our CI enforcement gates (`ENFORCEMENT.md`) to ship reliable customer features while preserving our ownership boundaries.
