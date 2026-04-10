# QUALITY FIX PLAN
# Esparex — Structured Refactor Backlog

**Command to use for every task:** `/quality-fix`  
**Rule:** One task per session. Mark checkbox when build passes. Never combine tiers.  
**Last updated:** 2026-04-10

---

## EXECUTION ORDER

| # | Tier | File / Target | Effort |
|---|------|---------------|--------|
| 1 | 3 | `mongoosePlugins.ts` — replace 3× `any` with interface | Quick |
| 2 | 3 | `redisCache.ts` — extract 3 private helpers | Quick |
| 3 | 3 | Controller DB queries — add `adService.assertOwnership()` | Quick |
| 4 | 2 | `listings.ts` — split into 6 modules | Medium |
| 5 | 2 | `ListingDetail.tsx` — extract 4 hooks | Medium |
| 6 | 2 | `BrowseAds.tsx` — extract 3 hooks + 1 utility | Medium |
| 7 | 2 | `PostAdContext.tsx` — extract 4 hooks | Medium |
| 8 | 2 | `DataTable.tsx` — extract 4 subcomponents | Medium |
| 9 | 2 | `taxonomy/page.tsx` — extract 3 subcomponents + 1 utility | Medium |
| 10 | 1 | `AdQueryService.ts` — split into 5 services | Large |
| 11 | 1 | `LocationService.ts` — split into 6 services | Large |

---

## TIER 3 — QUICK WINS

### Task 1 — `backend/src/config/mongoosePlugins.ts` — Type safety
- [ ] Read the full file
- [ ] Define `MongooseHookContext` interface **once** at the top of the file:
  ```ts
  interface MongooseHookContext {
    model?: { modelName: string };
    _startTime?: [number, number];
    op?: string;
  }
  ```
- [ ] Replace `this: any` at line 65 → `this: MongooseHookContext`
- [ ] Replace `this: any` at line 91 → `this: MongooseHookContext`
- [ ] Replace `this: any` at line 95 → `this: MongooseHookContext`
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass
- [ ] No other files touched

---

### Task 2 — `backend/src/utils/redisCache.ts` — Reduce nesting depth (10 → ~4)
- [ ] Read the full file
- [ ] Extract lines 497–517 into private function `auditKeyTtl(key: string): Promise<void>`
- [ ] Extract lines 304–319 into private function `scanAndDeleteBatch(pattern: string): Promise<number>`
- [ ] Extract line 408 template literal into private function `buildProbeKey(pattern: string): string`
- [ ] Replace original inline code with calls to the new functions
- [ ] Zero logic change — same inputs, same outputs, same error handling
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass
- [ ] No other files touched

---

### Task 3 — Controller DB queries → `adService.assertOwnership()`
- [ ] Read `backend/src/services/AdService.ts` (or equivalent) to find correct place to add the method
- [ ] Add to the service:
  ```ts
  async assertOwnership(adId: string, userId: string): Promise<void> {
    const ad = await AdModel.findById(adId).select('sellerId');
    if (!ad) throw new NotFoundError('Ad not found');
    if (String(ad.sellerId) !== String(userId)) throw new ForbiddenError('Not your ad');
  }
  ```
- [ ] Read `backend/src/controllers/ad/adMutationController.ts` line 136 — replace inline `AdModel.findById` with `adService.assertOwnership(id, req.user.id)`
- [ ] Read `backend/src/controllers/ad/adUserController.ts` line 95 — same replacement
- [ ] Read `backend/src/controllers/ad/adUserController.ts` line 218 — same replacement
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass
- [ ] Confirm: 0 remaining raw `AdModel.findById` for ownership checks in controllers

---

## TIER 2 — MEDIUM EXTRACTIONS

### Task 4 — `frontend/src/lib/api/user/listings.ts` → Split into 6 modules

**Target structure** (new folder, NOT duplicate of original):
```
frontend/src/lib/api/user/listings/
  normalizer.ts         ← normalizeListing(), ID validation, payload unwrapping
  listingDetailAPI.ts   ← single fetch, view tracking, analytics
  listingDiscoveryAPI.ts ← paginated search, home feed, trending, suggestions
  listingMutationAPI.ts ← create, update, delete, mark sold, repost, deactivate
  listingMediaAPI.ts    ← presigned URLs, S3 upload, image management
  userListingsAPI.ts    ← user's own listings, stats dashboard
  index.ts              ← barrel re-export (replaces original listings.ts)
```

