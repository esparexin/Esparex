# Architecture & Monorepo Standards

**Module**: 2 of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-20
**Status**: Active

---

## Merged From
- `.agents/governance/arch/STANDARDS.md` (Module 2)
- `.agents/governance/arch/ARCHITECTURE_STANDARD.md` (Module 2B)
- **Merged:** 2026-07

---

## Standard S1 — Package Ownership Standard `v1.0`

Every source directory at the monorepo root must be classified as one of:

| Class | Definition | Current examples |
|---|---|---|
| **Registered workspace** | Declared in root `package.json` `workspaces` array | `core/`, `shared/`, `apps/web/`, `apps/admin/`, `backend/api/` |
| **Infrastructure/runtime wrapper** | Explicitly documented in `README.md` | `apps/mobile/` (Capacitor shell) |

No other top-level directories are permitted. Adding one requires an update to this Standard and documentation in `README.md`.

---

## Standard S2 — Import Boundary Standard `v1.1`

| Import direction | Status | Enforcement |
|---|---|---|
| `apps/*` → `@esparex/shared` | ✅ Permitted | Convention |
| `apps/*` → `@esparex/core` | ❌ Forbidden | CI: `no-frontend-imports-from-core` |
| `apps/*` → `@esparex/backend-api` | ❌ Forbidden | Convention |
| `@esparex/shared` → `@esparex/core` | ❌ Forbidden | CI: `no-shared-imports-from-core` |
| `@esparex/core` → `@esparex/shared` | ✅ Permitted | Convention |
| `@esparex/core` → `@esparex/backend-api` | ❌ Forbidden | CI: `no-upstream-core-to-api` |
| `@esparex/backend-api` → `@esparex/core` | ✅ Permitted | Convention |
| `@esparex/backend-api` → `@esparex/shared` | ✅ Permitted | Convention |
| `*` → `@esparex/contracts` | ✅ Permitted | Convention |
| `@esparex/contracts` → `*` | ❌ Forbidden | CI: `contracts-is-independent` |

Any change to this Standard requires updating `.dependency-cruiser.js` and an ADR.

---

## Standard S3 — Package Content Standard `v1.1`

| Package | Permitted content | Prohibited content |
|---|---|---|
| `@esparex/contracts` | Pure type declarations, Zod DTO schemas, enums, API request/response contracts, event payloads, public type aliases | Business logic, service classes, repositories, database models, Mongoose/MongoDB code, any infrastructure dependencies |
| `@esparex/shared` | Pure TypeScript, Web-API-compatible utility functions, frozen legacy schemas (deprecated) | React hooks, Node.js APIs, Mongoose, Express, core business logic |
| `@esparex/core` | Domain services, Mongoose models, queues, workers, infrastructure config | HTTP routes, Express middleware, HTTP request/response types |
| `@esparex/backend-api` | HTTP routes, Express middleware, controllers, input validators | Direct Mongoose queries bypassing core services |
| `apps/*` | UI components, pages, API client hooks, frontend utilities | Backend imports, direct database access, domain business logic |

---

## Standard S4 — ADR Requirement Standard `v1.0`

An ADR is **required** when any of the following conditions apply:

| Condition | Why |
|---|---|
| New npm workspace or package | Changes the monorepo's architectural surface |
| Bounded context extracted from an existing package | Changes ownership and dependency model |
| New deployment unit or runtime process | Changes runtime topology |
| New external infrastructure dependency | Affects operational model |
| Change to an enforced `dependency-cruiser` rule | Modifies the architectural contract |
| Major framework replacement within a package | Affects the entire package surface |

**Rule of thumb**: If the change requires modifying `dependency-cruiser.js`, the root `workspaces` array, or `tsconfig.json` project references, an ADR is required. See [ADR-006](../decisions/ADR-006-adr-decision-lifecycle.md).

---

## Standard S5 — Architectural Complexity Trigger Standard `v1.0`

Triggers are **composite signals**, not single metrics. File count is one signal among several. A review is triggered when **two or more signals** apply simultaneously, or when a single critical signal is severe.

### Package-Level Triggers

| Signal | Threshold | Weight |
|---|---|---|
| `@esparex/core` total source files | > 600 files | Primary |
| Single domain subdirectory | > 20% of `core` total file count | Primary |
| Single domain subdirectory | > 500 KB source | Primary |
| Recurring merge conflicts in a domain | > 2 per month | Secondary |
| Domain test suite runtime | > 30s independently | Secondary |
| Domain has a natural ownership split | Team assignment changes | Secondary |

**Escalation rule**: One primary signal → schedule review. Two primary signals → review is mandatory before next major feature in that domain.

### Build & Runtime Triggers

