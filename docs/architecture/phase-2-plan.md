# Phase 2 — Execution Plan

**Date:** 2026-07-21
**Strategy:** Three small PRs, not one large one.

---

## PR 1: Listing Forms Consolidation

**Goal:** Merge `PostServiceForm` + `PostSparePartForm` via `ListingFormConfig`

**Files to create:**
- `components/user/shared/ListingForm.tsx` — single config-driven form component
- `components/user/shared/ListingFormConfig.ts` — type def + configs for service + spare part
- `components/user/shared/useListingFormOrchestration.ts` — replaces both orchestration hooks

**Files to modify:**
- `post-service/page.tsx` — use `<ListingForm config={serviceConfig} />`
- `post-spare-part-listing/page.tsx` — use `<ListingForm config={sparePartConfig} />`
- `edit-service/[id]/page.tsx` — pass `editServiceId`
- `edit-spare-part/[id]/page.tsx` — pass `editSparePartId`

**Files to remove:**
- `components/user/post-service/PostServiceForm.tsx`
- `components/user/post-spare-part/PostSparePartForm.tsx`
- `components/user/post-service/hooks/usePostServiceFormOrchestration.ts`
- `components/user/post-spare-part/hooks/usePostSparePartFormOrchestration.ts`

**Estimated: ~350 lines removed, ~150 lines added.**

**Risk:** Medium. Verify both create and edit flows for service and spare parts.

---

## PR 2: Catalog — Shared CRUD + Delete Dialog

**Goal:** Consolidate catalog admin patterns

**Tasks:**

| Task | Files | Impact |
|---|---|---|
| Extract `DeleteConfirmDialog` | All 5 catalog tabs (Categories, Brands, SpareParts, ServiceTypes, ScreenSizes) | 5 inline modals → 1 shared component |
| Extract `useCatalogQuery` generic hook | `useBrandCatalog`, `useServiceTypeCatalog`, `useSparePartCatalog`, `useCategorySchemaCatalog` | 5 hooks → 1 generic + 5 thin wrappers (or inlined) |
| Consolidate query keys for service + spare part | `queryKeys.ts` | Generated via `entityKeys('services')` |
| Migrate `useAdminLocations` to `useAdminCatalogCollection` | `useAdminLocations.ts` | Align with admin CRUD patterns |

**Risk:** Low-Medium. Pure extraction with no behavioral change.

---

## PR 3: Business Modals + Remaining Fixes

**Goal:** Consolidate business modals and deferred fixes

**Tasks:**

| Task | Files | Impact |
|---|---|---|
| Remove `BusinessRejectModal` / `BusinessSuspendModal` wrappers | 2 files deleted | Use `BusinessReasonModal` directly |
| Extract shared `stringId` / `requiredStringId` | 2 schema files | Shared constants |
| Fix `ListingDescriptionCard` dual-mount | `ListingDetail.tsx` | Single responsive component |
| Audit `listingMediaAPI.ts` for dead code | 1 file | Remove unused S3 upload path |
| Lazy load `AdImageCarousel` + `SearchFiltersPanel` | 2 dynamic imports | Performance |

**Risk:** Low. Straightforward extractions and lazy loading.

---

## Out of Scope for Phase 2

These items require more significant architectural decisions and are deferred:

| Item | Reason |
|---|---|
| Post Ad architecture alignment | Compatibility audit shows ~47% similarity — not justified |
| PostAdProvider useReducer | Profiling needed first (no evidence of bottleneck) |
| AdminSidebar focus/scroll/escape | Pre-existing, separate accessibility PR |
| Carousel thumbnail optimization | Performance optimization, separate PR |
