# ADR-007: Monorepo Package Topology & Candidate Enterprise Blueprint Deferral

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`

---

## 1. Context & Architectural Question

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located right at the repository root alongside deployable end-user applications (`apps/`) and delivery backends (`backend/`)?"*

While the dependency graph between these modules is verified as 100% inward and valid (`dependency-cruiser` verified 0 violations across 7,140 dependencies), placing libraries at the repository root creates visual and semantic ambiguity: a new engineer inspecting the root directory might assume `core/` and `shared/` are standalone deployable applications rather than supporting packages.

This decision record formally evaluates the current **`v1.x` Approved Baseline Topology** against the **Candidate `v2.0` Enterprise Blueprint** (`apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, `tooling/`) and defines exactly why our current layout is accepted for `v1.x`, what causes churn during any future restructuring, and the mandatory readiness checklist required before a restructuring is permitted.

---

## 2. Decision

### A. Accepted Baseline for Esparex `v1.x`
The current repository topology (`core/` and `shared/` at the repository root) is the **accepted baseline for `v1.0`** (`ADR-005`, `ADR-007`) and remains valid until a future repository restructuring is explicitly evaluated and approved through a new ADR.

```text
esparex/ (Current Approved Baseline - v1.x)
├── apps/                          # End-user UI deployables (web, admin, mobile)
├── backend/                       # Server delivery mechanisms (api)
├── core/                          # Reusable business domain package (@esparex/core)
└── shared/                        # Universal contracts & schemas (@esparex/shared)
```

### B. Why `core` is at the Root (and Not Under `backend/`)
- `@esparex/core` is an intentionally extracted **domain library**, not merely a folder of Express controllers (`ADR-005`).
- Moving `core/` inside `backend/core/` would falsely imply that domain logic is owned and consumed solely by the HTTP REST delivery mechanism (`backend/api`).
- Keeping `core/` at the root preserves its independence as a **platform-neutral domain package** capable of powering multiple distinct backend runtimes right now and in the future (e.g., CLI maintenance scripts, background worker processes, cron schedulers).

### C. Why `shared` is at the Root (and Not Under `backend/`)
- `@esparex/shared` is consumed across both frontend client applications (`apps/web`, `apps/admin`) and backend server packages (`core`, `backend/api`).
- Placing `shared/` under `backend/` would violate clean boundaries (`P3`) by forcing client UI applications to import from a server-delivery directory hierarchy.
- Following the dead-code purge of unused Node `crypto` Express middleware (`DF-001` resolved in `commit 9330ba5a`), `@esparex/shared` is 100% platform-neutral (`P4`) and properly positioned as a root-accessible universal library.

