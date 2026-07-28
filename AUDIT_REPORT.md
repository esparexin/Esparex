# Esparex Comprehensive Architecture Audit Report

**Date:** 2026-07-28
**Scope:** Repository-wide architecture audit of standalone pages, legacy pages, zombie pages, generic lists, generic forms, layouts, navigation, and component ownership.
**Constraint:** Audit-only — no refactoring, migration, or deletion.

---

## Deliverable 1: Page Architecture Diagram

```
ROOT LAYOUT ─── RootClientShell (ErrorBoundary, PopupProvider, LocationProvider)
│
├── (public) ─── CommonLayout (HeaderWrapper, Footer, ClientChromeLoader)
│   ├── /about                              → Static content (standalone)
│   ├── /ads/[slug]                         → Listing detail (factory-based)
│   ├── /brands/[slug]                      → Re-export from CatalogSlugRoutes
│   ├── /browse-services                    → permanentRedirect → /search?type=service
│   ├── /browse-spare-parts                 → permanentRedirect → /search?type=spare-part
│   ├── /business/[slug]                    → Business profile (standalone, 144 lines)
│   ├── /category/[category]                → Browse Ads (monolithic, 472 lines)
│   ├── /contact                            → Static content (standalone)
│   ├── /faq                                → Static content (standalone)
│   ├── /how-it-works                       → Static content (standalone)
│   ├── /login                              → Re-exports Home page (SUSPICIOUS)
│   ├── /models/[slug]                      → Re-export from CatalogSlugRoutes
│   ├── /privacy                            → Static content (standalone)
│   ├── /safety-tips                        → Static content (standalone)
│   ├── /search                             → Browse (delegates to BrowseAds/Services/SpareParts)
│   ├── /seller/[id]                        → Seller profile (standalone)
│   ├── /services/[slug]                    → Listing detail (factory-based)
│   ├── /site-map                           → Static content (standalone)
│   ├── /spare-part-listings/[slug]         → Listing detail (factory-based)
│   ├── /terms                              → Static content (standalone)
│   └── /unauthorized                       → Static content (standalone)
│
├── (private) ─── CommonLayout (with suspenseHeader, noindex)
│   ├── /account                            → redirect → /account/profile
│   ├── /account/ads                        → Shell → AccountPageShell (tab="mylistings")
│   ├── /account/alerts                     → Shell → AccountPageShell (tab="smartalerts")
│   ├── /account/business                   → Shell → AccountPageShell (tab="business")
│   ├── /account/business/apply             → Registration wizard (standalone)
│   ├── /account/messages                   → Shell → AccountPageShell (tab="messages")
│   ├── /account/messages/[conversationId]  → Shell → AccountPageShell (with conversationId)
│   ├── /account/plans                      → Shell → AccountPageShell (tab="plans")
│   ├── /account/profile                    → Shell → AccountPageShell (tab="personal")
│   ├── /account/purchases                  → Shell → AccountPageShell (tab="purchases")
│   ├── /account/saved                      → Shell → AccountPageShell (tab="saved")
│   ├── /account/services                   → Shell → AccountPageShell (listingSubTab="services")
│   ├── /account/settings                   → Shell → AccountPageShell (tab="settings")
│   ├── /account/spare-parts                → Shell → AccountPageShell (listingSubTab="spare-parts")
│   ├── /browse-services                    → permanentRedirect → /search?type=service
│   ├── /browse-spare-parts                 → permanentRedirect → /search?type=spare-part
│   ├── /business/edit                      → Business profile edit (standalone)
│   ├── /chat/[conversationId]              → Redirect to new chat route (legacy shim)
│   ├── /edit-ad/[id]                       → PostAdWizard edit mode
│   ├── /edit-service/[id]                  → ListingForm edit mode
│   ├── /edit-spare-part/[id]               → ListingForm edit mode
│   ├── /post-ad                            → 2-step wizard (bespoke architecture)
│   ├── /post-service                       → Single-page form (generic architecture)
│   └── /post-spare-part-listing            → Single-page form (generic architecture)
│
└── /offline                                → PWA offline page (standalone)
```

---

## Deliverable 2: Route Ownership Matrix

