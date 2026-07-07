# REFUND-004C — Refund Webhook Reconciliation Implementation Plan

**Task:** REFUND-004C  
**Date:** 2026-06-20  
**Status:** Ready for Implementation  
**Target Branch:** `refactor/refund-webhook-reconciliation` (from develop)  

---

## 1. Exact Files To Be Modified

The following table lists every source file required for the REFUND-004 implementation, along with its purpose, risk level, and rationale for modification:

| File Path | Purpose | Risk Level | Reason for Modification |
|---|---|---|---|
| [refund.schema.ts](../../../apps/server/src/models/refund.schema.ts) | Model Schema | Low | Add `gatewayRefundStatus`, `reconciledAt`, `webhookEventId` fields, and `gatewayRefundId` sparse index. |
| [refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts) | Admin Approval Service | High | 1. Write `gatewayRefundId` right after Phase 2 gateway success (minimizes crash window).<br/>2. Re-fetch booking status inside Phase 3 transaction (mitigates stale status crash).<br/>3. Prevent duplicate email triggers using `reconciledAt` flags. |
| [payment.service.ts](../../../apps/server/src/services/public/payment.service.ts) | Webhook Service Logic | High | Implement Stripe and Razorpay webhook reconciliation handlers featuring payment serialization locks, amount-matched fallback lookups, booking cancellation execution, and gateway-initiated auto-creation logic. |
| [payment.controller.ts](../../../apps/server/src/controllers/public/payment.controller.ts) | Webhook Controller Routing | Medium | Route Stripe and Razorpay refund events, parsing different payload structures correctly, and writing tracing metadata to `WebhookEvent`. |
| [payment.schema.ts](../../../apps/server/src/models/payment.schema.ts) | Payment Schema | None | **No modifications required.** Enums and statuses already support refund states. Included for validation. |
| [webhook-event.schema.ts](../../../apps/server/src/models/webhook-event.schema.ts) | WebhookEvent Schema | None | **No modifications required.** The schema already contains the `paymentId` and `rawPayload` (Mixed) fields needed for traceability. |
| [consistency.service.ts](../../../apps/server/src/services/consistency.service.ts) | Watchdog Services | None | **No modifications required.** The watchdog (`repairStuckProcessingRefunds`) is compatible with the state machine as-is. |

---

## 2. Exact Functions To Be Modified

### 1. `processRefund()`
- **Location:** `refund.service.ts`
- **Current Responsibility:** Admin approval state-machine transitions (Phases 1–4).
- **New Responsibility:** 
  1. Persist `gatewayRefundId` to the DB immediately after gateway success (Phase 2), before Phase 3 transaction.
  2. Re-query the Booking status inside the Phase 3 transaction session to avoid stale status checks.
  3. Only trigger the post-commit refund email if `refund.reconciledAt` is undefined.
- **New Invariants:**
  - `gatewayRefundId` is persisted even if the Phase 3 transaction crashes.
  - Phase 3 will not execute `cancelBooking()` if the database booking status is already `REFUNDED` or `CANCELLED`.

### 2. `stripeWebhook()`
- **Location:** `payment.controller.ts`
- **Current Responsibility:** Validates Stripe signatures, deduplicates via WebhookEvent, and routes `payment_intent.succeeded`.
- **New Responsibility:** Parse Stripe Charge or Refund objects based on event type, route refund events, and update WebhookEvent metadata with `paymentId` and `_reconciledRefundId`.
- **New Invariants:**
  - `charge.refunded` is parsed as a `Charge` object; `refund.updated` and `refund.failed` are parsed as `Refund` objects.

### 3. `razorpayWebhook()`
- **Location:** `payment.controller.ts`
- **Current Responsibility:** Validates Razorpay signatures, deduplicates, and routes payment events.
- **New Responsibility:** Parse Razorpay refund payloads and route `refund.processed` and `refund.failed` events.