| Signal | Threshold | Action |
|---|---|---|
| Full backend build time (`shared + core + api`) | > 60 seconds | Evaluate incremental build tooling |
| API cold start time | > 5 seconds | Evaluate startup optimization |
| Total test suite runtime | > 5 minutes | Evaluate parallelization |
| Render plan upgrade driven by memory/CPU | Any | Evaluate worker extraction |
| HTTP P95 latency correlated with worker job windows | Measurable correlation | Evaluate worker extraction (`backend/worker/`) |

### Deployment Triggers

| Signal | Threshold | Action |
|---|---|---|
| Distinct runtime deployment units | > 3 | Evaluate deployment model review |
| Traffic or data volume difference between services | > 10× | Evaluate independent scaling |

---

## Standard S6 — Hexagonal Ports & Adapters Suffix Standards

To ensure consistency and high readability across our Hexagonal Architecture boundaries, we enforce strict naming suffixes:

| Archetype | Suffix | Placement | Allowed Imports | Examples |
|---|---|---|---|---|
| **Port** | `Port` | `core/domains/<domain>/ports/` | Primitive types, building blocks, domain entities. | `PaymentGatewayPort`, `StoragePort`, `EmailPort` |
| **Adapter** | `Adapter` | `core/adapters/outbound/` or `inbound/` | Vendor SDKs, ports, configuration schemas. | `RazorpayAdapter`, `ZeptoMailAdapter` |
| **Repository Port** | `RepositoryPort` | `core/domains/<domain>/ports/` | Domain entities, value objects, ID structures. | `ListingRepositoryPort`, `CategoryRepositoryPort` |
| **Persistence** | `RepositoryAdapter` | `core/adapters/outbound/` | Database models, schemas, repositories, ports. | `MongoListingRepositoryAdapter` |

---

## Standard S7 — Shared Kernel Standard & Content Budget (Internal Core)

The internal core shared folder (`core/shared-kernel/`) contains foundational domain primitives, value objects, base errors, and events plumbing consumed universally across multiple bounded contexts. To prevent this folder from slowly degrading into a generic "common" utilities folder, we enforce an objective reference budget, strict compliance boundaries, and automatically checked CI constraints:

- **Reference Budget Threshold**: Utilities inside `core/shared-kernel/` (excluding event bus interfaces) may **only contain code referenced by three or more bounded contexts**.
- **Objective Shared Kernel Admission Rules**: An item is eligible for inclusion in `core/shared-kernel/` only if all of the following criteria are true:
  - [ ] **Used by three or more bounded contexts** (must be consumed universally).
  - [ ] **Domain agnostic** (contains no business-specific domain context knowledge).
  - [ ] **No infrastructure dependency** (no imports of database models, schemas, or technical packages).
  - [ ] **No adapter dependency** (does not depend on any outbound or inbound adapters).
  - [ ] **No transport dependency** (completely decoupled from HTTP, Express, REST, or messaging controllers).
  - [ ] **No UI dependency** (contains zero CSS, layout styling, or frontend client logic).
  - [ ] **Explicit owner** (ownership must be clearly defined in manifests).
  - [ ] **Unit tested** (100% covered by independent unit tests).
- **Shared Kernel Size Limit**: Maximum `25` files/classes and `10` directories.
- **Escalation Trigger**: If a file inside the shared kernel is referenced by fewer than three contexts, or if the size limit is exceeded, the code must be relocated to the specific business domain that consumes it.

### Content Boundaries
To prevent general helper functions and delivery/persistence details from bloating the shared kernel, we enforce strict binary criteria:

```text
Allowed Core Shared Kernel Building Blocks:
✓ Result / Either (Operation outcomes)
✓ Money / Percentage / Coordinates (Shared Value Objects)
✓ Email / Identifier / UniqueId (Domain Primitive Types)
✓ DomainError / AppError / NotFoundError (Shared Exceptions)
✓ Option / Maybe / Clock / Invariant (Standard Platform Primitives)

Forbidden Core Shared Kernel Elements:
✗ DateUtils / StringUtils (Belongs in packages/utils/)
✗ PhoneUtils / phoneFormatter (Belongs in packages/utils/)
✗ CatalogHelpers (Belongs in core/domains/catalog/)
✗ Validation (DTO schemas belong in application/validation/ or packages/contracts/)
✗ Formatting (Belongs in packages/utils/)
✗ Logger (Belongs in packages/config/ or packages/utils/)
```

---

## Standard S8 — Bounded Context Events Directory Layout

Concrete events belong strictly to the domain context that owns them.
- **Domain Events** (e.g. `ListingCreated`): Reside inside their respective domain boundaries under `core/domains/<domain>/domain/events/`.
- **Integration Events** (e.g. `PaymentCapturedIntegrationEvent`): Reside inside their respective domain boundaries under `core/domains/<domain>/domain/events/` and are exposed via the domain index barrel.
- **Shared Eventing Plumbing**: Interface contracts like `EventBus`, `EventEnvelope`, `EventSerializer`, and `EventDispatcher` reside globally under `core/shared-kernel/events/`. No concrete events are permitted inside this directory.

