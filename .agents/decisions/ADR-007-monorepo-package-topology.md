# ADR-007: Monorepo Package Topology & Enterprise Blueprint Deferral

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Platform Owner
**Impacted Modules**: Repository Root, `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`, `apps/*`

---

## 1. Context & Architectural Question

During the completion of the L1–L5 Architecture Governance Framework audits (`Phase 1`–`Phase 11`), a recurring structural question arose:

> *"Why are `@esparex/core` (`core/`) and `@esparex/shared` (`shared/`) located right at the repository root alongside deployable end-user applications (`apps/`) and delivery backends (`backend/`)?"*

While the dependency graph between these modules is verified as 100% inward and valid (`dependency-cruiser` verified 0 violations across 7,140 dependencies), placing libraries at the repository root creates visual and semantic ambiguity: a new engineer inspecting the root directory might assume `core/` and `shared/` are standalone deployable applications rather than supporting packages.

This decision record formally evaluates the current **`v1.x` Baseline Topology** against the **`v2.0` Enterprise Monorepo Target Blueprint** (`apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, `tooling/`) and defines exactly why our current layout is accepted for `v1.x` and what conditions trigger the future migration.

---

## 2. Decision

### A. Accepted Baseline for Esparex `v1.x`
The current repository topology (`core/` and `shared/` at the repository root) is the **accepted baseline for `v1.0`** and remains valid until a future repository restructuring is explicitly approved through an ADR.

```text
esparex/ (v1.x Baseline Topology)
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
While adopting an enterprise-scale categorical structure (`apps/`, `services/`, `packages/`, `infrastructure/`, `docs/`, `tooling/`) communicates operational intent immediately by separating deployables (`apps/`, `services/`) from libraries (`packages/`), executing that folder restructuring today is **deferred** because:
1. **Organizational vs. Functional Benefit**: Renaming and moving folders (`git mv core packages/domain`) provides cognitive clarity for new onboarding developers but yields zero immediate runtime performance, test speed, or business functionality improvements.
2. **High Churn Risk**: A monorepo-wide path migration requires simultaneously updating 5 `package.json` workspace definitions, `pnpm-workspace.yaml`, `tsconfig.json` project references, `dependency-cruiser.js` boundary regexes, CI build matrices, Dockerfile paths, and deployment scripts.
3. **Engineering Opportunity Cost**: Current engineering cycles are higher-value when directed toward product feature velocity, resolving open technical debt (`R-005` Dependabot vulnerabilities), and bounded-context domain hygiene.

---

## 3. Target State Roadmap (`v2.0` Enterprise Blueprint)

When the repository reaches the architectural scale triggers defined below, the codebase will migrate in stages to the **`v2.0` Enterprise Monorepo Blueprint**:

```text
esparex/ (v2.0 Target Enterprise Blueprint)
├── apps/                          # Deployable UI applications
│   ├── web/                       # Customer Web (Next.js)
│   ├── admin/                     # Admin Portal (Vite)
│   └── mobile/                    # Capacitor native shell
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

### Quantitative & Strategic Triggers for `v2.0` Migration
The migration from the `v1.x` Baseline to the `v2.0` Enterprise Blueprint will be initiated when **at least one** of the following conditions is met:
1. **Multiple Backend Runtimes (`R-001`)**: The HTTP API server (`backend/api`) experiences P95 latency degradation due to CPU-intensive worker execution, necessitating the creation of a standalone, separately deployed background processing service (`services/worker`). At that exact point, grouping `services/api` and `services/worker` next to `packages/domain` becomes structurally essential.
2. **Team Scaling**: The engineering team expands to multiple autonomous squads where domain packages (`packages/domain/catalog`, `packages/domain/payments`) must be published or independently versioned across distinct ownership boundaries.
3. **Dedicated Modernization Sprint**: A planned, scheduled technical debt epoch where 100% of engineering bandwidth is allocated to structural refactoring and comprehensive regression verification without competing feature roadmaps.

---

## 4. Staged Migration Strategy (When Triggered)

To minimize disruption when the `v2.0` migration is approved, it must execute via strict non-breaking stages:
1. Create top-level `packages/`, `services/`, and `tooling/` directories.
2. Move libraries using git: `git mv core packages/domain` and `git mv shared packages/shared`.
3. Move server runtimes using git: `git mv backend/api services/api`.
4. **Preserve Package Identifiers Initially**: Keep the npm package names (`@esparex/core`, `@esparex/shared`, `@esparex/backend-api`) identical during the initial directory move. This ensures that internal imports (`import { ... } from '@esparex/shared'`) continue working across all 5 workspaces without requiring massive import-string rewriting across 1,500+ files.
5. Update `pnpm-workspace.yaml` (adding `packages/*` and `services/*`), `tsconfig.json` path maps, `.dependency-cruiser.js` rules, and CI pipelines (`ENFORCEMENT.md`).
6. Run complete verification (`type-check -r`, `guard:dependencies`, and full Jest regression suites).
7. In a later, isolated epoch, optionally rename package identifiers (e.g., `@esparex/core` → `@esparex/domain`) using automated AST codemods (`jscodeshift` / `ts-morph`).
