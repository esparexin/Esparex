# REFUND-004B — Final Design Challenge Audit: Findings

**Task:** REFUND-004B  
**Date:** 2026-06-20  
**Status:** Audit Completed  

---

## 1. Summary of Findings

| ID | Severity | Scenario | Title |
|---|---|---|---|
| **RFND-B-F01** | **CRITICAL** | Scenario 1 & 7 | Stale Booking Status in Admin Phase 3 Transaction |
| **RFND-B-F02** | **HIGH** | Scenario 11 | Gateway-Initiated Refund Booking Leakage |
| **RFND-B-F03** | **MEDIUM** | Scenario 8 | Duplicate Confirmation Email Notification |

---

## 2. Detailed Findings

### RFND-B-F01: Stale Booking Status in Admin Phase 3 Transaction
- **Severity:** **CRITICAL**
- **Exact File/Function Evidence:** `apps/server/src/services/admin/refund.service.ts` -> `processRefund()`, L503-L506:
  ```ts
  if (isFullRefund) {
    if (booking.status === BookingStatus.CONFIRMED) {
      const cancelResult = await cancelBooking(refund.bookingId.toString(), adminNotes || 'Admin Refund Processed', session, BookingStatus.REFUNDED);
  ```
- **Reproduction Scenario:**
  1. Admin clicks "Approve". Phase 1 starts: reads Booking (status = `CONFIRMED`) and transitions Refund to `processing`.
  2. Phase 2 executes the gateway API call. It succeeds and returns a refund ID.
  3. The server experiences a brief thread delay or network lag. A Stripe webhook (`charge.refunded`) arrives on another thread before Phase 3 transaction starts.
  4. The webhook reconciliation handler runs. It matches the refund, starts a transaction, updates the refund to `completed`, and calls `cancelBooking`, transitioning the Booking status in the database to `REFUNDED`. It commits.
  5. The original admin approval thread resumes and enters Phase 3. It checks `booking.status === BookingStatus.CONFIRMED` using the *stale* in-memory `booking` object resolved in Phase 1 (which says `CONFIRMED`).
  6. It calls `cancelBooking(refund.bookingId, ..., BookingStatus.REFUNDED)`.
  7. Inside `cancelBooking`, the booking is loaded from the database (`await Booking.findById(id).session(session)`). The database status is `REFUNDED`.
  8. `cancelBooking` checks if status is already terminal and throws `AppError.badRequest('Booking is already in a terminal state: refunded')`, crashing the admin transaction and returning a 400 error to the admin interface.
- **Financial Impact:** Operational disruption. The refund succeeds at the gateway and is reconciled, but the admin is shown a failure error in the dashboard. This leads to double-approvals, support tickets, and confusion.
- **Recommended Remediation:** 
  In the Phase 3 transaction block in `refund.service.ts`, load a fresh instance of the booking document within the transaction session before executing booking cancellation checks:
  ```ts
  const freshBooking = await Booking.findById(booking._id).session(session) || booking;
  if (isFullRefund) {
    if (freshBooking.status === BookingStatus.CONFIRMED) {
      // Call cancelBooking
    } else if (freshBooking.status === BookingStatus.CANCELLED) {
      // Transition directly to REFUNDED in DB
    }
  }
  ```

---

### RFND-B-F02: Gateway-Initiated Refund Booking Leakage
- **Severity:** **HIGH**
- **Exact File/Function Evidence:** `apps/server/src/services/public/payment.service.ts` -> `reconcileStripeRefundWebhook()` and `reconcileRazorpayRefundWebhook()`
- **Reproduction Scenario:**
  1. An admin opens the Stripe or Razorpay dashboard directly (outside the MAD Admin interface) and refunds a customer's payment.
  2. Stripe/Razorpay issues a webhook event (`charge.refunded` or `refund.processed`) to the MAD server.
  3. The server checks the database. Since this refund was not initiated in MAD, no `Refund` document exists.
  4. Both primary and fallback lookups fail and return `null`.
  5. The reconciliation handler returns `{ status: 'skipped' }`, and the controller returns 200/success to acknowledge.
  6. The booking remains active and `CONFIRMED` in the MAD database, allowing the customer to attend the event even though their payment was refunded.
- **Financial Impact:** Direct financial loss. Unpaid bookings remain active, leading to seat leakage, loss of ticket inventory, and unpaid access to events.
- **Recommended Remediation:** 
  If primary and fallback lookups both return `null`, but the Payment is successfully resolved via the gateway payment identifier:
  1. Automatically create a new `Refund` document in the database with `status: 'completed'`, `origin: 'manual'`, and the matching gateway refund ID.
  2. Lock the payment document and execute the standard booking cancellation and ticket release logic.

---

### RFND-B-F03: Duplicate Confirmation Email Notification
- **Severity:** **MEDIUM**
- **Exact File/Function Evidence:** `apps/server/src/services/admin/refund.service.ts`, L561:
  ```ts
  if (updated.status === 'completed') {
    // trigger email ...
  }
  ```
- **Reproduction Scenario:**
  1. Webhook reconciliation handler completes a refund in the database and triggers the post-commit refund confirmation email to the customer.
  2. The admin approval thread Phase 3 commits successfully (post-remediation of RFND-B-F01).
  3. The admin approval thread post-commit hook detects `updated.status === 'completed'` and triggers another confirmation email.
- **Financial Impact:** Brand reputation and operational noise. Customers receive duplicate emails confirming the same refund.
- **Recommended Remediation:** 
  In the email trigger block of `processRefund` (`refund.service.ts:L561`), check if the refund was already reconciled before sending:
  ```ts
  if (updated.status === 'completed' && !updated.reconciledAt) {
    // Only send the email if it hasn't been reconciled by the webhook yet.
  }
  ```
  Additionally, in the webhook reconciliation handler, only trigger the confirmation email if the webhook actually transitioned the status from `processing`/`requested` to `completed` in that run.
