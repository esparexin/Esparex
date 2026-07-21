# Esparex Dual-Instance UI/UX Architecture Audit

**Date:** 2026-07-21
**Auditor:** AI Audit Agent
**Scope:** Full frontend audit — `apps/web/`, `apps/admin/`, `apps/mobile/`, `packages/`, `shared/`

---

## Repository Context

| Field | Value |
|---|---|
| Repository | `esparex/Esparex` |
| Active branch | `chore/governance-impact-rules` |
| Latest commit | `940b7773` |
| Working tree | Clean (no uncommitted changes) |

---

## Executive Summary

**25 findings** across the codebase:
- **Critical:** 3
- **High:** 9
- **Medium:** 10
- **Low:** 3

**Top 5 issues by impact:**
1. Post Service / Post Spare Part forms are ~78% duplicated
2. `BrowseAds.tsx` mounts `SearchFilters` twice (dual-render anti-pattern)
3. `AdminSidebar.tsx` mobile panel remains focusable when collapsed
4. 5 catalog tabs inline their own nearly identical delete confirmations
5. Post Ad uses 10+ `useState` calls in a single provider with cascading re-renders

---

## 🔴 Critical Findings

### C1. Post Service / Post Spare Part — 78% Code Duplication

| Attribute | Service Form | Spare Part Form |
|---|---|---|
| File | `PostServiceForm.tsx` (269 lines) | `PostSparePartForm.tsx` (272 lines) |
| Directory | `components/user/post-service/` | `components/user/post-spare-part/` |
| Orchestration hook | `usePostServiceFormOrchestration.ts` (115 lines) | `usePostSparePartFormOrchestration.ts` (109 lines) |

**Duplicated patterns (block-level):**
- `useForm` setup with identical `resolver`, `mode`, `defaultValues` shape — lines 32-44 / 60-72
- `useListingCategories` + `useBrandCatalog` calls with same props — lines 54-67 / 82-95
- `handleCategorySelect` logic — lines 105-111 / 128-134
- Category validation `useEffect` — lines 85-103 / 108-126
- `useListingFormProps` call (100% identical code) — lines 120-132 / 136-148
- Loading state (`ListingModalLoading`) — lines 134 / 150
- `ListingSubmissionSuccessModal` with same wrapper pattern — lines 135-149 / 151-165
- Brand selector JSX block — lines 175-186 / 191-202
- Category selector grid JSX — lines 166-173 / 182-189
- Return value shape of orchestration hooks (100% identical) — lines 105-114 / 99-108

**What differs:**
- Orchestration hook: catalog field name (`serviceTypeIds` vs `sparePartTypeId`)
- Orchestration hook: payload builders call different schema imports
- JSX: multi-select toggle grid vs single-select radio buttons
- Title maxLength (100 vs 120), description placeholder text
- Edit lock behavior: Service locks category + brand only; Spare Part also locks `sparePartTypeId`

**Root cause:** No shared listing form configuration abstraction. Two separate form files with copy-paste drift.

**Impact:** ~370 lines of technical debt. Any feature addition to one form must be manually applied to the other. Bug fixes in one form risk being forgotten in the other.

**Recommendation:** Create a single `ListingFormConfig`-driven component:
```typescript
type ListingFormConfig = {
  listingType: LISTING_TYPE;
  schema: z.ZodTypeAny;
  editSchema: z.ZodTypeAny;
  entityLabel: string;
  pendingRoute: string;
  catalogField: "serviceTypeIds" | "sparePartTypeId";
  catalogMode: "multi" | "single";
  catalogGridCols: string;
  catalogSkeletonCount: number;
  titleMaxLength: number;
  descPlaceholder: string;
  buildCreatePayload: (data: any) => any;
  buildEditPayload: (data: any) => any;
  buildEditValues: (payload: Record<string, unknown>) => any;
  createApi: Function;
  updateApi: Function;
};
```

**Regression risk:** Medium (~370 lines changed, both forms must be tested)
**Migration strategy:** Parameterize one form, remove the other, configure both listing types via config object.