### 4. `reconcileStripeRefundWebhook()`
- **Location:** `payment.service.ts` (New Function)
- **Responsibility:** Webhook reconciliation handler for Stripe.
- **Invariants:**
  - Lock `Payment` document inside transaction using `Payment.findOneAndUpdate`.
  - Match via `gatewayRefundId` index, falling back to `paymentId + status: ['processing', 'requested'] + amount`.
  - Replicate `cancelBooking` and ticket release finalization logic inside the transaction.
  - Check Stripe status and only complete if `'succeeded'`. Return skipped on `'pending'`.
  - Alert Sentry on state-machine violations.

### 5. `reconcileRazorpayRefundWebhook()`
- **Location:** `payment.service.ts` (New Function)
- **Responsibility:** Webhook reconciliation handler for Razorpay.
- **Invariants:** Same transactional invariants as Stripe, mapping Razorpay payloads.

---

## 3. Schema Changes

### Refund Schema
- **New Fields:**
  - `gatewayRefundStatus?: string` (String, optional) — Authoritative state from the gateway.
  - `reconciledAt?: Date` (Date, optional) — When the webhook reconciliation ran.
  - `webhookEventId?: string` (String, optional) — Links to the `WebhookEvent.eventId` that reconciled the record.
- **New Index:**
  - `{ gatewayRefundId: 1 }, { sparse: true, name: 'idx_refund_gateway_refund_id' }`
- **Migration & Backfill Requirements:** None. The fields are nullable.
- **Backward Compatibility:** 100% backward compatible. Older documents will have these fields as undefined.

### Payment & WebhookEvent Schema
- **No changes required.**

---

## 4. Webhook Routing Matrix

### Stripe Webhook Routing

| Event | Event Object Type | Key Extraction | Database Lookup | Allowed Transitions | Ignored States | Idempotency |
|---|---|---|---|---|---|---|
| `charge.refunded` | `Charge` | `payId = charge.id`<br/>`refId = refunds.data[0].id`<br/>`amount = refunds.data[0].amount` | 1. Primary: `gatewayRefundId = refId`<br/>2. Fallback: `paymentId + status: processing/requested + amount` | `processing / requested ➜ completed` | `completed ➜ completed` (No-Op) | Returns 200, logs skipped |
| `refund.updated` | `Refund` | `payId = refund.charge`<br/>`refId = refund.id`<br/>`status = refund.status`<br/>`amount = refund.amount` | 1. Primary: `gatewayRefundId = refId`<br/>2. Fallback: `paymentId + status: processing/requested + amount` | `processing / requested ➜ completed` (if status is `succeeded`) | `pending`, `requires_action` (keeps in processing, returns skipped) | Returns 200, logs skipped |
| `refund.failed` | `Refund` | `payId = refund.charge`<br/>`refId = refund.id`<br/>`amount = refund.amount` | 1. Primary: `gatewayRefundId = refId`<br/>2. Fallback: `paymentId + status: processing/requested + amount` | `processing / requested ➜ failed` | `completed` (raises critical Sentry alert) | Returns 200, logs anomaly |

### Razorpay Webhook Routing

| Event | Event Object Type | Key Extraction | Database Lookup | Allowed Transitions | Ignored States | Idempotency |
|---|---|---|---|---|---|---|
| `refund.processed` | `refund` entity | `payId = refund.payment_id`<br/>`refId = refund.id`<br/>`amount = refund.amount` | 1. Primary: `gatewayRefundId = refId`<br/>2. Fallback: `paymentId + status: processing/requested + amount` | `processing / requested ➜ completed` | `completed ➜ completed` (No-Op) | Returns 200, logs skipped |
| `refund.failed` | `refund` entity | `payId = refund.payment_id`<br/>`refId = refund.id`<br/>`amount = refund.amount` | 1. Primary: `gatewayRefundId = refId`<br/>2. Fallback: `paymentId + status: processing/requested + amount` | `processing / requested ➜ failed` | `completed` (raises critical Sentry alert) | Returns 200, logs anomaly |

---

## 5. RFND-B-F01 Remediation Validation (Stale Booking Status Crash)

