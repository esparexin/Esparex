# Changelog

All notable changes to the Esparex Platform will be documented in this file.

---

## [2.10.0] - 2026-07-22

### Added
- **Communications Bounded Context Isolation (M2.10):** Extracted `ContactService`, `ContactRevealService`, `ChatService`, `ChatAvailabilityService`, and `chat/*` (`ChatMessageService`, `ChatConversationService`, `ChatReportService`, `ChatAdminService`, `ChatUtils`) into a dedicated domain boundary under `core/src/domains/communications/`.
- **Program 1 Architecture Stabilization Phase:** Completed orphan file sweep (`0` orphans), verified dependency graph (`0` circular dependencies), verified contracts public package encapsulation (`@esparex/contracts`), and confirmed 100/100 architecture score across all 10 bounded contexts.
- **Milestone Release Tag:** Tagged release milestone `architecture-m2.10` passing all 10 repository gate checks and 100/100 architecture verification score.

---

## [2.9.0] - 2026-07-22

### Added
- **Analytics Bounded Context Isolation (M2.9):** Extracted `AnalyticsService`, `ReportService`, `ViewBufferingService`, `AuditService`, and `LocationAnalyticsService` into a dedicated domain boundary under `core/src/domains/analytics/`.
- **100% Backward-Compatible Compatibility Shims:** Added 1-line re-export shims in `core/src/services/` (`AnalyticsService.ts`, `ReportService.ts`, `ViewBufferingService.ts`, `AuditService.ts`, `location/LocationAnalyticsService.ts`) maintaining zero breaking changes.
- **Milestone Verification Tag:** Tagged release milestone `architecture-m2.9` passing all 10 repository gate checks and 100/100 architecture verification score.

---

## [2.8.0] - 2026-07-21

### Added
- **Discovery Bounded Context Isolation (M2.8):** Extracted `FeedService`, `FeedDecisionEngine`, `SavedSearchService`, `TrendingService`, and sub-level feed/savedSearch helpers into a dedicated domain boundary under `core/src/domains/discovery/`.
- **100% Backward-Compatible Compatibility Shims:** Added 1-line re-export shims in `core/src/services/` (`FeedService.ts`, `FeedDecisionEngine.ts`, `SavedSearchService.ts`, `TrendingService.ts`, `feed/*`, `savedSearch/*`) maintaining zero breaking changes.
- **Milestone Verification Tag:** Tagged release milestone `architecture-m2.8` passing all 10 repository gate checks and 100/100 architecture verification score.

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
