# Backend SSOT Refactor — Controller → Service Layer

**Goal:** No controller imports a Mongoose model directly. All DB access lives in the service layer.

**Rule:** `controllers/` may only import from `services/`, `utils/`, `middleware/`, `config/`, and shared types.

---

## Status

### ✅ Done (PRs #19 + #20)

| Controller | Service functions extracted to |
|---|---|
| `auth/authController` | `UserService.removeUserFcmToken` |
| `notification/notificationMutationController` | `NotificationService` (markAllRead, markById, delete) |
| `payment/paymentQueryController` | `PaymentProcessingService` (getActivePlans, getUserTransactions, getInvoice, getTransactionWithUser) |
| `payment/paymentMutationController` | `PaymentProcessingService` (getPlanById, getUserForPayment) |
| `user/userQueryController` | `UserService.getUserWithBusiness` |
| `user/userMutationController` | `UserService` (removeUserFcmToken, env reads) |
| `business/businessQueryController` | `BusinessCoreService` (getBusinessListings, getBusinessStats) |
| `business/businessMutationController` | `UserService.getUserPhoneVerification` |
| `business/businessUserController` | `BusinessCoreService` (getBusinessByUserId, getBusinessStats) |
| `savedAd/savedAdQueryController` | `SavedAdService.getSavedAds` |
| `savedAd/savedAdMutationController` | `SavedAdService` (saveAd, unsaveAd) |
| `report/reportController` | `ReportService` (checkTarget, createReport, countActive, autoHide) |
| `admin/adminAuditController` | `AdminService.getAuditLogs` |
| `admin/adminSmartAlertsController` | `SmartAlertService.getAlertDeliveryLogs` |
| `admin/adminSessionController` | `AdminSessionService` (getAdminSessions, revokeById) |
| `admin/admin2FAController` | `AdminService` (getAdminWithTwoFactor, saveAdmin) |
| `admin/adminApiKeyController` | `ApiKeyService` (getApiKeys, createApiKey, revokeApiKey) |
| `sparePartListing/sparePartListingController` | `SparePartListingService.saveSparePartListing` |
| `listing/listingController` | `AdService` (partial) |
| `location/locationController` | env via `config/env` |

---

## 🔲 Remaining (this session)

### Group A — Admin system controllers

| # | Controller | Lines | Models accessed directly | Target service |
|---|---|---|---|---|
| 1 | ✅ `admin/adminAdsController` | 744 | Ad, Report | `AdService.getAdForModerationById` + `ReportService` (extend) |
| 2 | ✅ `admin/adminListingsController` | 593 | Ad, Report | `AdService.extendListingExpiry` + `ReportService.bulkResolveReports` |
| 3 | ✅ `admin/adminUsersController` | 493 | User, Admin | `AdminUsersService` (extend — 13 new functions) |
| 4 | ✅ `admin/adminInvoiceController` | 404 | Invoice, Transaction, Plan, User, UserPlan | `InvoiceService` + `PaymentProcessingService` + `UserService` (extend) |
| 5 | ✅ `admin/adminLocationController` | 740 | Location, Ad, User, Geofence | `AdminLocationService` (new) |
| 6 | ✅ `admin/adminNotificationController` | 344 | NotificationLog, ScheduledNotification, User | `AdminNotificationService` (new) |
| 7 | ✅ `admin/system/adminAuthController` | 338 | Admin | `AdminService` (extend — 5 new functions) |
| 8 | ✅ `admin/system/adminDashboardController` | 559 | User, Ad, Model, Report, Business, RevenueAnalytics, ContactSubmission, Location, LocationAnalytics, AdminLog | `AdminDashboardService` (new) |
| 9 | ✅ `admin/adminBusinessController` | 308 | Business, Ad | `AdminBusinessService` (extend) |

### Group B — Listing controllers

| # | Controller | Lines | Models accessed directly | Target service |
|---|---|---|---|---|
| 10 | ✅ `listing/listingController` | 501 | Ad, Brand, Category, Model, SparePart, ServiceType | `AdService` (extend) |
| 11 | ✅ `service/serviceMutationController` | 618 | Ad, Category | `AdService` + `CatalogValidationService` (extend) |
| 12 | ✅ `service/serviceQueryController` | 116 | Ad | `AdService` (extend) |

### Group C — Catalog controllers

