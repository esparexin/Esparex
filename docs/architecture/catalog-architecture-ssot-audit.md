# ESPAREX ENTERPRISE CATALOG ARCHITECTURE & SSOT AUDIT

**Scope:** Device Catalog + Admin Dashboard + User Frontend + APIs + Database + RBAC  
**Audit Standard:** Single Source of Truth (SSOT), Evidence-Gated Code Cleanup, Root Cause Fix Only

---

## 1. Executive Summary

A comprehensive architectural audit of the Esparex catalog engine was conducted across all monorepo layers (`apps/web`, `apps/admin`, `packages/contracts`, `backend/api`, `core/src`).

### Key Audit Findings
1. **Category Hierarchy (`parentId`)**: Category hierarchy relies on `parentId: ObjectId` (referencing `Category`). Tree resolution is depth-bounded (max depth = 5) in `CatalogCategoryService.ts`. Cycle prevention is enforced via `validateCategoryParentHierarchy`.
2. **`status` vs `isActive` Domain Boundaries**:
   - `status` (string enum: `live`, `pending`, `archived`) represents the **Business Lifecycle State**.
   - `isActive` (boolean) represents the **Operational Availability Toggle**.
   - `CatalogCategoryService.ts` explicitly queries `{ isActive: true, isDeleted: { $ne: true }, status: CATALOG_STATUS.LIVE }`. Dual status fields serve distinct operational roles and must NOT be merged.
3. **`sortOrder` Field Usage**:
   - `sortOrder` exists in `Category.ts` and `SparePart.ts` for Admin UI table curation (`CategoriesTab.tsx`, `SparePartsTab.tsx`).
   - Public frontend navigation (`apps/web`) sorts alphabetically by `canonicalName` or by `marketplaceTrust` score. `sortOrder` is retained strictly for administrative curation.
4. **Permission-First RBAC**:
   - Authorization relies on `requireAdmin` token verification and fine-grained `requirePermission(permission)` checks against string permission arrays (`admin.permissions`).
   - Hardcoding granular job titles into the `Role` enum is rejected to prevent role explosion.
5. **Validation Duplication**: Admin UI forms (`apps/admin/src/schemas/admin.schemas.ts`) maintain duplicate Zod schemas instead of importing `@esparex/contracts` schemas directly.
6. **Cache Invalidation Gap**: Admin catalog mutations in `adminCatalogRoutes.ts` do not invalidate `activeCategoryCache` in `CatalogCategoryService.ts`.
7. **Pre-Delete Integrity Gap**: `Category.ts` lacks a Mongoose `deleteOne` pre-hook to prevent deleting parent categories when child subcategories or dependent entities exist.

---

## 2. 15 Enterprise Catalog Dimensions Audit

1. **Catalog Caching Strategy**: Process-level 60s in-memory cache (`activeCategoryCache`) + HTTP headers (`publicCacheControl`). Mutation invalidation gap identified.
2. **MongoDB Indexing & Collation**: Compound text indexes with field weights + case-insensitive unique indexes (`strength: 2`).
3. **N+1 & Unbounded Queries**: Bounded hierarchy traversal (`depth < 5`) + `countDocuments` 1500ms timeout fallback to `estimatedDocumentCount()`.
4. **API Response Consistency**: Serialization uses `applyToJSONTransform(Schema)` across all entities.
5. **Admin Bulk Operations**: Item-by-item admin mutations (`patch('/categories/:id')`).
6. **Optimistic Locking**: Catalog schemas set `versionKey: false`; `Ad` listings use `reviewVersion`.
7. **Catalog Approval Workflow**: State machine (`pending`, `approved`, `rejected`) + user-submitted `CatalogRequest` processing.
8. **Migration Impact Analysis**: Schema defaults (`default: []`, `default: false`) + `deprecateMethod('PATCH')` route wrappers.
9. **Parent Deletion & Cascade Behavior**: `Brand.ts` blocks delete when models exist. `Category.ts` requires pre-delete guard for child subcategories.
10. **Slug Uniqueness Enforcement**: Slugs canonicalized via `CatalogFacade.category.normalize.canonicalizeCategorySlug()`.
11. **Search Indexing**: MongoDB `$text` search with regex fallback over `slug`, `aliases`, `synonyms`.
12. **Transaction Boundaries**: Single-entity admin mutations execute without explicit multi-document sessions.
13. **Audit Log Coverage**: Administrative mutations logged to `AdminLog.ts`.
14. **Performance Impact**: In-memory category cache footprint is ~50KB.
15. **Category Hierarchy ADR**: Hard 3-level tree constraint requires product owner sign-off via ADR-004.