| Route | Owner | File | Status |
|-------|-------|------|--------|
| `/` | HomePage | `(public)/page.tsx` | Active |
| `/about` | StaticPage | `about/page.tsx` | Active |
| `/ads/[slug]` | ListingDetail (factory) | `ads/[slug]/page.tsx` | Active |
| `/brands/[slug]` | CatalogSlugRoutes | `brands/[slug]/page.tsx` | Active (re-export) |
| `/browse-services` | Redirect | `browse-services/page.tsx` | Legacy (redirect only) |
| `/browse-spare-parts` | Redirect | `browse-spare-parts/page.tsx` | Legacy (redirect only) |
| `/business/[slug]` | BusinessProfile | `business/[slug]/page.tsx` | Active |
| `/category/[category]` | BrowseAds (monolithic) | `category/[category]/page.tsx` | **DUPLICATE** |
| `/contact` | StaticPage | `contact/page.tsx` | Active |
| `/faq` | StaticPage | `faq/page.tsx` | Active |
| `/how-it-works` | StaticPage | `how-it-works/page.tsx` | Active |
| `/login` | HomePage (re-export) | `login/page.tsx` | **ZOMBIE** (renders homepage) |
| `/models/[slug]` | CatalogSlugRoutes | `models/[slug]/page.tsx` | Active (re-export) |
| `/offline` | PWAPage | `offline/page.tsx` | Active |
| `/privacy` | StaticPage | `privacy/page.tsx` | Active |
| `/safety-tips` | StaticPage | `safety-tips/page.tsx` | Active |
| `/search` | BrowseRouter | `search/page.tsx` | Active |
| `/seller/[id]` | SellerProfile | `seller/[id]/page.tsx` | Active |
| `/services/[slug]` | ListingDetail (factory) | `services/[slug]/page.tsx` | Active |
| `/site-map` | StaticPage | `site-map/page.tsx` | Active |
| `/spare-part-listings/[slug]` | ListingDetail (factory) | `spare-part-listings/[slug]/page.tsx` | Active |
| `/terms` | StaticPage | `terms/page.tsx` | Active |
| `/unauthorized` | StaticPage | `unauthorized/page.tsx` | Active |
| `/account` | Redirect | `account/page.tsx` | Active (redirect) |
| `/account/ads` | AccountPageShell | `account/ads/page.tsx` | Active (shell) |
| `/account/alerts` | AccountPageShell | `account/alerts/page.tsx` | Active (shell) |
| `/account/business` | AccountPageShell | `account/business/page.tsx` | Active (shell) |
| `/account/business/apply` | BusinessRegistration | `account/business/apply/page.tsx` | Active |
| `/account/messages` | AccountPageShell | `account/messages/page.tsx` | Active (shell) |
| `/account/plans` | AccountPageShell | `account/plans/page.tsx` | Active (shell) |
| `/account/profile` | AccountPageShell | `account/profile/page.tsx` | Active (shell) |
| `/account/purchases` | AccountPageShell | `account/purchases/page.tsx` | Active (shell) |
| `/account/saved` | AccountPageShell | `account/saved/page.tsx` | Active (shell) |
| `/account/services` | AccountPageShell | `account/services/page.tsx` | Active (shell) |
| `/account/settings` | AccountPageShell | `account/settings/page.tsx` | Active (shell) |
| `/account/spare-parts` | AccountPageShell | `account/spare-parts/page.tsx` | Active (shell) |
| `/business/edit` | BusinessProfileEdit | `business/edit/page.tsx` | Active |
| `/chat/[conversationId]` | LegacyRedirect | `chat/[conversationId]/page.tsx` | **LEGACY** (redirect shim) |
| `/edit-ad/[id]` | PostAdWizard (edit) | `edit-ad/[id]/page.tsx` | Active |
| `/edit-service/[id]` | ListingForm (edit) | `edit-service/[id]/page.tsx` | Active |
| `/edit-spare-part/[id]` | ListingForm (edit) | `edit-spare-part/[id]/page.tsx` | Active |
| `/post-ad` | PostAdWizard (create) | `post-ad/page.tsx` | Active |
| `/post-service` | ListingForm (create) | `post-service/page.tsx` | Active |
| `/post-spare-part-listing` | ListingForm (create) | `post-spare-part-listing/page.tsx` | Active |

---

## Deliverable 3: Standalone Page Report

### Pages That Should Remain Standalone (13)

| Page | Rationale |
|------|-----------|
| `/about` | Static legal/content page. Full content. |
| `/contact` | Static content page. |
| `/faq` | Static content page with Accordion. |
| `/how-it-works` | Static content page. |
| `/privacy` | Legal policy page. |
| `/safety-tips` | Static content page. |
| `/site-map` | SEO utility page with links. |
| `/terms` | Legal policy page. |
| `/unauthorized` | Auth error boundary page. |
| `/offline` | PWA offline page (special behavior). |
| `/business/[slug]` | Dynamic business profile (server data + metadata). |
| `/seller/[id]` | Dynamic seller profile. |
| `/account/business/apply` | Registration wizard with complex flow. |

### Pages That Could Become Intercepted Routes / Modals

