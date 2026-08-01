# Validation & Repository Audit Baseline — Issue #257

## Overview
This document records the baseline state of the User Frontend (`apps/web`) validation, repository hygiene, accessibility, and component architecture prior to remediation for Issue #257.

## Audit Inventory Summary

### 1. Generic Error Messages
- `apps/web/src/config/toastMessages.ts`: Generic string constants (`VALIDATION_ERROR`, `VALIDATION_REQUIRED`, `SUBMIT_FAILED`, `LOAD_FAILED`, `ACTION_FAILED`).
- `apps/web/src/lib/errorMapper.ts`: Generic error fallbacks (`"Something went wrong. Please try again later"`, `"Validation failed"`).

### 2. Zombie & Dead Code
- `apps/web/src/hooks/usePostAdValidation.ts`: 20-line stub hook containing redundant error state, doing zero actual validation.
- Legacy monkey-patch utilities (`suppressGoogleMapsRetryErrors.ts`).

### 3. Duplicate Search Select Primitives
- `apps/web/src/components/user/BrandSearchSelect.tsx`
- `apps/web/src/components/user/ModelSearchSelect.tsx`
- `apps/web/src/components/user/CatalogSearchSelect.tsx`

### 4. Accessibility & Focus Management
- Missing `aria-describedby` linking input elements to `<FormError />`.
- Missing `role="alert"` and `aria-live="assertive"` on top error banners.

## Remediation Objectives
- Eliminate generic validation messages.
- Scope form validation to active and visible fields.
- Enforce single-channel error presentation (inline field errors over popups).
- Consolidate duplicate search selects into canonical `CatalogSearchSelect`.
- Remove zombie hook `usePostAdValidation`.
- Ensure 100% WCAG 2.2 AA compliance and repository integrity gate passes.
