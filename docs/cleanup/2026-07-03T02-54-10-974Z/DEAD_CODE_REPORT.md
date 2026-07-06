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