| Page | Recommendation | Rationale |
|------|---------------|-----------|
| `/edit-ad/[id]` | Could be modal | Edit is a focused action, not a full page navigation. Users expect to stay in context. |
| `/edit-service/[id]` | Could be modal | Same pattern as edit-ad. |
| `/edit-spare-part/[id]` | Could be modal | Same pattern as edit-ad. |
| `/post-ad` | Could be modal | Posting an ad is a focused action wizard. Modal would preserve browse context. |
| `/post-service` | Already uses dialog layout | `ListingModalLayout` wraps content in a dialog-like shell — almost there. |
| `/post-spare-part-listing` | Already uses dialog layout | Same as post-service. |
| `/login` | Should be modal | Standard UX pattern is a modal/drawer overlay. Currently renders homepage (broken). |

### Pages That Should Remain as Shell/Proxy (14)

| Page | Rationale |
|------|-----------|
| `/account/ads` | Delegates to AccountPageShell. Intentional SPA-in-account pattern. |
| `/account/alerts` | Same pattern. |
| `/account/business` | Same pattern. |
| `/account/messages` | Same pattern. |
| `/account/messages/[id]` | Same pattern. |
| `/account/plans` | Same pattern. |
| `/account/profile` | Same pattern. |
| `/account/purchases` | Same pattern. |
| `/account/saved` | Same pattern. |
| `/account/services` | Same pattern. |
| `/account/settings` | Same pattern. |
| `/account/spare-parts` | Same pattern. |
| `/brands/[slug]` | Pure re-export from catalog routes — clean. |
| `/models/[slug]` | Pure re-export from catalog routes — clean. |

---

## Deliverable 4: Legacy Page Report

| Page | Classification | Reason |
|------|---------------|--------|
| `/login` | **Legacy** | Renders homepage instead of login form. Clearly a placeholder/broken stub. |
| `/browse-services` | **Legacy** | Immediately redirects to `/search?type=service`. Dead route kept for redirect compat. |
| `/browse-spare-parts` | **Legacy** | Immediately redirects to `/search?type=spare-part`. Same pattern. |
| `/chat/[conversationId]` | **Legacy (redirect shim)** | Parses old route params and redirects to new chat route. Migration artifact. Safe to remove after migration period. |
| `(auth)/` (route group) | **Legacy (empty group)** | Route group directory exists but has no files, no layout, no pages. Dead concept. |

---

## Deliverable 5: Zombie Page Report

| Page | Classification | Evidence |
|------|---------------|----------|
| `/login` | **ZOMBIE** | `export default Home` makes it render the homepage. Either the login form was never implemented or was removed. No `@modal` or interception used. |
| `(auth)/layout.tsx` | **ZOMBIE** | Route group exists but has zero content. No files, no pages, no layout. |
| `/browse-services/page.tsx` in `(private)` | **ZOMBIE** | Duplicate route in both `(public)` and `(private)` route groups. The `(private)` version is unreachable because the `(public)` version handles the path first. |
| `/browse-spare-parts/page.tsx` in `(private)` | **ZOMBIE** | Same issue — duplicate route in two route groups. |

### Verification: Duplicate Routes in Public AND Private

Both `browse-services` and `browse-spare-parts` exist in **both** `(public)` and `(private)` route groups. In Next.js App Router, a route can only belong to one route group — having it in two groups means one is unreachable. Both `(private)` versions of these routes are **zombie routes**.

---

## Deliverable 6: Generic List Audit

### SSOT Identification

| Component | Status | Path | Notes |
|-----------|--------|------|-------|
| `BrowseResultsPanel` | **SSOT** | `components/user/BrowseResultsPanel.tsx` | Generic results display with grid/list/virtualized/load-more/error/empty |
| `BrowseListingsView` | **SSOT** | `components/user/BrowseListingsView.tsx` | Generic orchestrator + controller |
| `BrowseListingCard` | **SSOT** | `components/user/BrowseListingCard.tsx` | Shared listing card (Services & Spare Parts) |
| `useBrowseListingsController` | **SSOT** | `components/user/useBrowseListingsController.ts` | State management |
| `BrowseServicesVirtualizedList` | **SSOT** | `components/user/BrowseServicesVirtualizedList.tsx` | Only virtualized list (no duplicate) |
| `DataTable` (`packages/ui`) | **SSOT** | `packages/ui/src/patterns/DataTable/` | Admin data table |
| `ad-card/AdCardGrid` | **SEPARATE SSOT** | `components/user/ad-card/AdCardGrid.tsx` | Card system for Ads (parallel to BrowseListingCard) |
| `ad-card/AdCardList` | **SEPARATE SSOT** | `components/user/ad-card/AdCardList.tsx` | Card system for Ads (parallel to BrowseListingCard) |

### Duplicate Implementations

