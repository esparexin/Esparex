# Architecture Standards: Hexagonal & DDD Core Rules

**Module**: 2B of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md), [ADR-009](../../decisions/ADR-009-integration-strategy.md)

---

## 1. Hexagonal Ports & Adapters Suffix Standards

To ensure consistency and high readability across our Hexagonal Architecture boundaries, we enforce strict naming suffixes:

| Archetype | Suffix | Placement | Allowed Imports | Examples |
|---|---|---|---|---|
| **Port** | `Port` | `core/domains/<domain>/ports/` | Primitive types, kernel models, domain entities. | `PaymentGatewayPort`, `StoragePort`, `EmailPort` |
| **Adapter** | `Adapter` | `core/adapters/` | Vendor SDKs, ports, configuration schemas. | `RazorpayAdapter`, `ZeptoMailAdapter`, `CloudinaryStorageAdapter` |
| **Repository Port** | `RepositoryPort` | `core/domains/<domain>/ports/` | Domain entities, value objects, ID structures. | `ListingRepositoryPort`, `CategoryRepositoryPort` |
| **Persistence** | `PersistenceAdapter` | `core/infrastructure/persistence/` | Database models, schemas, repositories, ports. | `MongoListingPersistenceAdapter` |

---

## 2. Shared Kernel Reference Budget

The shared domain kernel (`core/kernel/`) contains primitives and value objects consumed universally across multiple bounded contexts. To prevent the kernel from slowly degrading into a generic "common" folder, we enforce an objective reference budget:

- **Reference Budget Threshold**: Code or utilities inside `core/kernel/` may **only contain code referenced by three or more bounded contexts**.
- **Kernel Size Limit**: Maximum `25` files/classes and `10` directories.
- **Escalation Trigger**: If a file inside the kernel is referenced by fewer than three contexts, or if the size limit is exceeded, the code must be relocated to the specific business domain that consumes it.

---

## 3. `packages/foundation/` Content Boundaries

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

## 4. Domain Manifest YAML Specification (`manifest.yaml`)

Every bounded context under `core/domains/*` must maintain a `manifest.yaml` validating its metadata, ownership, stability, and operational boundaries:

```yaml
id: catalog                 # Bounded context identifier (stable, outlives org charts)
name: Catalog Domain        # Human-readable domain name
owner: catalog              # Stable domain owner tag
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
  - core/kernel
public_api:                 # Declared public barrel exports
  facades:
    - CatalogFacade
  ports:
    - CategoryRepositoryPort
```