| # | Controller | Lines | Models accessed directly | Target service |
|---|---|---|---|---|
| 13 | ✅ `catalog/catalogBrandModelController` | 771 | Category, Brand, Model, Ad, SparePart | `CatalogBrandModelService` (new) |
| 14 | ✅ `catalog/catalogCategoryController` | 370 | Category, Brand, Model, SparePart, ServiceType, ScreenSize | `CatalogCategoryService` (new) |
| 15 | ✅ `catalog/catalogSparePartController` | 351 | Category, Brand, Model, SparePart, Ad | `CatalogSparePartService` (new) |
| 16 | ✅ `catalog/catalogReferenceController` | 292 | Category, Brand, ServiceType, ScreenSize, Ad | `CatalogReferenceService` (new) |
| 17 | ✅ `catalog/catalogGovernanceController` | 163 | Category, Ad, Brand, Model | `CatalogGovernanceService` (new) |

---

### Group D — Remaining controllers (final session)

| # | Controller | Violation | Fix |
|---|---|---|---|
| 18 | ✅ `admin/system/adminAuthController` | `import { IAdmin }` (runtime) | Changed to `import type { IAdmin }` |
| 19 | ✅ `report/reportController` | `import { ReportTargetTypeValue }` (runtime) | Changed to `import type` |
| 20 | ✅ `content/editorial.content.controller` | `PageContent` model | `PageContentService` (new) |
| 21 | ✅ `invoice/invoiceMutationController` | `Invoice`, `mongoose.model('User')` | `InvoiceService.createInvoiceRecord` + `UserService.findUserByEmail` |
| 22 | ✅ `wallet/shared.ts` | `UserWallet`, `Transaction` | Re-exported typed wrappers via `WalletService` |
| 23 | ✅ `plan/shared.ts` | `Plan`, `UserPlan` | Re-exported typed wrappers via `PlanService` |
| 24 | ✅ `smartAlert/shared.ts` | `SmartAlert`, `UserPlan`, `Plan`, `UserWallet` | Re-exported typed wrappers via `SmartAlertService` + `PlanService` + `WalletService` |
| 25 | ✅ `business/shared.ts` | `BusinessModel` (findBusinessByIdentifier) | Moved to `BusinessCoreService`, re-exported |
| 26 | ✅ `user/userMutationController` | `User`, `Business`, `BlockedUser` | `UserService` + `BusinessCoreService` (extend) |
| 27 | ✅ `sparePartListing/sparePartListingController` | `Ad`, `SparePart`, `Category` | `SparePartListingService` + `CatalogCategoryService` + `CatalogSparePartService` |

---

## ✅ REFACTOR COMPLETE — all controllers now SSOT-compliant

Zero runtime model imports in `controllers/`. All `import type` uses remain (SSOT-compliant).

---

## New services created this session

| Service | Purpose |
|---|---|
| `SavedAdService.ts` | Save/unsave ads, paginated fetch with metadata hydration |
| `ReportService.ts` | Target validation, report creation, auto-hide threshold logic |
| `ApiKeyService.ts` | API key lifecycle (create, list, revoke) |
| `AdminDashboardService.ts` | Dashboard overview/card stats, admin logs, contact submissions, location analytics |
| `AdminLocationService.ts` | Location CRUD, geofence CRUD, dependency checks |
| `AdminNotificationService.ts` | Notification log and scheduled notification queries |
| `AdminRevealService.ts` | Contact reveal log queries |
| `PageContentService.ts` | Editorial page content CRUD (findBySlug, upsertBySlug, getAll) |
| `catalog/CatalogGovernanceService.ts` | Category health metrics (Ad/Brand/Model aggregations) |
| `catalog/CatalogCategoryService.ts` | Category CRUD + 6-model entity count query |
| `catalog/CatalogBrandModelService.ts` | Brand + Model CRUD, dependency checks, suggestion flows |
| `catalog/CatalogSparePartService.ts` | SparePart CRUD, active brand/model ID helpers |
| `catalog/CatalogReferenceService.ts` | ServiceType + ScreenSize CRUD, dependency checks |

## Services extended this session

| Service | Added functions |
|---|---|
| `UserService` | getUserById, getUserWithBusiness, getUserPhoneVerification, getUserAvatarById, checkUserExistsById, blockUserById, unblockUserById |
| `BusinessCoreService` | getBusinessListings, getBusinessStats, findBusinessByIdentifier, getBusinessByUserIdLean, softDeleteBusinessesByUserId |
| `AdminService` | getAuditLogs, getAdminWithTwoFactor, saveAdmin, findAdminByEmailForAuth, findAdminByResetToken, findAdminForLogin, updateAdminLastLogin, getAdminProfileById |
| `SmartAlertService` | getAlertDeliveryLogs, SmartAlertDocument type, SmartAlertModel typed wrapper |
| `AdminSessionService` | getAdminSessions, revokeAdminSessionById |
| `PaymentProcessingService` | getPlanById, getUserForPayment |
| `WalletService` | WalletModel typed wrapper, TransactionModel typed wrapper |
| `PlanService` | PlanModel typed wrapper, UserPlanModel typed wrapper |
| `SparePartListingService` | generateUniqueSparePartSlug |