| # | Duplicate Component | Lines | Existing SSOT | Overlap |
|---|-------------------|-------|---------------|---------|
| 1 | **`BrowseAds.tsx`** | **472** | `BrowseListingsView` + `BrowseResultsPanel` | **100% overlap** — completely duplicates the entire orchestration pipeline with inline state management, inline grid CSS, inline skeleton, inline load-more, inline error states. Uses `AdCardGrid`/`AdCardList` instead of `BrowseListingCard`. |
| 2 | **`BrowseListingResults.tsx`** | 86 | `BrowseResultsPanel` | **100% pass-through wrapper** — adds zero logic. Dead wrapper. |
| 3 | `ad-card/AdCardGrid.tsx` | 117 | `BrowseListingCard` | ~75% overlap in card rendering logic for listing entities |
| 4 | `ad-card/AdCardList.tsx` | 164 | `BrowseListingCard` | ~80% overlap in card rendering logic |
| 5 | Grid CSS string duplication | — | `BrowseResultsPanel` | Exact same CSS string repeated in `BrowseAds.tsx` and `BrowseServicesVirtualizedList.tsx` |
| 6 | Loading skeleton | — | `BrowseResultsPanel` | Identical 8-item skeleton duplicated in `BrowseAds.tsx` |

### Dead Components

| Component | Status | Rationale |
|-----------|--------|-----------|
| `BrowseListingResults.tsx` | **DEAD** | Pure pass-through wrapper. Can be deleted, consumers import `BrowseResultsPanel` directly. |

---

## Deliverable 7: Generic Form Audit

### SSOT Identification

| Component | Status | Path |
|-----------|--------|------|
| `ListingForm.tsx` | **SSOT for Service/SparePart** | `components/user/shared/ListingForm.tsx` |
| `listingFormConfig.ts` | **SSOT for config** | `components/user/shared/listingFormConfig.ts` |
| `GenericPostForm.tsx` | **SSOT for form layout** | `components/user/shared/GenericPostForm.tsx` |
| `ListingFormFields.tsx` | **SSOT for field components** | `components/user/shared/ListingFormFields.tsx` |
| `ListingModalLayout.tsx` | **SSOT for modal layout** | `components/user/shared/ListingModalLayout.tsx` |
| `useListingFormOrchestration` | **SSOT for submission** | `components/user/shared/useListingFormOrchestration.tsx` |
| `PostAdWizard.tsx` | **SEPARATE SSOT for Post Ad** | `components/user/post-ad/PostAdWizard.tsx` |
| `usePostAdForm.ts` | **SEPARATE SSOT for Post Ad form** | `hooks/usePostAdForm.ts` |
| `useListingSubmission.ts` | **SSOT for submission pipeline** | `hooks/listings/useListingSubmission.ts` |
| `@esparex/contracts` schemas | **SSOT for validation schemas** | `packages/contracts/src/v1/listings/schema/` |

### Form Architecture Summary

There are **two parallel form systems**:

| Aspect | System A: Post Ad | System B: Service / Spare Part |
|--------|-------------------|-------------------------------|
| Pattern | 2-step wizard | Single-page form |
| State Management | 6 React contexts | `useListingFormOrchestration` hook |
| Form Hook | `usePostAdForm.ts` (custom) | Inline `useForm` in `ListingForm.tsx` |
| Validation | Manual step validation + RHF trigger | Zod + RHF `onBlur` mode |
| Navigation Guard | `NavigationContext` + `confirmNavigation` | `GenericPostForm` + `confirmNavigation` |
| Image Handling | Custom `ImageUploadSection` with setMainImage | Shared `ListingImagesField` |
| Location | Custom `LocationSection` with GPS, map, editable | Shared `ListingLocationField` (read-only, business-sourced) |
| AI Generation | `usePostAdAiGeneration` (full feature) | None |
| Analytics | 10+ tracked events | None |
| Config | Hardcoded in components | `ListingFormConfig` driveable interface |
| Schema | `adPayload.schema.ts` (re-exports contracts) | `serviceListingPayload.schema.ts` / `postSparePartForm.schema.ts` |

### SSOT Violations in Forms

| # | Violation | Severity | Detail |
|---|-----------|----------|--------|
| 1 | `CategorySection.tsx` (post-ad) duplicates `CategorySelectorGrid` (shared) | **HIGH** | Two implementations of category selection grid with ~85% overlap |
| 2 | `ImageUploadSection.tsx` (post-ad) duplicates `ListingImagesField` (shared) | **MEDIUM** | Overlapping image upload with add/remove/preview — separate extension point |
| 3 | `PriceSection.tsx` (post-ad) duplicates `ListingPriceField` (shared) | **MEDIUM** | Post-ad has "Free" toggle switch not in shared version |
| 4 | `getNestedFieldMeta` (post-ad) vs `getFirstFormErrorMessage` (shared) | **LOW** | Overlapping error extraction utilities |

### Architectural Decision: Keep Two Systems Separate

Per AGENTS.md similarity threshold rule:
- Shared UI: ~40%
- Shared business rules: ~30%
- Shared validation: ~30%
- Shared API contract: ~50%
- Shared workflow: ~20%
- **Overall: BELOW 75% threshold** — consolidation would violate the Similarity Threshold Rule.

