# REFUND-004 — Refund Webhook Reconciliation
## Independent Architecture Audit Report

**Task:** REFUND-004  
**Date:** 2026-06-20  
**Target Branch:** `refactor/refund-webhook-reconciliation`  
**Status:** Audit Completed  

---

## 1. Architecture Verdict

**APPROVED WITH CHANGES**

The core design for Stripe and Razorpay refund webhook reconciliation is conceptually sound and correctly leverages the existing `WebhookEvent` outer-idempotency system. However, the proposed implementation plan has several critical and high-risk flaws that will cause runtime crashes, data inconsistencies, and state-machine violations. These must be addressed before the implementation can begin.

---

## 2. Detailed Findings

### Critical Findings

#### RFND-C01: Stripe Webhook Payload Model Mismatch (Runtime Crash Risk)
- **Severity:** CRITICAL
- **Risk:** Stripe's webhook sends different data objects depending on the event type. For `charge.refunded`, the event object (`event.data.object`) is a `Charge` object. For `refund.updated` and `refund.failed`, the event object is a `Refund` object. The proposed implementation plan assumes that all three events carry a `Charge` object and attempts to extract the gateway refund ID via `charge.refunds.data[0].id`. If a `refund.updated` or `refund.failed` event is received, `charge.refunds` will be `undefined`, causing a runtime `TypeError` and crashing the webhook handler.
- **Affected File/Function:** `apps/server/src/controllers/public/payment.controller.ts` -> `stripeWebhook()` and `apps/server/src/services/public/payment.service.ts` -> `PaymentService.reconcileStripeRefundWebhook()`
- **Recommended Correction:** The controller and service must distinguish between event types. 
  - For `charge.refunded`:
    - `gatewayPaymentId = charge.id`
    - `gatewayRefundId = charge.refunds.data[0]?.id`
  - For `refund.updated` and `refund.failed`:
    - `gatewayPaymentId = refund.charge` (which holds the Charge ID string `ch_...`)
    - `gatewayRefundId = refund.id` (which holds the Refund ID string `re_...`)

#### RFND-C02: Missing Booking and Ticket Cancellation (State Inconsistency)
- **Severity:** CRITICAL
- **Risk:** In the crash-window recovery scenario (Phase 2 gateway call succeeds but the server crashes before Phase 3 finalizes), the database `Refund` status is `processing` and the `Booking` remains `CONFIRMED`. The proposed reconciliation service only transitions the `Refund` status to `completed` and updates the `Payment` status. It completely omits the booking cancellation logic (`cancelBooking` and releasing tickets/seats). This leaves the booking in an active `CONFIRMED` state and tickets valid, leading to seat leakage (unpaid seats occupied) and inconsistent data.
- **Affected File/Function:** `apps/server/src/services/public/payment.service.ts` -> `reconcileStripeRefundWebhook()` and `reconcileRazorpayRefundWebhook()`
- **Recommended Correction:** The reconciliation service must replicate the finalization logic found in `apps/server/src/services/admin/refund.service.ts:L496-L532`. Specifically, if the refund completes via webhook:
  1. Determine if it is a full refund or if `refund.cancelTickets` is true.
  2. Call `cancelBooking(refund.bookingId, ...)` to transition the booking status to `REFUNDED` or `CANCELLED` and release inventory.
  3. Propagate and execute the post-commit cancel side effects (`executeCancelBookingSideEffects`) outside the transaction session.

---

### High Findings

#### RFND-H01: Premature Refund Completion via `refund.updated` Webhook
- **Severity:** HIGH
- **Risk:** Stripe fires a `refund.updated` webhook for any update on a refund object, including status changes to `pending` or metadata edits. The proposed plan maps `refund.updated` directly to the reconciliation handler and transitions the database Refund status to `completed` if it is currently `processing`. This means a `pending` refund from Stripe will be marked as `completed` in our database prematurely, violating the state machine and falsifying financial status.
- **Affected File/Function:** `apps/server/src/services/public/payment.service.ts` -> `reconcileStripeRefundWebhook()`
- **Recommended Correction:** The handler must check the Stripe Refund status field. It should only transition the database Refund status to `completed` if the webhook payload's status is `'succeeded'`. If the payload status is `'failed'`, it should transition to `'failed'`. If the payload status is `'pending'` or other non-terminal states, it should be ignored or kept in `processing`.

