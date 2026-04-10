# QUALITY FIX PLAN — ROUND 2
# Esparex — Structured Refactor Backlog

**Command to use for every task:** `/quality-fix`
**Rule:** One task per session. Mark checkbox when build passes. Never combine tiers.
**Baseline date:** 2026-04-10
**Round 1 status:** All 11 tasks complete ✅

---

## EXECUTION ORDER

| # | Tier | File / Target | Effort |
|---|------|---------------|--------|
| 1 | 3 | `PostAdContext.tsx` — remove 11× `any` | Quick |
| 2 | 3 | `useUrlSync.ts` — remove 8× `any` | Quick |
| 3 | 3 | `DataTableBody.tsx` — remove 6× `any` | Quick |
| 4 | 2 | `AdsView.tsx` (744 lines) — extract 4 hooks | Medium |
| 5 | 2 | `notifications/page.tsx` (678 lines) — extract subcomponents | Medium |
| 6 | 2 | `LocationContext.tsx` (712 lines) — extract 3 hooks | Medium |
| 7 | 2 | `useProfileSettings.ts` (706 lines) — split by domain | Medium |
| 8 | 1 | `BusinessService.ts` (871 lines) — split into domain services | Large |
| 9 | 1 | `chatService.ts` (818 lines) — split into domain services | Large |
| 10A | 1 | Controller DB queries — Session A: Payment controllers | Large |
| 10B | 1 | Controller DB queries — Session B: Notification controllers | Large |
| 10C | 1 | Controller DB queries — Session C: Admin controllers | Large |
| 10D | 1 | Controller DB queries — Session D: Catalog controllers | Large |
| 10E | 1 | Controller DB queries — Session E: Auth / Boost / SparePart | Large |

---

## TIER 3 — QUICK WINS

### Task 1 — `frontend/src/components/user/post-ad/PostAdContext.tsx` — Remove 11× `any`

**Known occurrences (verified):**
```
line  82: coordinates: any
line  85: coords?: any
line 127: submittedAd: any | null
line 128: setSubmittedAd: (ad: any | null) => void
line 235: setValue("location", location as any, ...)
line 299: submitAdApiCall = useCallback((payload: any, ...)
line 351: setValue("spareParts", fieldValue as any, ...)
line 415: form.setError("categoryId" as any, ...)
line 419: form.setError("deviceCondition" as any, ...)
line 425: let fieldsToValidate: any[]
line 442: trigger(fieldsToValidate as any)
```

**Steps:**
- [ ] Read `PostAdContext.tsx` in full
- [ ] Line 82–85: `coordinates` comes from Geolocation API → use `GeolocationCoordinates` or `{ lat: number; lng: number }`
- [ ] Lines 127–128: `submittedAd` is the shape returned by `createListing`/`updateListing` → check return type of those functions, use that type
- [ ] Line 235: `location as any` — check `setValue` generic; cast to the correct `PostAdFormData["location"]` field type
- [ ] Line 299: `payload: any` → replace with `AdPayload` (already imported as `PostAdFormData`)
- [ ] Line 351: `fieldValue as any` → cast to `PostAdFormData["spareParts"]`
- [ ] Lines 415, 419: `"categoryId" as any` → use `Path<PostAdFormData>` from react-hook-form
- [ ] Lines 425, 442: `any[]` / `as any` → use `Path<PostAdFormData>[]`
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass
- [ ] Confirm: `grep ": any\|as any" frontend/src/components/user/post-ad/PostAdContext.tsx` → 0

---

### Task 2 — `frontend/src/components/user/hooks/useUrlSync.ts` — Remove 8× `any`

**Known occurrences (verified):**
```
line  8:  routeParams: any
line 10:  query: string, setQuery: (val: any) => void
line 11:  selectedCategory: string | null, setSelectedCategory: (val: any) => void
line 12:  priceRange: [number, number], setPriceRange: (val: any) => void
line 13:  selectedBrands: string[], setSelectedBrands: (val: any) => void
line 14:  radiusKm: number, setRadiusKm: (val: any) => void
line 15:  sort: SortOption, setSort: (val: any) => void
line 16:  page: number, setPage: (val: any) => void
```

