# ADR-008: Domain Architecture, Bounded Contexts & Implementation Governance

**Status**: Accepted
**Date**: 2026-07-13
**Owners**: Architecture Owner, Domain Lead
**Impacted Modules**: `@esparex/core`, `@esparex/shared`, `@esparex/backend-api`
**Related Decisions**: [ADR-005](./ADR-005-package-boundary-enforcement.md), [ADR-007](./ADR-007-monorepo-package-topology.md)

---

## 1. Context & Architectural Challenge

While [ADR-007](./ADR-007-monorepo-package-topology.md) defines the macro-level **Repository Topology** (`apps/`, `services/`, `core/`, `packages/`), the internal architecture of `@esparex/core` (`core/`) requires rigorous boundary definitions and automated compliance.

Currently, `core/` contains over 11 distinct business capabilities (e.g., *Listings, Catalog, Payments, Chat, Alerts, Users, Moderation, Analytics, AI, Fraud, Authentication*) organized largely under a single flat directory (`core/services/` containing 90+ service files).

Without internal boundary enforcement, automated fitness functions, and strict domain vs. infrastructure separation, multiple engineering squads modifying code inside `core/` face:
1. **High merge conflict frequency**: Modifying `core/services/` touches a shared global namespace.
2. **Coupled domain rules**: Service files directly instantiating or querying Mongoose models across unrelated business lines (`payments` querying `chat` schemas directly).
3. **Infrastructure leakage**: Third-party SDKs (`Razorpay`, `Cloudinary`) and persistence details (`Mongoose` schemas, `BullMQ` queues) intermingled with pure business policies.

This decision record establishes our **Stage 2 Domain Consolidation Hierarchy**, enforces **Public API Barrel Encapsulation (`index.ts`)**, defines our **Machine-Readable Dependency Rule Matrix**, sets up self-describing **Domain Manifests (`manifest.yaml`)**, and governs **Automated Architectural Fitness Functions**.

---

## 2. Decision: Stage 2 Internal Core Hierarchy

Inside `@esparex/core`, code must be structured into four distinct, highly cohesive quadrants: **`domains/`**, **`integrations/`**, **`infrastructure/`**, and **`common/`**.

