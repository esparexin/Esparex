# Independent Security & Concurrency Audit — BUG-297C

**Auditor**: Principal Staff Engineer  
**Date**: June 20, 2026  
**Status**: APPROVED  
**Target Branch**: `fix/payment-verification-ownership`  

---

## 1. Concurrency & Timing Audit

We reviewed the concurrency lifecycle of the booking model after implementing the **Hybrid Ownership Continuity Model** (Change 1 and Change 2):

### Webhook-before-Verify Race (The Bug Scenario)
- **Path**: Webhook confirmBooking completes first. Guest sessionId is retained. User userId is assigned.
- **Result**: When the client redirects and calls `verifyPayment()` presenting only `sessionId`, `assertBookingOwnership()` finds `booking.sessionId === ownershipContext.sessionId`. The verification succeeds and returns the booking. The customer does **not** receive a `403 Forbidden` error. This solves the primary bug.

### Verify-before-Webhook Race
- **Path**: Client redirect calls `verifyPayment()` first. Webhook has not run.
- **Result**: The controller processes `verifyPayment` synchronously. It calls `confirmBooking()` (which assigns `userId` and preserves `sessionId`). The booking is confirmed, and the client receives the payload. When the webhook eventually executes, the `WebhookEvent` and `Payment` status idempotency filters catch it and skip any duplicate mutations.
- **Verdict**: No duplicate capacity allocation, socket emissions, or coupon redemptions can occur.

---

## 2. Security & Authorization Audit

### Access Scope Assessment
We verified that retaining the guest `sessionId` permanently on a booking document does **not** expose the booking details or ticket files to unauthorized entities:
- **`BookingController.getBooking`**: Strictly enforces the check `!booking.userId` for guest session owners. As soon as the webhook links the booking to a `userId`, guest session access to read the booking details is automatically blocked.
- **`BookingController.downloadBookingPDF`**: Enforces the same check, blocking ticket downloads for guest session owners once the user ID is linked.
- **`/payment/verify`**: Restoring guest session access here is safe because it is a payment verification write-path that requires a valid, gateway-provided payment token (e.g. Stripe `paymentIntentId` or Razorpay `payment_id`). An attacker cannot guess or brute-force these gateway tokens, meaning they cannot use a hijacked session ID to enumerate bookings.

---

## 3. Structural Constraints Verification

We verified that:
- **Zero Schema Changes**: The changes represent a logical shift in how the database is updated (removing `$unset` operations), requiring no database migrations or collections refactoring.
- **Zero Refund Impact**: Refund logic ([`refund.service.ts`](../../../apps/server/src/services/admin/refund.service.ts)) remains completely isolated and unchanged.
- **Zero Webhook Integrity Impact**: Webhook signature verification and idempotency models are unmodified.

---

## 4. Final Verdict

### [PASS] APPROVED
The implementation of the **Hybrid Ownership Continuity Model** is approved. All tests, build checks, and type checks have passed. The changes address the timing lockout while maintaining strict access controls on core read and download paths.
