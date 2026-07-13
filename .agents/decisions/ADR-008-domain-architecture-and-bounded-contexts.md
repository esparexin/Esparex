# ADR-008: Domain-Driven Internal Core Hierarchy & Implementation Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Domain Lead
**Impacted Modules**: `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`
**Related Decisions**: [ADR-005](./ADR-005-package-boundary-enforcement.md), [ADR-007](./ADR-007-monorepo-package-topology.md)

---

## 1. Context & Architectural Challenge

While [ADR-007](./ADR-007-monorepo-package-topology.md) defines the macro-level **Repository Topology** (`apps/`, `services/`, `core/`, `packages/`), the internal architecture of `@esparex/core` (`core/`) requires rigorous boundary definitions, clear DDD terminology, and an incremental refactoring strategy.

Currently, `core/` contains over 11 distinct business capabilities (e.g., *Listings, Catalog, Payments, Chat, Alerts, Users, Moderation, Analytics, AI, Fraud, Authentication*) organized largely under a single flat directory (`core/services/` containing 90+ service files).

Without internal boundary enforcement, automated fitness functions, and strict domain vs. infrastructure separation, multiple engineering squads modifying code inside `core/` face:
1. **High merge conflict frequency**: Modifying `core/services/` touches a shared global namespace.
2. **Coupled domain rules**: Service files directly instantiating or querying database schemas across unrelated business lines.
3. **Infrastructure leakage**: Third-party SDKs and persistence details intermingled with pure business policies.

This decision record establishes our **Hexagonal & Domain-Driven Design (DDD) Core Hierarchy** (`domains/`, `adapters/`, `infrastructure/`, `kernel/`, `events/`), mandates our **Incremental Migration Strategy (`Small PRs, Not One Massive Refactor`)**, enforces **Public API Barrel Encapsulation (`index.ts`)**, defines self-describing **Domain Manifests (`manifest.yaml`)**, and sets explicit **Architecture Decision Validation Metrics**.

---

## 2. Decision: Hexagonal & DDD Internal Core Hierarchy

Inside `@esparex/core`, code must be structured into five distinct, highly cohesive DDD quadrants that strictly invert dependencies via Hexagonal Architecture (`ports` & `adapters`) and organize infrastructure by capability rather than vendor:

```text
core/
├── domains/                       # Pure bounded business contexts (`catalog/`, `listings/`, `payments/`)
├── adapters/                      # Concrete vendor adapters (`RazorpayAdapter/`, `ZeptoMailAdapter/`)
├── infrastructure/                # Concrete persistence & queue capabilities (`persistence/`, `cache/`)
├── kernel/                        # Shared domain primitives & policies (`primitives/`, `errors/`)
└── events/                        # Shared domain event definitions & in-memory/Redis event bus
```

### 1. Bounded-Context Domain Structures (`core/domains/<domain-name>/`)
Within each bounded context, code is organized to separate application orchestration from pure domain logic, and ports are placed directly inside the domain that defines them:
```text
core/domains/<domain-name>/
├── application/                   # Application services (use case orchestrators, command handlers)
├── domain/                        # Pure domain model, domain services, and value objects
├── ports/                         # Hexagonal ports specific to this domain (e.g., PaymentGatewayPort)
├── repositories/                  # Domain-specific repository interface definitions
├── policies/                      # Domain rules and business policies
├── validation/                    # Zod / Joi validation schemas
├── events/                        # Domain events specific to this context
└── index.ts                       # Public domain barrel (exports ONLY public facades & interfaces)
```

### 2. Hexagonal Terminology & Port Isolation
- **Ports reside inside domains**: Hexagonal ports belong strictly to the bounded context that defines them (e.g., `core/domains/payments/ports/PaymentGatewayPort`), rather than a global directory.
- **Naming Conventions**:
  - Ports: Suffix `Port` (`PaymentGatewayPort`, `StoragePort`, `EmailPort`, `RepositoryPort`).
  - Adapters: Suffix `Adapter` (`RazorpayAdapter`, `ZeptoMailAdapter`, `CloudinaryStorageAdapter`).
