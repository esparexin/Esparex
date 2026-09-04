# Catalog Cache Invalidation & Idempotency Governance Standard

## 1. Architectural Overview

This governance document defines the authoritative architecture for Catalog Entity caching, invalidation, and deletion idempotency across the Esparex Platform (`@esparex/core`, `@esparex/backend-api`, `@esparex/apps-admin`, `@esparex/apps-web`).

---

## 2. The 4-Layer Prevention Architecture

```text
Layer 1: Idempotent Domain Contracts
         ↳ Every delete operation must accept multiple invocations safely ({ alreadyDeleted: true }).
Layer 2: Comprehensive Cache Namespace Invalidation
         ↳ No entity mutation can complete without invalidating catalog:list:${entity}:* and catalog:counts:*.
Layer 3: Automated Regression Test Gate
         ↳ CI blocks PRs if delete idempotency or cache invalidation patterns drift.
Layer 4: UI State Resilience & Fallback Recovery
         ↳ Admin UI hooks handle 404/already-deleted states cleanly without UI locking.
```

---

## 3. Layer 1: Idempotent Domain Contracts

### The Problem
When Mongoose applies soft-delete filters (`{ isDeleted: { $ne: true } }`), subsequent queries for deleted items return `null`. Naive deletion logic throwing `404 Not Found` traps administrators in a delete-lockout deadlock when cached lists present soft-deleted entities.

### Mandatory Rules
1. **With-Deleted Inspection**:
   Repository ports (`CategoryRepositoryPort`, `BrandRepositoryPort`, `ModelRepositoryPort`, `SparePartRepositoryPort`) must support `includeDeleted?: boolean` in `findById` queries via `setOptions({ withDeleted: true })`.
2. **Idempotent Deletion Returns**:
   - If an entity does not exist in the database, return `404 CATEGORY_NOT_FOUND` (or respective entity error).
   - If an entity is already soft-deleted (`isDeleted === true`), re-run cascading cleanups, invalidate caches, and return `{ alreadyDeleted: true }` with HTTP 200.
   - If an entity is active, perform soft-delete, execute cascade detach/soft-deletes, invalidate caches, and return `{ alreadyDeleted: false }` with HTTP 200.

---

## 4. Layer 2: Comprehensive Cache Namespace Invalidation

### The Problem
Paginated content lists are cached under `catalog:list:${entity}:${isUrlAdmin ? 'admin' : 'public'}:${readSwitch}:${path}?${query}` with TTL up to 3600s. If mutations only purge individual detail keys, list caches continue serving stale data.

### Mandatory Invalidation Patterns
Whenever a catalog entity (Category, Brand, Model, Spare Part, Service Type, Screen Size) is created, updated, toggled, or deleted:

1. **Specific Category Mutations**:
   - `catalog:list:category:*`
   - `catalog:categories:*`
   - `catalog:list:brand:*`
   - `catalog:list:model:*`
   - `catalog:list:sparepart:*`
   - `catalog:list:*`
   - `catalog:counts:*`
2. **Specific Brand Mutations**:
   - `catalog:list:brand:*`
   - `catalog:list:model:*`
   - `catalog:list:sparepart:*`
   - `catalog:list:*`
   - `catalog:counts:*`
3. **Global Invalidation Fallback**:
   - `catalog:*`
   - `master:*`

---

## 5. Layer 3: Automated Regression Testing

All domain delete orchestrators must have unit test suites verifying:
1. Fresh soft-delete succeeds and triggers cache invalidation.
2. Idempotent delete on already soft-deleted item returns `{ alreadyDeleted: true }` without throwing.
3. Non-existent item throws 404.

---

## 6. Layer 4: Admin UI Resilience

Admin hooks (`useAdminCategories`, `useAdminCatalogCollection`) must:
1. Immediately filter out deleted items upon user action.
2. Catch edge 404 responses gracefully as "already deleted" without throwing blocking error toasts.
3. Trigger re-fetching to synchronize server pagination metadata.
