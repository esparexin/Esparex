# 🏛️ Architecture Audit: Legacy Proxy Path Elimination Strategy

**Platform:** Esparex Enterprise Marketplace  
**Audit Scope:** `@esparex/core`, `@esparex/backend-api`, `@esparex/apps-web`, `@esparex/apps-admin`  
**Architecture Standard:** SSOT · Domain-Driven Design (DDD) · Clean Architecture  
**Governance:** Clean Code · Code Quality · Repository Discipline  
**Date:** July 24, 2026  

---

# Executive Summary

This architecture audit evaluates the remaining **Legacy Proxy Paths** within the Esparex monorepo and defines the governance strategy for their systematic retirement.

Legacy proxy paths were introduced as a temporary compatibility layer during the migration from the original flat service architecture to the current Domain-Driven Design (DDD) architecture. Although they successfully reduced migration risk, they now introduce duplicate import paths, weaken Single Source of Truth (SSOT) enforcement, complicate dependency management, and increase maintenance costs.

The objective of this audit is to establish a clear migration strategy that eliminates legacy proxy bridges while preserving backward compatibility through controlled, reviewable, domain-by-domain refactoring.

---

# Architectural Decision

Legacy Proxy Paths are **temporary migration artifacts**, not permanent architectural components.

They may only exist when they satisfy **all** of the following conditions:

* The repository is actively migrating from one architecture to another.
* Immediate migration of all consumers would create unacceptable risk.
* A canonical Domain-Driven Design (DDD) implementation already exists.
* The proxy contains **no business logic**, **no configuration**, **no side effects**, and **no additional exports** beyond simple re-export statements.
* A documented migration plan exists to remove the proxy.

If any of these conditions are no longer true, the proxy must be retired.

---

# Proxy Lifecycle

Every Legacy Proxy Path should follow a defined lifecycle.

```text
Create
    │
    ▼
Temporary Compatibility Layer
    │
    ▼
Consumer Migration
    │
    ▼
Verification
    │
    ▼
Proxy Removal
    │
    ▼
Canonical Domain Import Only
```

A proxy should never become a permanent dependency.

---

# Definition of a Valid Proxy

A valid proxy is limited to forwarding exports.

Example:

```typescript
export * from "../domains/listings/application/ad/AdCreationService";
```

A proxy **must not**:

* Contain business logic
* Instantiate classes
* Export additional utilities
* Read environment variables
* Register dependencies
* Modify exports
* Add wrapper methods
* Perform logging
* Perform dependency injection

The moment additional behavior is added, the file is no longer a proxy and must be treated as a production service.

---

# Why Were Legacy Proxy Paths Introduced?

Legacy proxy paths were created as a transitional compatibility mechanism during the platform's architectural evolution.

Originally, Esparex followed a flat service structure:

```text
core/
└── services/
```

As the platform adopted Domain-Driven Design, services were reorganized into bounded contexts:

```text
core/
└── domains/
```

Immediately updating every consumer—including APIs, workers, scheduled jobs, frontend applications, administrative modules, and test suites—would have required a high-risk repository-wide refactor.

To reduce migration risk, temporary proxy files were introduced to preserve existing imports while allowing internal service relocation.

---

# Why Should Legacy Proxy Paths Be Removed?

Once migration stabilizes, these proxy files become architectural debt rather than compatibility assets.

They introduce several long-term issues:

* Duplicate import paths for the same implementation
* Multiple "sources of truth" for identical services
* Reduced architectural clarity
* Hidden dependency chains
* Increased refactoring complexity
* Jest mock resolution inconsistencies
* Higher probability of circular dependencies
* Slower repository-wide modernization

From a governance perspective, every service should have exactly one canonical import path.

---

# Architectural Constraints

The `core/src/services` directory must **never** become:

* A second application layer
* A shared utility layer
* A convenience import layer
* A dependency injection container
* A domain abstraction layer

Its only acceptable purpose during migration is temporary compatibility.

---

# Current Audit Status

## Successfully Retired

The Notifications domain has already completed migration.

Removed proxy bridges:

* NotificationService
* AdminNotificationService
* SmartAlertService

Migration activities included:

* Updating all application imports
* Updating all Jest mocks
* Updating test fixtures
* Removing legacy proxy files
* Running type checking
* Running unit tests
* Verifying production build

This domain now consumes only canonical SSOT paths.

---

# Remaining Legacy Proxy Bridges

| Domain | Legacy Proxy | Canonical Domain Service |
|---|---|---|
| Listings | AdCreationService | domains/listings/application/ad |
| Listings | AdDuplicateService | domains/listings/application/ad |
| Listings | AdSlotService | domains/boosts/application/services |
| Listings | AdValidationService | domains/listings/application/ad |
| Payments | PaymentProcessingService | domains/payments/application |
| Payments | PlanEngine | domains/payments/domain/policies |
| Payments | PlanService | domains/payments/application |
| Authentication | AuthService | domains/auth/application |
| Users | UserService | domains/users/application |
| Chat | ChatService | domains/chat/application |
| Location | LocationService | domains/location/application |

---

# Retirement Criteria

A Legacy Proxy Path can only be deleted after all of the following conditions are satisfied:

* No application imports reference the proxy.
* No backend controllers reference the proxy.
* No workers or scheduled jobs reference the proxy.
* No frontend applications reference the proxy.
* No admin modules reference the proxy.
* No mobile modules reference the proxy.
* No unit tests reference the proxy.
* No integration tests reference the proxy.
* No `jest.mock()` statements reference the proxy.
* No public package exports expose the proxy.
* All consumers have been migrated to the canonical domain path.
* Type checking passes.
* Tests pass.
* Production build succeeds.

Only then may the proxy be removed.

---

# Migration Governance Workflow

Every proxy retirement should follow the same controlled process:

## Phase 1 — Identify
Verify the file is a pure re-export with no executable logic.

## Phase 2 — Dependency Discovery
Locate every consumer across application controllers, workers, jobs, frontend modules, and Jest test mocks.

## Phase 3 — Canonical Migration
Replace every legacy import with `@esparex/core/domains/<domain>/application/...` and update `jest.mock()` path declarations.

## Phase 4 — Verification
Delete proxy file, verify zero remaining references via full monorepo type-check, unit tests, and production build.

---

# Repository Governance Rule

Every service within the Esparex platform must have **one—and only one—canonical import path**.

> **Canonical Domain Imports Only**  
> All new implementations must import services directly from their canonical Domain-Driven Design (DDD) location under `@esparex/core/domains/*`. Importing services from `@esparex/core/services/*` is prohibited when an equivalent domain implementation exists. Legacy proxy bridges are transitional compatibility artifacts and must be retired incrementally through audited, domain-focused pull requests. No new proxy files may be introduced without explicit architectural approval.

---

# Future Enforcement

To prevent new Legacy Proxy Paths from accumulating, the repository should enforce the following:

* **ESLint Rule:** Disallow imports from `@esparex/core/services/*` when an equivalent domain path exists.
* **CI Validation:** Fail builds if new proxy files are introduced without explicit architectural approval.
* **Code Review Checklist:** Reject pull requests that introduce new legacy service imports.
* **Migration Tracking:** Every proxy bridge should be linked to a GitHub issue or ADR documenting its retirement plan.
* **Repository Audit:** Periodically scan for remaining proxy bridges and verify that migration progress is measurable.

---

# Long-Term Objective

The long-term objective is to eliminate the `core/src/services` compatibility layer entirely. Once all migrations are complete, the repository should expose only canonical domain-based services, ensuring:

* A single source of truth (SSOT) for every service.
* Clear Domain-Driven Design (DDD) boundaries.
* Simplified dependency graphs.
* Predictable import paths.
* Reduced technical debt.
* Easier maintenance, testing, and future refactoring.

At that stage, `core/src/services` should either be removed from the repository or reserved exclusively for genuine cross-domain orchestration services that cannot logically belong to a single bounded context. This establishes a clean, enforceable architecture aligned with Esparex's long-term engineering governance.