**Steps:**
- [ ] Read `useUrlSync.ts` in full
- [ ] `routeParams: any` → use `ReadonlyURLSearchParams` from `next/navigation` or `URLSearchParams`
- [ ] All setter callbacks `(val: any) => void` → replace each with its concrete type matching the state it sets:
  - `setQuery: (val: string) => void`
  - `setSelectedCategory: (val: string | null) => void`
  - `setPriceRange: (val: [number, number]) => void`
  - `setSelectedBrands: (val: string[]) => void`
  - `setRadiusKm: (val: number) => void`
  - `setSort: (val: SortOption) => void`
  - `setPage: (val: number) => void`
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass
- [ ] Confirm: `grep ": any\|as any" frontend/src/components/user/hooks/useUrlSync.ts` → 0

---

### Task 3 — `admin-frontend/src/components/ui/DataTableBody.tsx` — Remove 6× `any`

**Known occurrences (verified):**
```
line  7: virtualItems: any[]
line  8: firstVirtualItem: any
line  9: lastVirtualItem: any
line 10: visibleColumns: any[]
line 11: rowVirtualizer: any
line 33: key={(item as any).id || virtualRow.index}
```

**Steps:**
- [ ] Read `DataTableBody.tsx` in full
- [ ] Read `DataTable.tsx` to find the TanStack Table generics already in use
- [ ] `virtualItems`, `firstVirtualItem`, `lastVirtualItem` → use `VirtualItem` from `@tanstack/react-virtual`
- [ ] `visibleColumns: any[]` → use `Column<TData, unknown>[]` from `@tanstack/react-table`
- [ ] `rowVirtualizer: any` → use `Virtualizer<HTMLDivElement, Element>` from `@tanstack/react-virtual`
- [ ] Line 33 `(item as any).id` → `VirtualItem` has `.index` — replace `(item as any).id` with `virtualRow.key ?? virtualRow.index`
- [ ] Add generic `<TData>` to the component props if not already present
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass
- [ ] Confirm: `grep ": any\|as any" admin-frontend/src/components/ui/DataTableBody.tsx` → 0

---

## TIER 2 — MEDIUM EXTRACTIONS

### Task 4 — `admin-frontend/src/app/(protected)/ads/AdsView.tsx` (744 lines) — Extract 4 hooks

**Target structure:**
```
admin-frontend/src/app/(protected)/ads/
  AdsView.tsx                  ← orchestration only, target ~200 lines
  hooks/useAdFilters.ts        ← filter state (status, category, date range, search query)
  hooks/useAdSelection.ts      ← row selection, bulk action state
  hooks/useAdActions.ts        ← approve/reject/delete/feature action handlers + mutations
  hooks/useAdTableData.ts      ← query state, pagination, sorting, data fetching
```

**Steps:**
- [ ] Read `AdsView.tsx` in full — list all 23 hook call sites with line numbers
- [ ] Group filter-related `useState` calls → `useAdFilters` — returns `{ filters, setFilter, resetFilters }`
- [ ] Group selection/bulk state → `useAdSelection` — returns `{ selectedIds, toggleRow, selectAll, clearSelection }`
- [ ] Group action handlers (API calls, toasts, refetch triggers) → `useAdActions` — returns `{ approve, reject, delete, feature }`
- [ ] Group query/pagination/sorting → `useAdTableData` — returns `{ data, isLoading, pagination, sorting, setSorting, setPage }`
- [ ] Create `hooks/` folder alongside `AdsView.tsx`
- [ ] Move each group; `AdsView.tsx` imports and composes all four
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass
- [ ] Confirm: `wc -l admin-frontend/src/app/(protected)/ads/AdsView.tsx` → under 300

---

### Task 5 — `admin-frontend/src/app/(protected)/(system)/notifications/page.tsx` (678 lines) — Extract subcomponents

**Target structure:**
```
admin-frontend/src/app/(protected)/(system)/notifications/
  page.tsx                          ← orchestration only, target ~150 lines
  NotificationFiltersBar.tsx        ← filter controls (type, read/unread, date)
  NotificationListItem.tsx          ← single notification row rendering
  NotificationBulkActions.tsx       ← bulk mark-read, delete toolbar
  hooks/useNotificationFilters.ts   ← filter state + URL sync
```

