---
id: UX-BOOK-002
title: Checkout Pattern
status: approved
priority: critical
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-BOOK-001
related-patterns:
  - UX-FORM-001
  - UX-BOOK-003
  - UX-STATE-002
  - UX-STATE-003
related-components:
  - Button
  - FormField
  - Modal
  - Drawer
---

# UX-BOOK-002 — Checkout Pattern

## 1. Overview

The Checkout pattern defines the secure details-entry form and summary section for event bookings. It displays the locked ticket details, a countdown timer for the reservation hold, inputs for contact information (first name, last name, email, phone), age confirmation checkboxes if required, and the payment gateway selector.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/checkout/[bookingId]` | Core checkout page; includes reservation lock timeout |

---

## 3. Source of Truth

```
apps/web/src/components/booking/CheckoutContent.tsx — Main page controller and state orchestrator
apps/web/src/components/booking/checkout/CheckoutForm.tsx — Fields and validation logic
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/web/src/components/booking/CheckoutContent.tsx
  - apps/web/src/components/booking/checkout/CheckoutForm.tsx
  - packages/validations/src/booking.ts (CheckoutDetailsInput / checkoutDetailsSchema)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Button` | `@mad/ui` | "Place Order" submit button |
| `FormField` | `@mad/ui` | Label, input wrapping, and error messaging (not yet adopted - adoption gap) |
| `Modal` | `@mad/ui` | "Leave Checkout" confirmation dialog container |

> [!NOTE]
> **Adoption Gap**: While `FormField` is stable in `@mad/ui`, `CheckoutForm.tsx` currently implements fields using bare HTML `<label>` and `<input>` elements. Spacing and error displaying are handled using local classes.

---

## 6. State Diagram

```
Idle (Checkout page loaded, details fetched)
 ├── [tick countdown] → Idle (updating timeLeft string)
 ├── [expiry reached] → Expired (cooldown/session over, CTA disabled)
 ├── [form input change] → Idle (validating fields locally on-submit)
 ↓ [submit form]
Saving Details (saveDetailsMutation in flight)
 ├── [success] → Redirect to Payment (UX-BOOK-003)
 └── [error] → Idle (error banner shown)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `idle` | Active reservation; form fields writable | CheckoutForm |
| `expired` | Ticket lock time has run out | Countdown timer shows "Expired", CTA disabled |
| `loading` | Fetching booking detail or submitting details | Skeleton loaders / Button `isLoading` |
| `error` | Form validation error or API submission error | Error banner at top of form |

---

## 8. Optional States

| State | Description |
|---|---|
| `prefilled` | Authenticated user fields auto-filled from session |
| `navigating-away` | Modal warning user that progress will be lost on back click |

---

## 9. Keyboard & Accessibility

- **Countdown updates**: The countdown timer must announce state changes politely when getting close to zero, or use `aria-live="polite"` so screen-readers can query it.
- **Form focus order**: On submit with error, focus must move programmatically to the first field containing a validation error (e.g. `checkout-first-name`). This is implemented via `document.getElementById` focus calls in `CheckoutForm.tsx`.
- **Keyboard accessible links**: Privacy Policy and Terms of Service links must be reachable via Tab and readable.
- **WCAG AA criteria**:
  - **1.3.1**: Explicit field labels programmatically linked.
  - **2.4.3**: Focus order matches form reading sequence.
  - **3.3.1**: Error identification (clear text explanations for incorrect inputs).
  - **3.3.2**: Labels or instructions provided for required fields.

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-FORM-001` | Forms Pattern | Validates field standards |
| `UX-BOOK-003` | Payment Pattern | Handoff destination after detail validation |
| `UX-STATE-002` | Loading States | Rules for loading skeletons |
| `UX-STATE-003` | Error States | Handles API submission errors |

---

## 11. Implementation Checklist

```
☐ Implements useCountdown hook to managelogicalExpiresAt
☐ Pre-fills details if user is authenticated (useAuth)
☐ Disables all fields and submit button on session expiration
☐ Validates inputs using checkoutDetailsSchema from @mad/validations
☐ Compares guestEmail and guestEmailConfirm locally to ensure match
☐ Moves focus programmatically to first invalid field on validation failure
☐ Employs useCheckoutNavGuard / LeaveCheckoutModal to handle exit attempts
☐ Employs Button from @mad/ui with isLoading for submit
```

---

## 12. Governance Rules

#### Required
```
✓ Must display countdown timer matching logicalExpiresAt from the API
✓ Form submission must be blocked if countdown expires
✓ First name, last name, email, and phone validation must follow checkoutDetailsSchema from @mad/validations
✓ Must warn user before exiting the page if checkout has started (LeaveCheckoutModal)
```

#### Forbidden
```
✗ Allowing payment gateway initiation before saving checkout contact details
✗ Custom window.confirm() prompts for exit warnings — use @mad/ui Modal
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Reservation lock timer (typically 10 minutes) | ADR (to be linked) | Prevents inventory hoarding while allowing users sufficient time to fill forms and pay |
| Navigation guards on checkout | ADR (to be linked) | Prevents users from accidentally losing their seat locks via back clicks |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
