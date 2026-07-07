---
id: UX-BOOK-001
title: Booking Pattern
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
  - UX-BOOK-002
  - UX-STATE-002
  - UX-STATE-003
related-components:
  - Button
  - Modal
  - Drawer
---

# UX-BOOK-001 — Booking Pattern

## 1. Overview

The Booking pattern governs the process of selecting tickets, applying coupons, locking/reserving inventory, and transitioning to checkout. It is implemented primarily on the Event details page as either an inline page element or a responsive Modal/Drawer composite depending on the device viewport.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/events/[id]` (modal/drawer) | Triggered by clicking "Buy Tickets" on the event details page |

---

## 3. Source of Truth

```
apps/web/src/components/booking/TicketSelectionContent.tsx — Core selection logic and guest session wrapper
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/web/src/components/booking/TicketSelectionContent.tsx
  - packages/validations/src/booking.ts (ReserveTicketsInput schema)
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Button` | `@mad/ui` | "Apply" coupon button, quantity controls, and primary "Proceed to Checkout" action |
| `Modal` | `@mad/ui` | Desktop container for the booking ticket selector dialog |
| `Drawer` | `@mad/ui` | Mobile container for the booking ticket selector bottom sheet |

> [!NOTE]
> **Adoption Gap**: In `TicketSelectionContent.tsx`, ticket selection inputs (the quantity controls) are implemented with custom local styles rather than a standardized number input field or stepper component. A shared input primitive could improve UX consistency here.

---

## 6. State Diagram

```
Session Initialization
 ↓
Idle (Ticket selector open, session token active)
 ├── [change quantity] → Idle (updating subtotal and count)
 ├── [enter coupon] → Coupon Entered (submit enabled)
 │                     ↓ [apply coupon]
 │                    Applying Coupon
 │                     ├── [success] → Idle (coupon applied, pricing updated)
 │                     └── [error] → Idle (coupon error displayed)
 ↓ [checkout clicked, selectedCount > 0]
Creating Reservation (Booking reservation mutation in flight)
 ├── [success] → Redirect to Checkout (/checkout/[bookingId])
 └── [error] → Idle (general error displayed, form interactive)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `session-loading` | Establishing guest session on mount | Initializing session, form disabled |
| `idle` | Waiting for ticket quantities | Ticket tiers list shown, quantities zeroed |
| `coupon-applying` | Validating promo/coupon code | Spinner shown on "Apply" button |
| `submitting` | Creating temporary reservation | `Button isLoading` on "Proceed to Checkout" |
| `error` | Lock or verification failed | `role="alert"` or inline message |

---

## 8. Optional States

| State | Description |
|---|---|
| `coupon-applied` | Coupon verified, discount shown in subtotal |
| `sold-out` | No tickets left; "Buy Tickets" CTA disabled or hidden |

---

## 9. Keyboard & Accessibility

- **Focus trapping**: When rendered inside a Modal or Drawer, focus must be trapped via `@mad/ui` `Modal` / `Drawer` built-in focus trap or `useFocusTrap` hook.
- **Steppers / Quantities keyboard navigation**: Quantity increment/decrement buttons must be operable via Tab and Enter/Space. They must have appropriate `aria-label` describing their target tier (e.g. `aria-label="Decrease General Admission tickets"`).
- **Aria live regions**: Coupon validation messages (success or error) must be declared with `aria-live="polite"` or `role="status"` to announce the result to screen readers.
- **WCAG AA criteria**:
  - **1.3.1**: Information and relationships are programmatically determined.
  - **2.4.3**: Focus order is logical when stepping through tiers.
  - **4.1.2**: Name, Role, Value (buttons must have labels; disabled state correctly declared).

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-BOOK-002` | Checkout Pattern | This pattern acts as the entry point and reservation generator for the Checkout flow |
| `UX-STATE-002` | Loading States | Handles skeleton loaders or buttons in loading state |
| `UX-STATE-003` | Error States | Surfaces API lock errors or bad coupon codes |

---

## 11. Implementation Checklist

```
☐ Uses Modal (desktop) / Drawer (mobile) from @mad/ui
☐ Implements guest session initialization on mount (ensureGuestBookingSession)
☐ Ticket quantity selection handles maximum limit (max 10)
☐ Submit button is disabled when selected count is 0
☐ Submit button uses Button from @mad/ui with isLoading prop
☐ Form handles coupon success/error inline without full-page error state
☐ Verification uses ReserveTicketsInput validation schema
☐ Keyboard navigation allows full screen-reader and tab traversal
☐ Focus is returned to trigger element when Modal/Drawer is closed
```

---

## 12. Governance Rules

#### Required
```
✓ Must initiate secure guest session (ensureGuestBookingSession) before allowing ticket reservation
✓ Quantity controls must enforce maxPerOrder (default 10) and prevent negative numbers
✓ Coupon application feedback must be inline and distinct from general booking errors
✓ Must use stable @mad/ui Modal and Drawer containers to render the selection interface
```

#### Forbidden
```
✗ Allowing checkout submit with 0 tickets selected
✗ Custom dialog or modal implementations — must use @mad/ui primitives
✗ Custom inline spinners — must use Button isLoading prop
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Guest session token requirement | ADR (to be linked) | Gutes session tokens prevent checkout API spam and bot reservations |
| Responsive Modal vs Drawer | ADR (to be linked) | Modals work best on desktop, but drawers offer better touch-target experiences on mobile screens |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
