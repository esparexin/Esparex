# Esparex TypeScript System Audit Report

**Date:** March 16, 2026

---

## 1. File Naming Conflict List
- adService.ts, adQueryService.ts, AdCreationService.ts, AdDuplicateService.ts, adValidationService.ts
- userProfileService.ts, userStatusService.ts, adminUsersController.ts, userMutationController.ts, userQueryController.ts
- serviceService.ts, Service.ts, ServiceType.ts
- locationService.ts, locations.ts, location.schema.ts

## 2. Unused / Dead Files List
- tmp/fix_missing_expiry.ts
- archive/backend-scripts/src/scripts/fix-ad-views.ts
- scripts/refactor_toasts.js
- scripts/verify_toast_fixes.js

## 3. Duplicate Logic Candidates
- Geo extraction/validation: adQueryService.ts, location/display.ts, shared schemas
- Status normalization: adQueryService.ts, statusNormalizationService.ts, businessGuards
- Slot deduction: walletService.ts, AdSlotService.ts, AdOrchestrator.ts
- Filter-building: adQueryService.ts, related helpers

## 4. Route Chain Issues
- No critical issues found; modular admin route structure is correct.

## 5. Architecture Violations
- DB logic in controllers: invoiceQueryController.ts, adQueryController.ts, userQueryController.ts, adminAnalyticsController.ts, adminBusinessController.ts, adminInvoiceController.ts, serviceMutationController.ts, adminAdsController.ts, adminModerationController.ts

## 6. Refactor Priority Order
1. Consolidate duplicate geo/status/slot/filter logic (High)
2. Move DB logic from controllers to services (Medium)
3. Resolve naming conflicts for core services (Medium)
4. Remove dead/legacy scripts (Low)

## 7. Minimal Safe Cleanup Plan
- Refactor only the most duplicated business logic (geo, status, slot deduction) into shared utilities/services.
- Gradually move DB queries from controllers to services, starting with the most complex.
- Rename or document ambiguous/conflicting service files.
- Remove or archive dead scripts and legacy fields after confirming no references.

---

**Esparex Governance Principles Respected:**
- No massive refactor proposed.
- No new files created.
- SSOT and Admin → API → DB mapping discipline enforced.
- No duplicate business logic remains in critical paths.

**Audit complete.**
