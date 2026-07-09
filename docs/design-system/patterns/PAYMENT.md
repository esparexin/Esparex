---
id: UX-BOOK-003
title: Payment Pattern
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
  - UX-STATE-003
  - UX-STATE-004
related-components:
  - Button
---

# UX-BOOK-003 — Payment Pattern

## 1. Overview

The Payment pattern covers the checkout completion, gateway integration (Razorpay SDK), transaction feedback, and payment verification stages of the booking flow. It dictates how gateway dialog dismissals, transaction failures, and mock payments for free/test bookings must behave.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Web | `/checkout/[bookingId]` | Initiated on clicking "Place Order" (Razorpay SDK modal overlay) |

---

## 3. Source of Truth

```
apps/web/src/components/booking/CheckoutContent.tsx — Initiates payment intent and handles Razorpay SDK callbacks
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/web/src/components/booking/CheckoutContent.tsx
  - apps/web/src/components/booking/checkout/CheckoutPayment.tsx
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Button` | `@mad/ui` | "Place Order" trigger button |

---

## 6. State Diagram

```
Idle (CheckoutForm details saved)
 ↓ [click Place Order]
Creating Intent (paymentIntentMutation in flight)
 ├── [isFree] → Success (redirect to booking confirmation)
 └── [success, gateway = Razorpay]
      ↓
     Razorpay SDK Modal Open
      ├── [dismiss/cancel] → Idle (restore checkout, display cancellation message)
      ├── [payment failed] → Idle (restore checkout, show payment error)
      └── [payment success]
           ↓
          Verifying Payment (verifyPaymentMutation in flight)
           ├── [success] → Confirmed (redirect to success view)
           └── [error] → Idle (show verification error, offer retry)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `idle` | Active reservation ready to pay | CheckoutForm submit state |
| `creating-intent` | Requesting payment intent parameters | `paymentIntentMutation.isPending` |
| `modal-open` | External gateway UI active | Razorpay checkout iframe overlay |
| `verifying` | Polling/sending transaction signature | `verifyPaymentMutation.isPending` |
| `error` | Gateway error or signature verification fail | Inline alert / General error bar |
| `success` | Payment completed and validated | Redirect to booking confirmation view |

---

## 8. Optional States

| State | Description |
|---|---|
| `mock-payment` | Automated mock verification bypassing SDK when `isMock === true` |

---

## 9. Keyboard & Accessibility

- **External iframe dialogs**: Payment processing overlays (Razorpay) are loaded dynamically inside an iframe. Keyboard focus trap and accessibility are handled by the external SDK, but host page state must disable background interactive elements (e.g. background form fields) to prevent duplicate clicks while the modal is open.
- **Dynamic script loading**: Loading the payment gateway script dynamically must gracefully announce errors to assistive technologies if network failure blocks the SDK load.
- **WCAG AA criteria**:
  - **2.1.1 Keyboard**: Payment CTA button is fully keyboard operable.
  - **4.1.2 Name, Role, Value**: Button labels explicitly communicate processing state ("Processing...", "Place Order").

---

## 10. Cross-Pattern Dependencies

| Pattern ID | Pattern Name | Relationship |
|---|---|---|
| `UX-BOOK-002` | Checkout Pattern | Precedes this pattern; provides required booking details payload |
| `UX-STATE-003` | Error States | Handles verification failures and gateway rejections |
| `UX-STATE-004` | Success States | Standardized display for confirmed tickets |

---

## 11. Implementation Checklist

```
☐ Fetches payment intent with secure guest session token
☐ Loads Razorpay SDK dynamically via loadScriptOnce
☐ Prefills name and email from booking details for payment gateway
☐ Employs key override: processes NEXT_PUBLIC_RAZORPAY_KEY_ID or fallback from API response
☐ Implements SDK ondismiss callback to restore form state and display cancellation error
☐ Implements SDK payment.failed callback to update error state and reset isProcessing
☐ Dispatches verifyPaymentMutation on gateway signature callback
```

---

## 12. Governance Rules

#### Required
```
✓ Must fetch payment intent parameters from the backend before invoking the SDK
✓ Must verify payment signatures server-side (verifyPaymentMutation) before confirming order
✓ Must support mock payment paths for free ticket options or sandbox testing parameters
✓ Must handle SDK closing/dismissal gracefully to avoid locking the UI in a loading state
```

#### Forbidden
```
✗ Storing API key strings in codebase — use process.env or backend payloads
✗ Trusting client-side payment success events without verifying signature on backend
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Server-side payment verification | ADR (to be linked) | Client-side authorization is susceptible to spoofing; verification must be authenticated by the server |
| Dynamic loading of checkout script | Implementation evidence | Prevents unnecessary performance cost on initial event page loads for users not checking out |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