---

## Standard S9 — Domain Manifest YAML Specification (`manifest.yaml`)

Every bounded context under `core/domains/*` must maintain a `manifest.yaml` validating its metadata, ownership, stability, and operational boundaries:

```yaml
id: catalog                 # Bounded context identifier (stable, outlives org charts)
name: Catalog Domain        # Human-readable domain name
owner: catalog              # Bounded context tag (stable domain, not team name)
business_owner: Marketplace # Marketplace | Core | Support
technical_owner: Platform   # Platform | Architecture | Security
maintainer: Catalog Squad   # Current maintaining squad
maturity: stable            # experimental | growing | stable | strategic
visibility: public          # public | private
stability: stable           # stable | experimental
criticality: high           # low | medium | high | mission-critical
sla: tier-1                 # tier-1 (high availability) | tier-2 (standard) | tier-3 (batch)
since: 1.0                  # Baseline version
layer: domain               # Layer classification
depends_on:                 # Explicit imports
  - shared
  - core/shared-kernel
public_api:                 # Declared public barrel exports
  facades:
    - CatalogFacade
  ports:
    - CategoryRepositoryPort
```

---

## Standard S10 — Core Architectural Patterns

### A. UnitOfWork Pattern (Transaction Abstraction)
To prevent leakage of database transaction details (like Mongoose `ClientSession`) into application services, we use the `UnitOfWork` pattern:
- **Port**: `ListingUnitOfWorkPort` defines an `executeTransaction` method accepting an opaque session type.
  ```typescript
  export interface ListingUnitOfWorkPort {
      executeTransaction<T>(work: (session: unknown) => Promise<T>): Promise<T>;
  }
  ```
- **Adapter**: `MongoListingUnitOfWorkAdapter` implements the transaction using Mongoose's `session.withTransaction` internally.
- **Application Services**: Consume the port via the composition root, passing `session` as `unknown` to ensure complete database framework independence:
  ```typescript
  await getListingUnitOfWork().executeTransaction(async (session) => {
      await getListingRepository().updateOne(id, patch, session);
  });
  ```

### B. Repository Pattern (Database Abstraction)
All persistence-layer queries and commands are routed through a domain-defined Repository Port:
- **Port**: `ListingRepositoryPort` defines standard CRUD and domain-specific query methods using plain TS objects.
- **Adapter**: `MongoListingRepositoryAdapter` handles the Mongoose schema interaction, maps MongoDB documents using a `toDomain()` mapping function, and implements the queries.
- **Controllers & Middlewares**: Call `getListingRepository().findOne(...)` instead of directly importing `AdModel` or writing raw Mongoose queries.

### C. Cache Abstraction Pattern
Rather than calling Redis client helpers (like `redisCache`) directly, the application layer declares its invalidation needs through a business-intent-focused cache port:
- **Port**: `ListingsCachePort` exposes only business-intent invalidation methods:
  ```typescript
  export interface ListingsCachePort {
      invalidateAdFeedCaches(): Promise<void>;
      invalidatePublicAdCache(adId: string): Promise<void>;
  }
  ```
- **Adapter**: `RedisListingsCacheAdapter` calls the low-level Redis caching helpers.
- **Core Services & Listeners**: Call `getListingsCache().invalidateAdFeedCaches()` via the composition root, keeping business logic clean of infrastructure caching mechanics.

### D. Composition Root Pattern
Dependencies are wired together at the package boundary in a central composition root (`core/src/composition/<domain>.ts`):
- Singleton instance factories (e.g. `getListingRepository()`, `getListingUnitOfWork()`, `getListingsCache()`) instantiate adapters and return their port interfaces.

---

## Standard Version History

| Standard | Version | Date | Summary of Change |
|---|---|---|---|
| S1 Package Ownership | v1.0 | 2026-07-13 | Initial — workspace + infrastructure-wrapper classification |
| S2 Import Boundary | v1.1 | 2026-07-18 | Add @esparex/contracts independent leaf boundary rules |
| S3 Package Content | v1.1 | 2026-07-18 | Add @esparex/contracts permitted/prohibited classification |
| S4 ADR Requirement | v1.0 | 2026-07-13 | Initial — 6 conditions requiring an ADR |
| S5 Complexity Trigger | v1.0 | 2026-07-13 | Initial — composite triggers replacing single file-count threshold |
| S6 Suffix Standards | v1.0 | 2026-07-20 | Unified from Architecture Standard Module 2B |
| S7 Shared Kernel | v1.0 | 2026-07-20 | Unified from Architecture Standard Module 2B |
| S8 Event Directory | v1.0 | 2026-07-20 | Unified from Architecture Standard Module 2B |
| S9 Domain Manifest | v1.0 | 2026-07-20 | Unified from Architecture Standard Module 2B |
| S10 Arch Patterns | v1.0 | 2026-07-20 | Unified from Architecture Standard Module 2B |
