# QUALITY FIX PLAN
# Esparex — Structured Refactor Backlog

**Command to use for every task:** `/quality-fix`
**Rule:** One task per session. Mark checkbox when build passes. Never combine tiers.
**Last updated:** 2026-04-10

---

## ROUND 1 — COMPLETED ✅

All 11 tasks verified complete. All three workspaces pass `tsc --noEmit` clean.

| # | Task | Status |
|---|------|--------|
| 1 | `mongoosePlugins.ts` — `MongooseHookContext` replaces `any` | ✅ Done |
| 2 | `redisCache.ts` — extract 3 private helpers | ✅ Done |
| 3 | Controllers — `adService.assertOwnership()` | ✅ Done |
| 4 | `listings.ts` → 6 modules under `listings/` | ✅ Done |
| 5 | `ListingDetail.tsx` → 4 hooks | ✅ Done |
| 6 | `BrowseAds.tsx` → 3 hooks + utility | ✅ Done |
| 7 | `PostAdContext.tsx` → 4 hooks | ✅ Done |
| 8 | `DataTable.tsx` → 4 subcomponents | ✅ Done |
| 9 | `taxonomy/page.tsx` → 3 subcomponents + utility | ✅ Done |
| 10 | `AdQueryService.ts` → 5 services under `services/ad/` | ✅ Done |
| 11 | `LocationService.ts` → 6 services under `services/location/` | ✅ Done |

---

## ROUND 2 — NEXT TASKS

### Execution Order

| # | Tier | File / Target | Effort |
|---|------|---------------|--------|
| 1 | 3 | `PostAdContext.tsx` — remove 11× `any`, add concrete types | Quick |
| 2 | 3 | `useUrlSync.ts` — remove 8× `any` | Quick |
| 3 | 3 | `admin-frontend` `DataTableBody.tsx` — remove 6× `any` | Quick |
| 4 | 2 | `admin-frontend` `AdsView.tsx` (744 lines) — extract hooks | Medium |
| 5 | 2 | `admin-frontend` `notifications/page.tsx` (677 lines) — extract hooks/subcomponents | Medium |
| 6 | 2 | `frontend` `LocationContext.tsx` (712 lines) — extract hooks | Medium |
| 7 | 2 | `frontend` `useProfileSettings.ts` (706 lines) — split by domain | Medium |
| 8 | 1 | `backend` `BusinessService.ts` (871 lines) — split into domain services | Large |
| 9 | 1 | `backend` `chatService.ts` (818 lines) — split into domain services | Large |
| 10 | 1 | Controller DB queries — migrate 45 controllers to service layer | Large |

---

## TIER 3 — QUICK WINS

### Task 1 — `frontend/src/components/user/post-ad/PostAdContext.tsx` — Remove `any`

- [ ] Read `PostAdContext.tsx` in full
- [ ] Grep for all `: any` and `as any` — note each occurrence with line number
- [ ] For each, identify the actual type (check what value is assigned / returned)
- [ ] Replace with concrete interfaces or existing types from the codebase
- [ ] Do NOT introduce new shared type files — keep types local unless they already exist in a shared types file
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass
- [ ] Confirm: `grep ": any\|as any" frontend/src/components/user/post-ad/PostAdContext.tsx` returns 0

---

### Task 2 — `frontend/src/components/user/hooks/useUrlSync.ts` — Remove `any`

- [ ] Read `useUrlSync.ts` in full
- [ ] Grep for `: any` / `as any` — note each with line number
- [ ] Replace with concrete types (URL search param values are typically `string | string[] | null`)
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

### Task 3 — `admin-frontend/src/components/ui/DataTableBody.tsx` — Remove `any`

- [ ] Read `DataTableBody.tsx` in full
- [ ] Identify all 6 `any` usages — most likely `row`, `cell`, or virtualizer types
- [ ] Check what TanStack Table generics are used in `DataTable.tsx` — use the same generics in `DataTableBody`
- [ ] Replace `any` with the correct TanStack `Row<TData>`, `Cell<TData, TValue>` types
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass

---

## TIER 2 — MEDIUM EXTRACTIONS

### Task 4 — `admin-frontend/src/app/(protected)/ads/AdsView.tsx` (744 lines) — Extract hooks