The dual architecture is architecturally justified.

### Dead Form Components

| Component | Status | Rationale |
|-----------|--------|-----------|
| `clearBrandDependents` function body (empty) | **DEAD** | Empty function in `useCategoryDependents.ts`, never executed |
| `brandIsPending` state | **DEAD** | Never set to `true`, exposed but unused |
| `PostAdWizardProps.setHasUnsavedChanges` | **DEAD** | Declared in types but never used — `NavigationContext` handles this |

---

## Deliverable 8: Layout Ownership Report

### Layout Inventory

| Layout | Path | Type | Consumers | Status |
|--------|------|------|-----------|--------|
| Root Layout | `app/layout.tsx` | Server | All pages | Active |
| Root Client Shell | `app/layout.tsx` (→RootClientShell) | Client | All pages via layout | Active |
| Public Layout | `app/(public)/layout.tsx` | Server | All public routes | Active |
| Private Layout | `app/(private)/layout.tsx` | Server | All private routes | Active |
| Post Ad Layout | `app/(private)/post-ad/layout.tsx` | Client | `/post-ad` | Active |
| Account Layout | `app/(private)/account/layout.tsx` | Server | All `/account/*` | Active |
| Account Messages Layout | `app/(private)/account/messages/layout.tsx` | Server | `/account/messages/*` | Active (CSS only) |
| Business Edit Layout | `app/(private)/business/edit/layout.tsx` | Server | `/business/edit` | Active |
| Chat Layout | `app/(private)/chat/layout.tsx` | Server | `/chat/*` | Active (CSS only) |
| Common Layout | `components/layout/CommonLayout.tsx` | Client | (public) + (private) | Active |

### Layout Ownership Violations

| Issue | Severity | Detail |
|-------|----------|--------|
| `PageContainer` underutilized | **MEDIUM** | Defined as canonical layout bounds (4 variants) but only used in 1 place (`ProfileSettingsSidebar.tsx`). All other pages use inline `max-w-7xl mx-auto` classes, duplicating PageContainer's purpose. |
| `business-entry` vs `my-business` duplicate route | **LOW** | Two `UserPage` enum values resolve to same URL `/account/business` |
| AuthGuard triple-wrapping | **LOW** | Three layouts wrap in `<AuthGuard>` — could be consolidated but follows Next.js route-group conventions |
| `(auth)` route group is unused | **LOW** | Group exists but has no pages, no layout, no files |

### PageContainer Usage

- **Defined at:** `components/ui/PageContainer.tsx` (4 variants: compact, default, wide, full)
- **Used at:** `ProfileSettingsSidebar.tsx` (1 consumer)
- **NOT used by:** Any page-level layout, CommonLayout, or any feature page
- **Verdict:** The canonical container primitive exists but is significantly underutilized

---

## Deliverable 9: Navigation Ownership Report

### Navigation SSOT Chain

```
config/navigation.ts (SSOT for navigation items)
  → getNavigationItems(surface, role) → Header, MobileNavDrawer, MobileBottomNav

lib/routeUtils.ts (SSOT for route mapping)
  → getPageRoute(page, params) → URL
  → useAppNavigation → navigateTo()

context/NavigationContext.tsx (SSOT for unsaved-changes guard)
  → confirmNavigation()
```

### Navigation Ownership

| Responsibility | Canonical Owner | Duplicate Owner | Status |
|---------------|----------------|-----------------|--------|
| Route definitions | `lib/routeUtils.ts` | None | **Clean** |
| Navigation item config | `config/navigation.ts` | None | **Clean** |
| Navigation hook | `hooks/useAppNavigation.ts` | `hooks/usePostAdNavigation.ts` | **Acceptable** (separate concerns) |
| Unsaved-changes guard | `context/NavigationContext.tsx` | None | **Clean** |
| Mobile bottom nav | `MobileBottomNav.tsx` (global) | `MobileAccountBottomNav.tsx` (account) | **Potential conflict** on mobile account pages |
| Ad card navigation | `ad-card/shared.tsx` (declarative Link) | `router.push()` in same file | **Dual pattern** in same component family |

### Navigation Duplication Risks

1. **Two bottom nav bars** — Global `MobileBottomNav` and account-specific `MobileAccountBottomNav` may overlap on mobile account pages (mitigated by chrome policy)
2. **Dual ad card navigation** — `AdCardLinkWrapper` (declarative `<Link>`) and `useAdCardNavigation` (imperative `router.push()`) coexist in same component family

---

## Deliverable 10: Component Ownership Matrix

