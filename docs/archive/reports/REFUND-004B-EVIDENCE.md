# REFUND-004B — Final Design Challenge Audit: Evidence

**Task:** REFUND-004B  
**Date:** 2026-06-20  
**Status:** Audit Completed  

---

## 1. Scenario-by-Scenario Evaluation

### Scenario 1: Webhook arrives before gatewayRefundId write-through update
- **Code Evidence:** 
  - `apps/server/src/services/admin/refund.service.ts:L391` (reads booking outside transaction in Phase 1)
  - `apps/server/src/services/admin/refund.service.ts:L503-L506` (checks stale booking status and calls `cancelBooking`)
  - `apps/server/src/services/admin/booking.service.ts:L365-L371` (`cancelBooking` throws if status is already `REFUNDED` or `CANCELLED`)
- **Analysis:** If the server is slow to execute the write-through update of `gatewayRefundId` right after Phase 2 gateway success, and a webhook arrives, the primary lookup fails but the fallback lookup succeeds. The webhook transaction completes the refund, updates the Payment to `REFUNDED`, and calls `cancelBooking` (transitioning the booking in the database to `REFUNDED`). When the original admin approval thread resumes and runs Phase 3, it uses the stale in-memory `booking` object (which says status is `CONFIRMED`) and attempts to call `cancelBooking`. Since the database already has the booking as `REFUNDED`, `cancelBooking` throws a terminal state error, causing the admin's transaction to fail and abort.
- **Finding:** **RFND-B-F01 (CRITICAL)**. The admin transaction will crash and throw an error to the user even though the refund was successfully processed and reconciled.

### Scenario 2: Multiple partial refunds with identical amounts
- **Design Evidence:** Fallback lookup parameters: `Refund.findOne({ paymentId, status: { $in: ['processing', 'requested'] }, amount: webhookRefundAmount })` combined with the transaction Payment serialization lock.
- **Analysis:** If two partial refunds of ₹500 exist for the same payment in `processing` status, and a webhook arrives for ₹500, the fallback lookup matches the first one (Refund A) and transitions it to `completed`. Because its status is now `completed`, a subsequent webhook for ₹500 will not match Refund A (as its status is no longer `processing` or `requested`) and will successfully match Refund B. If both webhooks arrive concurrently, the Payment serialization lock forces them to run sequentially, ensuring no double-matching of the same record.
- **Verdict:** **SAFE**. The combination of status filtering and Payment locking guarantees correctness.

### Scenario 3: Stripe refund.updated arrives before charge.refunded
- **Design Evidence:** Controller routing + Stripe status filtering.
- **Analysis:** Stripe webhooks do not guarantee delivery order. If `refund.updated` arrives first with `status: 'succeeded'`, it is routed to the handler, matches the refund, and completes it. When `charge.refunded` arrives later, the primary lookup resolves the completed refund, sees `status === 'completed'`, and skips processing as an idempotent no-op.
- **Verdict:** **SAFE**.

### Scenario 4: Stripe refund.failed arrives after refund.completed
- **Design Evidence:** Service reconciliation mapping for `refund.failed` event.
- **Analysis:** If a refund is already marked `completed` in the database, but Stripe sends a late `refund.failed` webhook (e.g. bank rejection), the handler logs a critical anomaly and alerts Sentry. It does NOT revert the database status back to `failed` because the booking has already been cancelled and seats/tickets released, which is an irreversible action. This is the correct operational design.
- **Verdict:** **SAFE** (Sentry alert handles manual operations).

### Scenario 5: Razorpay refund.processed replay events
- **Code Evidence:** `apps/server/src/controllers/public/payment.controller.ts:L264-L293` (outer idempotency check on signature-derived event ID).
- **Analysis:** Razorpay webhook events are fingerprinted using an HMAC of the raw body. Any replayed webhook carries the same body, producing the same `eventId` key. The controller checks `WebhookEvent.findOne({ eventId })`. If the status is `'success'`, the request is immediately acknowledged with 200 without invoking the service reconciliation handler.
- **Verdict:** **SAFE**.

### Scenario 6: Watchdog reset + late webhook
- **Design Evidence:** State machine supporting `requested -> completed` transitions.
- **Analysis:** If a server crash occurs and the watchdog runs after 15 minutes, it resets the Refund status from `processing` to `requested`. When the webhook eventually arrives, the handler successfully matches the refund in `requested` state and transitions it to `completed`, cancelling the booking. This successfully closes the loop.
- **Verdict:** **SAFE**.