**Steps:**
- [ ] Read `page.tsx` in full
- [ ] Identify the filter bar JSX section → extract to `NotificationFiltersBar.tsx`
- [ ] Identify single notification row JSX → extract to `NotificationListItem.tsx`
- [ ] Identify bulk action toolbar JSX → extract to `NotificationBulkActions.tsx`
- [ ] Extract filter state + any URL sync logic → `hooks/useNotificationFilters.ts`
- [ ] `page.tsx` imports and composes all three components and the hook
- [ ] Run `npx tsc --noEmit` in `admin-frontend/` — must pass

---

### Task 6 — `frontend/src/context/LocationContext.tsx` (712 lines) — Extract 3 hooks

**Target structure:**
```
frontend/src/context/
  LocationContext.tsx              ← context definition + provider shell, target ~150 lines
  hooks/useLocationSearch.ts       ← search query, debounce, results state
  hooks/useLocationPermission.ts   ← geolocation API permission, current position, error handling
  hooks/useLocationSelection.ts    ← selected location state, localStorage persistence, clearing
```

**Steps:**
- [ ] Read `LocationContext.tsx` in full
- [ ] Identify search domain (query state, debounce, search API call, results) → `useLocationSearch`
- [ ] Identify permission/geo domain (navigator.geolocation, permission state, position, error) → `useLocationPermission`
- [ ] Identify selection domain (selected location, persistence, clear) → `useLocationSelection`
- [ ] Each hook returns values wired into context value in the provider
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass

---

### Task 7 — `frontend/src/hooks/useProfileSettings.ts` (706 lines) — Split by domain

**Target structure:**
```
frontend/src/hooks/
  useProfileSettings.ts                ← barrel re-export only (backward compat)
  profile/usePersonalSettings.ts       ← name, avatar, email, display preferences
  profile/useBusinessSettings.ts       ← business profile, shop photos, address, operating hours
  profile/useSecuritySettings.ts       ← password change, 2FA, active sessions
  profile/useNotificationSettings.ts   ← push/email/SMS notification preferences
```

**Steps:**
- [ ] Read `useProfileSettings.ts` in full — identify domain sections by their state variables and API calls
- [ ] Create `frontend/src/hooks/profile/` subfolder
- [ ] Move each domain into its own hook, keeping internal state and handlers co-located
- [ ] Replace `useProfileSettings.ts` body with barrel re-exports: `export * from './profile/usePersonalSettings'; ...`
- [ ] Run `npx tsc --noEmit` in `frontend/` — must pass
- [ ] Verify: all existing call sites of `useProfileSettings` still resolve through the barrel

---

## TIER 1 — LARGE SERVICE SPLITS

### Task 8 — `backend/src/services/BusinessService.ts` (871 lines) — Split into domain services

**Domain map (from analysis):**

| Lines | Domain | Target service |
|-------|--------|----------------|
| 1–187 | Types, helpers, S3 cleanup, document normalization | `_shared/businessHelpers.ts` |
| 288–418 | Register business (full flow) | `BusinessRegistrationService.ts` |
| 419–561 | Get by user/id, update profile | `BusinessProfileService.ts` |
| 562–766 | Search, list, filter businesses | `BusinessSearchService.ts` |
| 767–871 | Approve, reject, withdraw, soft delete | `BusinessModerationService.ts` |

**Target structure:**
```
backend/src/services/business/
  _shared/businessHelpers.ts         ← normalizeDocuments, cleanupRemovedS3Objects, type defs
  BusinessRegistrationService.ts     ← registerBusiness
  BusinessProfileService.ts          ← getBusinessByUserId, getBusinessById, updateBusinessById
  BusinessSearchService.ts           ← getBusinesses (filters, pagination, geo)
  BusinessModerationService.ts       ← approveBusiness, rejectBusiness, withdrawBusiness, softDeleteBusiness
backend/src/services/BusinessService.ts  ← re-export facade (keep until all call sites verified)
```