#### RFND-H02: Fallback Lookup Ambiguity on Concurrent Partial Refunds
- **Severity:** HIGH
- **Risk:** In the crash-window recovery scenario where the database lacks `gatewayRefundId`, the fallback lookup searches for `Refund.findOne({ paymentId, status: 'processing' })`. If an admin has approved multiple partial refunds for the same payment concurrently (which is supported), both will be in `processing` status. The webhook handler will arbitrarily match the first processing refund it finds, potentially associating the wrong refund ID or amount with the wrong record, causing data corruption.
- **Affected File/Function:** `apps/server/src/services/public/payment.service.ts` -> `reconcileStripeRefundWebhook()` and `reconcileRazorpayRefundWebhook()`
- **Recommended Correction:** 
  1. Refine the fallback query to match by amount as well: `Refund.findOne({ paymentId, status: 'processing', amount: webhookRefundAmount })` (converting webhook cents to decimal).
  2. In `refund.service.ts` (Phase 2), save `gatewayRefundId` to the Refund document *immediately* after the gateway API call succeeds, before starting the Phase 3 transaction. This minimizes the crash window to microseconds and avoids relying on fallback lookups in almost all cases.

#### RFND-H03: Missing Payment Serialization Lock (Race Condition)
- **Severity:** HIGH
- **Risk:** Under REFUND-002, concurrent updates to the payment and its refunds are serialized using `Payment.findOneAndUpdate({ _id: paymentId }, { $set: { updatedAt: new Date() } })`. The proposed webhook reconciliation runs inside a transaction but does NOT perform this payment lock. If a webhook arrives concurrently with an admin approving another refund or a watchdog running, the balance and payment status calculations may read stale states, leading to race conditions and inconsistent payment statuses.
- **Affected File/Function:** `apps/server/src/services/public/payment.service.ts` -> `reconcileStripeRefundWebhook()` and `reconcileRazorpayRefundWebhook()`
- **Recommended Correction:** The reconciliation transaction must first execute a serialization write lock on the `Payment` document:
  ```ts
  await Payment.findOneAndUpdate(
    { _id: refund.paymentId },
    { $set: { updatedAt: new Date() } },
    { session, new: true }
  );
  ```

---

### Medium Findings

#### RFND-M01: Watchdog Reset and Webhook Race leading to Duplicate Refunds
- **Severity:** MEDIUM
- **Risk:** If the server crashes during a refund, and the webhook is delayed past the watchdog threshold (15 minutes), the watchdog will reset the Refund status from `processing` to `requested`. When the webhook eventually arrives, the proposed design sees the status as `requested`, logs an anomaly, and skips processing. This leaves the database Refund in `requested` status, allowing the admin to approve it again and triggering a duplicate refund at the gateway.
- **Affected File/Function:** `apps/server/src/services/public/payment.service.ts` -> `reconcileStripeRefundWebhook()` and `reconcileRazorpayRazorpayWebhook()`
- **Recommended Correction:** If a webhook confirms a refund succeeded at the gateway, and the corresponding Refund document is found in `requested` state, the reconciliation handler should still transition it to `completed` (after logging the watchdog timeout anomaly). Since the money is already gone from the gateway, completing the refund reflects reality and prevents a duplicate admin approval.