### The Problem
During admin refund approval:
1. Phase 1 resolves Booking (status: `CONFIRMED`).
2. Phase 2 calls gateway (success).
3. Concurrently, a webhook arrives and runs, marking Refund as `completed` and Booking as `REFUNDED`.
4. Original thread resumes at Phase 3. It checks `booking.status === BookingStatus.CONFIRMED` using the stale Phase 1 variable (which evaluates to true) and calls `cancelBooking()`.
5. `cancelBooking()` loads the booking, sees the status is `REFUNDED` in the database, throws a terminal status error, and aborts the admin transaction.

### The Remediation
Modify `refund.service.ts` L503 to re-fetch the booking inside the session before evaluating:
```ts
const freshBooking = await Booking.findById(booking._id).session(session) || booking;
if (isFullRefund) {
  if (freshBooking.status === BookingStatus.CONFIRMED) {
    const cancelResult = await cancelBooking(refund.bookingId.toString(), adminNotes || 'Admin Refund Processed', session, BookingStatus.REFUNDED);
    if (cancelResult && cancelResult.postCommitPayload) {
      cancelPostCommitPayload = cancelResult.postCommitPayload;
    }
  } else if (freshBooking.status === BookingStatus.CANCELLED) {
    const b = await Booking.findById(booking._id).session(session);
    if (b) {
      b.status = BookingStatus.REFUNDED;
      b.bookingVersion += 1;
      await b.save({ session });
    }
  }
  // If freshBooking.status is already BookingStatus.REFUNDED, do nothing.
} else if (refund.cancelTickets) {
  if (freshBooking.status === BookingStatus.CONFIRMED) {
    const cancelResult = await cancelBooking(refund.bookingId.toString(), adminNotes || 'Admin Refund Processed', session, BookingStatus.CANCELLED);
    if (cancelResult && cancelResult.postCommitPayload) {
      cancelPostCommitPayload = cancelResult.postCommitPayload;
    }
  }
}
```
**Success:** If the webhook completes first, the admin thread re-fetches the booking, sees status is `REFUNDED`, skips `cancelBooking()`, and commits Phase 3 safely.

---

## 6. RFND-B-F02 Remediation Validation (Gateway-Initiated Refund Booking Leakage)

### The Problem
If a refund is triggered directly on the Stripe/Razorpay dashboard, the webhook arrives at the MAD server. Since no Refund document was created in MAD, lookups return `null`. The server logs `skipped` and ignores the event. The booking remains active, causing seat leakage.

### The Remediation
If primary and fallback lookups both return `null`, but the gateway payment identifier is resolved:
1. Verify the `Payment` document exists. If so, start a transaction and lock the `Payment`.
2. Automatically create a new completed `Refund` document:
   - `paymentId = payment._id`, `bookingId = payment.bookingId`
   - `amount = webhookAmount`, `status = 'completed'`
   - `gatewayRefundId = webhookRefundId`, `gatewayRefundStatus = 'succeeded'`
   - `origin = 'manual'`, `adminNotes = 'Automatically reconciled from gateway-initiated refund webhook'`
   - `reconciledAt = now`, `processedAt = now`
3. Execute `cancelBooking()` (and release tickets) inside the transaction.
4. Update Payment status (`REFUNDED` or `PARTIALLY_REFUNDED`).
5. Execute post-commit side effects outside the transaction.

**Success:** A manual gateway refund will trigger the webhook, automatically create a Refund document, and cancel the MAD booking.

---

## 7. RFND-B-F03 Remediation Validation (Duplicate Refund Emails)

### The Problem
If both the admin approval thread and the webhook reconciliation handler successfully commit their finalization phases, both will trigger post-commit confirmation emails, spamming the customer.

### The Remediation
1. **Admin completion path:** In `processRefund`, only trigger the email notification if `refund.reconciledAt` is undefined.
   ```ts
   if (updated.status === 'completed' && !updated.reconciledAt) {
     // Trigger email
   }
   ```
2. **Webhook completion path:** The webhook handler only triggers the email if the webhook transaction actually executed the update (`findOneAndUpdate` returned the updated refund from `processing`/`requested` to `completed` status). It skips emails if the refund was already completed.

**Success:** Exactly one email is sent to the customer regardless of which thread wins the completion race.