### D. Why the Enterprise Blueprint (`packages/` + `services/`) is Deferred
Adopting an enterprise-scale categorical structure (`apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, `tooling/`) communicates operational intent immediately by separating deployables (`apps/`, `services/`) from libraries (`packages/`). However, executing that restructuring today is **deferred** because:
1. **Organizational vs. Functional Benefit**: Renaming and moving folders (`git mv core packages/domain`) provides cognitive clarity for onboarding developers but yields zero immediate runtime performance, test speed, or business functionality improvements.
2. **Configuration Churn**: Moving paths across a monorepo introduces configuration and CI churn (`pnpm-workspace.yaml`, `tsconfig.json`, `dependency-cruiser.js`, Dockerfile paths, and deployment pipelines).
3. **Engineering Opportunity Cost**: Current engineering cycles are higher-value when directed toward product feature velocity, resolving open technical debt (`R-005` Dependabot vulnerabilities), and bounded-context domain hygiene.

---

## 3. Candidate Future Topology (`v2.0` Candidate — Requires New ADR)

Rather than forcing a fixed future commitment, the enterprise `packages/` + `services/` layout is documented as the **Candidate Enterprise Topology for `v2.0`**. It represents an evidence-driven target that will only be adopted when quantitative architectural triggers justify the migration and a new ADR is approved:

```text
esparex/ (Future Candidate - Requires ADR)
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
├── packages/                      # Reusable libraries
│   ├── domain/                    # Business domain (`core/` migrated here)
│   ├── shared/                    # Cross-platform contracts (`shared/` migrated here)
│   ├── ui/                        # Shared UI component library
│   ├── config/                    # Shared ESLint/TS configs
│   └── testing/                   # Shared test utilities
│
├── infrastructure/                # Docker, Kubernetes, Terraform, monitoring
├── docs/                          # Architecture governance, ADRs, system blueprints
└── tooling/                       # Custom internal CLI scripts & build automation
```

### Quantitative Triggers for Candidate Migration Evaluation
The candidate migration will be formally evaluated when **at least one** of the following conditions is met:
1. **Multiple Backend Runtimes (`R-001`)**: The HTTP API server (`backend/api`) requires standalone background worker extraction (`services/worker`) to protect HTTP P95 latency. At that point, grouping `services/api` and `services/worker` next to `packages/domain` becomes structurally essential.
2. **Team Scaling**: The engineering organization expands to multiple autonomous squads where domain packages (`packages/domain/catalog`, `packages/domain/payments`) must be published or independently versioned across distinct boundaries.
3. **Dedicated Modernization Epoch**: A planned, scheduled technical debt epoch where 100% of engineering bandwidth is allocated to structural refactoring and comprehensive regression verification without competing feature roadmaps.

---

## 4. Migration Risk Analysis & Prerequisite Gate

If a future ADR approves migrating from the `v1.x` Approved Baseline to the `v2.0` Candidate Topology, the migration must strictly separate code churn from build/config churn.

### Churn & Risk Classification Matrix
Because all source files in Esparex consistently use workspace package imports (`@esparex/core`, `@esparex/shared`) rather than relative filesystem paths (`../../core/src/...`), source code modifications during directory movement (`git mv`) are minimal. The primary churn and risk live in build tooling and repository configuration:

| Area | Risk Level | Rationale & Impact |
|---|---|---|
| **Business logic** | 🟢 **Very Low** | Zero domain algorithms, schemas, or service handlers change during directory relocation. |
| **Runtime** | 🟢 **Very Low** | Node, Express, Next.js, and Vite runtimes execute identical compiled JavaScript bundles. |
| **Imports (workspace-based)** | 🟢 **Low** | Because packages are imported by workspace name (`@esparex/shared`), internal import statements remain unchanged. |
| **Tooling & CI** | 🟡 **Medium** | Requires updating `pnpm-workspace.yaml`, `tsconfig.json` project references, `.dependency-cruiser.js` regex boundaries, GitHub Actions workflows, and Dockerfile `COPY` paths. |
| **Documentation** | 🟡 **Medium** | Requires updating `README.md` onboarding paths, developer setup guides, and internal architecture diagrams. |

---

### Repository Modernization Readiness Checklist (Pre-Migration Gate)
Before any future move to `packages/` / `services/` can begin, the repository must pass the mandatory **Readiness Checklist**. If any item fails, the migration is postponed until the prerequisite is satisfied:

- [ ] **No relative imports between workspaces**: All cross-package imports use strict workspace identifiers (`@esparex/core`, `@esparex/shared`). Zero instances of `import ... from '../../core/src/...'`.
- [ ] **All packages imported via workspace names**: Every package definition (`package.json`) uses standard `workspace:*` dependencies.
- [ ] **TypeScript project references (`tsconfig.json`) are clean**: Composite build references execute cleanly via `tsc --build` without path resolution warnings.
- [ ] **CI passes without path assumptions**: Linting, type-checking, and testing tasks run via workspace scripts (`npm run test -w @esparex/core`) rather than hardcoded directory loops.
- [ ] **Deployment scripts don't rely on directory names**: Build and deployment automation (`Dockerfile`, Render scripts) resolve targets from workspace metadata rather than hardcoded root strings.
- [ ] **Build is reproducible from workspace metadata**: Every artifact and bundle builds cleanly in an isolated clean-room environment (`npm ci && npm run build`).

---

## 5. Summary & Strategic Direction

- **For Esparex `v1.x`**: We preserve `apps/`, `backend/api`, `core/`, and `shared/` (`Status: Approved Baseline — Architecturally sound and governed`).
- **For Esparex `v2.x`**: We establish `apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, and `tooling/` (`Status: Future Candidate — Evidence-driven, not roadmap-forced`).
- **Execution Mandate**: Engineering bandwidth remains dedicated to shipping product features, evolving bounded contexts (`Catalog`, `Payments`), and remediating security debt (`R-005` Dependabot upgrades).