**Target structure:**
```
admin-frontend/src/app/(protected)/ads/
  AdsView.tsx                  ← orchestration only (~200 lines)
  hooks/useAdFilters.ts        ← filter state (multiple useState calls)
  hooks/useAdSelection.ts      ← row selection, bulk action state
  hooks/useAdActions.ts        ← approve/reject/delete/feature action handlers
  hooks/useAdTableData.ts      ← query, pagination, sorting state
```

**Steps:**
- [ ] Read `AdsView.tsx` in full — identify all 23 hook call sites
- [ ] Group: filter-related state → `useAdFilters`
- [ ] Group: selection/bulk state → `useAdSelection`
- [ ] Group: action handlers (API calls, mutations) → `useAdActions`
- [ ] Group: query/pagination/sorting state → `useAdTableData`
- [ ] Extract each group into a hook file in a new `hooks/` folder alongside `AdsView.tsx`
- [ ] `AdsView.tsx` imports and composes all four hooks
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass
- [ ] Confirm: line count drops below 300

---

### Task 5 — `admin-frontend/src/app/(protected)/notifications/page.tsx` (677 lines) — Extract subcomponents

**Target structure:**
```
admin-frontend/src/app/(protected)/notifications/
  page.tsx                        ← orchestration only (~150 lines)
  NotificationFiltersBar.tsx      ← filter controls
  NotificationListItem.tsx        ← single notification row
  NotificationBulkActions.tsx     ← bulk action toolbar
  hooks/useNotificationFilters.ts ← filter state
```

**Steps:**
- [ ] Read `notifications/page.tsx` in full
- [ ] Identify distinct JSX sections: filter bar, list item, bulk actions
- [ ] Extract each into a co-located file
- [ ] Extract filter state into `hooks/useNotificationFilters.ts`
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass

---

### Task 6 — `frontend/src/context/LocationContext.tsx` (712 lines) — Extract hooks

**Target structure:**
```
frontend/src/context/
  LocationContext.tsx              ← context definition + provider shell (~150 lines)
  hooks/useLocationSearch.ts       ← search state, query, results
  hooks/useLocationPermission.ts   ← geolocation permission, current position
  hooks/useLocationSelection.ts    ← selected location state, persistence
```

**Steps:**
- [ ] Read `LocationContext.tsx` in full
- [ ] Identify domains: search vs permission/geo vs selection/persistence
- [ ] Extract each domain into a hook in a new `hooks/` folder alongside the context
- [ ] Provider body imports hooks and wires into context value
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

### Task 7 — `frontend/src/hooks/useProfileSettings.ts` (706 lines) — Split by domain

**Target structure:**
```
frontend/src/hooks/
  useProfileSettings.ts              ← thin re-export barrel (backward compat)
  profile/usePersonalSettings.ts     ← personal info, avatar, display name
  profile/useBusinessSettings.ts     ← business profile, shop photos, address
  profile/useSecuritySettings.ts     ← password change, 2FA, session management
  profile/useNotificationSettings.ts ← notification preferences
```

**Steps:**
- [ ] Read `useProfileSettings.ts` in full — identify domain sections
- [ ] Create `frontend/src/hooks/profile/` subfolder
- [ ] Move each domain into its own hook file
- [ ] Replace original `useProfileSettings.ts` with barrel re-export
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

## TIER 1 — LARGE SERVICE SPLITS

### Task 8 — `backend/src/services/BusinessService.ts` (871 lines) — Split into domain services

**Target structure:**
```
backend/src/services/business/
  _shared/businessHelpers.ts          ← shared normalization, validation helpers
  BusinessProfileService.ts           ← profile CRUD, photos, address
  BusinessSearchService.ts            ← search, discovery, nearby
  BusinessAnalyticsService.ts         ← stats, views, engagement
  BusinessVerificationService.ts      ← verification status, documents
backend/src/services/BusinessService.ts  ← re-export facade (keep until call sites migrated)
```

**Steps:**
- [ ] Read `BusinessService.ts` in full — map line ranges to domains
- [ ] Create `services/business/` subfolder
- [ ] Extract shared helpers first into `_shared/businessHelpers.ts`
- [ ] Extract each domain service, importing helpers as needed
- [ ] Update `BusinessService.ts` to be a pure re-export barrel
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass
- [ ] Grep for `BusinessService` imports — confirm all resolve through facade

---

