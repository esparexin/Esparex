# Esparex Repository Cleanup Consolidated Audit Report

## STATUS: AWAITING HUMAN APPROVAL

This consolidated report packages all findings, safe deletion candidates, rollback actions, and validation steps.

---

# Executive Summary — Repository Cleanup Audit

## 📋 Repository Metadata
- **Repository:** Esparex
- **Branch:** cleanup-phase-1
- **Commit Hash:** eea48f3c79256afad440b2994a9debf5bf102fb0
- **Scan Time:** 2026-07-03T02:54:10.974Z
- **Workspace Count:** 5
- **Node Version:** v20.11.1
- **Package Manager:** npm
- **Cleanup Engine Version:** 1.2.0
- **Scanner Version:** 1.2.0


---

## 📈 Health Overview & Statistics

| Safety Category | Count | Percentage |
| :--- | :---: | :---: |
| **APPROVED_FOR_DELETION** | 0 | 0.0% |
| **VERIFIED_SAFE_DELETE** | 1 | 2.7% |
| **DELETE_CANDIDATE** | 6 | 16.2% |
| **REVIEW_REQUIRED** | 27 | 73.0% |
| **BLOCK_DELETE** | 3 | 8.1% |

---

## 🚀 Deletion Plan Summary
We identified **0** files that have 0 references across all analyzed verification gates at 100% confidence and are approved for deletion.

---

## 🔍 Recovery Checkpoints
Rollback commands have been generated using tag `pre-cleanup-2026-07-03_02-54-10`.


---

# Verification Pipeline Gate Matrix

This report logs the sequential traversal status of all scanned candidates through EGE verification gates.

---