```text
core/
├── domains/                       # Pure bounded business contexts (`<domain-a>`, `<domain-b>`)
├── integrations/                  # External vendor & third-party API adapters (`razorpay/`, `cloudinary/`)
├── infrastructure/                # Replaceable persistence & caching adapters (`persistence/`, `queues/`)
└── common/                        # Shared domain kernel & cross-cutting utilities (`errors/`, `events/`)
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

## 3. Public API Enforcement & Barrel Encapsulation (`index.ts`)

To prevent tight coupling between distinct bounded contexts, every domain inside `core/domains/*` must strictly encapsulate its private implementations:

### Rule: 100% Barrel Encapsulation via `index.ts`
Every bounded context must expose only its public API through a root `index.ts` file (`Public Facades, Public DTOs, Public Domain Events, Abstract Repository Interfaces`). Everything outside of what is explicitly exported in `index.ts` is strictly private to that domain squad.

```text
❌ Forbidden Deep Implementation Import (Breaks Encapsulation):
import { internalHelper } from "@esparex/core/domains/catalog/services/internalHelper";

✅ Required Public Facade Import:
import { CatalogFacade, ICatalogRepository } from "@esparex/core/domains/catalog";
```

Enforced automatically by `dependency-cruiser` (`no-deep-domain-imports` rule prohibiting imports across `core/domains/*/src/*` or deep subdirectories).

---

## 4. Machine-Readable Dependency Rule Matrix (`ADR-009 Specification`)

To ensure zero duplication between governance documentation and our `dependency-cruiser` tooling, all inter-module boundary relationships must conform strictly to the **Dependency Rule Matrix**:

| From Module Layer | To Module Layer | Allowed? | Architectural Rationale & Enforcement Rule |
|---|---|---|---|
| **`apps/*`** | **`services/*`** | ✅ **Yes** | Client UI applications invoke backend REST/WebSocket runtimes via network/transport APIs. |
| **`apps/*`** | **`core/` / `domains/*`** | ❌ **No** | Deployable client UIs cannot import backend domain logic or server database abstractions directly (`no-frontend-imports-from-core`). |
| **`apps/*`** | **`contracts`** (`@esparex/shared`) | ✅ **Yes** | Client UIs share universal DTOs, schemas, types, and enums with backend services. |
| **`services/*`** | **`core/` / `domains/*`** | ✅ **Yes** | Transport controllers/workers delegate business execution to domain facades. |
| **`services/*`** | **`contracts`** (`@esparex/shared`) | ✅ **Yes** | Backend controllers validate payloads against universal schemas. |
| **`core/` / `domains/*`** | **`contracts`** (`@esparex/shared`) | ✅ **Yes** | Domain entities and facades implement or validate against universal contracts. |
| **`core/` / `domains/*`** | **`services/*` / `apps/*`** | ❌ **No** | Business logic must never depend on delivery engines or transport routers (`no-core-imports-from-backend`). |
| **`contracts`** | **Anything else** | ❌ **No** | Universal contracts must be 100% standalone and platform-neutral (`no-shared-imports-from-core`). |

---

## 5. Domain Manifest Specification (`manifest.yaml`)

When a bounded context inside `core/domains/<domain-name>/` begins preparing for autonomous graduation (`Stage 5`), or when multiple engineering squads collaborate across bounded boundaries, every domain must maintain a self-describing **`manifest.yaml`** at its root:

```yaml
# core/domains/catalog/manifest.yaml
id: catalog
name: Catalog Domain
owner: catalog-squad@esparex.in
status: active
depends_on:
  - contracts (@esparex/shared)
  - core/common/errors
  - core/common/events
public_api:
  facades:
    - CatalogFacade
    - CatalogSearchGovernanceService
  repositories:
    - ICategoryRepository
    - IHierarchyRepository
events_emitted:
  - category.created
  - category.updated
  - attribute.deprecated
events_consumed:
  - listing.published
```

This manifest makes our architecture self-describing, enables automated CI architecture scorecards, and prevents untracked dependency drift.

---

## 6. Implementation Governance & Automated Fitness Functions

To ensure our architecture program (`ADR-007` & `ADR-008`) never drifts into theoretical prose, we enforce **Automated Architectural Fitness Functions** across every build and pull request:

### 1. Automated Fitness Functions (CI Gates)
- **`guard:dependencies`**: `dependency-cruiser` continuously verifies our Dependency Rule Matrix, prohibiting deep domain imports, upward layer imports, and circular dependencies (`E-001`–`E-006`).
- **`guard:public-api`**: AST linting (`@typescript-eslint/no-restricted-imports`) verifies that cross-domain imports originate strictly from public barrels (`index.ts`).
- **`guard:infrastructure-isolation`**: Static analysis verifies that files under `core/domains/*` contain zero imports from `mongoose`, `bullmq`, `redis`, `express`, or `aws-sdk`.

### 2. Architecture Scorecard & Release Telemetry
Every release pipeline automatically aggregates and reports our **Architecture Scorecard**:
- **Domain Coupling Ratio**: Percentage of inter-domain dependencies passing through public facades vs. internal files (Target: 100% public facade).
- **Circular Dependency Count**: Enforced at exact 0.
- **Domain Ownership Coverage**: Percentage of `core/domains/*` modules with a valid `manifest.yaml` and assigned squad owner (Target: 100%).
- **Package Integrity & Size**: Monitored across all 5 workspaces (`web`, `admin`, `mobile`, `backend-api`, `core`, `shared`).

---

## 7. Summary & Execution Mandate

With our architecture program complete and fully verifiable via machine-readable specifications:
1. **No Further Structural ADRs Required**: Architecture documentation is mature and locked (`ADR-001` through `ADR-008`).
2. **Immediate Implementation Focus**: We shift 100% of engineering bandwidth from expanding documentation to **Implementation Governance**—gradually restructuring `core/` into `domains/`, `integrations/`, `infrastructure/`, and `common/` during feature sprints while automating compliance via CI fitness functions.
3. **High-Return Technical Debt**: We prioritize clearing pre-existing security vulnerabilities (`R-005` Dependabot backlog) and shipping product capabilities across our governed bounded contexts.