**Steps:**
- [ ] Read `BusinessService.ts` in full
- [ ] Create `services/business/` subfolder
- [ ] Create `_shared/businessHelpers.ts` — move shared types + private helpers (lines 1–187)
- [ ] Create `BusinessRegistrationService.ts` — move `registerBusiness` (lines 288–418)
- [ ] Create `BusinessProfileService.ts` — move profile read/update (lines 419–561)
- [ ] Create `BusinessSearchService.ts` — move `getBusinesses` (lines 562–766)
- [ ] Create `BusinessModerationService.ts` — move moderation actions (lines 767–871)
- [ ] Each service imports only from `_shared/businessHelpers.ts` — never cross-imports between sibling services
- [ ] Update `BusinessService.ts` → pure re-export barrel
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass
- [ ] Grep all `BusinessService` imports — confirm all resolve through facade

---

### Task 9 — `backend/src/services/chatService.ts` (818 lines) — Split into domain services

**Domain map (from analysis):**

| Functions | Domain | Target service |
|-----------|--------|----------------|
| `startConversation`, `getConversationForUser`, `hideConversation`, `restoreConversation`, `blockConversation` | Room/conversation management | `ChatRoomService.ts` |
| `listConversations`, `adminListConversations`, `adminGetConversation` | Query / inbox | `ChatQueryService.ts` |
| `sendMessage`, `getMessages`, `markRead`, `adminDeleteMessage` | Message operations | `ChatMessageService.ts` |
| `reportConversation`, `resolveReport`, `adminMuteConversation`, `adminExportConversation` | Moderation / reporting | `ChatModerationService.ts` |
| `encodeHtmlEntities`, `sanitizeText`, `detectBadWords`, `computeRiskScore`, `maskSensitiveData`, `buildConversationPreview`, normalizers | Shared utilities | `_shared/chatHelpers.ts` |

**Target structure:**
```
backend/src/services/chat/
  _shared/chatHelpers.ts         ← sanitize, encode, risk score, DTO helpers
  ChatRoomService.ts             ← start/hide/restore/block conversations
  ChatQueryService.ts            ← list/get conversations, admin views
  ChatMessageService.ts          ← send, get, mark-read, delete messages
  ChatModerationService.ts       ← report, resolve, mute, export
backend/src/services/chatService.ts  ← re-export facade (keep until all call sites verified)
```

**Steps:**
- [ ] Read `chatService.ts` in full
- [ ] Create `services/chat/` subfolder
- [ ] Create `_shared/chatHelpers.ts` — move all private helper functions (lines 26–132, 544–615)
- [ ] Create `ChatMessageService.ts` — move message operations (lines 262–411)
- [ ] Create `ChatRoomService.ts` — move conversation lifecycle (lines 133–195, 413–460)
- [ ] Create `ChatQueryService.ts` — move list/get operations (lines 196–261, 628–744)
- [ ] Create `ChatModerationService.ts` — move report/resolve/mute/export (lines 460–543, 746–818)
- [ ] Each service imports from `_shared/chatHelpers.ts` only — no cross-sibling imports
- [ ] Update `chatService.ts` → pure re-export barrel
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

## TASK 10 — CONTROLLER DB QUERY MIGRATION (5 sessions)

**Rule:** Each session = one controller group. Run `tsc --noEmit` after each session before moving to the next.

---

### Session 10A — Payment controllers

**Files:** `paymentMutationController.ts`, `paymentQueryController.ts`

**Queries to move (verified):**
```
paymentMutationController.ts:25  User.findById(req.user._id)
paymentMutationController.ts:28  Plan.findById(planId)
paymentMutationController.ts:36  Transaction.countDocuments({ userId, status: 'pending', ... })
paymentMutationController.ts:50  Transaction.findOne({ userId, planId, status: 'pending' })
paymentQueryController.ts:27     Plan.find(query).sort({ price: 1 })
paymentQueryController.ts:50     Transaction.find({ userId }).sort(...)
paymentQueryController.ts:73     Invoice.findOne({ transactionId })
paymentQueryController.ts:92     Transaction.findById(transactionId).populate(...)
```

**Steps:**
- [ ] Read `PaymentProcessingService.ts` to find the right home for these queries
- [ ] Add to service: `getUserForPayment(userId)`, `getPlanById(planId)`, `checkVelocity(userId, planId)`, `findPendingTransaction(userId, planId)`
- [ ] Add to service: `getPublicPlans()`, `getUserTransactions(userId)`, `getInvoiceByTransaction(transactionId)`, `getTransactionById(transactionId)`
- [ ] Replace inline model calls in both controllers with service method calls
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