### Task 9 — `backend/src/services/chatService.ts` (818 lines) — Split into domain services

**Target structure:**
```
backend/src/services/chat/
  ChatMessageService.ts    ← send, receive, read receipts
  ChatRoomService.ts       ← room creation, membership, listing linkage
  ChatQueryService.ts      ← conversation list, unread counts, search
  ChatNotificationService.ts ← push triggers, unread badge sync
backend/src/services/chatService.ts  ← re-export facade
```

**Steps:**
- [ ] Read `chatService.ts` in full — map line ranges to domains
- [ ] Create `services/chat/` subfolder
- [ ] Split each domain into its file
- [ ] Keep `chatService.ts` as re-export facade
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

### Task 10 — Controller DB queries — migrate to service layer (45 controllers)

This is a multi-session task. Work through one controller group per session.

**Priority order (by risk and call volume):**

**Session A — Payment controllers:**
- [ ] Read `paymentMutationController.ts` + `paymentQueryController.ts`
- [ ] Identify all raw DB queries (User, Plan, Transaction, Invoice models)
- [ ] Move each query into `PaymentProcessingService.ts` or a new `PaymentQueryService.ts`
- [ ] Controllers call service methods only
- [ ] `tsc --noEmit` in `backend/` — must pass

**Session B — Notification controllers:**
- [ ] Read `notificationQueryController.ts` + `notificationMutationController.ts`
- [ ] Move `Notification.find`, `countDocuments`, `findOneAndUpdate`, `findOneAndDelete` to a service
- [ ] `tsc --noEmit` in `backend/` — must pass

**Session C — Admin controllers:**
- [ ] Read `adminAdsController.ts` — move `Ad.findById`, `Report.findById`, `Report.findByIdAndUpdate`
- [ ] Read `adminApiKeyController.ts` — move all `ApiKey.*` queries
- [ ] Read `planAdminController.ts` — move all `PlanModel.*` queries
- [ ] Each group → one corresponding service method
- [ ] `tsc --noEmit` in `backend/` — must pass

**Session D — Catalog controllers:**
- [ ] Read `catalogCategoryController.ts` + `catalogGovernanceController.ts` + `catalogBrandModelController.ts`
- [ ] Move Category, Brand, Model queries to `CatalogHierarchyService.ts` (already exists)
- [ ] `tsc --noEmit` in `backend/` — must pass

**Session E — Remaining (auth, boost, sparepart):**
- [ ] `authController.ts`, `boostController.ts`, `sparePartListingController.ts`
- [ ] Move each raw query to its appropriate service
- [ ] `tsc --noEmit` in `backend/` — must pass

---

## COMPLETION CHECKLIST (Round 2)

When all 10 tasks above are checked:

- [ ] `npx tsc --noEmit` passes in `backend/`
- [ ] `npx tsc --noEmit` passes in `frontend/`
- [ ] `npx tsc --noEmit` passes in `admin-frontend/`
- [ ] `grep -rn ": any\|as any" frontend/src/components/user/post-ad/PostAdContext.tsx` → 0 results
- [ ] `grep -rn ": any\|as any" frontend/src/components/user/hooks/useUrlSync.ts` → 0 results
- [ ] `grep -rn ": any\|as any" admin-frontend/src/components/ui/DataTableBody.tsx` → 0 results
- [ ] `wc -l admin-frontend/src/app/\(protected\)/ads/AdsView.tsx` → under 300
- [ ] `grep -rn "\.findOne\|\.findById\|\.find(\|\.aggregate\|\.countDocuments" backend/src/controllers` → only service-delegated calls remain

---

## DUPLICATION PREVENTION RULES (carry forward from Round 1)

1. `normalizeListing()` lives ONLY in `frontend/src/lib/api/user/listings/normalizer.ts`
2. `MongooseHookContext` interface lives ONLY in `mongoosePlugins.ts`
3. `adService.assertOwnership()` lives ONLY in the ad service
4. `_shared/adFilterHelpers.ts` — filter builders here only
5. `_shared/hierarchyLoader.ts` — hierarchy loader here only
6. Extracted hooks live alongside their consuming component — never in a global `/hooks` dir unless shared across 3+ components
7. Re-export facades are TEMPORARY — remove after all call sites migrated
8. New `any` must never be introduced — always define a concrete type or use an existing one
