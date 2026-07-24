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

# What is a Legacy Proxy Path?

A Legacy Proxy Path is a thin re-export file located under:

```text
core/src/services/
```

whose only responsibility is forwarding exports to the canonical domain implementation.

Example:

```typescript
export * from "../domains/listings/application/ad/AdCreationService";
```

The file contains no business logic and exists only to preserve legacy import paths.

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

# Architecture Principle

Every service must have a single canonical location.

Preferred:

```text
@esparex/core/domains/<domain>/application/...
```

Avoid:

```text
@esparex/core/services/...
```

The `core/services` directory should never become a permanent abstraction layer.

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

# Migration Governance Workflow

Every proxy retirement should follow the same controlled process.

## Phase 1 — Identify

Verify the file is a pure re-export with no executable logic.

---

## Phase 2 — Dependency Discovery

Locate every consumer.

Search:

* Application imports
* Backend controllers
* Workers
* Jobs
* Scheduled tasks
* Admin
* Web
* Mobile
* Unit tests
* Integration tests
* Jest mocks

---

## Phase 3 — Canonical Migration

Replace every legacy import with the domain path.

Application:

```text
@esparex/core/domains/<domain>/application/...
```

Testing:

Update every

```text
jest.mock(...)
```

to reference the canonical domain path.

---

## Phase 4 — Verification

Only after every consumer has migrated:

* Delete proxy
* Type check
* Run tests
* Build repository
* Verify no remaining references
* Merge

---

# Repository Governance Rule

The following rule becomes part of the Esparex engineering standards:

> **Canonical Domain Imports Only**  
> All new implementations must import services directly from their canonical Domain-Driven Design (DDD) location under `@esparex/core/domains/*`. Importing services from `@esparex/core/services/*` is prohibited when an equivalent domain implementation exists. Legacy proxy bridges are transitional compatibility artifacts and must be retired incrementally through audited, domain-focused pull requests. No new proxy files may be introduced without explicit architectural approval.

---

# Long-Term Objective

The target architecture is:

```text
Consumers
        │
        ▼
Domain Application Services
        │
        ▼
Domain Layer
        │
        ▼
Infrastructure
```

There should be no permanent dependency on:

```text
core/services/
```

Once all legacy proxy bridges are retired, the `core/services` directory should either be removed entirely or reserved exclusively for genuine cross-domain orchestration services that cannot logically belong to a single bounded context. This preserves SSOT, reinforces DDD boundaries, simplifies dependency management, and ensures a clean, maintainable architecture as the Esparex platform continues to evolve.