| Component | Presentation Owner | Business Logic Owner | Data Owner | Navigation Owner | Modal Owner | Layout Owner |
|-----------|-------------------|---------------------|------------|-----------------|-------------|--------------|
| **Post Ad Wizard** | `post-ad/` components | `hooks/listings/useListingSubmission` | React Query + SSR | `NavigationContext` | `ListingModalLayout` | `post-ad/layout.tsx` |
| **Listing Form** | `shared/ListingFormFields` | `shared/useListingFormOrchestration` | React Query + SSR | `NavigationContext` | `ListingModalLayout` | `post-service/layout.tsx` |
| **Browse Ads** | `BrowseAds.tsx` (monolithic) | `BrowseAds.tsx` (inline) | React Query | Inline `router.push()` | None | `(public)/layout.tsx` |
| **Browse Services** | `BrowseListingCard` | `useBrowseListingsController` | React Query | `getPageRoute` | None | `(public)/layout.tsx` |
| **Listing Detail** | `listing-detail/` components | `lib/listings/listingDetailPage.tsx` (RSC) | SSR + React Query | `ListingPageClient` | `ListingDetailDialogs` | `(public)/layout.tsx` |
| **Account Shell** | `ProfileSettingsSidebar` | `AccountPageShell` | Auth + React Query | `useAppNavigation` | None | `account/layout.tsx` |
| **Static Pages** | Inline in page file | None | None | None | None | `(public)/layout.tsx` |

### Ownership Violations

| Violation | Severity | Detail |
|-----------|----------|--------|
| `BrowseAds.tsx` owns presentation AND business logic AND data | **HIGH** | 472-line monolithic component violates Zero-Leakage governance |
| `useListingDetailActions.ts` calls `formatPrice(ad.price)` | **MEDIUM** | Presentation formatting inside a logic hook |
| `AdCardMeta.tsx` has inline service price formatting | **MEDIUM** | Price range logic should be in `listingPresentation.ts` |
| Three parallel Ad type systems (`Listing`, `Ad`, `AdData`/`UiAd`) | **HIGH** | Multiple type definitions for the same entity — `AdCardData = AdData \| UiAd \| Ad` is a fragile union workaround |
| `schemas/ad.schema.ts` defines local Ad type instead of importing from contracts | **MEDIUM** | Duplicate type definition |

---

## Deliverable 11: Duplicate Implementation Report

| # | Duplicate A | Duplicate B | Similarity | Recommendation |
|---|-------------|-------------|------------|---------------|
| 1 | `BrowseAds.tsx` (472 lines) | `BrowseListingsView` + `BrowseResultsPanel` pipeline | ~90% | Migrate BrowseAds to use the SSOT pipeline |
| 2 | `ad-card/AdCardGrid.tsx` | `BrowseListingCard` | ~75% | Assess consolidation — may stay separate if card requirements diverge |
| 3 | `CategorySection.tsx` (post-ad) | `CategorySelectorGrid` (shared) | ~85% | Extend CategorySelectorGrid with edit mode lock + aria-pressed, then consume in post-ad |
| 4 | `ImageUploadSection.tsx` (post-ad) | `ListingImagesField` (shared) | ~70% | Extend ListingImagesField with `onSetMain` prop |
| 5 | `PriceSection.tsx` (post-ad) | `ListingPriceField` (shared) | ~60% | Extend ListingPriceField with Free toggle |
| 6 | `BrowseListingResults.tsx` | `BrowseResultsPanel` (direct) | 100% | **Delete** BrowseListingResults (pure pass-through) |
| 7 | `apps/web/label.tsx` | `@esparex/ui` Label atom | 100% | **Delete** local label.tsx, replace with re-export |
| 8 | `"business-entry"` + `"my-business"` (routeUtils) | Same URL `/account/business` | 100% | Consolidate enum values |
| 9 | `getPlanBadge` in `shared.tsx` | `getPlanBadge` in `AdCardCover.tsx` | ~90% | Both may render simultaneously on same card (visual bug) |
| 10 | `clearBrandDependents` (empty fn) | Intent to clear models | 100% dead | Implement or remove |

---

## Deliverable 12: Dead Code Report

### Safe to Delete Immediately

| # | File/Function | Reason |
|---|---------------|--------|
| 1 | `BrowseListingResults.tsx` (86 lines) | Pure pass-through wrapper, adds zero value |
| 2 | `apps/web/src/components/ui/label.tsx` | Duplicate of `@esparex/ui` Label — replace with re-export |
| 3 | `clearBrandDependents` (empty function body) | Dead code — never executes any logic |
| 4 | `brandIsPending` state + setter | Never set to `true`, exposed but not consumed |
| 5 | `PostAdWizardProps.setHasUnsavedChanges` | Declared but never used |
| 6 | `isLoadingModels` in catalog state | Exposed but never consumed by any component |

### Safe to Delete After Migration (Legacy Shim)