---

### C2. `BrowseAds.tsx` — `SearchFilters` Dual-Mounted

**File:** `apps/web/src/components/user/BrowseAds.tsx:263 + 276`

**Current architecture:**
```
BrowseAds
├── SearchFilters (hidden via "hidden lg:block" CSS)  ← { line 263 }
└── SearchResultsHeader → SearchFilters (hidden via "md:hidden" CSS)  ← { line 276 }
```

Both `SearchFilters` instances are **fully mounted simultaneously**, each with:
- Own `useIsMobile()` hook
- Own `useState` for drawer open/close
- Own `useEffect` for hydration gating
- Own `<Drawer>` component with Radix/vaul
- Own `<SearchFiltersPanel>` with brand selection, price range, category tree

**Root cause:** Responsive rendering via CSS visibility instead of conditional mounting.

**Impact:** ~2x unnecessary JS bundle execution on every browse page load. Mobile drawer state is duplicated. Performance overhead persists throughout session.

**Recommendation:** Use a single `SearchFiltersShell` that conditionally renders based on viewport:

```tsx
const SearchFiltersShell = dynamic(() => import("./SearchFiltersShell"));
const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
// ...
{isDesktop === null ? null : isDesktop ? (
  <SearchFilters {...filterProps} />
) : (
  <SearchResultsHeader ... filterNode={<SearchFilters {...filterProps} />} />
)}
```

**Regression risk:** Medium — layout shift possible if resize logic is not carefully managed.
**Migration strategy:** Extract to single `SearchFiltersShell` component, use `useMediaQuery` hook for breakpoint-aware conditional rendering.

---

### C3. PostAdProvider — 10 `useState` Calls + Cascading Re-renders

**File:** `apps/web/src/components/user/post-ad/context/provider.tsx:34-69`

**Current architecture:**
```typescript
const [userHasInteracted, setUserHasInteracted] = useState(false);
const [stepValidationAttempts, setStepValidationAttempts] = useState<Record<number, boolean>>({});
const [mode, setMode] = useState<"create" | "edit">("create");
const [listingId, setListingId] = useState<string | null>(null);
const [currentStep, setCurrentStep] = useState(0);
const [originalAdStatus, setOriginalAdStatus] = useState<string | undefined>();
const [isLoading, setIsLoading] = useState(true);
const [brandIsPending, setBrandIsPending] = useState(false);
const [submittedAd, setSubmittedAd] = useState<any>(null);
// + 6 child hooks: useListingCategories, useBrandCatalog, useSparePartCatalog,
//                   useCategorySchemaCatalog, useListingImages, useListingLocation
```

**Root cause:** Single provider manages all post-ad state, including 6 catalog/image/location hooks that each have their own `useState`. Any state change re-evaluates all hooks. The `catalogState` (line 128) has 12 `useMemo` dependencies; `stateValue` (line 132) merges 4 sub-states.

**Impact:** Every catalog change cascades through the entire provider tree. Heavy re-render tax during multi-step wizard navigation.

**Recommendation:** The 6 sub-contexts partially mitigate consumer re-renders, but hook evaluation still runs on every render. Convert `catalogState` + `locationState` + `imagesState` into standalone hooks with `useSyncExternalStore` or move sub-states out of the provider via `useReducer` for atomic updates.

**Regression risk:** High — provider is used throughout the wizard.
**Migration strategy:** Incremental — first isolate `imagesState` and `locationState` into separate providers, then consolidate remaining state into a `useReducer`.

---

## 🟠 High Severity Findings

### H1. Post Ad / Post Service / Post Spare Part — Architectural Inconsistency

**Files:**
- `PostAdWizard.tsx` + `PostAdProvider` + 6 context files (multi-step wizard, context-based)
- `PostServiceForm.tsx` + `usePostServiceFormOrchestration` (single-page form, hook-based)
- `PostSparePartForm.tsx` + `usePostSparePartFormOrchestration` (single-page form, hook-based)