### Session 10B — Notification controllers

**Files:** `notificationQueryController.ts`, `notificationMutationController.ts`

**Queries to move (verified):**
```
notificationQueryController.ts:57   Notification.find(query)
notificationQueryController.ts:61   Notification.countDocuments(query)
notificationQueryController.ts:62   Notification.countDocuments({ userId, isRead: false })
notificationMutationController.ts:61  Notification.findOneAndUpdate(...)
notificationMutationController.ts:90  Notification.findOneAndDelete(...)
```

**Steps:**
- [ ] Find or create `NotificationService.ts` (check if exists under `services/`)
- [ ] Add methods: `getUserNotifications(userId, query)`, `getNotificationCounts(userId, query)`, `getUnreadCount(userId)`, `markNotificationRead(id, userId)`, `deleteNotification(id, userId)`
- [ ] Replace inline model calls in both controllers with service method calls
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

### Session 10C — Admin controllers

**Files:** `adminAdsController.ts`, `adminApiKeyController.ts`, `adminAuditController.ts`, `planAdminController.ts`

**Queries to move (verified):**
```
adminAdsController.ts:204   Ad.findById(id).select('status')
adminAdsController.ts:285   Ad.findById(id).select('status listingType')
adminAdsController.ts:457   Report.findById(id)
adminAdsController.ts:476   Report.findById(id)
adminAdsController.ts:526   Report.findByIdAndUpdate(...)
adminAdsController.ts:681   Ad.findById(id).select('status reviewVersion listingType')
adminApiKeyController.ts:22  ApiKey.find(query)
adminApiKeyController.ts:27  ApiKey.countDocuments(query)
adminApiKeyController.ts:87  ApiKey.findByIdAndUpdate(...)
adminAuditController.ts:33   AdminLog.find(query)
adminAuditController.ts:38   AdminLog.countDocuments(query)
planAdminController.ts:29    PlanModel.findByIdAndUpdate(planId, ...)
planAdminController.ts:60    PlanModel.find(query)
planAdminController.ts:70    PlanModel.findById(planId)
```

**Steps:**
- [ ] Ad queries → add to `AdminService.ts` or `AdService.ts`: `getAdStatusById(id)`, `getReportById(id)`, `resolveReport(id, data)`
- [ ] ApiKey queries → find/create `ApiKeyService.ts`: `listApiKeys(query)`, `countApiKeys(query)`, `updateApiKeyById(id, data)`
- [ ] AdminLog queries → find/create `AdminAuditService.ts`: `getLogs(query)`, `countLogs(query)`
- [ ] Plan queries → add to existing plan service: `getPlanById(id)`, `listPlans(query)`, `updatePlanById(id, data)`
- [ ] Replace inline model calls in all four controllers
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

### Session 10D — Catalog controllers

**Files:** `catalogCategoryController.ts`, `catalogGovernanceController.ts`, `catalogBrandModelController.ts`

**Queries to move (verified):**
```
catalogCategoryController.ts:58,65   model.collection.countDocuments(...)
catalogCategoryController.ts:165     Category.findOne({ slug })
catalogCategoryController.ts:184     Category.findById(id)
catalogCategoryController.ts:218     Category.findByIdAndUpdate(...)
catalogCategoryController.ts:284,346 Category.findById(categoryId)
catalogGovernanceController.ts:89    Category.findById(id).lean()
catalogGovernanceController.ts:98    Ad.aggregate([...])
catalogGovernanceController.ts:109   Brand.countDocuments({ categoryId })
catalogGovernanceController.ts:110   Model.aggregate([...])
catalogBrandModelController.ts:71,336 Category.findOne({ slug })
catalogBrandModelController.ts:123,153,266,287,661 Brand.findOne(...)
catalogBrandModelController.ts:232,233,234 Model/Brand/SparePart.countDocuments(...)
catalogBrandModelController.ts:355   Brand.find(...)
catalogBrandModelController.ts:419   Model.findOne(...)
catalogBrandModelController.ts:456   Model.find(...)
catalogBrandModelController.ts:541,542 Ad/SparePart.countDocuments(...)
catalogBrandModelController.ts:599,609,675 Model.findOne(...)
```

