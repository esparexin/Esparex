# Architecture Implementation Guide: DDD Core Consolidation

**Module**: 6B of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Incremental Migration Mandate

To preserve product feature velocity and minimize regression risk, **all refactoring toward the Hexagonal DDD architecture must execute via small, focused pull requests (PRs)**. Large repository-wide structural rewrites are strictly prohibited.

Every incremental PR must:
1. Address a single bounded context or a single migration phase.
2. Compile cleanly with zero type-checking errors.
3. Pass all 540 automated tests (`npm test` in workspaces).
4. Introduce no circular dependencies or boundary violations.

---

## 2. Sprint-by-Sprint Migration Strategy

The migration of `@esparex/core` into the Hexagonal DDD modular core structure follows a multi-sprint roadmap:

### Sprint 1: Core Domain Consolidation (Product Foundations)
- **Primary Goal**: Establish core directories and migrate the initial two bounded contexts.
- **Action Items**:
  1. Create `core/domains/catalog/` and `core/domains/listings/` directories.
  2. Subdivide each directory into `application/`, `domain/`, `ports/`, `repositories/`, `policies/`, `validation/`, and `events/`.
  3. Migrate flat files from `core/services/` and `core/models/` related to Catalog and Listings into these subfolders.
  4. Create public barrel `index.ts` files for Catalog and Listings.

### Sprint 2: Extended Domain Consolidation (Monetization & Social)
- **Primary Goal**: Group remaining core services.
- **Action Items**:
  1. Create `core/domains/payments/`, `core/domains/chat/`, and `core/domains/users/`.
  2. Organize internal application/domain directories.
  3. Relocate relevant services and models.
  4. Encapsulate behind public `index.ts` barrels.

### Phase A: Persistence Relocation (Repositories)
- **Primary Goal**: Decouple database drivers from domain boundaries.
- **Action Items**:
  1. Create `core/infrastructure/persistence/mongo/`.
  2. Move Mongoose schemas and concrete Mongo repositories out of `core/domains/*/repositories/` into `core/infrastructure/persistence/mongo/`.
  3. Implement dependency injection wiring at the application boot level.

### Phase B: Ports Relocation
- **Primary Goal**: Standardize port naming and ensure domains reference only abstractions.
- **Action Items**:
  1. Relocate abstract repository and integration interfaces to their respective `core/domains/<domain-name>/ports/` directories.
  2. Rename all abstract interfaces to suffix `Port` (e.g. `ICategoryRepository` ──► `CategoryRepositoryPort`).

### Phase C: Adapters Relocation
- **Primary Goal**: Wrap vendor-specific logic.
- **Action Items**:
  1. Relocate vendor-specific SDK integrations to `core/adapters/` (e.g., Razorpay, ZeptoMail, Cloudinary).
  2. Rename integrations to suffix `Adapter` (e.g. `RazorpayAdapter`).

### Phase D: Infrastructure Consolidation
- **Primary Goal**: Group remaining caches and queues by capability.
- **Action Items**:
  1. Group cache adapters into `core/infrastructure/cache/`.
  2. Group message queue adapters into `core/infrastructure/messaging/`.