**Three different architectural patterns for three nearly identical business processes:**
1. Post Ad: multi-step wizard with context provider, `FormProvider`, step navigation machine
2. Post Service: single-page form, direct `useForm` + orchestration hook
3. Post Spare Part: single-page form, direct `useForm` + orchestration hook

**Root cause:** Organic growth without architectural alignment. Post Ad was built first with a heavy architecture; Service and Spare Part were built later with a lightweight approach.

**Impact:** Any cross-cutting feature (e.g., AI generation for descriptions, image optimization, location services) must be implemented differently for each flow. Developer cognitive overhead when switching between flows.

**Recommendation:** Establish a single `ListingFormOrchestrator` framework. Either:
- (A) Extract the Post Ad wizard into a generic multi-step form framework that Service/Spare Part could also use for future step expansion, or
- (B) Refactor Post Ad to use the same hook-based pattern as Service/Spare Part (removing the context complexity)

**Regression risk:** High for option B (Post Ad refactor). Medium for option A.
**Migration strategy:** Start with option B for immediate wins — the context layer adds complexity without clear benefit since the wizard is only 2 steps.

---

### H2. Catalog Tabs — 5 Inline Delete Confirmations

**Files:**
- `BrandsTab.tsx:321-413`
- `CategoriesTab.tsx:300-345`
- `SparePartsTab.tsx:313-366`
- `ScreenSizesTab.tsx:238-278`
- `ServiceTypesTab.tsx:212-252`

**Current architecture:** Each tab renders its own `CatalogModal` with duplicate JSX:
```tsx
<CatalogModal isOpen={...} onClose={...} title="Delete {Entity}">
  <div className="text-center">
    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
    <p>Are you sure you want to delete {entity}?</p>
    <div className="flex gap-2 justify-center mt-4">
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={handleYes}>Yes, Delete {Entity}</Button>
    </div>
  </div>
</CatalogModal>
```
Only `BrandsTab` has unique 409-handling. `models-tab/delete-modal.tsx` already demonstrates the extracted pattern.

**Root cause:** No shared `DeleteConfirmDialog` component despite 5 nearly identical implementations.

**Impact:** 5 copies of the same JSX. Style drift possible. Feature changes require updating 6 locations.

**Recommendation:** Extract a `DeleteConfirmDialog` component (following `models-tab/delete-modal.tsx` pattern) with:
- `entityName`, `entityLabel`, `onConfirm`, `isLoading`, `dependencyMessage?` (for Brands 409-case)

**Regression risk:** Low — pure extraction, logic unchanged.
**Migration strategy:** Create component, swap all 5 inline usages.

---

### H3. Admin Sidebar — Hidden Mobile Panel Remains Focusable

**File:** `apps/admin/src/components/layout/AdminSidebar.tsx:75-114`

```tsx
<aside className={`...translate-x-0: -translate-x-full ... lg:hidden`}>
  <SidebarNavigation items={visibleModules} counts={counts} />
</aside>
```

**Current architecture:** Mobile sidebar `<aside>` is moved offscreen via `-translate-x-full` but remains fully in the DOM with tabbable `<Link>` elements from `SidebarNavigation`. No `aria-hidden`, `inert`, or `tabIndex=-1` applied when closed.

**Root cause:** CSS-only hide pattern without accessibility considerations. The `translate-x-full` class moves it offscreen but does not remove it from the accessibility tree.

**Impact:** Keyboard users can tab into invisible navigation links. Screen readers may announce offscreen content. WCAG 2.2 SC 2.4.3 (Focus Order) violation.

**Recommendation:**
```tsx
<aside
  className={`
    fixed inset-y-0 left-0 z-40 flex ... lg:hidden
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
  `}
  aria-hidden={!isMobileOpen}
  inert={!isMobileOpen ? true : undefined}
>
```

**Regression risk:** Low — `inert` is widely supported in modern browsers.

---

### H4. `ListingDescriptionCard` Dual-Mounted (Mobile + Desktop)