#### RFND-M02: Lack of Sentry Alerting on Critical Anomalies
- **Severity:** MEDIUM
- **Risk:** When a webhook reconciliation handler encounters a critical state-machine anomaly (e.g., Stripe reports `refund.failed` but the database shows the Refund is already `completed`), the proposed plan logs it and returns 200 to prevent retry storms. However, this represents a severe financial desynchronization (money returned to gateway but marked completed, or vice versa) and needs active human intervention. A standard logger warning can be easily missed in production.
- **Affected File/Function:** `apps/server/src/controllers/public/payment.controller.ts`
- **Recommended Correction:** Integrate `Sentry.captureException` or `Sentry.captureMessage` with appropriate severity level (e.g., `'error'` or `'critical'`) when state-machine anomalies are detected.

---

### Low Findings

#### RFND-L01: `processedAt` and `reconciledAt` Dual Fields
- **Severity:** LOW
- **Risk:** The implementation plan adds `reconciledAt` to the Refund model but does not clarify how it interacts with `processedAt` (which is standardly set during Phase 3). Keeping both fields separate but unset could break reporting scripts that rely on `processedAt` to determine when a refund was finalized.
- **Affected File/Function:** `apps/server/src/models/refund.schema.ts` and `apps/server/src/services/public/payment.service.ts`
- **Recommended Correction:** When completing a refund via webhook, set both `processedAt` (representing finalization) and `reconciledAt` (representing webhook confirmation time) to the current timestamp.

#### RFND-L02: WebhookEvent Tracking of Refund ID
- **Severity:** LOW
- **Risk:** The plan avoids adding a `refundId` field to the `WebhookEvent` model to keep schema modifications minimal. However, this reduces traceability. If a developer needs to audit webhook events, they cannot easily query which refund was affected by a specific event without looking through server logs.
- **Affected File/Function:** `apps/server/src/controllers/public/payment.controller.ts`
- **Recommended Correction:** Although `IWebhookEvent` does not have a `refundId` field, we can record the resolved `refundId` in the `rawPayload` or as metadata inside the `WebhookEvent` before saving it, which increases audit trail clarity.

---

## 3. Review Q&A

### Q1. Is the reconciliation architecture safe?
**No.** In its current proposed form, it is unsafe.
1. The **object type mismatch** for Stripe events (`charge.refunded` vs `refund.updated`/`refund.failed`) will cause the handler to throw a runtime error when accessing `charge.refunds.data[0].id` for the latter two events.
2. The **omission of booking cancellation** and ticket release logic during webhook completion means a recovered refund will leave the booking active, leaking inventory.
3. The **lack of Payment serialization locks** opens the door to concurrent write races.

### Q2. Is webhook processing idempotent?
**Yes, but with caveats.** The outer idempotency (`WebhookEvent.eventId`) prevents duplicate processing of the same request payload. The inner idempotency correctly detects `status === 'completed'` and skips modifications. However, the inner idempotency should be improved to handle concurrent transaction wins gracefully rather than throwing false anomalies when a concurrent request finishes first.

### Q3. Is crash-window recovery sufficient?
**Partial.** It is sufficient for single-refund payments. However:
1. It is **ambiguous** if there are multiple concurrent partial refunds in `processing` status.
2. It fails to recover if the **watchdog resets** the refund to `requested` before the webhook arrives, as the webhook will then reject and skip it.

### Q4. Can duplicate refunds still occur?
**Yes.** If the watchdog resets the refund to `requested` because the webhook was delayed or the server was down, the webhook handler will skip processing because the refund is in `requested` state. An admin can then re-approve the refund, triggering a second gateway transaction.

### Q5. Is REFUND-004 ready for implementation?
**No.** The implementation plan must be revised to address:
1. Distinct payload parsing for Stripe `Charge` and `Refund` objects.
2. Checking the gateway status (e.g. `'succeeded'`) on Stripe `refund.updated` before marking completed.
3. Incorporating `cancelBooking` and ticket release in the reconciliation completion path.
4. Adding amount-matching to the fallback lookup and applying Payment serialization locks.
5. Allowing reconciliation of `requested` refunds when matched by a valid gateway event.

Once these changes are reflected in a revised implementation plan, the task will be ready for approval.
