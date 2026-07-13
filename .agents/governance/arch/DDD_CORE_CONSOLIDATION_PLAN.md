# Execution Plan: DDD Core Consolidation

**Module**: 6D of 6 — Architecture Governance Framework
**Last Updated**: 2026-07-13
**Related Decisions**: [ADR-007](../../decisions/ADR-007-monorepo-package-topology.md), [ADR-008](../../decisions/ADR-008-domain-architecture-and-bounded-contexts.md)

---

## 1. Overview & Objectives

This document maps the concrete, file-by-file refactoring steps to relocate the flat services in `@esparex/core` into bounded DDD contexts inside `core/domains/` and capabilities inside `core/infrastructure/`, `core/adapters/`, and `core/foundation/`.

The primary objectives are:
1. **No PR Overlap**: Migrate files incrementally to prevent merge conflicts.
2. **Zero Runtime Regression**: Maintain a fully green test suite after every single commit/PR.
3. **Automated Verification**: Protect boundaries via CI checks at every gate.

---

## 2. Current to Target Folder Mapping

| Current File/Folder | Target Directory | Responsibility |
|---|---|---|
| `core/src/services/` (flat 90+ files) | `core/src/domains/<domain>/` | Bounded context directories |
| `core/src/models/` (Mongoose Schemas) | `core/src/infrastructure/persistence/mongo/` | Database implementations |
| `core/src/config/` (infrastructure boot) | `core/src/infrastructure/` | Cache, queues, configurations |
| `core/src/utils/` (general helpers) | `core/src/foundation/` | Basic primitives & value objects |
| `core/src/jobs/` (BullMQ workers) | `core/src/infrastructure/messaging/` | Async job queue adapters |

---

## 3. Sprint Refactoring Sequence (20-40 Small PRs)

To prevent repository-wide disruption, migration runs sequentially through 4 primary milestones:

### Sprint 1: Catalog & Listings Domain Consolidation (PRs 1-10)
- **PR 1**: Create `core/src/domains/catalog/` folders and manifest.
- **PR 2**: Move `CategoryResolutionPolicy.ts` and `CatalogSearchGovernanceService.ts` to `catalog/domain/services/`.
- **PR 3**: Move `catalogRequestApprovalService.ts` to `catalog/application/`.
- **PR 4**: Create `catalog/ports/CategoryRepositoryPort.ts` and declare interface.
- **PR 5**: Create `catalog/index.ts` barrel file exporting public facades.
- **PR 6**: Create `core/src/domains/listings/` directories.
- **PR 7**: Move Listing services (`AdCreationService`, `AdUpdateService`, `AdRepostService`, `AdValidationService`, `AdQueryService`).
- **PR 8**: Create `listings/ports/ListingRepositoryPort.ts`.
- **PR 9**: Move `ListingModerationQueryService` and `SavedAdService`.
- **PR 10**: Create `listings/index.ts` public barrel file.

### Sprint 2: Monetization & Social Domains (PRs 11-20)
- **PR 11**: Create `core/src/domains/payments/` directory.
- **PR 12**: Move `PaymentProcessingService.ts` and `PaymentWebhookService.ts`.
- **PR 13**: Define `PaymentGatewayPort.ts` inside `payments/ports/`.
- **PR 14**: Create `core/src/domains/chat/` directory.
- **PR 15**: Move `chatService.admin.ts` and `chatAvailabilityService.ts`.
- **PR 16**: Create `core/src/domains/users/` directory.
- **PR 17**: Move `UserStatusService.ts` and `AuthService.ts`.
- **PR 18**: Create `core/src/domains/moderation/` directory.
- **PR 19**: Move `FraudDetectionService.ts` and `ReportService.ts`.
- **PR 20**: Generate index barrels for payments, chat, users, moderation.

### Sprint 3: Ports, Adapters, & Infrastructure Relocation (PRs 21-30)
- **PR 21**: Create `core/src/infrastructure/persistence/mongo/` and move Mongoose models.
- **PR 22**: Move `db.ts` database bootstrapping to `infrastructure/persistence/`.
- **PR 23**: Relocate external SDK calls into `core/src/adapters/outbound/`.
- **PR 24**: Create `RazorpayAdapter.ts` in `core/src/adapters/outbound/` implementing `PaymentGatewayPort`.
- **PR 25**: Create `ZeptoMailAdapter.ts` implementing `EmailPort`.
- **PR 26**: Create `CloudinaryStorageAdapter.ts` implementing `StoragePort`.
- **PR 27**: Relocate Redis configuration to `core/src/infrastructure/cache/redis/`.
- **PR 28**: Relocate BullMQ queues to `core/src/infrastructure/messaging/bullmq/`.
- **PR 29**: Create `core/src/foundation/` and relocate Result, Money, Coordinates, and base DomainErrors.
- **PR 30**: Eliminate the legacy `core/src/services/` flat folder.

---

## 4. Risk Assessment & Rollback Strategy

| Identified Risk | Severity | Mitigation Action | Rollback Strategy |
|---|---|---|---|
| **Merge Conflicts** | 🟡 Medium | Restructure domains sequentially. Do not refactor multiple contexts in parallel. | If a PR has conflicts, rebase branch immediately. Do not attempt manual conflict resolution on main. |
| **Broken Type Resolution** | 🔴 High | Run `tsc --build` locally before committing. | Revert the specific move commit using `git checkout HEAD~1 <file>` to restore type sanity. |
| **Circular Dependencies** | 🔴 High | Run `npm run guard:circular` (Madge check) on every staged file. | Revert imports that cross-domain boundaries and expose the required API via the index barrel instead. |
| **Namespace Collisions** | 🟡 Low | Suffix all relocated services and models explicitly by domain. | Suffix with domain identifiers (e.g. `ListingMongooseModel`). |

---

## 5. Verification Checklist (Post-PR Gate)

Before a refactoring PR can be merged, the developer must verify the checklist:

- [ ] **Build compiles**: `npm run build` runs successfully with zero warnings.
- [ ] **Tests pass**: `npm test` passes all 540 automated unit tests.
- [ ] **No deep imports**: Static linter verifies no files import from subdirectories under `domains/*/`.
- [ ] **No circular paths**: `npm run guard:circular` outputs 0 circular dependency trees.
- [ ] **No direct DB imports in domains**: `verify-domain-coupling.ts` confirms 0 Mongoose/Mongo references inside the domains folder.
- [ ] **Manifest validation**: `verify-manifests.ts` verifies `manifest.yaml` structure and stability tags.