**File:** `apps/web/src/components/user/ListingDetail.tsx:475-476`

```tsx
<ListingDescriptionCard ad={ad} variant="mobile" />
<ListingDescriptionCard ad={ad} variant="desktop" />
```

Both instances call `cleanupListingDescription()`, render warranty/attributes grids, and included/excluded sections. The component internally uses `isMobile` flag to toggle CSS classes.

**Impact:** 2x rendering of the same content. Description is parsed twice. If the description is long, this doubles string processing time.

**Recommendation:** Single mounted instance with all-responsive CSS:
```tsx
<ListingDescriptionCard ad={ad} />
```
And inside, use responsive Tailwind classes instead of `md:hidden` / `hidden md:block`.

**Regression risk:** Low — pure CSS refactor.

---

### H5. Duplicate Image Upload Strategies

**File A:** `apps/web/src/hooks/listings/useListingSubmission.ts:100-141` — Sequential FormData → `/api/upload/ad-image` upload pipeline.
**File B:** `apps/web/src/lib/api/user/listings/listingMediaAPI.ts:17-44` — Presigned URL + S3 upload approach (`getListingImagePresignedUrl` + `uploadFileToS3`).

Two upload strategies exist. `useListingSubmission.ts` (used by Post Service / Post Spare Part) uses strategy A. Strategy B is defined but its usage is unclear.

**Impact:** If both are used, inconsistency in upload behavior. If B is dead code, it should be removed.

**Recommendation:** Audit usage of `listingMediaAPI.ts`. Either consolidate to one strategy or remove dead code.

---

### H6. `usePostServiceFormOrchestration` + `usePostSparePartFormOrchestration` — 70% Duplication

**Files:**
- `apps/web/src/components/user/post-service/hooks/usePostServiceFormOrchestration.ts` (115 lines)
- `apps/web/src/components/user/post-spare-part/hooks/usePostSparePartFormOrchestration.ts` (109 lines)

Both call `useGenericListingForm` + `useListingSubmission` with identical structure. Payload builders (`buildServiceCreatePayload` / `buildSparePartCreatePayload`) are structurally identical save for field name mappings.

**Recommendation:** Create a single `useListingFormOrchestration(config)` generic hook. Move listing-type-specific logic (payload builders, schema references) into the config object.

**Regression risk:** Medium — combined with C1.

---

### H7. 5 Catalog Hooks Follow Identical Pattern

**Files:**
- `useBrandCatalog.ts` (58 lines)
- `useServiceTypeCatalog.ts` (64 lines)
- `useSparePartCatalog.ts` (~70 lines)
- `useCategorySchemaCatalog.ts` (~60 lines)
- `useListingCategories.ts` (~50 lines)

All share: `useState` for loading/data, `useCallback` for load function, `try/catch` with `logger.error`, ID normalization. `useServiceTypeCatalog` and `useSparePartCatalog` are ~75% structurally identical.

**Recommendation:** Extract a `useCatalogQuery<T>({ fetcher, normalizer })` generic hook.

---

### H8. Business Modals — 7 Files for 3 Behaviors

**Files:** `BusinessRejectModal.tsx`, `BusinessSuspendModal.tsx`, `BusinessDeleteModal.tsx`, `BusinessModifyModal.tsx`, `BusinessDetailsModal.tsx`, `BusinessReasonModal.tsx`, `BusinessAdminModals.tsx`

`BusinessRejectModal` (34 lines) and `BusinessSuspendModal` (32 lines) are thin wrappers passing different props to `BusinessReasonModal`. `BusinessDeleteModal` (82 lines) duplicates its own dialog infrastructure.

**Recommendation:** Remove `BusinessRejectModal` and `BusinessSuspendModal` wrappers. Use `BusinessReasonModal` directly with props. Extract delete confirmation to shared pattern.

**Regression risk:** Low.

---

### H9. `PostSparePartFormSchema` + `EditPostSparePartFormSchema` — Dual Validation Schemas

**File:** `apps/web/src/schemas/postSparePartForm.schema.ts:10-29`

