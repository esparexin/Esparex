# booking/ticket ownership model decision

> [!NOTE]
> **Status: RESOLVED (2026-07-05)**  
> **Resolution**: Option 3 (Hybrid Grace Window) was selected, implemented, and merged to `develop` via **PR #483** (`refactor(booking): align booking ownership validation with hybrid grace window (PR4)`).
> All 8 access points have been aligned under a single, centralized authorization routine: `PublicBookingService.assertBookingAccess()`.
>
> **Centralized Implementation Details:**
> - Guest session access is allowed indefinitely while a booking is in active checkout states (`AWAITING_PAYMENT`, `FAILED`).
> - After a transaction completes (`CONFIRMED`, `EXPIRING`, `EXPIRED`), guest session access is strictly limited to the configured grace window `BOOKING_OWNERSHIP_GRACE_MS` (default: 10 minutes), anchored to the booking's `confirmedAt` or `logicalExpiresAt` lifecycle timestamps.
> - Access is immediately revoked for `CANCELLED` and `REFUNDED` bookings.
> - Authenticated registered owners (`booking.userId`) always maintain access, bypassing the grace window.
>
> This document remains for historical reference.

---

## Current Divergence

There is a split in the backend access controls when checking guest session ownership of bookings. Specifically:
- **Strict Guest Checks** require that `booking.userId` is NOT set. Once a booking is linked to a registered user account, any attempt to access the booking using only the original guest `sessionId` is rejected (HTTP 403 / verification required).
- **Lax Guest Checks** permit guest session access (`booking.sessionId === reqSessionId`) even if the booking has already been linked to a registered user account (`booking.userId` is set).

### Ownership Behavior Matrix

The current classification of the 8 ownership validation locations across the codebase is as follows:

| Location | Component / File | Line Range | Current Behavior |
| :--- | :--- | :--- | :--- |
| `getBooking` | `booking.controller.ts` | 180–184 | **Strict** |
| `downloadBookingPDF` | `booking.controller.ts` | 315–319 | **Strict** |
| `generateDownloadToken` | `booking.controller.ts` | 373–377 | **Strict** |
| `resendBookingTickets` | `booking.controller.ts` | 436–440 | **Strict** |
| `canViewTicketQR` | `ticket-ownership.service.ts` | 85 | **Strict** |
| `PaymentService.assertBookingOwnership` | `payment.service.ts` | 74–77 | **Lax** |
| `PublicBookingService.saveCheckoutDetails` | `booking.service.ts` | 673 | **Lax** |
| Socket `booking:join` | `sockets/index.ts` | 442 | **Lax** |

---

## Alignment Options

To ensure consistent security and user experience, the system should align on a single behavior model. The three proposed options are detailed below.

### Option 1 — Strict Everywhere

Under this model, guest session access is strictly blocked across all 8 locations once a booking is linked to a registered user account.

* **Behavior**: If `booking.userId` is populated, only the authenticated user matching `booking.userId` has access. Guest `sessionId` checks will always fail with a 403 Forbidden.
* **Security Impact**: High. Prevents persistent guest access to claimed bookings. Mitigates risk from shared/leaked guest links or long-lived guest cookies.
* **Usability Impact**: Potential disruption. If a guest completes payment or registration on another device/browser, any active frontend tabs or socket connections on the original guest browser (relying on `sessionId`) will be immediately locked out, potentially interrupting real-time updates or ongoing checkout flows.

### Option 2 — Lax Everywhere

Under this model, guest session access is permitted across all 8 locations, regardless of whether the booking is linked to a registered user account.

* **Behavior**: Access is granted if either the authenticated `userId` matches `booking.userId` OR the request `sessionId` matches `booking.sessionId`.
* **Security Impact**: Lower. A guest session cookie remains a valid access token for the lifetime of that session or cookie, even after the booking is claimed by a registered user account. If a guest session is compromised or the guest URL is shared, unauthorized users can download PDFs, view ticket QRs, and update booking info.
* **Usability Impact**: High convenience. Ensures that active client-side sessions (e.g. checkout pages, socket listeners, and redirection flows) are not disrupted when a booking is linked to a user.

### Option 3 — Hybrid Grace Window

This model allows guest session access even if a `userId` is set, but only during an active checkout/payment window or for a limited time after creation/linkage.

* **Behavior**: Guest sessions are accepted while the booking status is `awaiting_payment` or within a configured duration (e.g., 30 minutes) post-link. Once the transaction completes (booking status becomes `completed`) or the window expires, access is strictly limited to the authenticated user.
* **Security Impact**: Balanced. Minimizes the window of vulnerability for guest session exploitation while securing the booking once the transaction is finalized.
* **Usability Impact**: Smooth checkout. Allows real-time payment webhook processing, socket joins, and thank-you/receipt page loads to complete seamlessly on the guest session before enforcing strict authenticated-only access.
* **Complexity**: High. Requires storing, checking, and validating state transitions or timestamps (e.g., grace window expiration) across all ownership checks.