### Scenario 7: Admin retry while webhook reconciliation is executing
- **Code Evidence:** Payment serialization locks and Phase 1 atomic claims.
- **Analysis:** If the admin retries approving the refund concurrently with the webhook executing, the Payment serialization lock forces one thread to serialize. If the webhook commits first, the admin's atomic claim (`requested -> processing` or `processing -> completed` save) fails because the refund is now `completed`. If the admin thread commits first, the webhook sees the refund is already completed and skips. As long as the stale booking status crash (Scenario 1) is mitigated, this is fully safe.
- **Verdict:** **SAFE** (dependent on RFND-B-F01 remediation).

### Scenario 8: Duplicate email notification risk
- **Code Evidence:** `apps/server/src/services/admin/refund.service.ts:L561-L580` (email trigger).
- **Analysis:** If the webhook completes the refund, it sends a confirmation email. If the admin approval thread later commits (re-fetching the booking to avoid the terminal state crash), the admin thread's post-commit effects will run and trigger a second confirmation email to the customer.
- **Finding:** **RFND-B-F03 (MEDIUM)**. Customers will receive duplicate emails.

### Scenario 9: Duplicate booking cancellation risk
- **Code Evidence:** `apps/server/src/services/admin/booking.service.ts:L365` (throws on already cancelled/refunded booking).
- **Analysis:** Handled under Scenario 1 and 7. If the booking is already cancelled, calling `cancelBooking` throws. Re-fetching the booking inside the transaction session and checking its state before calling `cancelBooking` prevents duplicate cancellation attempts.
- **Verdict:** **SAFE** (dependent on RFND-B-F01 remediation).

### Scenario 10: Concurrent webhook deliveries for same refund
- **Design Evidence:** Payment serialization lock.
- **Analysis:** If two webhooks for the same refund arrive concurrently (e.g. `charge.refunded` and `refund.updated`), they both start transactions. The Payment serialization lock forces them to run sequentially. The first completes the refund, and the second skips as a no-op.
- **Verdict:** **SAFE**.

### Scenario 11: Missing gateway refund lookup path (Gateway-initiated refund)
- **Design Evidence:** Primary and fallback lookups returning null.
- **Analysis:** If an admin initiates a refund directly on the Stripe/Razorpay dashboard instead of the MAD Admin UI, the webhook arrives at the server. Since there is no Refund document in the database, both the primary lookup (by `gatewayRefundId`) and the fallback lookup (by `paymentId + processing/requested status`) return null. The proposed design skips the webhook, leaving the booking active and confirmed. The customer gets their money back but retains active tickets.
- **Finding:** **RFND-B-F02 (HIGH/CRITICAL)**. This constitutes a severe financial leak.

### Scenario 12: WebhookEvent stale processing recovery interactions
- **Code Evidence:** `apps/server/src/controllers/public/payment.controller.ts:L89-L115` (reclaiming stale processing events after 5 minutes).
- **Analysis:** If a webhook handler crashes mid-execution, the `WebhookEvent` status is left as `'processing'`. After 5 minutes, a redelivery of the webhook can reclaim the event and re-execute the handler. The handler will safely check the Refund status and complete it if it was not completed, or skip if it was already completed.
- **Verdict:** **SAFE**.

### Scenario 13: Full refund vs partial refund payment status calculations
- **Design Evidence:** Calculating sum of completed refunds.
- **Analysis:** The handler queries the database for all *other* completed refunds for the payment. By summing their amounts and adding the current refund's amount, it compares it against the payment's capture amount. Since REFUND-002 prevents the sum of processing + completed refunds from exceeding the payment amount at claim time, this calculation is safe and cannot exceed the limit.
- **Verdict:** **SAFE**.

### Scenario 14: Booking already cancelled before reconciliation
- **Design Evidence:** Webhook handler state transitions.
- **Analysis:** If the booking is already cancelled (e.g., manually cancelled by customer support before the refund is finalized), the webhook reconciliation handler detects `booking.status === 'cancelled'`. It directly updates the booking status to `REFUNDED` and saves it, without calling `cancelBooking`, avoiding terminal state errors.
- **Verdict:** **SAFE**.

### Scenario 15: Refund already completed before webhook arrives
- **Design Evidence:** Primary lookup checks.
- **Analysis:** If the admin approval flow successfully completed Phase 3, the `gatewayRefundId` is populated. When the webhook arrives, the primary lookup resolves the completed refund, sees `status === 'completed'`, and skips as an idempotent no-op.
- **Verdict:** **SAFE**.