- **Dependency Flow Rule**:
  `Domain` ──► `Port` ──► `Adapter` ──► `Infrastructure`
  *Rule*: Bounded contexts must never depend directly on infrastructure adapters. They must reference Port abstractions.

### 3. Capability-Grouped Infrastructure (`core/infrastructure/`)
Infrastructure is categorized purely by responsibility, keeping it vendor-neutral:
- `persistence/` (e.g., MongoDB / Mongoose repository implementations)
- `cache/` (e.g., Redis distributed lock implementation)
- `messaging/` (e.g., BullMQ queue implementations)
- `storage/` (e.g., Cloudinary storage wrappers)
- `mail/` (e.g., ZeptoMail dispatcher implementation)

### 4. Tiny Kernel Boundary (`core/kernel/`)
The shared domain kernel (`core/kernel/`) contains:
- `kernel/primitives/` (Base Result/Either/Option types)
- `kernel/value-objects/` (Money, coordinates, date ranges)
- `kernel/errors/` (DomainError base exceptions)
- `kernel/policies/` (Shared invariants and check guards)
- `kernel/ids/` (UUID generation and validators)
*Rule*: `core/kernel/` must remain tiny (maximum 20-30 classes/files). Anything larger must be extracted into a specific business domain to prevent kernel from becoming a miscellaneous dumping ground.

---

## 3. Incremental Migration Strategy (`Small PRs, Not One Massive Refactor`)

We explicitly prohibit attempting to create this hierarchy in one massive refactoring pull request. Domain consolidation inside `@esparex/core` executes via **Small, Incremental PRs** across focused sprints alongside normal feature delivery:

```text
Current State:
core/services/ (90+ flat files), core/models/, core/jobs/
   ↓
Sprint 1 (Domain Consolidation — Core Product Boundaries):
Extract `core/domains/catalog/` and `core/domains/listings/` with internal application/domain/ports layout.
   ↓
Sprint 2 (Domain Consolidation — Monetization & Social):
Extract `core/domains/payments/`, `core/domains/chat/`, and `core/domains/users/`.
   ↓
Phase A (Move Repositories):
Extract data access implementations into `core/infrastructure/persistence/`.
   ↓
Phase B (Move Ports):
Define abstract interfaces inside their respective `domains/<name>/ports/` using Port naming convention.
   ↓
Phase C (Move Adapters):
Wrap vendor integrations into `core/adapters/` using Adapter naming convention.
   ↓
Phase D (Move Infrastructure):
Organize remaining cache and messaging queues into `core/infrastructure/cache/` and `core/infrastructure/messaging/`.
```

Every PR must pass all 540 automated test suites before merging.

---

## 4. Public API Enforcement & Barrel Encapsulation (`index.ts`)

To prevent tight coupling between distinct bounded contexts, every domain inside `core/domains/*` must strictly encapsulate its private implementations:

### Rule: 100% Barrel Encapsulation via `index.ts`
Every bounded context must expose only its public API through a root `index.ts` file (`Public Facades, Public DTOs, Public Domain Events`). Everything outside of what is explicitly exported in `index.ts` is strictly private to that domain.

```text
❌ Forbidden Deep Implementation Import (Breaks Encapsulation):
import { internalHelper } from "@esparex/core/domains/catalog/services/internalHelper";

✅ Required Public Facade Import:
import { CatalogFacade } from "@esparex/core/domains/catalog";
```

Enforced automatically by `dependency-cruiser` (`no-deep-domain-imports` rule).

---

## 5. Extended Domain Manifest Specification (`manifest.yaml`)

Every domain context must maintain a self-describing **`manifest.yaml`** at its root to govern ownership, stability, and dependencies:

