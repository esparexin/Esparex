# Dead Code Verification Report

This report details reference matches and classifications for all scanned candidates.

---

### 1. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/next-env.d.ts
- **Confidence Score:** 93%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/next-env.d.ts'. Replacement confidence HIGH (Score: 100)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 100
- Replacement checks: 20
- **Overall Confidence**: 93%

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
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 77%

### 3. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/src/hooks/useAdminStatusFilteredList.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 4. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/next-env.d.ts
- **Confidence Score:** 93%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/admin/next-env.d.ts'. Replacement confidence HIGH (Score: 100)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 100
- Replacement checks: 20
- **Overall Confidence**: 93%

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
- Git history stats: 80
- Replacement checks: 50
- **Overall Confidence**: 80%

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
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 77%

### 7. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/common/AppErrorBanner.tsx
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 8. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx
- **Confidence Score:** 98%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

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

### 9. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/MobileStickyCta.tsx
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 10. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx
- **Confidence Score:** 98%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

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

### 11. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx
- **Confidence Score:** 98%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

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

### 12. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/listings/useListingCatalog.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/hooks/listings/useListingCategories.ts'. Replacement confidence HIGH (Score: 70)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 13. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/hooks/usePostAdPreload.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 14. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/errors/errorToPopup.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 15. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/browseServerPage.tsx
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 16. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/lib/listings/listingPriceAdapter.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 17. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/schemas/sparePartListingPayload.schema.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 18. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/@types/index.d.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'apps/web/src/components/user/ad-card/index.tsx'. Replacement confidence HIGH (Score: 71)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 19. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts
- **Confidence Score:** 98%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

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

### 20. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/HMACSignatureMiddleware.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/middleware/HMACSignatureMiddleware.ts'. Replacement confidence HIGH (Score: 150)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 21. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/lifecyclePolicyGuard.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 22. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/express.d.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/types/express.ts'. Replacement confidence HIGH (Score: 78)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 23. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/types/reliability-core-augmentations.d.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/utils/securityMonitoring.ts'. Replacement confidence HIGH (Score: 200)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 24. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/admin2FAController.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 25. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminCacheController.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/controllers/admin/system/adminDashboardController.ts'. Replacement confidence HIGH (Score: 83)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 26. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/adminRevealController.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/controllers/admin/adminApiKeyController.ts'. Replacement confidence HIGH (Score: 71)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 27. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/controllers/admin/chat/chatAdminController.ts
- **Confidence Score:** 96%
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
- Replacement checks: 80
- **Overall Confidence**: 96%

### 28. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/middleware/HMACSignatureMiddleware.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'backend/user/src/middleware/HMACSignatureMiddleware.ts'. Replacement confidence HIGH (Score: 150)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 29. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/queues/queueDashboard.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 30. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts
- **Confidence Score:** 98%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

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

### 31. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/SellerTrustSignalsService.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 32. [REVIEW_REQUIRED] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/adminLogHelpers.ts
- **Confidence Score:** 91%
- **Risk Score:** HIGH
- **Evidence:** Potential replacement file: 'core/src/controllers/admin/adminUsersController.ts'. Replacement confidence HIGH (Score: 275)
- **Recommendation:** Confirm if replacement file fully supersedes this file before cleanup.

#### Confidence Breakdown
- Static references: 100
- Runtime references: 100
- Framework conventions: 100
- Repository conventions: 100
- Configuration inclusions: 100
- Documentation matches: 100
- Git history stats: 80
- Replacement checks: 20
- **Overall Confidence**: 91%

### 33. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/mongoUtils.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 34. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/utils/serviceRefResolver.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 35. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/promotion.validator.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 36. [DELETE_CANDIDATE] C:/Users/Administrator/Documents/GitHub/Esparex/core/src/validators/wallet.validator.ts
- **Confidence Score:** 94%
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
- Replacement checks: 50
- **Overall Confidence**: 94%

### 37. [VERIFIED_SAFE_DELETE] C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts
- **Confidence Score:** 98%
- **Risk Score:** NONE
- **Evidence:** No active imports, runtime references, configurations, or doc matches found.
- **Recommendation:** Safe to delete. Recommended for cleanup. Update documentation links if desired.

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