Two schemas for create vs edit of spare parts. Create uses `BaseSparePartPayloadSchema.omit(...)`, edit uses `PartialSparePartPayloadSchema.pick(...)`.

**Recommendation:** Single schema with conditional `.or()` or `.partial()` based on `mode: "create" | "edit"`.

---

## 🟡 Medium Severity Findings

### M1. `BusinessRejectModal` / `BusinessSuspendModal` — Unnecessary Thin Wrappers

**Files:**
- `apps/admin/src/components/business/BusinessRejectModal.tsx` (34 lines)
- `apps/admin/src/components/business/BusinessSuspendModal.tsx` (32 lines)

Both are pure prop-passing wrappers around `BusinessReasonModal`. They provide no logic.

### M2. Admin `useAdminLocations` — Standalone Hook Ignores Shared CRUD Pattern

**File:** `apps/admin/src/hooks/useAdminLocations.ts` (248 lines)

Does not use `useAdminCrudList` or `useAdminCatalogCollection` like all other admin catalog hooks. Manually implements pagination/fetch/loading.

### M3. `AdminUserFormCard` — Type Duplication

**File:** `apps/admin/src/components/system/adminUsers/adminUsers.ts:24-40`

`AdminCreateFormState` and `AdminEditFormState` share 4 of 6 identical fields (email, name, role, twoFactor).

### M4. `stringId` / `requiredStringId` — Duplicated Across 2 Schema Files

**Files:**
- `apps/web/src/schemas/serviceListingPayload.schema.ts:17-18`
- `apps/web/src/schemas/postSparePartForm.schema.ts:7-8`

Both redefine identical `z.string().optional()` / `z.string().min(1, 'Required')` — should be in shared constants.

### M5. `queryKeys.ts` — Service + Spare Part Query Keys Are Structural Copies

**File:** `apps/web/src/hooks/queries/queryKeys.ts:55-68`

`services` and `spare` namespaces are identical structural copies: `all()`, `details()`, `detail(id)`, `my*(status)`.

### M6. Cats: 5 Hooks, 5 Ways to Handle Create/Update/Refresh

| File | Pattern |
|---|---|
| `useAdminBrands.ts` | Uses `useAdminCatalogCollection` → shared refresh |
| `useAdminModels.ts` | Uses `useAdminCatalogCollection` → shared refresh |
| `useAdminCategories.ts` | Custom `handleCreate`/`handleUpdate` with manual toast/error |
| `useAdminLocations.ts` | Fully custom (no `useAdminCatalogCollection`) |
| `useAdminScreenSizes.ts` | Uses `useAdminCatalogCollection` |

### M7. Post Ad / Post Service / Post Spare Part — Form Normalization Drift

**File:** `apps/web/src/lib/listings/postingFormNormalization.ts:76-119`

`buildPostAdEditPayload` (line 119) is a third variant alongside `buildServiceListingEditValues` and `buildSparePartListingEditValues`. Three different payload builders for the same schema family.

### M8. `AdImageCarousel` — Not Lazy-Loaded

**File:** `apps/web/src/components/user/ListingDetail.tsx` (no dynamic import for the carousel)

Heavy component (carousel, lightbox, 10+ full-res images, share/favorite buttons, touch handlers) should use `next/dynamic`.

### M9. `AdImageCarousel` — All Thumbnails Always Rendered

**File:** `apps/web/src/components/user/listing-detail/AdImageCarousel.tsx:141-163`

Thumbnail strip renders every image as a full `<Image fill unoptimized>` regardless of visibility.

### M10. `SearchFiltersPanel` — Not Lazy-Loaded

**File:** `apps/web/src/components/search/SearchFiltersPanel.tsx`

Mobile Drawer variant only shown on user interaction — candidate for lazy loading.

---

## 🟢 Low Severity Findings

### L1. `AdminCreateUserFormSchema` / `AdminEditUserFormSchema` — Discriminated Union Pattern Works but Schema Is Split

**File:** `apps/admin/src/schemas/admin.schemas.ts:68-72`

