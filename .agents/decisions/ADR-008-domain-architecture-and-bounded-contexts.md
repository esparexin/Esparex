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
2. **Coupled domain rules**: Service files directly instantiating or querying Mongoose models across unrelated business lines (`payments` querying `chat` schemas directly).
3. **Infrastructure leakage**: Third-party SDKs (`Razorpay`, `Cloudinary`) and persistence details (`Mongoose` schemas, `BullMQ` queues) intermingled with pure business policies.

This decision record establishes our **Hexagonal & Domain-Driven Design (DDD) Core Hierarchy** (`domains/`, `ports/`, `adapters/`, `infrastructure/`, `kernel/`, `events/`), mandates our **Incremental Migration Strategy (`Small PRs, Not One Massive Refactor`)**, enforces **Public API Barrel Encapsulation (`index.ts`)**, defines self-describing **Domain Manifests (`manifest.yaml`)**, and sets explicit **Architecture Decision Validation Metrics**.

---

## 2. Decision: Hexagonal & DDD Internal Core Hierarchy

Inside `@esparex/core`, code must be structured into six distinct, highly cohesive DDD quadrants that strictly invert dependencies via Hexagonal Architecture (`ports` & `adapters`) and organize infrastructure by capability rather than vendor:

```text
core/
├── domains/                       # Pure bounded business contexts (`catalog/`, `listings/`, `payments/`)
├── ports/                         # Abstract domain interfaces (`PaymentGatewayPort`, `StoragePort`, `EmailPort`)
├── adapters/                      # Concrete vendor adapters (`RazorpayAdapter`, `CloudinaryStorageAdapter`)
├── infrastructure/                # Concrete persistence & queue capabilities (`persistence/`, `cache/`, `messaging/`)
├── kernel/                        # Shared domain primitives & policies (`primitives/`, `value-objects/`, `errors/`)
└── events/                        # Shared domain event definitions & in-memory/Redis event bus
```

### Subdivided Kernel & Capability-Grouped Infrastructure
1. **`core/domains/<domain-name>/` (Pure Business Logic)**:
   - Owns: Entities, Value Objects, Domain Services, Validation Rules, Domain Policies (`PlanEngine`, `ListingSubmissionPolicy`), and Domain Events (`AdPublished`, `PaymentCaptured`).
   - Forbids: Direct Mongoose `Model.find()` calls, direct third-party SDK imports (`Razorpay`, `aws-sdk`), and HTTP/WebSocket transport dependencies.
2. **`core/ports/` (Abstract Abstraction Layer — Hexagonal Ports)**:
   - Owns: TypeScript interface contracts suffixed cleanly with `Port` (`PaymentGatewayPort`, `StoragePort`, `EmailPort`, `RepositoryPort`).
   - Forbids: Vendor implementation details or Mongoose/Redis connections.
3. **`core/adapters/` (Concrete Vendor Wrappers — Hexagonal Adapters)**:
   - Owns: Third-party SDK initialization and implementations of ports (`RazorpayAdapter implements PaymentGatewayPort`, `CloudinaryStorageAdapter implements StoragePort`).
   - Forbids: Pure business calculation rules.
4. **`core/infrastructure/` (Capability-Grouped Infrastructure)**:
   - Owns: Concrete infrastructure categorized by responsibility rather than vendor:
     - `infrastructure/persistence/mongo/` (Mongoose schemas & repository implementations)
     - `infrastructure/cache/redis/` (Redis cache clients & distributed locks)
     - `infrastructure/messaging/bullmq/` (BullMQ job queues & worker processors)
     - `infrastructure/storage/cloudinary/` (CDN image storage engines)
     - `infrastructure/mail/zeptomail/` (Transactional email dispatchers)
   - Forbids: Pure business calculation logic or HTTP transport routers.
5. **`core/kernel/` (Subdivided Shared Kernel)**:
   - Owns: Domain kernel capabilities subdivided cleanly to prevent miscellaneous dumping:
     - `kernel/primitives/` (Base types, Result/Either abstractions, Date ranges)
     - `kernel/value-objects/` (Universal value objects like `Money`, `Coordinates`, `EmailAddress`)
     - `kernel/policies/` (Shared platform guard policies and invariants)
     - `kernel/errors/` (Standardized domain error classes (`DomainError`, `NotFoundError`))
     - `kernel/ids/` (UUID generation and canonical ID validators)
   - Forbids: Miscellaneous utility dumping (`common/` is forbidden).

---

## 3. Incremental Migration Strategy (`Small PRs, Not One Massive Refactor`)

While Section 2 defines the target enterprise structure inside `core/`, **we explicitly prohibit attempting to create this hierarchy in one massive refactoring pull request**. Large one-shot rewrites stall product velocity and introduce high regression risk.

Instead, domain consolidation inside `@esparex/core` executes via **Small, Incremental PRs** across focused sprints alongside normal feature delivery:

