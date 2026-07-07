---
id: JRN-BOOK-001
title: Browse & Book Journey
status: approved
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-patterns:
  - UX-BOOK-001
  - UX-BOOK-002
  - UX-BOOK-003
  - UX-STATE-001
  - UX-STATE-002
  - UX-STATE-003
  - UX-STATE-004
---

# JRN-BOOK-001 — Browse & Book Journey

## Overview

The Browse & Book Journey details the end-to-end user path from finding an event to successfully purchasing tickets. It covers how a user navigates search/filters, opens the ticket selector, configures quantities, fills checkout forms under a reservation timeout lock, completes payment, and views their confirmed tickets.

---

## Journey Map

```
[Entry Point — Home / Events Catalog]
  User browses events list
  System displays list of events
  ├── Events search & filter applied (UX-FORM-002 / UX-FORM-003)
  └── Loading state rendered via skeletons (UX-STATE-002)

        ↓ [User clicks event card]

[Event Details Page]
  User reviews date, description, pricing tiers
  User clicks "Buy Tickets" CTA

        ↓

[Step 1 — Ticket Selection]  ←  Pattern: UX-BOOK-001
  Modal/Drawer overlay opens
  System secures guest token (ensureGuestBookingSession)
  User adjusts quantities per tier
  User enters & applies optional promo/coupon code

  Errors:
  ├── Guest token fail → page-level ErrorState, form locked
  ├── No tickets selected → inline validation warning on checkout submit
  └── Invalid coupon → inline coupon error block, price not updated

        ↓ [User clicks "Proceed to Checkout"]

[Step 2 — Temporary Reservation Created]
  System locks ticket inventory on backend (publicCreateBooking)
  Redirects user to secure checkout page

        ↓

[Step 3 — Secure Checkout Details]  ←  Pattern: UX-BOOK-002
  Checkout page renders with 10-minute hold countdown timer (useCountdown)
  User inputs First Name, Last Name, Email, and Phone
  User selects Payment Gateway (Razorpay / Stripe)

  Form Validation Failures (on-submit):
  ├── Zod schema error → display inline field warning, focus moves to first error
  └── Email confirm mismatch → error below confirm email field

  Navigation Escape Guard:
  └── User attempts back click → LeaveCheckoutModal prompts warning

  Session Lock Expiry:
  └── 10m countdown ends → fields locked, submit disabled, timer shows "Expired"

        ↓ [User clicks "Place Order" / Submit Form]

[Step 4 — Payment Processing]  ←  Pattern: UX-BOOK-003
  System creates payment intent on backend (publicCreatePaymentIntent)
  External Razorpay SDK modal pops up

  Gateway Events:
  ├── User closes gateway modal → cancel callback, restore form, show error banner
  ├── Payment rejects → show gateway error, allow retry
  └── Payment matches → verify callback dispatches verifyPaymentMutation

        ↓

[Step 5 — Booking Success Confirmation]  ←  Pattern: UX-STATE-004
  System displays "Booking Confirmed!" screen
  Displays unique Booking Reference ID
  Presents post-success CTAs ("View Tickets", "Continue Browsing")
```

---

## Handoff & State Sync Matrix

| Stage | Triggering Action | Source Pattern | Target Pattern | State Variable Synced |
|---|---|---|---|---|
| Step 1 → 2 | Ticket selection submit | `UX-BOOK-001` | `UX-BOOK-002` | `bookingId` (redirect parameter) |
| Step 3 → 4 | Checkout form submit | `UX-BOOK-002` | `UX-BOOK-003` | `detailsPayload` (sent to API) |
| Step 4 → 5 | Payment verified success | `UX-BOOK-003` | `UX-STATE-004` | `BookingStatus.CONFIRMED` |

---

## Experience Guardrails

1. **Cumulative Layout Shift (CLS)**: Skeletons must be used while loading event grids or checkout summaries to avoid layout shifting.
2. **Double Submission Prevention**: Submit buttons must automatically disable and display `isLoading` spinner state immediately upon form submit.
3. **Session Loss Warning**: A navigation guard must prevent the user from losing their seat lock via accidental back-button clicks once checkout has been initialized.

---

## Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
