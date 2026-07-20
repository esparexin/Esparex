# Esparex Project Decisions (ADR Index)

This document tracks all high-level architectural decisions and their current statuses. Detailed records are located in `.agents/decisions/`.

---

## Repository Architecture Baseline

Intended package responsibilities after completion of Phase 2C:

| Package              | Responsibility                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| `@esparex/contracts` | DTOs, types, enums, schemas, contract constants                          |
| `@esparex/shared`    | Utilities, helpers, observability, popup infrastructure, route constants |
| `core`               | Business logic                                                           |
| `backend/api`        | HTTP API, controllers, integrations                                      |
| `apps/web`           | Frontend application                                                     |
| `apps/admin`         | Admin application                                                        |

---

## Active Architectural Decision Records

### [ADR-001: The Policy Engine](../../.agents/decisions/ADR-001-policy-engine.md)
* **Status:** Accepted  
* **Decision:** Enforces automated workspace policies via custom linter rules, ensuring that code standards are automatically checked on every commit rather than checked via post-hoc code reviews.

### [ADR-002: Knowledge Creation Rule](../../.agents/decisions/ADR-002-knowledge-creation-rule.md)
* **Status:** Accepted  
* **Decision:** Governs the creation of custom rules and expertise profiles (Skills) to prevent documentation drift and unstructured file dumps in the workspace config.

### [ADR-003: Verification Separation](../../.agents/decisions/ADR-003-verification-separation.md)
* **Status:** Accepted  
* **Decision:** Decoupled verification scripts from actual production code, ensuring test tooling outputs do not leak into the build targets.

### [ADR-004: Responsibility Naming Standard](../../.agents/decisions/ADR-004-responsibility-naming.md)
* **Status:** Accepted  
* **Decision:** Enforces standard suffix conventions across all core layers (e.g. `*Port` for interfaces, `*Adapter` for database implementations, `*Service` for business orchestrations).

### [ADR-005: Core & Backend-API Package Separation](../../.agents/decisions/ADR-005-core-backend-separation.md)
* **Status:** Accepted  
* **Decision:** Split the backend into two workspaces: `backend/api` (Express REST routing, middleware, controllers) and `core` (DDD logic, repositories, Mongoose schemas).

### [ADR-006: ADR Decision Lifecycle](../../.agents/decisions/ADR-006-adr-decision-lifecycle.md)
* **Status:** Accepted  
* **Decision:** Defines the criteria and templates for introducing, reviewing, and deprecating Architectural Decision Records (ADRs).

### [ADR-007: Monorepo Package Topology](../../.agents/decisions/ADR-007-monorepo-package-topology.md)
* **Status:** Accepted  
* **Decision:** Establishes the workspace dependency boundaries using npm workspaces and defines `@esparex/contracts` as the bottom-level leaf package.

### [ADR-008: Domain-Driven Internal Core Hierarchy & Bounded Contexts](../../.agents/decisions/ADR-008-domain-architecture-and-bounded-contexts.md)
* **Status:** Accepted  
* **Decision:** Organizes the `core` package into discrete, isolated DDD bounded contexts inside `core/src/domains/` to prepare the codebase for future microservice or package extraction.

### [ADR-009: Integration Event Strategy](../../.agents/decisions/ADR-009-integration-strategy.md)
* **Status:** Accepted  
* **Decision:** Standardizes cross-domain communication via typed integration events (declared in `@esparex/contracts`) and processed asynchronously by Redis-backed background queues (BullMQ).

---

## Phase 2D — Repository Convergence & Public API Simplification

### Status
Planned

### Context

Phases 2A–2C completed the migration from the transitional
`@esparex/shared` → `@esparex/contracts` architecture.

The repository now enforces direct imports from
`@esparex/contracts`, and the transitional proxy has been removed.

The remaining work is architectural simplification rather than
migration.

### Goals

- Validate package boundaries.
- Review all public package barrels (`index.ts`).
- Remove unnecessary compatibility layers.
- Eliminate proxy-style re-export barrels.
- Keep package APIs intentional and minimal.
- Preserve runtime behavior.

### Primary Candidate

`apps/web/src/types/User.ts`

Current state:
- Re-exports entire `@esparex/contracts`
- Re-exports entire `@esparex/shared`
- Only two symbols are consumed: `User`, `UserNotificationSettings`

**Decision:** Unless an application-level public API is intentionally required, remove the barrel and migrate consumers to direct imports from `@esparex/contracts`.

### Decision Rule

Keep a barrel only if it defines an intentional application or package public API. Remove barrels that simply forward another package without adding semantic value.

### Success Criteria

- Explicit dependency graph.
- No compatibility proxy layers.
- Minimal public APIs.
- No duplicate exports.
- No runtime changes.