**Steps:**
- [ ] Read `CatalogHierarchyService.ts` — it already exists; add methods to it
- [ ] Add: `getCategoryBySlug(slug)`, `getCategoryById(id)`, `updateCategory(id, data)`, `getCategoryWithUsage(id)`
- [ ] Add: `getBrandBySlug(categoryId, slug)`, `getBrandById(id)`, `findOrCreateBrand(data)`, `getBrandUsageCounts(id)`
- [ ] Add: `getModelBySlug(brandId, slug)`, `findOrCreateModel(data)`, `getModelUsageCounts(id)`
- [ ] Replace all inline model calls in the three catalog controllers with service method calls
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

### Session 10E — Auth / Boost / SparePart controllers

**Files:** `authController.ts`, `boostController.ts`, `sparePartListingController.ts`

**Queries to move (verified):**
```
authController.ts:107  User.findByIdAndUpdate(req.user._id, { deviceToken })
boostController.ts     Ad.find + Boost.find (verify exact lines)
sparePartListingController.ts  Category.findById + SparePart.findById (verify exact lines)
```

**Steps:**
- [ ] Read all three files fully — confirm exact line numbers of remaining raw queries
- [ ] `User.findByIdAndUpdate` in auth → add `UserService.updateDeviceToken(userId, token)` method
- [ ] Boost queries → add to `AdSlotService.ts` or create `BoostService.ts`: `getActiveBoosts(userId)`, `getAdBoosts(adId)`
- [ ] SparePart queries → these likely belong in `CatalogHierarchyService.ts`
- [ ] Replace inline calls in all three controllers
- [ ] Run `npx tsc --noEmit` in `backend/` — must pass

---

## COMPLETION CHECKLIST (Round 2)

When all tasks above are checked:

- [ ] `npx tsc --noEmit` passes in `backend/`
- [ ] `npx tsc --noEmit` passes in `frontend/`
- [ ] `npx tsc --noEmit` passes in `admin-frontend/`
- [ ] `grep -rn ": any\|as any" frontend/src/components/user/post-ad/PostAdContext.tsx` → 0
- [ ] `grep -rn ": any\|as any" frontend/src/components/user/hooks/useUrlSync.ts` → 0
- [ ] `grep -rn ": any\|as any" admin-frontend/src/components/ui/DataTableBody.tsx` → 0
- [ ] `wc -l admin-frontend/src/app/(protected)/ads/AdsView.tsx` → under 300
- [ ] `grep -rn "\.findOne\b\|\.findById\b\|\.find(\|\.aggregate(\|\.countDocuments(" backend/src/controllers/payment` → 0 raw queries
- [ ] `grep -rn "\.findOne\b\|\.findById\b\|\.find(\|\.aggregate(\|\.countDocuments(" backend/src/controllers/notification` → 0 raw queries
- [ ] `ls backend/src/services/business/` → contains 5 files
- [ ] `ls backend/src/services/chat/` → contains 5 files
- [ ] `cat backend/src/services/BusinessService.ts` → re-export barrel only (under 10 lines)
- [ ] `cat backend/src/services/chatService.ts` → re-export barrel only (under 10 lines)

---

## DUPLICATION PREVENTION RULES (carry forward)

1. `normalizeListing()` lives ONLY in `frontend/src/lib/api/user/listings/normalizer.ts`
2. `MongooseHookContext` interface lives ONLY in `mongoosePlugins.ts`
3. `adService.assertOwnership()` lives ONLY in the ad service — never copy to a new service
4. `_shared/adFilterHelpers.ts` — ad filter builders here only
5. `_shared/hierarchyLoader.ts` — location hierarchy loader here only
6. `_shared/businessHelpers.ts` — business types and private helpers here only (do not duplicate in sibling services)
7. `_shared/chatHelpers.ts` — chat sanitize/encode/risk helpers here only
8. Extracted hooks live alongside their consuming component — not in a global `/hooks` dir unless shared across 3+ components
9. Re-export facades are TEMPORARY — remove after all call sites migrated
10. `any` must never be introduced — always define a concrete type or use an existing one
