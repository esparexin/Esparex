# Changelog

All notable changes to the Esparex Platform will be documented in this file.

---

## [2.7.0] - 2026-07-21

### Added
- **Boosts Bounded Context Isolation (M2.7):** Extracted `BoostService`, `PromotionPolicyService`, and `AdSlotService` into a dedicated domain boundary under `core/src/domains/boosts/`.
- **100% Backward-Compatible Compatibility Shims:** Added 1-line re-export shims in `core/src/services/` (`BoostService.ts`, `PromotionPolicyService.ts`, `AdSlotService.ts`) maintaining zero breaking changes.
- **Milestone Verification Tag:** Tagged release milestone `architecture-m2.7` passing all 10 repository gate checks and 100/100 architecture verification score.

---

## [2.6.0] - 2026-07-21

### Added
- **Fraud & Trust Bounded Context Isolation (M2.6):** Created dedicated domain boundaries under `core/src/domains/fraud/` (`FraudDetectionService`, `SpamDetectorService`, `DuplicateRolloutGuard`) and `core/src/domains/trust/` (`TrustService`).
- **100% Backward-Compatible Compatibility Shims:** Added 1-line re-export shims in `core/src/services/` (`FraudDetectionService.ts`, `TrustService.ts`, `SpamDetectorService.ts`, `DuplicateRolloutGuard.ts`) maintaining zero breaking changes for existing consumers.
- **Milestone Verification Tag:** Tagged release milestone `architecture-m2.6` passing all 10 repository gate checks and 100/100 architecture verification score.

---

## [2.5.0] - 2026-07-15

### Added
- **Developer Architecture Guide (`ARCHITECTURE.md`):** Added a root-level guide documenting Bounded Context topology, Ports & Adapters naming suffixes, and implementation patterns (Repository, UnitOfWork, Caching, and Composition Roots).
- **Bounded Context Migration Workflow (`.agents/workflows/bounded_context_migration.md`):** Established a repeatable 10-step template (Discovery, Repository Audit, Port Design, Adapter Implementation, UnitOfWork, Cache Decoupling, Controller Cleanup, Architecture Audit, Release Gate, and Pull Request) for all future domain modernizations.
- **Listings Cache Boundary:** Introduced `ListingsCachePort` and its concrete `RedisListingsCacheAdapter` implementation to isolate Redis primitives.
- **Listings Transaction Boundary:** Implemented `ListingUnitOfWorkPort` and `MongoListingUnitOfWorkAdapter` to encapsulate Mongoose sessions.

### Changed
- **Listings Bounded Context DDD Migration (#109):** Transitioned Listings services and controllers to DDD Ports & Adapters architecture. Removed direct database model (`AdModel`) and Mongoose/Redis client imports from core services and middleware utilities.
- **Catalog Bounded Context DDD Migration (#108):** Successfully migrated Catalog core entity validations, middlewares, and controllers to decouple database frameworks.
- **Workspace Configuration:** Updated root `README.md` and `.agents/AGENTS.md` guidelines to link to the new architecture standards.

### Deferred (Future Modernization Candidates)
- Auth Bounded Context Migration
- Wallet Bounded Context Migration
- Notifications Bounded Context Migration
- Payments Bounded Context Migration
- Smart Alerts Bounded Context Migration
- Domain Port Purity Audit (Location ports importing Mongoose query types)