```text
Current State:
core/services/ (90+ flat files), core/models/, core/jobs/
   ↓
Sprint 1 (Domain Consolidation — Core Product Boundaries):
Extract `core/domains/catalog/` and `core/domains/listings/` with public `index.ts` barrels.
   ↓
Sprint 2 (Domain Consolidation — Monetization & Social):
Extract `core/domains/payments/`, `core/domains/chat/`, and `core/domains/users/`.
   ↓
Phase A (Move Repositories):
Extract data access files from services into `core/infrastructure/persistence/mongo/`.
   ↓
Phase B (Move Ports):
Define abstract interfaces in `core/ports/` (`PaymentGatewayPort`, `StoragePort`, `EmailPort`).
   ↓
Phase C (Move Adapters):
Wrap vendor integrations (`Razorpay`, `Cloudinary`, `ZeptoMail`) into `core/adapters/`.
   ↓
Phase D (Move Infrastructure):
Organize remaining cache and messaging queues into `core/infrastructure/cache/redis/` and `messaging/bullmq/`.
```

Every incremental PR must pass all 540 automated test suites (`npm test -w @esparex/core` and `npm test -w @esparex/backend-api`) before merging.

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

Enforced automatically by `dependency-cruiser` (`no-deep-domain-imports` rule prohibiting imports across `core/domains/*/src/*` or deep subdirectories).

---

## 5. Domain Manifest Specification (`manifest.yaml`)

When a bounded context inside `core/domains/<domain-name>/` achieves maturity or collaborates across team boundaries, it maintains a self-describing **`manifest.yaml`** at its root:

```yaml
# core/domains/catalog/manifest.yaml
id: catalog
name: Catalog Domain
owner: catalog # Stable domain identifier (teams change, domains remain constant)
visibility: public
stability: stable
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
  - attribute.deprecated
events_consumed:
  - listing.published
```

This manifest makes our architecture self-describing and enables automated CI architecture scorecards (`verify-manifests.ts`).

---

## 6. Implementation Governance & Automated Fitness Functions

To ensure our architecture program (`ADR-007` & `ADR-008`) never drifts into theoretical prose, we enforce **Automated Architectural Fitness Functions** across every build and pull request via dedicated scripts in `tooling/scripts/architecture/`:

### Automated Fitness Scripts (`tooling/scripts/architecture/`)
- **`verify-boundaries.ts`**: Run via `dependency-cruiser` to verify our Dependency Rule Matrix, prohibiting deep domain imports, upward layer imports, and circular dependencies (`E-001`–`E-006`).
- **`verify-public-api.ts`**: Verifies via static AST checks that external cross-domain imports originate strictly from public barrels (`index.ts`).
- **`verify-manifests.ts`**: Validates the structure, `visibility`, `stability`, `layer`, public API alignment, and ownership of `manifest.yaml` files under `core/domains/*`.
- **`verify-domain-coupling.ts`**: Verifies that `core/domains/*` files contain zero imports from `mongoose`, `bullmq`, `redis`, `express`, or `aws-sdk` (forcing dependency through `ports/` and `adapters/`).
- **`architecture-scorecard.ts`**: Aggregates release telemetry into a CI quality summary.

---

## 7. Architecture Decision Validation & Success Metrics

Every architectural decision must answer: **"How do we know this decision succeeded?"**
ADR-008 is validated continuously against explicit, machine-verifiable success criteria:

| Success Metric | Target / Enforced Threshold | Verification Mechanism |
|---|---|---|
| **Deep Domain Implementation Imports** | **`0` instances** | Enforced via `dependency-cruiser` (`no-deep-domain-imports`). |
| **Circular Dependencies** | **`0` instances** | Enforced via `dependency-cruiser` (`no-circular` / `E-006`). |
| **Domain Coupling Ratio** | **`< 5%` direct inter-domain coupling** | Monitored via `verify-domain-coupling.ts` (forcing communication via event bus or public facades). |
| **Domain Manifest Coverage** | **`100%` across all `core/domains/*`** | Validated via `verify-manifests.ts` during CI pull request checks. |
| **Public API Barrel Encapsulation** | **`100%` imports via `index.ts`** | Verified via `@typescript-eslint/no-restricted-imports` and AST linting. |
| **Infrastructure Isolation inside Domains** | **`0` imports of Mongoose/BullMQ/Redis inside `domains/`** | Verified via static import analysis (`verify-domain-coupling.ts`). |

---

## 8. Summary & Execution Mandate

With our Hexagonal and DDD architecture direction locked and governed (`ADR-001` through `ADR-008`), future structural ADRs are expected only when introducing **new architectural patterns, new deployment models, or new dependency directions**. We transition 100% of engineering bandwidth to **Implementation Governance**:
1. **Incremental Refactoring (`Small PRs`)**: Restructuring `core/` into `domains/`, `ports/`, `adapters/`, `infrastructure/`, and `kernel/` sprint-by-sprint alongside product delivery without massive one-shot rewrites.
2. **Automated Compliance**: Replacing manual documentation checks with CI-enforced architectural fitness scripts (`verify-boundaries.ts`, `verify-public-api.ts`).
3. **High-Return Technical Debt**: Clearing pre-existing security vulnerabilities (`R-005` Dependabot backlog) across our stable, governed codebase.