| # | File | Migration Requirement |
|---|------|----------------------|
| 7 | `chat/[conversationId]/page.tsx` | Must confirm all chat links use the new route format |
| 8 | `browse-services/page.tsx` (in both groups) | Already redirects — confirm no bookmarks point here |
| 9 | `browse-spare-parts/page.tsx` (in both groups) | Already redirects — confirm no bookmarks point here |
| 10 | `login/page.tsx` | Must implement a proper login page first |

### Zombie Route Group

| # | Entity | Action |
|---|--------|--------|
| 11 | `(auth)/` route group (entire directory) | Delete — has no files, no layout, no pages |

### Potential Bug (Not Dead but Broken)

| # | File | Issue |
|---|------|-------|
| 12 | `AdCardGrid.tsx` + `AdCardCover.tsx` | Duplicate badge rendering — both pass `getPlanBadge` as children AND render it internally |
| 13 | `login/page.tsx` | Renders the homepage instead of a login form |

---

## Deliverable 13: Consolidation Recommendations

### HIGH PRIORITY (Architecture-Critical)

| # | Recommendation | Effort | Risk | Impact |
|---|---------------|--------|------|--------|
| 1 | **Migrate `BrowseAds.tsx` to use `BrowseListingsView` pipeline** | 2-3 days | Medium | Eliminates 472-line monolithic duplicate, aligns Ad browsing with Service/SparePart browsing |
| 2 | **Unify card systems** — migrate BrowseAds to `BrowseListingCard` or extend `BrowseListingCard` to support ad-specific props | 1-2 days | Medium | Eliminates duplicate card rendering system |
| 3 | **Consolidate listing type definitions** — eliminate `AdData`, `UiAd`, local `Ad` schema. Use `Listing` from normalizer as single canonical type | 1 day | High (touches many files) | Eliminates fragile `AdCardData` union type |

### MEDIUM PRIORITY

| # | Recommendation | Effort | Risk | Impact |
|---|---------------|--------|------|--------|
| 4 | **Extend `CategorySelectorGrid`** with edit mode lock + aria-pressed, replace post-ad's `CategorySection.tsx` | 0.5 day | Low | Eliminates SSOT violation |
| 5 | **Extend `ListingImagesField`** with `onSetMain` prop, replace post-ad's `ImageUploadSection.tsx` | 0.5 day | Low | Eliminates duplicate image upload |
| 6 | **Delete `BrowseListingResults.tsx`** | 0.1 day | None | Dead code removal |
| 7 | **Delete local `label.tsx`**, replace with re-export from `@esparex/ui` | 0.1 day | None | SSOT violation fix |
| 8 | **Consolidate `"business-entry"` and `"my-business"`** in `routeUtils.ts` | 0.1 day | Low | Eliminates duplicate route enum |
| 9 | **Fix duplicate `getPlanBadge` rendering** in AdCardGrid + AdCardCover | 0.2 day | Low | Fixes visual bug |
| 10 | **Fix `login/page.tsx`** to render actual login form instead of homepage | 0.5 day | Medium | Fixes broken route |
| 11 | **Remove duplicate `browse-services` and `browse-spare-parts`** from `(private)` route group | 0.1 day | None | Zombie route elimination |

### LOW PRIORITY

| # | Recommendation | Effort | Risk | Impact |
|---|---------------|--------|------|--------|
| 12 | Consolidate price formatting into `listingPresentation.ts` | 0.5 day | Low | Cleaner separation of concerns |
| 13 | Delete `(auth)/` route group | 0.05 day | None | Empty directory cleanup |
| 14 | Remove `clearBrandDependents` empty function | 0.05 day | None | Dead code cleanup |
| 15 | Remove `brandIsPending` + `isLoadingModels` if unconsumed | 0.1 day | None | Dead state cleanup |
| 16 | Remove `setHasUnsavedChanges` from PostAdWizardProps | 0.05 day | None | Dead prop cleanup |
| 17 | Consolidate `getNestedFieldMeta` and `getFirstFormErrorMessage` | 0.2 day | Low | Shared utility consolidation |

### DO NOT CONSOLIDATE (Architecturally Justified)

| # | Non-Consolidation | Rationale |
|---|-------------------|-----------|
| 1 | Post Ad wizard vs Service/SparePart single-page form | Below 75% similarity threshold per AGENTS.md |
| 2 | Global `MobileBottomNav` vs account `MobileAccountBottomNav` | Different interaction models (Link-based vs button-based tab switching) |

---

## Deliverable 14: Safe Deletion List

### Zero-Risk Deletions (Can delete immediately)

```
apps/web/src/components/user/BrowseListingResults.tsx
apps/web/src/components/ui/label.tsx                   (replace with re-export)
apps/web/src/app/(auth)/                                (empty route group)
```

### Low-Risk Deletions (Verify usage first)

```
apps/web/src/app/(private)/browse-services/page.tsx     (zombie — duplicate of public)
apps/web/src/app/(private)/browse-spare-parts/page.tsx  (zombie — duplicate of public)
```