| Candidate File | Static | Runtime | Framework | Convention | Config | Docs | Git | Replacement | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/next-env.d.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ❌ | **DELETE_CANDIDATE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/app/not-found.tsx` | ✔ | ✔ | ❌ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **BLOCK_DELETE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/hooks/useAdminStatusFilteredList.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/next-env.d.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ❌ | **DELETE_CANDIDATE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/app/global-error.tsx` | ✔ | ✔ | ❌ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **BLOCK_DELETE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/app/not-found.tsx` | ✔ | ✔ | ❌ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **BLOCK_DELETE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/common/AppErrorBanner.tsx` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/MobileStickyCta.tsx` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **DELETE_CANDIDATE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/listings/useListingCatalog.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/usePostAdPreload.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/errors/errorToPopup.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **DELETE_CANDIDATE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/browseServerPage.tsx` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/listingPriceAdapter.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/schemas/sparePartListingPayload.schema.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/@types/index.d.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **DELETE_CANDIDATE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/HMACSignatureMiddleware.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/lifecyclePolicyGuard.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/express.d.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/reliability-core-augmentations.d.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **DELETE_CANDIDATE** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/admin2FAController.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminCacheController.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminRevealController.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/chat/chatAdminController.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/middleware/HMACSignatureMiddleware.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/queues/queueDashboard.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/SellerTrustSignalsService.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/adminLogHelpers.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/mongoUtils.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/serviceRefResolver.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/promotion.validator.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/wallet.validator.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ❌ | **REVIEW_REQUIRED** |
| `C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠️ | ✔ | **VERIFIED_SAFE_DELETE** |


---

# Approval Queue — Codebase Cleanup

> [!IMPORTANT]
> **STATUS: AWAITING HUMAN APPROVAL**
> The files listed in this queue have successfully cleared all EGE verification gates at 100% confidence.

---

## Approved Candidates Inventory (0 files)

*No files have passed all gates at 100% confidence to enter the approval queue.*

---

# Deletion Execution Batch Plan

Phased deletion grouping compiled based on logical workspaces.

---

*No approved deletion phases scheduled.*

---

# Cleanup Statistics Report

## 📋 Repository Metadata
- **Repository:** Esparex
- **Branch:** cleanup-phase-1
- **Commit Hash:** eea48f3c79256afad440b2994a9debf5bf102fb0
- **Scan Time:** 2026-07-03T02:54:10.974Z
- **Workspace Count:** 5
- **Node Version:** v20.11.1
- **Package Manager:** npm
- **Cleanup Engine Version:** 1.2.0
- **Scanner Version:** 1.2.0


---

## 🚀 Deletions vs Retained Counts
- **Total Scanned Candidates:** 37
- **Approved for Deletion (100%):** 0
- **Verified Safe (Review Needed):** 1
- **Delete Candidates (Unverified):** 6
- **Review Required (Imports/Renamed):** 27
- **Locked/Blocklisted (Do Not Delete):** 3

---

## 📈 Safety Ratios
- **Automated Safe Deletion Yield:** 0.0%
- **Manual Review Overhead:** 89.2%
- **System Lock Preservation:** 8.1%


---

# Safe Delete List (Verified)

The following files have met EGE safety metrics and can be safely deleted.

---

- **C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts** (Risk: LOW, Confidence: 98%)
  *Evidence:* No active code imports. git history trace exists (Age: 59 days, Last Modified: 59 days ago, Commits: 1, Contributors: 1).
  *Recommendation:* Safe to delete but has document/git history references. Review before clean.


---

# Keep List (Locked & Active)

The following files must be retained in the repository because they are referenced or have active roles.

---

- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/app/not-found.tsx** [BLOCK_DELETE] (Risk: CRITICAL, Confidence: 100%)
  *Evidence:* File base name matches Next.js app router convention: 'not-found.tsx'
  *Recommendation:* DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/app/global-error.tsx** [BLOCK_DELETE] (Risk: CRITICAL, Confidence: 100%)
  *Evidence:* File base name matches Next.js app router convention: 'global-error.tsx'
  *Recommendation:* DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/app/not-found.tsx** [BLOCK_DELETE] (Risk: CRITICAL, Confidence: 100%)
  *Evidence:* File base name matches Next.js app router convention: 'not-found.tsx'
  *Recommendation:* DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.


---

# Review Required List

The following files require developer audit before any deletion plans.

---

- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/hooks/useAdminStatusFilteredList.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/admin/src/hooks/useAdminAdsQuery.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/common/AppErrorBanner.tsx** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/components/common/BackButton.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/components/ui/accordion.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/MobileStickyCta.tsx** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/components/ui/accordion.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/components/user/profile/tabs/BusinessTab.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/listings/useListingCatalog.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/hooks/listings/useListingCategories.ts'. Replacement confidence MEDIUM (Total score: 37). Signals: filename stem overlap (7), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/usePostAdPreload.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/hooks/usePostAdForm.ts'. Replacement confidence MEDIUM (Total score: 36). Signals: filename stem overlap (6), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/browseServerPage.tsx** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/lib/listings/adReportPayload.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/listingPriceAdapter.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/lib/listings/listingPresentation.ts'. Replacement confidence MEDIUM (Total score: 36). Signals: filename stem overlap (6), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/schemas/sparePartListingPayload.schema.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/web/src/schemas/sparePart.schema.ts'. Replacement confidence MEDIUM (Total score: 33). Signals: filename stem overlap (3), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'backend/user/src/middleware/adminAuth.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/HMACSignatureMiddleware.ts** (Risk: HIGH, Confidence: 86%)
  *Evidence:* Potential replacement file: 'core/src/middleware/HMACSignatureMiddleware.ts'. Replacement confidence HIGH (Total score: 65). Signals: filename stem overlap (10), exported symbols matches [1/1] (35), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/lifecyclePolicyGuard.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'backend/user/src/middleware/adminAuth.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/express.d.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'backend/user/src/types/auth.types.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/admin2FAController.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/controllers/admin/adminAuditController.ts'. Replacement confidence MEDIUM (Total score: 33). Signals: filename stem overlap (3), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminCacheController.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'backend/user/src/routes/adminRoutes.ts'. Replacement confidence MEDIUM (Total score: 41). Signals: filename stem overlap (3), exported symbols matches [1/2] (18), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminRevealController.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/controllers/admin/adminApiKeyController.ts'. Replacement confidence MEDIUM (Total score: 37). Signals: filename stem overlap (7), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/chat/chatAdminController.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'apps/admin/src/app/(protected)/chat/AdminChatView.tsx'. Replacement confidence MEDIUM (Total score: 32). Signals: exported symbols matches [2/6] (12), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/middleware/HMACSignatureMiddleware.ts** (Risk: HIGH, Confidence: 86%)
  *Evidence:* Potential replacement file: 'backend/user/src/middleware/HMACSignatureMiddleware.ts'. Replacement confidence HIGH (Total score: 65). Signals: filename stem overlap (10), exported symbols matches [1/1] (35), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/queues/queueDashboard.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/queues/queueDefaults.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/services/AdCreationService.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/SellerTrustSignalsService.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/services/AdCreationService.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/adminLogHelpers.ts** (Risk: HIGH, Confidence: 92%)
  *Evidence:* Potential replacement file: 'core/src/controllers/admin/adminUsersController.ts'. Replacement confidence MEDIUM (Total score: 38). Signals: filename stem overlap (3), exported symbols matches [5/5] (35)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/mongoUtils.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/utils/mongoGeoUtils.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/serviceRefResolver.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/utils/serviceQuality.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/promotion.validator.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/validators/ad.validator.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/wallet.validator.ts** (Risk: HIGH, Confidence: 89%)
  *Evidence:* Potential replacement file: 'core/src/validators/ad.validator.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
  *Recommendation:* Confirm if replacement file fully supersedes this file before cleanup.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/next-env.d.ts** (Risk: MEDIUM, Confidence: 97%)
  *Evidence:* Unreferenced candidate requiring verification.
  *Recommendation:* Manually audit and trace file references.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/next-env.d.ts** (Risk: MEDIUM, Confidence: 97%)
  *Evidence:* Unreferenced candidate requiring verification.
  *Recommendation:* Manually audit and trace file references.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx** (Risk: MEDIUM, Confidence: 93%)
  *Evidence:* Unreferenced candidate requiring verification.
  *Recommendation:* Manually audit and trace file references.
- **C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/errors/errorToPopup.ts** (Risk: MEDIUM, Confidence: 93%)
  *Evidence:* Unreferenced candidate requiring verification.
  *Recommendation:* Manually audit and trace file references.
- **C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/@types/index.d.ts** (Risk: MEDIUM, Confidence: 93%)
  *Evidence:* Unreferenced candidate requiring verification.
  *Recommendation:* Manually audit and trace file references.
- **C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/reliability-core-augmentations.d.ts** (Risk: MEDIUM, Confidence: 95%)
  *Evidence:* Unreferenced candidate requiring verification.
  *Recommendation:* Manually audit and trace file references.


---

# Dead Code Verification Report

This report details reference matches and classifications for all scanned candidates.

---

### 1. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/next-env.d.ts
- **Confidence Score:** 97%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 100
- Replacement checks: 70
- **Overall Confidence**: 97%

### 2. [BLOCK_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/app/not-found.tsx
- **Confidence Score:** 100%
- **Risk Score:** CRITICAL
- **Evidence:** File base name matches Next.js app router convention: 'not-found.tsx'
- **Recommendation:** DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 0
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 0
- **Overall Confidence**: 73%

### 3. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/hooks/useAdminStatusFilteredList.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/admin/src/hooks/useAdminAdsQuery.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 4. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/next-env.d.ts
- **Confidence Score:** 97%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 100
- Replacement checks: 70
- **Overall Confidence**: 97%

### 5. [BLOCK_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/app/global-error.tsx
- **Confidence Score:** 100%
- **Risk Score:** CRITICAL
- **Evidence:** File base name matches Next.js app router convention: 'global-error.tsx'
- **Recommendation:** DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 0
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 75%

### 6. [BLOCK_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/app/not-found.tsx
- **Confidence Score:** 100%
- **Risk Score:** CRITICAL
- **Evidence:** File base name matches Next.js app router convention: 'not-found.tsx'
- **Recommendation:** DO NOT DELETE. Structural config, authentication code, or framework layout file required by build engine.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 0
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 0
- **Overall Confidence**: 73%

### 7. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/common/AppErrorBanner.tsx
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/components/common/BackButton.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 8. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/components/ui/accordion.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 9. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/MobileStickyCta.tsx
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/components/ui/accordion.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 10. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/components/user/profile/tabs/BusinessTab.tsx'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 11. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx
- **Confidence Score:** 93%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 70
- **Overall Confidence**: 93%

### 12. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/listings/useListingCatalog.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/hooks/listings/useListingCategories.ts'. Replacement confidence MEDIUM (Total score: 37). Signals: filename stem overlap (7), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 13. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/usePostAdPreload.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/hooks/usePostAdForm.ts'. Replacement confidence MEDIUM (Total score: 36). Signals: filename stem overlap (6), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 14. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/errors/errorToPopup.ts
- **Confidence Score:** 93%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 70
- **Overall Confidence**: 93%

### 15. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/browseServerPage.tsx
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/lib/listings/adReportPayload.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 16. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/listingPriceAdapter.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/lib/listings/listingPresentation.ts'. Replacement confidence MEDIUM (Total score: 36). Signals: filename stem overlap (6), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 17. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/schemas/sparePartListingPayload.schema.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/schemas/sparePart.schema.ts'. Replacement confidence MEDIUM (Total score: 33). Signals: filename stem overlap (3), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 18. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/@types/index.d.ts
- **Confidence Score:** 93%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 70
- **Overall Confidence**: 93%

### 19. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'backend/user/src/middleware/adminAuth.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 20. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/HMACSignatureMiddleware.ts
- **Confidence Score:** 86%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/middleware/HMACSignatureMiddleware.ts'. Replacement confidence HIGH (Total score: 65). Signals: filename stem overlap (10), exported symbols matches [1/1] (35), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 0
- **Overall Confidence**: 86%

### 21. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/lifecyclePolicyGuard.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'backend/user/src/middleware/adminAuth.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 22. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/express.d.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'backend/user/src/types/auth.types.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 23. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/reliability-core-augmentations.d.ts
- **Confidence Score:** 95%
- **Risk Score:** MEDIUM
- **Evidence:** Unreferenced candidate requiring verification.
- **Recommendation:** Manually audit and trace file references.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 70
- **Overall Confidence**: 95%

### 24. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/admin2FAController.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/controllers/admin/adminAuditController.ts'. Replacement confidence MEDIUM (Total score: 33). Signals: filename stem overlap (3), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 25. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminCacheController.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'backend/user/src/routes/adminRoutes.ts'. Replacement confidence MEDIUM (Total score: 41). Signals: filename stem overlap (3), exported symbols matches [1/2] (18), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 26. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminRevealController.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/controllers/admin/adminApiKeyController.ts'. Replacement confidence MEDIUM (Total score: 37). Signals: filename stem overlap (7), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 27. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/chat/chatAdminController.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/admin/src/app/(protected)/chat/AdminChatView.tsx'. Replacement confidence MEDIUM (Total score: 32). Signals: exported symbols matches [2/6] (12), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 28. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/middleware/HMACSignatureMiddleware.ts
- **Confidence Score:** 86%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'backend/user/src/middleware/HMACSignatureMiddleware.ts'. Replacement confidence HIGH (Total score: 65). Signals: filename stem overlap (10), exported symbols matches [1/1] (35), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 0
- **Overall Confidence**: 86%

### 29. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/queues/queueDashboard.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/queues/queueDefaults.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 30. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/services/AdCreationService.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 31. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/SellerTrustSignalsService.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/services/AdCreationService.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 32. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/adminLogHelpers.ts
- **Confidence Score:** 92%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/controllers/admin/adminUsersController.ts'. Replacement confidence MEDIUM (Total score: 38). Signals: filename stem overlap (3), exported symbols matches [5/5] (35)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 30
- **Overall Confidence**: 92%

### 33. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/mongoUtils.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/utils/mongoGeoUtils.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 34. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/serviceRefResolver.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/utils/serviceQuality.ts'. Replacement confidence MEDIUM (Total score: 34). Signals: filename stem overlap (4), same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 35. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/promotion.validator.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/validators/ad.validator.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 36. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/wallet.validator.ts
- **Confidence Score:** 89%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/validators/ad.validator.ts'. Replacement confidence MEDIUM (Total score: 30). Signals: same directory proximity (10), git rename status logs detected (20)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 50
- Replacement checks: 30
- **Overall Confidence**: 89%

### 37. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts
- **Confidence Score:** 98%
- **Risk Score:** LOW
- **Evidence:** No active code imports. git history trace exists (Age: 59 days, Last Modified: 59 days ago, Commits: 1, Contributors: 1).
- **Recommendation:** Safe to delete but has document/git history references. Review before clean.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 100
- **Overall Confidence**: 98%



---

# Esparex Cleanup Rollback Action Plan

This document outlines recovery checklists, git restore commands, and backup targets to recover files if cleanup fails.

---

## 1. Tag Backup Recommendation
Create a tag before running any deletion scripts:
```bash
git tag -a pre-cleanup-2026-07-03_02-54-10 -m "Pre-cleanup backup tag"
git push origin pre-cleanup-2026-07-03_02-54-10
```

---

## 2. Git Restore Commands
To restore all files in this cleanup phase, execute:
```bash
# Restore specific deleted files
```

Alternatively, to completely reset your local workspace back to the backup state:
```bash
git reset --hard pre-cleanup-2026-07-03_02-54-10
```

---

## 3. Recovery Checklist
- [ ] Confirm git branch is clean before running cleanup.
- [ ] Run `git tag` to verify tag creation success.
- [ ] Execute deletion phase script.
- [ ] In case of validation errors, immediately execute `git checkout pre-cleanup-2026-07-03_02-54-10 -- <failed-file>`.
- [ ] Re-run `npm run build` to verify restore success.

---

## 4. Affected File Inventory (0 files)


---

# Cleanup Changelog

### EGE Cleanup Release — 2026-07-03
- Executed EGE Cleanup Framework Phase 1.3 scanner.
- Inspected 37 file candidates.
- Flagged 0 files as APPROVED_FOR_DELETION candidates.
- Generated execution details under `docs/cleanup/`.


---

# Pull Request Template — Codebase Cleanup Audit

## STATUS: AWAITING HUMAN APPROVAL

Addresses repository cleanup analysis compiled by EGE on 2026-07-03.

---

## PR Summary
- **APPROVED_FOR_DELETION candidates**: 0 files.
- **Verification status**: Clean (build, lint, test, guards passing).
- **Rollback tag**: `pre-cleanup-2026-07-03_02-54-10`.

---

## Verification Logs (Recommended)
- [ ] npm run build
- [ ] npm run test
- [ ] npm run lint
- [ ] npm run governance:guards

