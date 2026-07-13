# Architecture Standards: Hexagonal & DDD Core Rules

**Module**: 2B of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md), [ADR-009](../../decisions/ADR-009-integration-strategy.md)

---

## 1. Hexagonal Ports & Adapters Suffix Standards

To ensure consistency and high readability across our Hexagonal Architecture boundaries, we enforce strict naming suffixes:

| Archetype | Suffix | Placement | Allowed Imports | Examples |
|---|---|---|---|---|
| **Port** | `Port` | `core/domains/<domain>/ports/` | Primitive types, foundation models, domain entities. | `PaymentGatewayPort`, `StoragePort`, `EmailPort` |
| **Adapter** | `Adapter` | `core/adapters/outbound/` or `inbound/` | Vendor SDKs, ports, configuration schemas. | `RazorpayAdapter`, `ZeptoMailAdapter` |
| **Repository Port** | `RepositoryPort` | `core/domains/<domain>/ports/` | Domain entities, value objects, ID structures. | `ListingRepositoryPort`, `CategoryRepositoryPort` |
| **Persistence** | `PersistenceAdapter` | `core/infrastructure/persistence/` | Database models, schemas, repositories, ports. | `MongoListingPersistenceAdapter` |

---

## 2. Shared Foundation Reference & Content Budget (Internal Core)

The shared foundation folder (`core/foundation/`) contains primitives and value objects consumed universally across multiple bounded contexts. To prevent the foundation from slowly degrading into a generic "common" folder, we enforce an objective reference budget and strict content limits:

- **Reference Budget Threshold**: Code or utilities inside `core/foundation/` may **only contain code referenced by three or more bounded contexts**.
- **Foundation Folder Size Limit**: Maximum `25` files/classes and `10` directories.
- **Escalation Trigger**: If a file inside the foundation is referenced by fewer than three contexts, or if the size limit is exceeded, the code must be relocated to the specific business domain that consumes it.

### Content Boundaries
To prevent general helper functions from bloating the shared foundation, we enforce strict binary criteria:

```text
Allowed Foundation Primitives:
✓ Result / Either (Operation outcomes)
✓ Money / Percentage / Coordinates (Shared Value Objects)
✓ Email / Identifier / UniqueId (Domain Primitive Types)
✓ DomainError / NotFoundError (Shared Exceptions)
✓ Option / Maybe / Clock / Invariant (Standard Platform Primitives)

Forbidden Foundation Primitives:
✗ DateUtils / StringUtils (Belongs in packages/utils/)
✗ PhoneUtils / phoneFormatter (Belongs in packages/utils/)
✗ CatalogHelpers (Belongs in core/domains/catalog/)
✗ Validation (DTO schemas belong in application/validation/ or packages/contracts/)
✗ Formatting (Belongs in packages/utils/)
✗ Logger (Belongs in packages/config/ or packages/utils/)
```

---

## 3. `packages/foundation/` Content Boundaries (External Workspace Package)

To prevent `packages/foundation/` from accumulating miscellaneous helper utilities, the package enforces a binary allowed/forbidden rule set:

```text
Allowed:
✓ Either (Result type)
✓ Result<T> (Operation outcomes)
✓ Option / Maybe (Nullable abstractions)
✓ Identifier / UniqueId (Domain ID bases)
✓ Money (Financial Value Object)
✓ Email / Percentage (Basic Domain Primitives)
✓ UUID / Clock / Invariant (Core Platform Abstractions)

Forbidden:
✗ Helpers / Utils (Belongs in packages/utils/)
✗ DateUtils / StringUtils (Belongs in packages/utils/)
✗ Validation / Schemas (Belongs in shared/ or packages/contracts/)
✗ Formatting (Belongs in packages/utils/)
✗ CatalogUtils / domainSpecifics (Belongs in core/domains/<domain>/)
```

---

## 4. Bounded Context Events Directory Layout (`core/events/`)

Events are structured under two dedicated subdirectories based on their transactional and consumer scope:

- **`core/events/domain/` (Domain Events)**:
  - Scope: Internal to a single bounded context (e.g. `ListingCreated`). Responds to state changes synchronously/in-memory.
  - Allowed Imports: Domain entities, domain value objects.
- **`core/events/integration/` (Integration Events)**:
  - Scope: Across context boundaries or external systems (e.g. `SendWelcomeEmail`). Dispatched asynchronously via message queues.
  - Allowed Imports: contracts, DTO types.

---

## 5. Domain Manifest YAML Specification (`manifest.yaml`)

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
  - core/foundation
public_api:                 # Declared public barrel exports
  facades:
    - CatalogFacade
  ports:
    - CategoryRepositoryPort
```
