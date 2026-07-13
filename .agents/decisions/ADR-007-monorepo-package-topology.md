# ADR-007: Ownership-Driven Monorepo Topology & Target Blueprint Deferral

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`

---

## 1. Context & Architectural Philosophy: Ownership Over Folders

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose regarding physical directory placement:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located at the repository root alongside deployable end-user applications (`apps/`) and server delivery backends (`backend/`)?"*

While physical folder structure influences developer onboarding clarity, **the true architecture of a monorepo is defined by ownership, responsibility, and deployability boundaries—not folder names**.

| Owner / Package | Core Responsibility | Deployable Runtime? | Universal / Platform Neutral? |
|---|---|---|---|
| **`apps/*`** (`web`, `admin`, `mobile`) | End-user presentation & user interface workflows | ✅ **Yes** | ❌ **No** (Browser / Capacitor) |
| **`backend/api`** | HTTP transport, routing, Express middleware, server bootstrapping | ✅ **Yes** | ❌ **No** (Node.js / Render) |
| **`core`** (or future `domain`) | Pure business rules, domain models, validation, Mongoose repositories | ❌ **No** (Library) | ❌ **No** (Backend Node.js library) |
| **`shared`** | Cross-platform contracts, API schemas, shared utilities | ❌ **No** (Library) | ✅ **Yes** (Universal JS/TS) |

As long as these ownership and dependency boundaries remain strictly enforced (`P1`–`P6`), physical folder locations can be reorganized later without violating architectural integrity.

This decision record evaluates our **Current Approved Topology** against the **Candidate Enterprise Blueprint**, explains why root placement is accepted today, forbids multi-step intermediate rewrites, and establishes objective business/technical triggers (rather than version numbers) for any future restructuring.

---

## 2. Decision

### A. Accepted Baseline Topology
The current repository topology (`core/` and `shared/` at the repository root) is the **approved baseline** (`ADR-005`, `ADR-007`) and remains valid until a future restructuring is triggered by objective architectural needs and approved via a new ADR.

```text
esparex/ (Current Approved Baseline)
├── apps/                          # End-user UI deployables (web, admin, mobile)
├── backend/                       # Server delivery mechanisms (api)
├── core/                          # Reusable business domain library (@esparex/core)
└── shared/                        # Universal contracts & schemas (@esparex/shared)
```

### B. Why `core` is at the Root (and Not Under `backend/`)
- `@esparex/core` is an extracted **domain library**, not merely a folder of HTTP controllers (`ADR-005`).
- Moving `core/` inside `backend/core/` would falsely imply that domain logic is owned solely by the HTTP REST delivery mechanism (`backend/api`).
- Keeping `core/` at the root preserves its independence as a **reusable domain package** capable of powering multiple backend runtimes without routing through HTTP delivery (`backend/api`).

### C. Why `shared` is at the Root (and Not Under `backend/`)
- `@esparex/shared` is consumed across both client UI applications (`apps/web`, `apps/admin`) and backend server packages (`core`, `backend/api`).
- Placing `shared/` under `backend/` would violate clean boundaries (`P3`) by forcing client applications to import from a server-delivery directory tree.
- Following our dead-code purge of unused Express middleware (`DF-001` resolved in `commit 9330ba5a`), `@esparex/shared` is 100% platform-neutral (`P4`) and properly positioned as a root universal library.

### D. Single-Stage Modernization Principle (No Two-Step Rewrites)
We explicitly **forbid** intermediate, two-step repository rewrites:

```text
❌ Forbidden Two-Step Sequence:
Current (`core` at root) → `backend/core` → `packages/domain` (Double churn without value)
```

If the codebase is modernized in the future, it must execute via a **single, definitive migration**:

```text
✅ Required Single-Stage Sequence:
Current (`core` / `shared` at root) → `packages/domain` + `packages/shared` + `services/api`
```

---

## 3. Candidate Enterprise Blueprint & Objective Triggers

Rather than tying future restructuring to arbitrary version numbers (`v1.x` vs `v2.0`), the enterprise `packages/` + `services/` layout is documented as our **Candidate Enterprise Blueprint**. It will be considered solely when measurable architectural or organizational triggers occur.

```text
esparex/ (Candidate Enterprise Blueprint - Requires Objective Triggers + ADR)
├── apps/                          # Deployable UI applications
│   ├── web/                       # Customer Web (Next.js)
│   ├── admin/                     # Admin Portal (Vite)
│   └── mobile/                    # Capacitor native shell wrapper
│
├── services/                      # Deployable backend server runtimes
│   ├── api/                       # Express HTTP API (`backend/api` migrated here)
│   ├── worker/                    # BullMQ / Background Processing Jobs (`R-001` extraction)
│   └── scheduler/                 # Cron / Recurring Task Engine
│
├── packages/                      # Reusable libraries
│   ├── domain/                    # Business domain (`core/` migrated here)
│   ├── shared/                    # Cross-platform contracts (`shared/` migrated here)
│   ├── ui/                        # Shared UI component library
│   ├── sdk/                       # API SDK library
│   └── config/                    # Shared ESLint/TS configs
│
├── infrastructure/                # Docker, Kubernetes, Terraform, monitoring
├── docs/                          # Architecture governance, ADRs, system blueprints
└── tooling/                       # Custom internal CLI scripts & build automation
```

### Objective Business & Technical Triggers
Repository modernization (`packages/` + `services/` migration) will be evaluated when **one or more of the following occur**:
1. **Multiple deployable backend runtimes are introduced**: E.g., splitting `backend/api` into a dedicated API server (`services/api`), background processing worker (`services/worker`), and cron scheduler (`services/scheduler`). Grouping these next to `packages/domain` becomes structurally essential (`R-001`).
2. **Independent package publishing becomes necessary**: E.g., publishing `@esparex/sdk` or `@esparex/shared` to an external npm registry or internal enterprise artifact repository.
3. **Multiple engineering teams own different bounded contexts**: E.g., separate squads owning `catalog`, `payments`, and `ads` require independent boundary enforcement and versioning under `packages/domain/*`.
4. **Repository tooling benefits from a `packages/` convention**: Modern monorepo build tools (e.g., Turborepo, Nx, Knip) require or gain significant optimization benefits from a standardized `packages/*` and `services/*` workspace layout.
5. **Build or dependency management complexity exceeds current governance thresholds**: Monorepo dependency management or path alias resolution becomes a bottleneck under the root topology.

---

## 4. Migration Risk Analysis & Prerequisite Gate

### Churn & Risk Classification Matrix
Because all source files in Esparex consistently use workspace package imports (`@esparex/core`, `@esparex/shared`) rather than relative filesystem paths (`../../core/src/...`), source code modifications during directory movement (`git mv`) are minimal. The primary churn lives in build tooling and repository configuration:

| Area | Risk Level | Rationale & Churn Source |
|---|---|---|
| **Business logic** | 🟢 **Very Low** | Zero domain algorithms, schemas, or service handlers change during directory relocation. |
| **Runtime** | 🟢 **Very Low** | Node, Express, Next.js, and Vite runtimes execute identical compiled JavaScript bundles. |
| **Imports (workspace-based)** | 🟢 **Low** | Because packages are imported by workspace name (`@esparex/shared`), internal import statements remain unchanged. |
| **Tooling & CI** | 🟡 **Medium** | Requires updating `pnpm-workspace.yaml`, `tsconfig.json` project references, `.dependency-cruiser.js` regex boundaries, GitHub Actions workflows, and Dockerfile `COPY` paths. |
| **Documentation** | 🟡 **Medium** | Requires updating `README.md` onboarding paths, developer setup guides, and internal architecture diagrams. |

---

### Repository Modernization Readiness Checklist (Pre-Migration Gate)
Before any future move to `packages/` / `services/` can begin, the repository must pass the mandatory **Readiness Checklist**:

- [ ] **No relative imports between workspaces**: All cross-package imports use strict workspace identifiers (`@esparex/core`, `@esparex/shared`). Zero instances of `import ... from '../../core/src/...'`.
- [ ] **All packages imported via workspace names**: Every package definition (`package.json`) uses standard `workspace:*` dependencies.
- [ ] **TypeScript project references (`tsconfig.json`) are clean**: Composite build references execute cleanly via `tsc --build` without path resolution warnings.
- [ ] **CI passes without path assumptions**: Linting, type-checking, and testing tasks run via workspace scripts (`npm run test -w @esparex/core`) rather than hardcoded directory loops.
- [ ] **Deployment scripts don't rely on directory names**: Build and deployment automation (`Dockerfile`, Render scripts) resolve targets from workspace metadata rather than hardcoded root strings.
- [ ] **Build is reproducible from workspace metadata**: Every artifact and bundle builds cleanly in an isolated clean-room environment (`npm ci && npm run build`).

---

## 5. Strategic Focus Summary

With our ownership boundaries (`apps/*`, `backend/api`, `core`, `shared`) strictly verified (`PASS WITH OBSERVATIONS`), **architecture is no longer an engineering bottleneck**. All further architectural expansion is frozen.

Engineering focus now shifts entirely to:
1. **Product feature velocity** (using the governance framework as an automated quality gate).
2. **Bounded-context domain hygiene** (monitoring `Catalog` and `Payments` complexity against `S5` triggers).
3. **Security and dependency remediation** (resolving pre-existing Dependabot vulnerabilities in `R-005`).
4. **Performance and operational excellence** (driven by real production latency telemetry).