**Steps:**
- [ ] Read `listings.ts` in full — note line ranges per domain
- [ ] Create `listings/` subfolder
- [ ] Create `normalizer.ts` — move `normalizeListing()` + ID validation + payload helpers (lines 17–264)
- [ ] Create `listingDetailAPI.ts` — move detail fetch + view tracking + analytics (lines 325–375)
- [ ] Create `userListingsAPI.ts` — move user's listings + stats (lines 378–465)
- [ ] Create `listingDiscoveryAPI.ts` — move paginated search + feed + trending + suggestions (lines 530–699)
- [ ] Create `listingMutationAPI.ts` — move create/update/delete/repost/markSold/deactivate (lines 725–835)
- [ ] Create `listingMediaAPI.ts` — move presigned URLs + S3 upload + image management (lines 856–893)
- [ ] All modules import `normalizeListing` from `./normalizer` — never inline it again
- [ ] Create `index.ts` barrel that re-exports everything from all 6 modules
- [ ] Replace original `listings.ts` content with: `export * from './listings/index'`
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass
- [ ] Verify: no call site in the app needs an import path change (barrel maintains contract)

---

### Task 5 — `frontend/src/components/user/ListingDetail.tsx` → Extract 4 hooks

**Target structure** (new files alongside component, same folder):
```
frontend/src/components/user/
  ListingDetail.tsx              ← slimmed to ~200 lines
  hooks/useViewTracking.ts       ← view counting with ref-based dedup
  hooks/useAdStatus.ts           ← adStatus computation + override logic
  hooks/usePhoneReveal.ts        ← phone state, reveal API call, masking
  hooks/useAnalyticsDialog.ts    ← analytics data load, dialog open/close
```

**Steps:**
- [ ] Read `ListingDetail.tsx` in full
- [ ] Extract view-tracking logic (lines 232–291) into `hooks/useViewTracking.ts` — returns nothing, side-effect only
- [ ] Extract adStatus computation (lines 162–191, 133–138) into `hooks/useAdStatus.ts` — returns `{ adStatus, isOwner, isSold }`
- [ ] Extract phone state + reveal logic (lines 425–478) into `hooks/usePhoneReveal.ts` — returns `{ phone, isRevealed, revealPhone, isRevealing }`
- [ ] Extract analytics dialog logic (lines 123–124, 203–230, 406–423) into `hooks/useAnalyticsDialog.ts` — returns `{ open, data, loading, openDialog, closeDialog }`
- [ ] Import and call each hook in `ListingDetail.tsx` at the same position the inline code was
- [ ] Confirm: all state and handler references in JSX still resolve correctly
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

### Task 6 — `frontend/src/components/user/BrowseAds.tsx` → Extract 3 hooks + 1 utility

**Target structure:**
```
frontend/src/components/user/
  BrowseAds.tsx                  ← slimmed ~200 lines
  hooks/useFilterState.ts        ← consolidates 10+ filter useState calls
  hooks/useUrlSync.ts            ← URL ↔ filter state bidirectional sync
  hooks/useFilterToQuery.ts      ← pure UI state → API payload conversion
  hooks/useBrowseEmptyState.ts   ← badge/title/description derivation
```

Also:
- [ ] Move module-level `categoriesRequest` singleton cache to a `lib/cache/catalogCache.ts` utility (or existing catalog context if one exists — check before creating)

**Steps:**
- [ ] Read `BrowseAds.tsx` in full
- [ ] Identify all `useState` filter declarations (lines 101–121) — move into `useFilterState` returning `[filters, setters]` via a reducer
- [ ] Extract URL sync logic (lines 319–398) into `useUrlSync(filters, setFilters)` — side-effect hook, no return value
- [ ] Extract filter-to-query logic (lines 156–209) into `useFilterToQuery(filters)` — pure function returning `ListingFilters`; can be a plain function, not a hook, if no React state
- [ ] Extract empty-state logic (lines 266–297) into `useBrowseEmptyState(results, filters)` — returns `{ badges, title, description }`
- [ ] Grep for `categoriesRequest` — if defined only in `BrowseAds.tsx`, move to `lib/cache/catalogCache.ts`; if already elsewhere, import it
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

### Task 7 — `frontend/src/components/user/post-ad/PostAdContext.tsx` → Extract 4 hooks

**Target structure:**
```
frontend/src/components/user/post-ad/
  PostAdContext.tsx               ← context wiring + value assembly only
  hooks/usePostAdFormNormalization.ts  ← normalizeIdentityFieldsBeforeSubmit + buildEditAdPayload
  hooks/useImageUploadWorkflow.ts      ← S3 pre-upload, error recovery
  hooks/usePostAdAiGeneration.ts       ← AI content call, error handling, brand resolution
  hooks/useCategoryDependents.ts       ← field resets on category/brand change + requiresScreenSize
```

