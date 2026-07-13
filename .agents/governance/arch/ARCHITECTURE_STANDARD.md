# Architecture Standards: Hexagonal & DDD Core Rules

**Module**: 2B of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Hexagonal Ports & Adapters Suffix Standards

To ensure consistency and high readability across our Hexagonal Architecture boundaries, we enforce strict naming suffixes:

| Archetype | Suffix | Placement | Allowed Imports | Examples |
|---|---|---|---|---|
| **Port** | `Port` | `core/domains/<domain>/ports/` | Primitive types, kernel models, domain entities. | `PaymentGatewayPort`, `StoragePort`, `EmailPort` |
| **Adapter** | `Adapter` | `core/adapters/` | Vendor SDKs, ports, configuration schemas. | `RazorpayAdapter`, `ZeptoMailAdapter`, `CloudinaryStorageAdapter` |
| **Repository** | `RepositoryPort` | `core/domains/<domain>/repositories/` | Domain entities, value objects, ID structures. | `ListingRepositoryPort`, `CategoryRepositoryPort` |
| **Persistence** | `PersistenceAdapter` | `core/infrastructure/persistence/` | Database models, schemas, repositories, ports. | `MongoListingPersistenceAdapter` |

---

## 2. Shared Kernel Size Budget

The shared domain kernel (`core/kernel/`) contains primitives and value objects consumed universally across all bounded contexts. To prevent the kernel from slowly degrading into a dumping ground, we enforce a strict **Kernel Size Budget**:

- **Maximum files/classes**: `25`
- **Maximum folders**: `10`
- **Allowed Contents**: Universal abstractions (e.g., base `DomainError`), shared primitives, and domain-agnostic value objects.
- **Escalation Trigger**: If a change pushes the kernel size beyond 25 files or 10 folders, the additions must be extracted into a specific business domain context.

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
✗ dateUtils / formatters (Belongs in packages/utils/)
✗ helpers / objectUtils (Belongs in packages/utils/)
✗ validation / schemas (Belongs in shared/ or packages/contracts/)
✗ catalogUtils / domainSpecifics (Belongs in core/domains/<domain>/)
✗ phoneFormatter / formatters (Belongs in packages/utils/)
```

---

## 4. Domain Manifest YAML Specification (`manifest.yaml`)

Every bounded context under `core/domains/*` must maintain a `manifest.yaml` validating its metadata, ownership, and operations boundaries:

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
