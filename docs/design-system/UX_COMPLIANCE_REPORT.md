# UX Compliance Audit Report

**Audit Date:** 2026-07-06  
**Status:** Approved  
**Version:** 1.0.0  
**Auditor:** AI Governance Agent  
**Target:** apps/web, apps/admin  
**Design System Release:** design-system-v1.4.0  

---

## Executive Summary

This report documents the compliance of `apps/web` and `apps/admin` against the newly published UX pattern specifications (`UX-AUTH-001` through `UX-DLG-002`). 

The baseline design system components (`@mad/ui` v1.4.0) are fully adopted in primary views, but substantial **adoption gaps** exist where application-level views use raw HTML inputs, custom spinners, or ad-hoc layout logic instead of composition primitives (such as `FormField`). 

Additionally, the **admin login view** exhibits total non-compliance, using zero `@mad/ui` primitives. These gaps represent the primary technical debt to resolve before automated UX governance enforcement (Phase 4) is deployed.

---

## Compliance Matrix

| Pattern ID | Pattern Name | Priority | Web Compliance | Admin Compliance | Primary Gaps |
|---|---|---|---|---|---|
| `UX-AUTH-001` | Authentication | Critical | ⚠️ Partial | ❌ Non-Compliant | Raw inputs used; admin uses custom button & spinner |
| `UX-AUTH-002` | OTP Verification | Critical | ⚠️ Partial | N/A | Raw input & custom timer containers used |
| `UX-NAV-001` | Navigation | High | ✅ Compliant | ⚠️ Partial | Mobile drawer toggle has no focus trap resets |
| `UX-FORM-001` | Forms | High | ⚠️ Partial | ⚠️ Partial | Bare `<input>` elements; zero adoption of `FormField` |
| `UX-FORM-002` | Search | Medium | ⚠️ Partial | ⚠️ Partial | Varying debounce timings; no shared `SearchInput` |
| `UX-FORM-003` | Filtering | Medium | ⚠️ Partial | ⚠️ Partial | Raw dropdown buttons; ad-hoc date input selectors |
| `UX-FORM-004` | Sorting | Medium | N/A | ⚠️ Partial | Sorting columns lacks `aria-sort` indicators |
| `UX-FORM-005` | Pagination | Medium | N/A | ⚠️ Partial | Custom pagers; no shared `Pagination` composite |
| `UX-DATA-001` | Tables | High | N/A | ✅ Compliant | Reuses stable `@mad/ui` `Table` primitives |
| `UX-DATA-002` | Dashboard | Medium | N/A | ✅ Compliant | Metric layouts use stable `@mad/ui` `Card` |
| `UX-BOOK-001` | Booking | Critical | ⚠️ Partial | N/A | Custom ticket steppers/inputs used in modals |
| `UX-BOOK-002` | Checkout | Critical | ⚠️ Partial | N/A | Raw form fields; bypasses `FormField` composite |
| `UX-BOOK-003` | Payment | Critical | ✅ Compliant | N/A | razorpay SDK loaded and verified correctly |
| `UX-STATE-001` | Empty States | High | ✅ Compliant | ✅ Compliant | Correctly uses `@mad/ui` `EmptyState` |
| `UX-STATE-002` | Loading States | High | ✅ Compliant | ⚠️ Partial | Admin pages load with custom spinner templates |
| `UX-STATE-003` | Error States | Critical | ⚠️ Partial | ⚠️ Partial | Custom error banners; should use `@mad/ui` `ErrorState` |
| `UX-STATE-004` | Success States | High | ✅ Compliant | ✅ Compliant | Unified checkout success page redirects correct |
| `UX-DLG-001` | Confirmation Dialogs | High | N/A | ✅ Compliant | Dialog overlays use stable `@mad/ui` `Modal` |
| `UX-DLG-002` | Delete Flows | High | N/A | ✅ Compliant | Two-step cancels and deletes execute securely |

---

## Detailed Findings & Evidence

### 1. Authentication Gaps (Critical)
- **Web Auth Form (`apps/web/src/components/auth/AuthForm.tsx`):**
  - Form inputs are raw `<input>` elements instead of `@mad/ui` `Input` or wrapped `FormField` composites.
  - Error messages use simple `role="alert"` wrapper divs instead of `@mad/ui` `ErrorState`.
- **Admin Login (`apps/admin/src/app/login/page.tsx`):**
  - Uses `motion.button` with custom styles instead of `@mad/ui` `Button`.
  - Uses custom `div` spinner animations instead of `@mad/ui` `Spinner`.
  - Displays errors in custom error container bands without using `@mad/ui` `ErrorState`.
  - Bypasses all programmatic focus shifts on layout mounts.

### 2. Form & Field Gaps (High)
- **Checkout Form (`apps/web/src/components/booking/checkout/CheckoutForm.tsx`):**
  - Bypasses the `@mad/ui` `FormField` composite entirely.
  - Standard inputs (First Name, Last Name, Email, Phone) are implemented with bare `<label>` and `<input>` tags, duplicating error layout logic.

### 3. Component Primitive Gaps (Medium)
- **Pagination (`UX-FORM-005`):**
  - Admin booking directory table (`BookingsTable.tsx` line 197-220) renders pagination controls (Prev/Next buttons) locally. This duplicates pagination display rules across pages.
- **Search debounce (`UX-FORM-002`):**
  - debounce configurations vary between views; no centralized hook or input primitive restricts typing query loads.

---

## Action Items & Remediation Tasks

Before automated governance rules are enforced in Phase 4, the following tasks must be resolved to bring the repository to 100% compliance:

1. **[TASK-001] Migrate Web/Admin Auth Fields to FormField:**
   - Replace raw `<label>`/`<input>` groups in `AuthForm.tsx` and `CheckoutForm.tsx` with stable `@mad/ui` `FormField` and `Input` compositions.
2. **[TASK-002] Refactor Admin Login view:**
   - Migrate `apps/admin/src/app/login/page.tsx` to utilize `@mad/ui` `Button`, `Spinner`, and `ErrorState` components.
3. **[TASK-003] Build Pagination Primitive:**
   - Address backlog item `BL-001` (create `@mad/ui` `Pagination` component) and migrate `BookingsTable.tsx` to use it.
4. **[TASK-004] Standardize Stepper Inputs:**
   - Migrate custom quantities select/decrement stepper layout elements in `TicketSelectionContent.tsx` to a unified numeric stepper layout.
