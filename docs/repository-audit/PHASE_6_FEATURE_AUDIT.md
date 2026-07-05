# Phase 6: Feature Audit Report

## 1. Executive Summary
A feature audit was conducted across the logical features of the Esparex project without diving into specific coding implementations. The audit mapped route definitions, controllers, models, and services to distinct domain features (Authentication, Ads/Listings, Catalog, Location, Chat, Notifications, Payments, Smart Alerts, and Business/User Profiles). The verification discovered severe service-layer splits (especially in Listings and Location) and several dead service stubs.

---

## 2. Scope
This audit evaluated the codebase's feature division and mapping across:
- Route controllers and handlers
- Backend database models
- Business services in `core/src/services/`
- Frontend routes and state management hooks

---

## 3. Inventory
The project supports 10 core features:
1. **Authentication** — OTP validation, session security, and role permissions.
2. **Listings (Ads)** — Vehicles and spare parts classified advertisements.
3. **Catalog** — Taxonomy categories, brand-to-model hierarchies, and user additions request flow.
4. **Location** — Geolocation detection, state autocomplete, and coordinate validation.
5. **Chat** — Direct messaging, conversation status, and flagging reports.
6. **Notifications** — Push, Email, and in-app system messaging.
7. **Payments & Wallet** — Razorpay integration, transaction histories, and user wallets.
8. **Smart Alerts** — User notifications based on saved listings searches.
9. **Business Profiles** — Verified dealer registrations and settings.
10. **User Profiles** — Customer contact cards and settings.

---

## 4. Findings

### Critical Severity Findings
1. **Severe Fragmentation of Location Feature Logic**
   - **Finding**: Location utility, engine, and query logic are scattered across at least 6 separate folders:
     - `core/src/utils/`
     - `shared/src/utils/`
     - `shared/src/listingUtils/`
     - `shared/src/location/`
     - `shared/src/location-engine/`
     - `core/src/services/location/`
   - **Impact**: High probability of code duplication and calculation differences (e.g. distance formulas or radius checks returning different results between frontend validation, backend schemas, and database spatial queries).

---

### High Severity Findings
2. **Split Classified Listings (Ads) Services**
   - **Finding**: Listing services are divided between `core/src/services/*.ts` (9 flat files) and `core/src/services/ad/*.ts` (9 sub-directory files).
     - *Flat Services*: `AdCreationService`, `AdDuplicateService`, `AdEngagementService`, `AdImageService`, `AdMediaService`, `AdMutationService`, `AdOrchestrator`, `AdSlotService`, `AdValidationService`.
     - *Sub-directory Services*: `AdAggregationService`, `AdDetailService`, `AdFeedService`, `AdMetricsService`, `AdPolicyService`, `AdPromotionService`, `AdRepostService`, `AdSearchService`, `AdUpdateService`.
   - **Impact**: Confuses developers, as there is no clean partition standard determining where a listing operation should be implemented.

3. **Dead or Redundant Service Stubs**
   - **Finding**:
     - `core/src/services/ChatService.ts` is a 213-byte stub containing no logic, while the actual implementation lives in `core/src/services/chat/`.
     - `core/src/services/NotificationService.ts` coexists with `core/src/services/notification/` subdirectory.
   - **Impact**: Contaminates imports and increases dead code clutter.

---

### Medium Severity Findings
4. **Oversized Catalog Services & Standalone Files**
   - **Finding**: `core/src/services/catalog/` contains 11 files, but `CatalogHierarchyService.ts` (49 KB) and `CatalogSearchGovernanceService.ts` (81 KB) are excessively large files that violate single responsibility rules. In addition, `catalogRequestApprovalService.ts` is placed flat outside the subdirectory.
   - **Impact**: Poor maintainability of catalog mapping.

5. **Duplicate Payment Reconciliation Job files**
   - **Finding**: Both `reconcilePayments.job.ts` and `reconcilePayments.ts` exist in the `core/src/jobs/` directory.
   - **Impact**: Duplicate file names causing code clutter and potential import confusion.

---

## 5. Evidence

### Location Scattering Examples
- [shared/src/location/location.utils.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/location/location.utils.ts)
- [shared/src/location-engine/index.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/location-engine/index.ts)
- [shared/src/listingUtils/locationUtils.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/shared/src/listingUtils/locationUtils.ts)

### Empty Chat Service Stub
- [core/src/services/ChatService.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/ChatService.ts)

### Duplicate Payment Reconciliation Job Files
- `core/src/jobs/reconcilePayments.job.ts`
- `core/src/jobs/reconcilePayments.ts`

---

## 6. Risk Level
- **Overall Feature Risk**: **High**
- The split listings and scattered location logic increase the risk of developer errors and runtime calculation mismatch issues.

---

## 7. Recommendations
1. **Unify Location Code**: Relocate all environment-agnostic location primitives and utils to a single `shared/src/location/` module. Delete separate listing location engines.
2. **Consolidate Listings (Ads) Services**: Move the 9 flat services in `core/src/services/` into `core/src/services/ad/` and document the single point of entry for listing operations.
3. **Prune Stubs**: Delete the empty 213-byte `ChatService.ts` and merge the flat `NotificationService.ts` into the subdirectory.
4. **Catalog Restructuring**: Move `catalogRequestApprovalService.ts` into `core/src/services/catalog/` and break down the oversized hierarchy and search governance files.

---

## 8. Out-of-Scope Items
- Inspection of frontend app components (covered in Frontend/Admin audits).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 7 — API Audit**.