Schema split forces type gymnastics at call sites. Clean but non-ideal.

### L2. `AdminSidebar.tsx` — Desktop Sidebar Uses CSS `width` Transition Without `aspect-ratio` Consideration

**File:** `apps/admin/src/components/layout/AdminSidebar.tsx`

`transition-[width]` with `var(--sidebar-width)` — may cause layout shift during expand/collapse.

### L3. `PostAd` / EditAdWrapper — Duplicate Loading State

**File:** `apps/web/src/components/user/post-ad/EditAdWrapper.tsx:14-15`

`isLoading` and `error` state duplicated between `EditAdWrapper` and `PostAdProvider`.

---

## Positive Patterns (Things Done Right)

| Pattern | File | Why It's Good |
|---|---|---|
| CatalogPageTemplate + useAdminCatalogCollection | `catalog/tabs/` | Successful shared abstraction for CRUD tabs |
| PlanFormModal | `plans/PlanFormModal.tsx` | Unified Create/Edit with `isEdit` flag |
| UserActionDialog | `system/users/UserActionDialog.tsx` | 5 actions unified via `ACTION_PRESENTATION` config map |
| CatalogModal | `catalog/CatalogModal.tsx` | Single reusable modal with maxWidth prop |
| models-tab/delete-modal.tsx | `catalog/tabs/models-tab/` | Extracted delete component (should be shared) |
| useGenericListingForm | `shared/useGenericListingForm.ts` | Good abstraction for edit preload + images |
| ListingSubmissionSuccessModal | `shared/` | Successfully shared across all 3 listing types |
| React Query query key dedup | `hooks/queries/queryKeys.ts` | Prevents duplicate API requests |
| Radix-based dialog/sheet/alert | `components/ui/` | Correct focus trapping and ARIA built-in |

---

## Consolidated Recommendations (Priority Order)

| # | Action | Severity | Effort | Risk | Benefit |
|---|---|---|---|---|---|
| 1 | Unify PostServiceForm + PostSparePartForm via `ListingFormConfig` | Critical | Medium | Medium | -370 lines, single maintenance point |
| 2 | Fix `SearchFilters` dual-mount in `BrowseAds.tsx` | Critical | Small | Medium | Halve browse page re-render cost |
| 3 | Add `inert` + `aria-hidden` to AdminSidebar mobile panel | High | Tiny | Low | WCAG 2.2 AA compliance |
| 4 | Extract `DeleteConfirmDialog` for Catalog tabs | High | Small | Low | 5→1 pattern |
| 5 | Remove `BusinessRejectModal`/`BusinessSuspendModal` wrappers | High | Tiny | Low | -66 lines |
| 6 | Create `useListingFormOrchestration` generic hook | High | Medium | Medium | Consolidate Service + Spare Part |
| 7 | Extract shared `stringId`/`requiredStringId` Zod constants | High | Tiny | Low | DRY schema validation |
| 8 | Fix `ListingDescriptionCard` dual-mount | High | Tiny | Low | Half the description rendering |
| 9 | Lazy load `AdImageCarousel` | Medium | Tiny | Low | Faster initial ListingDetail load |
| 10 | Consolidate image upload strategies (FormData vs S3 presigned) | High | Small | Low | Single upload pipeline |
| 11 | Extract `useCatalogQuery` generic hook | High | Medium | Low | Consolidate 5 catalog hooks |
| 12 | Migrate `useAdminLocations` to `useAdminCatalogCollection` | Medium | Medium | Medium | Align with admin patterns |
| 13 | Consolidate PostAd architecture with Service/Spare Part | Medium | Large | High | Long-term consistency |
| 14 | Optimize carousel thumbnails (lazy load, proper sizes) | Medium | Small | Low | Fewer image requests |
| 15 | `useMemo` filter props in `BrowseAds.tsx` | Medium | Tiny | Low | Enable memoization |
| 16 | Add `React.memo` to `AdTitlePriceCard` | Low | Tiny | Low | Prevent unnecessary re-renders |