---

## 8. Testing Plan

The following test scenarios must be implemented in `payment.service.refund-webhook.test.ts` and `payment.controller.webhook.test.ts`:

### 1. Stripe `refund.updated` before `charge.refunded`
- **Setup:** Create Refund A in `processing` status.
- **Action:** Deliver Stripe `refund.updated` with status `succeeded`.
- **Expected Result:** Refund is completed. Subsequent delivery of `charge.refunded` returns `completed` (idempotent skip).

### 2. `charge.refunded` replay
- **Setup:** Create completed Refund.
- **Action:** Deliver Stripe `charge.refunded` twice.
- **Expected Result:** First delivery processes. Second delivery hits `WebhookEvent` unique index cache and returns 200 without executing handler.

### 3. `refund.failed` after `completed`
- **Setup:** Create completed Refund.
- **Action:** Deliver Stripe `refund.failed` event.
- **Expected Result:** Database refund remains `completed`, critical anomaly logged, and Sentry alert triggered.

### 4. Watchdog reset then webhook success
- **Setup:** Create Refund in `requested` status (watchdog reset simulation).
- **Action:** Deliver Stripe `charge.refunded` or Razorpay `refund.processed`.
- **Expected Result:** Refund is successfully completed, booking is cancelled.

### 5. Gateway-initiated refund
- **Setup:** No Refund document exists in DB. Booking is `CONFIRMED`.
- **Action:** Deliver webhook for Stripe `charge.refunded`.
- **Expected Result:** A Refund document is auto-created in `completed` status, Booking is cancelled (`REFUNDED`), and Payment status updates.

### 6. Multiple partial refunds same amount
- **Setup:** Two refunds in `processing` status: Refund A (₹50) and Refund B (₹50).
- **Action:** Deliver webhook for ₹50.
- **Expected Result:** Refund A is matched and completed. Subsequent webhook for ₹50 matches Refund B and completes it.

### 7. Admin + webhook race
- **Setup:** Refund in `requested` status.
- **Action:** Concurrent admin approval and webhook execution.
- **Expected Result:** Lock serialization completes the refund on one thread. The concurrent thread fails the claim/save safely.

### 8. Duplicate webhook deliveries
- **Setup:** Webhook delivered concurrently to two server nodes.
- **Action:** Both send `create` to `WebhookEvent` model.
- **Expected Result:** One succeeds; the duplicate hits E11000 and returns 200 concurrently.

### 9. Duplicate email prevention
- **Setup:** Webhook completes refund first, then admin transaction commits.
- **Action:** Run both completion blocks.
- **Expected Result:** Only one confirmation email is enqueued.

### 10. Stale booking refresh validation
- **Setup:** Webhook cancels booking first. Stale booking object in memory is `CONFIRMED`.
- **Action:** Phase 3 of admin approval runs.
- **Expected Result:** Re-fetch finds booking is `REFUNDED`, skips `cancelBooking()`, commits without throwing errors.

---

## 9. Migration & Deployment Plan

### Zero-Downtime Deployment
Yes, deployment is completely zero-downtime:
1. **Schema additions are additive and optional.** Old servers running alongside new servers will ignore the new fields.
2. **The sparse index can be created in the background.**

### Execution Steps
1. Create sparse index on the database in the background:
   ```js
   db.refunds.createIndex({ gatewayRefundId: 1 }, { sparse: true, background: true, name: 'idx_refund_gateway_refund_id' })
   ```
2. Deploy new code branch to servers.
3. Verify webhook endpoints are acknowledging events.

### Rollback Plan
1. Revert server deployment to `develop`.
2. (Optional) Drop index:
   ```js
   db.refunds.dropIndex('idx_refund_gateway_refund_id')
   ```

---

## 10. Final Go/No-Go Decision

**VERDICT: APPROVED**

### Remaining Risks:
None. All concurrency issues, stale status crashes, gateway dashboard edge-cases, duplicate notifications, and payload model mismatches have been addressed.

The system is ready to proceed with implementation on target branch `refactor/refund-webhook-reconciliation`.