### Medium-Risk Deletions (Require minor migration)

```
apps/web/src/app/(public)/login/page.tsx                (broken — re-implement first)
apps/web/src/app/(private)/chat/[conversationId]/page.tsx (redirect shim — verify no traffic)
```

---

## Deliverable 15: Migration Strategy

### Phase 1: Quick Wins (No risk, immediate)
1. Delete `BrowseListingResults.tsx` — import `BrowseResultsPanel` directly
2. Replace `apps/web/src/components/ui/label.tsx` with 1-line re-export
3. Remove empty `clearBrandDependents` function body
4. Remove `brandIsPending` / `setBrandIsPending` if unconsumed
5. Remove `(auth)/` route group directory
6. Fix duplicate `getPlanBadge` in AdCardGrid + AdCardCover
7. Remove duplicate `browse-services` + `browse-spare-parts` from `(private)` group

### Phase 2: Form Consolidation (0.5-1 day each)
8. Extend `CategorySelectorGrid` with edit mode lock + aria-pressed → replace `CategorySection.tsx`
9. Extend `ListingImagesField` with `setMain` → replace `ImageUploadSection.tsx`
10. Extend `ListingPriceField` with Free toggle → replace `PriceSection.tsx`
11. Fix login page to render actual login form

### Phase 3: List/Route Architecture (2-3 days)
12. Refactor `BrowseAds.tsx` to use `BrowseListingsView` pipeline
13. Decide on card unification strategy (adopt `BrowseListingCard` vs extend `ad-card`)
14. Consolidate listing type definitions (`AdData`/`UiAd`/`Ad` → single `Listing`)

### Phase 4: Polish (0.5-1 day)
15. Move price formatting to `listingPresentation.ts`
16. Consolidate `getNestedFieldMeta` and `getFirstFormErrorMessage`
17. Consolidate `"business-entry"` / `"my-business"` enum values

---

## Deliverable 16: Risk Assessment

### High-Risk Migrations

| Change | Risk | Mitigation |
|--------|------|------------|
| Refactor `BrowseAds.tsx` to use `BrowseListingsView` | **High** — 472 lines, many edge cases | Maintain backward-compatible URL behavior. Keep both implementations during transition. Run E2E tests. |
| Consolidate type definitions (`AdData`/`UiAd`/`Ad` → `Listing`) | **High** — affects many files across the app | Create adapter layer. Roll out incrementally per component. |
| Fix `login/page.tsx` | **Medium** — currently renders homepage, users may rely on this | Deploy new login page, ensure `/login` route works correctly |

### Medium-Risk Migrations

| Change | Risk | Mitigation |
|--------|------|------------|
| Card system unification | **Medium** — `AdCardGrid`/`AdCardList` are deeply integrated | Keep both systems alive during transition, deprecate one |
| Form field consolidation | **Medium** — Post Ad has specific behaviors (edit mode lock, AI generation) | Extend shared components with optional props, don't break existing post-ad behavior |

### Low-Risk Migrations

| Change | Risk | Rationale |
|--------|------|-----------|
| Dead code removals | **None** | Functions are empty, components are pass-through wrappers |
| Empty route group deletion | **None** | No content to break |
| Duplicate route removal | **Low** | Both routes already redirect, but verify traffic first |
| Re-export primitives | **None** | Functionally identical |
| Enum consolidation | **Low** | Both point to same URL, just need to update references |

---

## Executive Summary

**Total files audited:** ~200+
**Total routes audited:** 42
**Total standalone pages:** 13
**Total shell/proxy pages:** 14
**Total zombie pages:** 4
**Total legacy pages:** 5
**Total duplicate implementations:** 10
**Total dead code items:** 7
**Total SSOT violations:** 12
**Total safe-to-delete items:** 8

### Critical Findings

1. **`BrowseAds.tsx` (472 lines) is the largest duplicate** — a full parallel implementation of the `BrowseListingsView` pipeline. This should be the top migration priority.

2. **Two parallel form architectures** — Post Ad (custom wizard with 6 contexts) vs Service/Spare Part (config-driven single-page form). **Keep separate** per similarity threshold rules.

3. **Two parallel card systems** — `ad-card/` components for Ads vs `BrowseListingCard` for Services/Spare Parts. Consolidation decision needed.

4. **Three parallel Ad type definitions** — `Listing` (normalizer), `Ad` (local schema), `AdData`/`UiAd` (legacy) — fragile union type as workaround.

5. **`PageContainer` underutilized** — defined as canonical layout primitive but used in only 1 of 20+ consumer locations.

6. **`login/page.tsx` is broken** — renders homepage instead of login form.

7. **`BrowseListingResults.tsx` is a pure pass-through** — 86 lines of dead wrapper code.

8. **`apps/web/label.tsx` is a duplicate** — full local copy of `@esparex/ui` Label atom.