```yaml
# core/domains/catalog/manifest.yaml
id: catalog
name: Catalog Domain
owner: catalog # Bounded context identifier (stable, does not change with teams)
business_owner: Marketplace
technical_owner: Platform
maintainer: Catalog Squad
maturity: stable # experimental | growing | stable | strategic
visibility: public # public | private
stability: stable # stable | experimental
since: 1.0
layer: domain
status: active
depends_on:
  - shared (@esparex/shared)
  - core/kernel
  - core/events
public_api:
  facades:
    - CatalogFacade
    - CatalogSearchGovernanceService
  ports:
    - RepositoryPort
events_emitted:
  - category.created
  - category.updated
events_consumed:
  - listing.published
```

This manifest is validated during CI pull request checks (`verify-manifests.ts`).

---

## 6. Implementation Governance & Telemetry Scorecard

To ensure our architecture program never drifts into theoretical prose, we enforce **Automated Architectural Fitness Functions** via scripts in `tooling/scripts/architecture/`:

- **`verify-boundaries.ts`**: Run via `dependency-cruiser` to verify our Dependency Rule Matrix.
- **`verify-public-api.ts`**: Verifies that external cross-domain imports originate strictly from public barrels (`index.ts`).
- **`verify-manifests.ts`**: Validates the structure and attributes of `manifest.yaml` files.
- **`verify-domain-coupling.ts`**: Verifies that domain files contain zero imports from persistence packages or external SDKs directly.
- **`architecture-scorecard.ts`**: Aggregates release telemetry.

### Telemetry Trend Scorecard
Release pipelines track trends over time to monitor architectural health across release cycles:

| Release | Domain Coupling | Circular Dependencies | Bounded Domains | Public API Violations | Manifest Coverage |
|---|---|---|---|---|---|
| **2026.1** | 4.1% | 0 | 8 | 2% | 90% |
| **2026.2** | 3.7% | 0 | 9 | 0% | 100% |

---

## 7. Architecture Decision Validation & Validation Lifecycle

Every architectural decision follows a structured **Validation Lifecycle**:
`Decision` ──► `Implementation` ──► `Verification` ──► `Telemetry` ──► `Retirement`

We measure success against explicit, machine-verifiable metrics:

| Success Metric | Target / Enforced Threshold | Verification Mechanism |
|---|---|---|
| **Deep Domain Imports** | **`0` instances** | Enforced via `dependency-cruiser` (`no-deep-domain-imports`). |
| **Circular Dependencies** | **`0` instances** | Enforced via `dependency-cruiser` (`E-006`). |
| **Domain Coupling Ratio** | **`< 5%` direct inter-domain coupling** | Monitored via `verify-domain-coupling.ts`. |
| **Domain Manifest Coverage** | **`100%` across all `core/domains/*`** | Validated via `verify-manifests.ts`. |
| **Public API Barrel Encapsulation** | **`100%` imports via `index.ts`** | Verified via `@typescript-eslint/no-restricted-imports`. |
| **Infrastructure Isolation inside Domains** | **`0` direct infrastructure/adapter imports inside domains** | Verified via `verify-domain-coupling.ts`. |

### Architectural Decision Budget
Every sprint planning session must evaluate and track:
- **New technical debt created** (Exceptions allowed by architecture lead).
- **Technical debt removed** (Refactored files aligned with target architecture).
- **Domains affected** (Impacted bounded contexts).
- **Boundary violations introduced** (Must be 0 to pass build).
- **ADR updates required** (Obsoletion or refinements to existing rules).

---

## 8. Summary & Execution Mandate

Future structural ADRs are expected only when introducing **new architectural patterns, new deployment models, or new dependency directions**. We transition 100% of engineering bandwidth to **Implementation Governance**:
1. **Incremental Refactoring (`Small PRs`)**: Restructuring `core/` into `domains/`, `adapters/`, `infrastructure/`, and `kernel/` sprint-by-sprint.
2. **Automated Compliance**: Enforcing boundary rules and capturing trend scorecards in CI.
3. **High-Return Technical Debt**: Clearing pre-existing security vulnerabilities (`R-005` Dependabot backlog) across our stable codebase.
