# ADR-008: Domain Architecture, Bounded Contexts & Internal Core Hierarchy

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Domain Lead
**Impacted Modules**: `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`
**Related Decisions**: [ADR-005](./ADR-005-package-boundary-enforcement.md), [ADR-007](./ADR-007-monorepo-package-topology.md)

---

## 1. Context & Architectural Challenge

While [ADR-007](./ADR-007-monorepo-package-topology.md) defines the macro-level **Repository Topology** (`apps/`, `services/`, `core/`, `packages/`), the internal architecture of `@esparex/core` (`core/`) requires rigorous boundary definitions.

Currently, `core/` contains over 11 distinct business capabilities (e.g., *Listings, Catalog, Payments, Chat, Alerts, Users, Moderation, Analytics, AI, Fraud, Authentication*) organized largely under a single flat directory (`core/services/` containing 90+ service files).

Without internal boundary enforcement and strict domain vs. infrastructure separation, multiple engineering squads modifying code inside `core/` face:
1. **High merge conflict frequency**: Modifying `core/services/` touches a shared global namespace.
2. **Coupled domain rules**: Service files directly instantiating or querying Mongoose models across unrelated business lines (`payments` querying `chat` schemas directly).
3. **Infrastructure leakage**: Third-party SDKs (`Razorpay`, `Cloudinary`) and persistence details (`Mongoose` schemas, `BullMQ` queues) intermingled with pure business policies.

This decision record establishes our **Stage 2 Domain Consolidation Hierarchy**, separates pure domain logic from infrastructure/integrations, defines standard **Bounded-Context Ownership Rules**, and sets the graduation criteria for **Stage 5 Autonomous Domain Extraction**.

---

## 2. Decision: Stage 2 Internal Core Hierarchy

Inside `@esparex/core`, code must be structured into four distinct, highly cohesive quadrants: **`domains/`**, **`integrations/`**, **`infrastructure/`**, and **`common/`**.

```text
core/
├── domains/                       # Pure bounded business contexts
│   ├── <domain-a>/                # e.g., catalog/
│   ├── <domain-b>/                # e.g., listings/
│   └── <domain-c>/                # e.g., payments/
│
├── integrations/                  # External vendor & third-party API adapters
│   ├── razorpay/                  # Payment gateway SDK wrappers & webhook parsers
│   ├── cloudinary/                # Image manipulation & CDN storage adapters
│   └── zeptomail/                 # Transactional email delivery adapters
│
├── infrastructure/                # Replaceable persistence & caching adapters
│   ├── persistence/               # Mongoose schema registrations & repository adapters
│   ├── queues/                    # BullMQ job queue wrappers
│   └── cache/                     # Redis cache layer wrappers
│
└── common/                        # Shared domain kernel & cross-cutting utilities
    ├── errors/                    # Standardized domain error classes (`DomainError`)
    └── events/                    # In-memory or Redis domain event bus (`DomainEventBus`)
```

### Separation of Domain vs. Infrastructure
1. **`core/domains/<domain-name>/` (Pure Business Logic)**:
   - Owns: Entities, Value Objects, Domain Services, Validation Rules, Domain Policies (`PlanEngine`, `ListingSubmissionPolicy`), and Domain Events (`AdPublished`, `PaymentCaptured`).
   - Forbids: Direct Mongoose `Model.find()` calls, direct third-party SDK imports (`Razorpay`, `aws-sdk`), and HTTP/WebSocket transport dependencies.
2. **`core/infrastructure/persistence/` (Persistence Adapters)**:
   - Owns: Mongoose schema definitions (`listing.schema.ts`), Mongoose repository implementations (`MongoListingRepository`), and database index definitions.
   - Forbids: Pure business calculation logic or HTTP transport concerns.
3. **`core/integrations/<vendor>/` (Vendor Adapters)**:
   - Owns: Third-party SDK initialization, retry logic, webhook signature validation, and payload mapping to domain DTOs.
   - Forbids: General business domain rules.

---

## 3. Bounded-Context Structure & Ownership Model

To ensure every bounded context inside `core/domains/*` can graduate cleanly to an autonomous top-level domain (`Stage 5`), each domain folder follows a standardized internal layout and strict ownership boundaries.