**Steps:**
- [ ] Read `PostAdContext.tsx` in full
- [ ] Extract `normalizeIdentityFieldsBeforeSubmit` + `buildEditAdPayload` (lines 302–353) into `usePostAdFormNormalization` — returns `{ normalizeFields, buildEditPayload }`
- [ ] Extract S3 image pre-upload logic (lines 589–625) into `useImageUploadWorkflow` — returns `{ uploadImages }`
- [ ] Extract AI generation call + error handling (lines 464–499) into `usePostAdAiGeneration` — returns `{ generateContent, isGenerating, error }`
- [ ] Extract `handleCategoryChange` + `handleBrandChange` + `requiresScreenSize` (lines 284–294, 429–459) into `useCategoryDependents(form)` — returns `{ handleCategoryChange, handleBrandChange, requiresScreenSize }`
- [ ] Provider body becomes: import hooks → wire into context value
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

### Task 8 — `admin-frontend/src/components/ui/DataTable.tsx` → Extract 4 subcomponents

**Target structure** (same file or co-located, choose co-located to keep file small):
```
admin-frontend/src/components/ui/
  DataTable.tsx           ← orchestration only (~100 lines)
  DataTableToolbar.tsx    ← column visibility menu + search input (~60 lines)
  DataTableBody.tsx       ← virtualized tbody + row/cell loop
  DataTablePagination.tsx ← pagination footer + buttons (~50 lines)
  DataTableRow.tsx        ← single virtualized row with ref + onClick
```

**Steps:**
- [ ] Read `DataTable.tsx` in full
- [ ] Extract toolbar section (lines 161–222) into `DataTableToolbar` — props: `{ columns, globalFilter, onGlobalFilterChange }`
- [ ] Extract virtualized tbody (lines 223–301) into `DataTableBody` — props: `{ virtualItems, rows, visibleColumns, rowVirtualizer, onRowClick }`
- [ ] Extract pagination footer (lines 304–354) into `DataTablePagination` — props: `{ table, totalRows }`
- [ ] Extract single row (lines 264–282) into `DataTableRow` — props: `{ virtualRow, row, visibleColumns, onRowClick }`
- [ ] `DataTable.tsx` imports and composes all four
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass
- [ ] Confirm: nesting level drops from 9 to ≤4

---

### Task 9 — `admin-frontend/src/app/(protected)/(catalog)/taxonomy/page.tsx` → Extract 3 subcomponents + 1 utility

**Target structure** (co-located in the same `taxonomy/` folder):
```
admin-frontend/src/app/(protected)/(catalog)/taxonomy/
  page.tsx              ← orchestration only (~100 lines, nesting ≤4)
  CategoryTreeRow.tsx   ← category button + expand toggle (~20 lines)
  BrandTreeRow.tsx      ← brand button + expand toggle (~15 lines)
  ModelListItem.tsx     ← model item + status badge (~18 lines)
  modelStatusClassName.ts ← pure fn: (status: string) => string
```

**Steps:**
- [ ] Read `page.tsx` in full
- [ ] Extract `modelStatusClassName` ternary (lines 268–274) into `modelStatusClassName.ts` as a pure exported function
- [ ] Extract category row JSX + toggle (lines 202–223) into `CategoryTreeRow` component
- [ ] Extract brand row JSX + toggle (lines 236–251) into `BrandTreeRow` component
- [ ] Extract model list item JSX (lines 260–278) into `ModelListItem` — uses `modelStatusClassName`
- [ ] `page.tsx` renders `<CategoryTreeRow>` → `<BrandTreeRow>` → `<ModelListItem>` with existing data flow
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass
- [ ] Confirm: nesting level drops from 11 to ≤4

---

## TIER 1 — LARGE SERVICE SPLITS

### Task 10 — `backend/src/services/AdQueryService.ts` → Split into 5 services

**Target structure:**
```
backend/src/services/ad/
  _shared/adFilterHelpers.ts    ← shared filter builders, blocked seller helper, status normalization
  AdSearchService.ts            ← filter building, match stages, listing type compatibility (lines 120–366)
  AdAggregationService.ts       ← pipeline construction, geo/ranking, ad hydration (lines 381–1038)
  AdMetricsService.ts           ← status counts, moderation summaries, seller stats (lines 1039–1120)
  AdDetailService.ts            ← single lookups, slug resolution, admin queries (lines 1172–1396)
  AdFeedService.ts              ← home feed, trending, suggestions (lines 1423+)
backend/src/services/AdQueryService.ts  ← KEPT as re-export facade (do NOT delete yet)
```

