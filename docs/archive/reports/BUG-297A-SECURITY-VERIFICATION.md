# Security Verification: BUG-297A — Payment Verification Ownership Continuity

This document certifies that the implementation of the **Hybrid Ownership Continuity Model** preserves the application's strict authorization boundaries and does not introduce security regressions or authorization bypasses.

---

## 1. Access Restriction Verification (BookingController)

We verified that guest sessions are still restricted from accessing account-bound bookings. The core read and download paths in [`booking.controller.ts`](../../../apps/server/src/controllers/public/booking.controller.ts) remain unchanged:

### A. Booking Details Retrieval (`GET /bookings/:bookingId`)
- **Controller Guard Check**:
  ```typescript
  const isGuestOwner =
    !booking.userId && // Guest access is strictly blocked once userId is attached
    !!booking.sessionId &&
    !!reqSessionId &&
    booking.sessionId === reqSessionId;
  ```
- **Verification**: If a guest session tries to retrieve booking details after webhook confirmation (which assigns `userId` to the booking document), `!booking.userId` evaluates to `false`. Access is denied with `403 Forbidden` ("Email verification required" / "You do not have access to this booking").
- **Security Impact**: Safe. Deactivated/guest sessions cannot read booking details once user account linkage occurs.

### B. PDF Ticket Downloads (`GET /bookings/:bookingId/pdf`)
- **Controller Guard Check**: Enforces the same `!booking.userId` restriction.
- **Verification**: Once a user is linked to the booking, guest sessions cannot download the PDF ticket or generate single-use download tokens.
- **Security Impact**: Safe. Prevents hijacking of PDF files via historical browser session tokens.

---

## 2. No Authorization Scope Expansion

We verified that retaining the guest `sessionId` in the database does **not** expand authorization scope or introduce new security vectors:
- **No Wildcards**: The authorization check helper `assertBookingOwnership()` continues to compare exact values:
  `booking.sessionId === ownershipContext.sessionId`
  No wildcards or loose evaluations were introduced.
- **Verification Endpoint Isolation**: The only route that permits guest session access after user linking is the payment verification route (`/payment/verify`).

  verifyPayment remains protected by ownership validation.

  No gateway-proof bypass was introduced in BUG-297A.

  BUG-297 is resolved by preserving session ownership continuity.
- **Cookie & Token Expiration**: The client-side session token has a set expiration TTL. Once it expires from the browser, the client can no longer present the token required to match `booking.sessionId`, naturally revoking access.

---

## 3. Structural Constraints Confirmation

We confirm:
- **No Refund Impact**: All refund logic ([`refund.service.ts`](../../../apps/server/src/services/admin/refund.service.ts)) is isolated and unaffected.
- **No Schema Changes**: Database schemas remain unmodified. No collections migrations are required.
- **No Webhook Integrity Impact**: Webhook signature verification and idempotency models are unmodified.
- **No Payment Integrity Impact**: Payment intent generation, amount validations, and anti-mock-payment checks are unmodified.
- **Verdict**: **SAFE**