### Standard Bounded-Context Directory Layout (`core/domains/<domain-name>/`)
```text
core/domains/<domain-name>/
├── models/                        # Pure TypeScript domain entities & value objects
├── services/                      # Domain services implementing business workflows
├── policies/                      # Business rule engines & guard policies
├── validation/                    # Zod / Joi domain validation schemas
├── events/                        # Domain event definitions (`<Domain>Event`)
├── repositories/                  # Abstract repository interfaces (`I<Domain>Repository`)
└── index.ts                       # Public domain barrel (exports ONLY public contracts & facades)
```

### Bounded-Context Ownership Specification Example: `Catalog Domain`
```text
Catalog Domain (`core/domains/catalog`)
├── Owns:
│   ✓ Models (`Category`, `CategoryAttribute`, `HierarchyNode`)
│   ✓ Services (`CatalogResolutionPolicy`, `CatalogSearchGovernanceService`)
│   ✓ Validation (`catalog.validator.ts`)
│   ✓ Policies (`AttributeRequiredPolicy`, `CategoryEligibilityGuard`)
│   ✓ Domain Events (`category.created`, `attribute.updated`)
│   ✓ Repositories (`ICategoryRepository` abstraction interface)
└── Does NOT Own (Strictly Forbidden):
    ✗ HTTP Transport / Express Routes (`services/api/routes/catalog.router.ts`)
    ✗ React Components / Hooks (`apps/web/src/components/Catalog/`)
    ✗ Redis Connection Bootstrapping (`backend/api/src/config/redis.ts`)
    ✗ Express Middleware / JWT Decoding (`shared/middleware/auth.ts`)
```

### Inter-Domain Communication Rules
When one bounded context requires data or capabilities from another (e.g., `listings` requires category attribute validation from `catalog`):
1. **Direct internal imports are prohibited**: `core/domains/listings` cannot import internal implementation files from `core/domains/catalog/services/internalHelper.ts`.
2. **Public Facade / Barrel Only**: Communication must occur strictly via the target domain's public barrel export (`import { CatalogFacade } from '../catalog'`).
3. **Domain Event Bus**: Asynchronous cross-domain reactions (`listing.published` triggering smart alert matching in `alerts`) must use the shared `DomainEventBus` (`core/common/events`) rather than direct synchronous service coupling.

---

## 4. Graduation to Stage 5: Autonomous Domain Extraction

When a bounded context inside `core/domains/<domain-name>/` achieves organizational autonomy and high change frequency, it is eligible for mechanical extraction to a top-level workspace (`domains/<domain-name>`) per [ADR-007 Stage 5](./ADR-007-monorepo-package-topology.md).

```text
Mechanical Stage 5 Extraction Path:
core/domains/<domain-name>  ───(git mv)───►  domains/<domain-name>
```

### Graduation Gate Criteria (`core/domains/*` → `domains/*`)
A domain context inside `core/` may only graduate to a standalone top-level package if it satisfies all four criteria:
1. **Zero Sideways Implementation Coupling**: The context does not import any internal private files from other domains inside `core/domains/`.
2. **Dedicated Squad Ownership**: An autonomous engineering squad explicitly owns the domain's roadmap, SLAs, and release lifecycle (`Principle 5`).
3. **Independent Deployment or Publishing Need**: The domain requires independent npm publishing (e.g., sharing with an external enterprise partner) or standalone micro-service runtime execution (`services/catalog-worker`).
4. **Clean Abstraction Compliance**: The domain depends purely on abstract repository interfaces (`I<Domain>Repository`), allowing its infrastructure adapters (`persistence/`) to be wired at the service runtime boundary without code modification.

---

## 5. Summary & Stage 2 Execution Strategy

By adopting [ADR-008](./ADR-008-domain-architecture-and-bounded-contexts.md) alongside [ADR-007](./ADR-007-monorepo-package-topology.md), Esparex establishes:
- **Macro-level clean topology** (`apps/`, `services/`, `packages/contracts`, `core/`).
- **Micro-level domain hygiene** (`core/domains/`, `core/integrations/`, `core/infrastructure/`, `core/common/`).
- **Mechanical extraction paths** (`core/domains/<domain>` → `domains/<domain>`).

Engineering teams execute **Stage 2 Domain Consolidation** incrementally during everyday feature development by grouping new and modified services into their respective `core/domains/<domain-name>` folders while maintaining 100% test coverage across our 540 automated test suites.
