# Esparex Project Changelog

All notable milestones and architectural transitions for the Esparex Platform.

---

## [1.0.0] - 2026-07-18
### Added
- Created `@esparex/contracts` as the Single Source of Truth (SSOT) leaf package.
- Setup strict Dependency Cruiser rule to enforce the isolation of contracts as a true leaf.
- Configured modular tsconfig references and mapped path aliases for test runtimes.
- Captured Repository Baseline v2.0 (0 TS errors, 0 circular dependencies, 566/566 passing tests).
- Tagged release `arch-milestone/contracts-migration-v1.0`.

### Deprecated
- Marked `@esparex/shared` contracts proxy as deprecated.

### Removed
- Deleted legacy contract folders (`shared/src/enums/`, `shared/src/schemas/`, `shared/src/types/`, and `shared/src/contracts/chat.contracts.ts`).

---

## [0.5.0] - 2026-07-13
### Added
- Split the monolithic backend into two isolated workspaces: `backend/api` and `core`.
- Restructured `core` into discrete DDD bounded contexts (`catalog`, `listings`, `chat`, `identity`, `location`).
- Enforced Ports & Adapters boundary, ensuring that application services interact with Mongoose schemas only via abstract Repository Ports.
- Introduced BullMQ queue engine for asynchronous integration events.
- Setup pre-commit lint and route collision guards.