**Steps:**
- [ ] Read `AdQueryService.ts` in full — note all exports and their line ranges
- [ ] Create `backend/src/services/ad/` folder
- [ ] Create `_shared/adFilterHelpers.ts` — move: blocked seller filter, status normalization helpers, any utility functions shared by 2+ services
- [ ] Create `AdSearchService.ts` — move search + filter building logic
- [ ] Create `AdAggregationService.ts` — move aggregation pipeline logic
- [ ] Create `AdMetricsService.ts` — move count/stats logic
- [ ] Create `AdDetailService.ts` — move single-ad lookup + slug resolution
- [ ] Create `AdFeedService.ts` — move home feed + trending + suggestions
- [ ] Each service imports what it needs from `_shared/adFilterHelpers.ts`
- [ ] Update `AdQueryService.ts` to be a pure re-export barrel: `export * from './ad/AdSearchService'; export * from './ad/AdAggregationService'; ...`
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass with facade in place
- [ ] Grep for all imports of `AdQueryService` — confirm they all resolve through the facade
- [ ] After all call sites verified → delete inline code from facade, confirm build still passes
- [ ] **Do NOT delete `AdQueryService.ts` itself** until confirmed by a separate session

---

### Task 11 — `backend/src/services/LocationService.ts` → Split into 6 services

**Target structure:**
```
backend/src/services/location/
  _shared/hierarchyLoader.ts       ← shared hierarchy loading utility (imported by Hierarchy + ReverseGeocode)
  LocationNormalizer.ts            ← input coercion, response formatting (lines 289–442)
  LocationSearchService.ts         ← Atlas full-text search, fuzzy matching, autocomplete (lines 736–918)
  LocationAnalyticsService.ts      ← touch tracking, event logging, popularity scoring (lines 475–571)
  LocationHierarchyService.ts      ← tree traversal, parent-child relationships (lines 931–1080)
  ReverseGeocodeService.ts         ← coordinate→location, boundary matching, caching (lines 1081–1161)
  LocationDataService.ts           ← pincode lookup, ingestion, Nominatim API calls (lines 573–705)
backend/src/services/LocationService.ts  ← KEPT as re-export facade (do NOT delete yet)
```

**Steps:**
- [ ] Read `LocationService.ts` in full — note all exports and line ranges
- [ ] Create `backend/src/services/location/` folder
- [ ] Create `_shared/hierarchyLoader.ts` — move shared hierarchy loading logic used by both `LocationHierarchyService` and `ReverseGeocodeService`
- [ ] Create `LocationNormalizer.ts` — move normalization + formatting
- [ ] Create `LocationAnalyticsService.ts` — move touch tracking + event logging
- [ ] Create `LocationDataService.ts` — move data ingestion + pincode lookup + Nominatim calls
- [ ] Create `LocationSearchService.ts` — move search + fuzzy matching + autocomplete
- [ ] Create `LocationHierarchyService.ts` — move tree traversal + parent-child navigation
- [ ] Create `ReverseGeocodeService.ts` — move reverse geocoding + boundary matching
- [ ] `LocationHierarchyService` and `ReverseGeocodeService` both import from `_shared/hierarchyLoader.ts` — never duplicate the loader
- [ ] Update `LocationService.ts` to be a pure re-export barrel
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass
- [ ] Grep for all `LocationService` imports — confirm all resolve through facade
- [ ] **Do NOT delete `LocationService.ts`** until a follow-up session confirms all imports migrated

---

## COMPLETION CHECKLIST

When all 11 tasks are checked above, run this final verification:

- [ ] `npx tsc --noEmit` passes in `backend/`
- [ ] `npx tsc --noEmit` passes in `frontend/`
- [ ] `npx tsc --noEmit` passes in `admin-frontend/`
- [ ] `grep -r "AdQueryService\|LocationService" backend/src --include="*.ts" | grep -v "facade\|index"` returns only the facade files
- [ ] `grep -rn ": any" backend/src/config/mongoosePlugins.ts` returns 0 results
- [ ] `grep -rn "AdModel.findById" backend/src/controllers` returns 0 results (all moved to service)
- [ ] No new files were created that duplicate logic from existing files

---

## DUPLICATION PREVENTION RULES (never violate)

1. `normalizeListing()` lives ONLY in `frontend/src/lib/api/user/listings/normalizer.ts`
2. `MongooseHookContext` interface lives ONLY in `mongoosePlugins.ts`
3. `adService.assertOwnership()` lives ONLY in the ad service — controllers never do raw ownership queries
4. `_shared/adFilterHelpers.ts` — filter builders live here only, NOT copied into each split service
5. `_shared/hierarchyLoader.ts` — hierarchy loader lives here only
6. Extracted hooks live alongside their consuming component — never in a global `/hooks` directory unless already shared across 3+ components
7. Re-export facades are TEMPORARY — track and remove after all call sites migrated