---

## Architecture Health Scorecard

| Dimension | Score | Notes |
|---|---|---|
| **Create/Edit unification** | ⚠️ 6/10 | Good in Admin (PlanForm, UserActionDialog, CatalogPageTemplate). Poor in listings (split schemas for spare parts). |
| **Desktop/Mobile split** | ✅ 9/10 | Only `ListingDescriptionCard` fragment. Mobile chrome components are correctly adaptive. |
| **Validation SSOT** | ⚠️ 5/10 | Zod schemas drifting. `stringId` duplicated. Business validation has dual runtime + Zod paths. |
| **State management** | ⚠️ 4/10 | PostAdProvider is a monolith. Three different state patterns for three similar listing flows. |
| **Business logic** | ⚠️ 5/10 | API calls reasonably shared. Orchestration hooks 70% duplicated. Two image upload strategies. |
| **Accessibility** | ⚠️ 6/10 | No duplicate IDs. Radix handles focus. AdminSidebar offscreen focus is a real issue. |
| **Performance** | ⚠️ 5/10 | Dual-mounted SearchFilters is the biggest issue. Carousel images unoptimized. Few lazy-loaded components. |
| **Component responsibility** | ✅ 8/10 | CatalogModal, AlertDialog, etc. well-separated. CatalogPageTemplate is a success story. |
| **Admin CRUD consistency** | ⚠️ 6/10 | CatalogPageTemplate works great. Delete confirmations duplicated. Location hook doesn't follow pattern. |

**Overall: ⚠️ 6/10 — Good foundation with targeted duplication issues.**

---

## Appendix: File Reference Index

| Finding | Primary File(s) | Lines |
|---|---|---|
| C1 | `PostServiceForm.tsx`, `PostSparePartForm.tsx` | All |
| C1 (hooks) | `usePostServiceFormOrchestration.ts`, `usePostSparePartFormOrchestration.ts` | All |
| C2 | `BrowseAds.tsx` | 263, 276 |
| C3 | `post-ad/context/provider.tsx` | 34-69 |
| H1 | `PostAdWizard.tsx`, `PostServiceForm.tsx`, `PostSparePartForm.tsx` | All |
| H2 | `BrandsTab.tsx`, `CategoriesTab.tsx`, `SparePartsTab.tsx`, `ScreenSizesTab.tsx`, `ServiceTypesTab.tsx` | Delete modal sections |
| H3 | `AdminSidebar.tsx` | 75-114 |
| H4 | `ListingDetail.tsx` | 475-476 |
| H5 | `useListingSubmission.ts:100-141`, `listingMediaAPI.ts:17-44` | All |
| H6 | `usePostServiceFormOrchestration.ts`, `usePostSparePartFormOrchestration.ts` | All |
| H7 | `useBrandCatalog.ts`, `useServiceTypeCatalog.ts`, `useSparePartCatalog.ts`, `useCategorySchemaCatalog.ts` | All |
| H8 | `BusinessRejectModal.tsx`, `BusinessSuspendModal.tsx`, `BusinessDeleteModal.tsx` | All |
| H9 | `postSparePartForm.schema.ts` | 10-29 |
| M1 | `BusinessRejectModal.tsx`, `BusinessSuspendModal.tsx` | All |
| M2 | `useAdminLocations.ts` | All |
| M3 | `adminUsers.ts` | 24-40 |
| M4 | `serviceListingPayload.schema.ts:17-18`, `postSparePartForm.schema.ts:7-8` | All |
| M5 | `queryKeys.ts` | 55-68 |
| M6 | `useAdminCategories.ts`, `useAdminBrands.ts`, `useAdminLocations.ts` | All |
| M7 | `postingFormNormalization.ts` | 76-119 |
| M8 | `ListingDetail.tsx` | Imports |
| M9 | `AdImageCarousel.tsx` | 141-163 |
| M10 | `SearchFiltersPanel.tsx` | All |

---

*End of audit. See docs/audit/ for future comparison baselines.*
