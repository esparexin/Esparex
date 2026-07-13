# ADR-008: Domain-Driven Internal Core Hierarchy & Bounded-Context Boundaries

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Domain Lead
**Impacted Modules**: `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`
**Related Decisions**: [ADR-005](./ADR-005-package-boundary-enforcement.md), [ADR-007](./ADR-007-monorepo-package-topology.md), [ADR-006](./ADR-006-adr-decision-lifecycle.md), [ADR-009](./ADR-009-integration-strategy.md)

---

## 1. Context & Architectural Challenge

While [ADR-007](./ADR-007-monorepo-package-topology.md) defines the macro-level **Repository Topology** (`apps/`, `services/`, `core/`, `packages/`), the internal architecture of `@esparex/core` (`core/`) requires rigorous boundary definitions.

Currently, `core/` contains over 11 distinct business capabilities (e.g., *Listings, Catalog, Payments, Chat, Alerts, Users, Moderation, Analytics, AI, Fraud, Authentication*) organized largely under a single flat directory (`core/services/` containing 90+ service files).

Without internal boundary enforcement, automated fitness functions, and strict domain vs. infrastructure separation, multiple engineering squads modifying code inside `core/` face:
1. **High merge conflict frequency**: Modifying `core/services/` touches a shared global namespace.
2. **Coupled domain rules**: Service files directly instantiating or querying database schemas across unrelated business lines.
3. **Infrastructure leakage**: Third-party SDKs and persistence details intermingled with pure business policies.

---

## 2. Decision

We establish a **Domain-Driven Design (DDD) Core Hierarchy** inside `@esparex/core` that organizes code into five distinct quadrants, separates application use-case orchestration from pure domain logic, enforces Hexagonal Port/Adapter boundaries, and requires public barrel encapsulation.

### 1. Internal Core Structure
To separate concerns, the `core` codebase is organized into five timeless quadrants:
- **`core/domains/`** — Bounded business contexts containing business domain logic.
- **`core/adapters/`** — Concrete inbound and outbound adapters:
  - `core/adapters/inbound/` — Handles entry transport points (REST/WebSocket controllers, webhook listeners, CLI commands).
  - `core/adapters/outbound/` — Implements outgoing port interfaces (Mongo persistence adapters, external vendor dispatchers).
- **`core/infrastructure/`** — Concrete database persistence and technical capabilities.
- **`core/foundation/`** — Shared, domain-agnostic value objects and primitives.
- **`core/events/`** — Shared domain event definitions and the event bus.

### 2. Internal Bounded-Context Layout
Within each bounded context (`core/domains/<domain-name>/`), we enforce separation of use-case orchestration from pure domain rules:
- **`application/`** — Orchestrates use cases (Application Services or demand-driven CQRS command/query split):
  - **Flat Application Services**: For standard contexts, a flat service class (e.g., `application/CatalogService.ts`) is preferred to avoid over-engineering.
  - **CQRS Split**: A context is only split into `application/commands/`, `application/queries/`, and `application/handlers/` when the complexity of the domain naturally warrants it.
  - **Application Validation**: Input shape checks and DTO parsing live in `application/validation/`.
- **`domain/`** — Houses pure business logic, domain services, value objects, and entities:
  - `domain/entities/` — Stateful business entities.
  - `domain/services/` — Stateless business calculations and rules.
  - `domain/policies/` — Complex business-state validation policies and invariants.
  - `domain/events/` — Pure Domain Events (e.g., `UserRegistered`).
- **`ports/`** — Defines Hexagonal port interfaces specific to this bounded context. To maximize cohesion, **all repository interfaces reside directly in the domain's ports directory** (e.g. `ports/ListingRepositoryPort.ts`, `ports/PaymentGatewayPort.ts`), eliminating separate repository subfolders.

### 3. Hexagonal Port/Adapter Boundary Rule
- **Port Isolation**: Ports belong strictly to the bounded context that defines them rather than a global directory.
- **Inversion of Control**: Domain code must only interact with port abstractions (`*Port`). Bounded domains are prohibited from importing or depending directly on concrete adapters or infrastructure classes.
- **Dependency Flow**:
  `Domain` ──► `Port` ──► `Adapter` ──► `Infrastructure`

### 4. Domain vs. Integration Events
- **Domain Events** (business rules): Indicate state changes *within* a single bounded context (e.g., `ListingCreated`, `PaymentCaptured`). They reside in `core/events/domain/` and are handled synchronously or in-memory.
- **Integration Events** (side effects & messaging): Trigger actions *across* bounded context boundaries or external systems (e.g., `SendWelcomeEmail`). They reside in `core/events/integration/` and are dispatched asynchronously across queue infrastructure.

### 5. Public API Barrel Encapsulation (`index.ts`)
Each bounded context must expose only its public API through a root `index.ts` file (`Public Facades, Public DTOs, Integration Events`). Everything outside of what is explicitly exported in `index.ts` is strictly private to that domain. Cross-domain imports targeting internal subdirectories are prohibited.

---

## 3. Rationale

1. **Testability**: Separating pure domain logic from database persistence and vendor SDKs allows testing domain policies in isolation with rapid, clean-room unit tests.
2. **Squad Autonomy**: Clear folder boundaries (`domains/<name>`) allow team squads to own specific folders without encountering constant merge conflicts in a global service namespace.
3. **Decoupling from Technology**: Organizing infrastructure by capability (`core/infrastructure/persistence/`, `core/infrastructure/cache/`) rather than vendor (MongoDB, Redis) ensures the core business logic remains independent of underlying technology choices.
4. **Mechanical Extraction Path**: Encapsulating each domain within a self-contained folder under `core/domains/` makes future micro-service or package extraction a 1-to-1 mechanical directory migration (`git mv`).

---

## 4. Consequences

- **Positive**: The codebase is self-documenting, and boundaries are clear to developers onboarding to the platform.
- **Positive**: Infrastructure can be replaced (e.g., migrating email providers or databases) without altering core business rules or validation policies.
- **Negative**: Introducing ports, interfaces, and adapters adds structural overhead for small feature additions.
- **Enforcement & Operations**: Automated CI boundaries, scorecard metrics, and implementation roadmaps are governed independently to prevent ADR drift.

---

## 5. Architectural Lifecycle & Validation

Every architectural decision follows a formalized validation lifecycle:
`Decision` ──► `Implementation` ──► `Verification` ──► `Telemetry` ──► `Retirement`

Detailed standards, automation scripts, and release scorecard metrics are maintained in our decoupled governance modules:
- **Detailed Rules & Budgets**: [ARCHITECTURE_STANDARD.md](../governance/arch/ARCHITECTURE_STANDARD.md)
- **Migration & Refactoring Roadmap**: [IMPLEMENTATION_GUIDE.md](../governance/arch/IMPLEMENTATION_GUIDE.md)
- **Scorecard Metrics & Budgeting**: [ARCHITECTURE_SCORECARD.md](../governance/arch/ARCHITECTURE_SCORECARD.md)
- **Automation Setup & Scripts**: [ARCHITECTURE_CI.md](../governance/arch/ARCHITECTURE_CI.md)
