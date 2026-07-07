# REFUND-004A — Refund Webhook Reconciliation Implementation Plan

**Task:** REFUND-004A  
**Date:** 2026-06-20  
**Status:** Revised Plan for Review  
**Target Branch:** `refactor/refund-webhook-reconciliation` (from develop)  

---

## 1. Goal

Implement the revised refund webhook reconciliation design to address all findings (RFND-C01 through RFND-L02) from the independent architecture audit:
1. Handle both Stripe `Charge` and `Refund` payload models.
2. Mirror full booking cancellation and ticket release logic on webhook completion.
3. Validate Stripe refund status on `refund.updated`.
4. Implement amount-matched fallback lookup and save `gatewayRefundId` immediately after gateway call.
5. Apply Payment serialization locks inside transactions.
6. Support watchdog-reset recovery (`requested` ➜ `completed`).
7. Alert Sentry on critical anomalies.
8. Align `processedAt` and `reconciledAt` fields.
9. Populate tracing metadata on `WebhookEvent` documents.

---

## 2. Proposed Changes

### Component 1: Model Schema

#### [MODIFY] [refund.schema.ts](../../../apps/server/src/models/refund.schema.ts)

- Add interface fields:
  ```ts
  gatewayRefundStatus?: string;
  reconciledAt?: Date;
  webhookEventId?: string;
  ```
- Add schema properties:
  ```ts
  gatewayRefundStatus: { type: String },
  reconciledAt: { type: Date },
  webhookEventId: { type: String },
  ```
- Add sparse index:
  ```ts
  refundSchema.index(
    { gatewayRefundId: 1 },
    { sparse: true, name: 'idx_refund_gateway_refund_id' }
  );
  ```

---

### Component 2: Service Layer (Admin Approval Phase)

#### [MODIFY] [refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts)

- In `processRefund`, in the Approve path (right after the Stripe/Razorpay API call succeeds and returns `finalGatewayRefundId`, before the Phase 3 finalization transaction begins), persist the gateway ID to minimize the crash window:
  ```ts
  // Line ~485:
  if (finalGatewayRefundId) {
    await Refund.updateOne(
      { _id: refund._id },
      { $set: { gatewayRefundId: finalGatewayRefundId } }
    ).catch(err => logger.error({ err, refundId: refund._id }, 'Failed to persist gatewayRefundId immediately.'));
    
    refund.gatewayRefundId = finalGatewayRefundId; // update local object
  }
  ```

---

### Component 3: Service Layer (Reconciliation Handlers)

#### [MODIFY] [payment.service.ts](../../../apps/server/src/services/public/payment.service.ts)

Implement two static methods for Stripe and Razorpay webhook reconciliation.

```ts
import { BookingStatus, PaymentStatus } from '@mad/shared';
import * as Sentry from '@sentry/node';
```

##### 1. `PaymentService.reconcileStripeRefundWebhook(eventData, webhookEventId, eventType)`
- **Event Parsing (RFND-C01, RFND-H01):**
  - If `eventType === 'charge.refunded'`:
    - `gatewayPaymentId = eventData.id`
    - `gatewayRefundId = eventData.refunds?.data?.[0]?.id`
    - `gatewayStatus = 'succeeded'`
    - `amountInCents = eventData.refunds?.data?.[0]?.amount`
  - If `eventType === 'refund.updated'` or `'refund.failed'`:
    - `gatewayPaymentId = eventData.charge`
    - `gatewayRefundId = eventData.id`
    - `gatewayStatus = eventData.status` // e.g. 'succeeded', 'failed', 'pending'
    - `amountInCents = eventData.amount`
- **Pre-Filtering:**
  - If `gatewayStatus === 'pending'` or other non-terminal state, log info and return `{ status: 'skipped' }`.
- **Primary Lookup:** `Refund.findOne({ gatewayRefundId })`.
- **Fallback Lookup (RFND-H02):**
  - If not found and `gatewayPaymentId` is present:
    - Look up `Payment.findOne({ gatewayPaymentId, gateway: 'stripe' })`.
    - If Payment found, query: `Refund.findOne({ paymentId: payment._id, status: { $in: ['processing', 'requested'] }, amount: amountInCents / 100 })`.
- **Reconciliation Logic:**
  - Run inside transaction `runInTransaction(async (session) => { ... })`:
    - **Payment Serialization Lock (RFND-H03):**
      - Run `await Payment.findOneAndUpdate({ _id: refund.paymentId }, { $set: { updatedAt: new Date() } }, { session, new: true })`.
    - **Atomic Transition (RFND-M01):**
      - Run:
        ```ts
        const updatedRefund = await Refund.findOneAndUpdate(
          { _id: refund._id, status: { $in: ['processing', 'requested'] } },
          { $set: { status: gatewayStatus === 'failed' ? 'failed' : 'completed', gatewayRefundStatus: gatewayStatus, reconciledAt: new Date(), processedAt: new Date(), webhookEventId } },
          { session, new: true }
        );
        ```
    - **If already completed / failed (Idempotency):**
      - If `refund.status === 'completed'` and event says success ➜ return `{ status: 'completed', refundId: refund._id }`.
      - If `refund.status === 'failed'` and event says failed ➜ return `{ status: 'failed', refundId: refund._id }`.
    - **Anomaly Detection (RFND-M02):**
      - If `refund.status === 'completed'` and event says failed ➜ Trigger Sentry alert (`Sentry.captureMessage`), log warning, return `{ status: 'anomaly' }`.
      - If `refund.status === 'failed'` and event says success ➜ Trigger Sentry alert, log warning, return `{ status: 'anomaly' }`.
    - **Mirroring finalization (RFND-C02):**
      - Resolve `Payment` and `Booking`.
      - Calculate:
        ```ts
        const otherCompletedRefunds = await Refund.find({
          paymentId: refund.paymentId,
          status: 'completed',
          _id: { $ne: refund._id }
        }).session(session);
        const totalCompletedRefunded = otherCompletedRefunds.reduce((sum, r) => sum + r.amount, 0);
        const isFullRefund = (totalCompletedRefunded + refund.amount) === payment.amount;
        const newPaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
        ```
      - Update Payment: `await Payment.findByIdAndUpdate(refund.paymentId, { status: newPaymentStatus }, { session })`.
      - Booking cancel:
        - If `isFullRefund`:
          - If `booking.status === BookingStatus.CONFIRMED`:
            - Call `cancelBooking(refund.bookingId.toString(), 'Stripe Refund Webhook Reconciled', session, BookingStatus.REFUNDED)` and extract `postCommitPayload`.
          - If `booking.status === BookingStatus.CANCELLED`:
            - Update booking to `BookingStatus.REFUNDED`, increment `bookingVersion`, and save.
        - Else if `refund.cancelTickets` and `booking.status === BookingStatus.CONFIRMED`:
          - Call `cancelBooking(refund.bookingId.toString(), 'Stripe Refund Webhook Reconciled', session, BookingStatus.CANCELLED)` and extract `postCommitPayload`.
      - Return `{ status: 'completed', refundId: refund._id, cancelPostCommitPayload, paymentId: payment._id }`.
  - **Outside Transaction (Post-Commit Effects):**
    - Execute `executeCancelBookingSideEffects(cancelPostCommitPayload)`.
    - Trigger booking/refund email notifications.

##### 2. `PaymentService.reconcileRazorpayRefundWebhook(refundEntity, eventType, webhookEventId)`
- **Event Parsing:**
  - `gatewayPaymentId = refundEntity.payment_id`
  - `gatewayRefundId = refundEntity.id`
  - `amountInPaise = refundEntity.amount`
  - `gatewayStatus = eventType === 'refund.processed' ? 'processed' : 'failed'`
- **Reconciliation Logic:**
  - Same transaction block structure, Payment locking, atomic transition (`requested`/`processing` ➜ `completed`/`failed`), booking cancellation mirror, and anomaly alerting.
  - Fallback matches: `Refund.findOne({ paymentId: payment._id, status: { $in: ['processing', 'requested'] }, amount: amountInPaise / 100 })`.

---

### Component 4: Controller Routing

#### [MODIFY] [payment.controller.ts](../../../apps/server/src/controllers/public/payment.controller.ts)

- **Stripe Webhook Handler (`stripeWebhook`):**
  - Add routing:
    ```ts
    } else if (
      event.type === 'charge.refunded' ||
      event.type === 'refund.updated' ||
      event.type === 'refund.failed'
    ) {
      const eventData = event.data.object as any;
      const result = await PaymentService.reconcileStripeRefundWebhook(
        eventData,
        event.id,
        event.type
      );
      
      // Update WebhookEvent traceability (RFND-L02)
      if (result.refundId) {
        webhookEvent.rawPayload = {
          ...webhookEvent.rawPayload,
          _reconciledRefundId: result.refundId
        };
      }
      if (result.paymentId) {
        webhookEvent.paymentId = result.paymentId;
      }
      
      if (result.status === 'anomaly') {
        logger.warn({ eventId: event.id, result }, 'Stripe refund anomaly occurred.');
      }
    }
    ```
- **Razorpay Webhook Handler (`razorpayWebhook`):**
  - Parse refund payload identifiers:
    ```ts
    let razorpayRefundId: string | undefined;
    let razorpayRefundPaymentId: string | undefined;
    if (eventType.startsWith('refund.')) {
      razorpayRefundId = body.payload?.refund?.entity?.id;
      razorpayRefundPaymentId = body.payload?.refund?.entity?.payment_id;
    }
    ```
  - Route refund events:
    ```ts
    if (razorpayOrderId && razorpayPaymentId) {
      // payment flow ...
    } else if (razorpayRefundId && (eventType === 'refund.processed' || eventType === 'refund.failed')) {
      const refundEntity = body.payload.refund.entity;
      const result = await PaymentService.reconcileRazorpayRefundWebhook(
        refundEntity,
        eventType,
        eventId
      );
      
      if (result.refundId) {
        webhookEvent.rawPayload = {
          ...webhookEvent.rawPayload,
          _reconciledRefundId: result.refundId
        };
      }
      if (result.paymentId) {
        webhookEvent.paymentId = result.paymentId;
      }
    }
    ```

---

### Component 5: Tests

#### [MODIFY] [payment.controller.webhook.test.ts](../../../apps/server/src/controllers/public/payment.controller.webhook.test.ts)
- Add tests to verify controller-to-service routing for Stripe `charge.refunded`, `refund.updated`, `refund.failed`, and Razorpay `refund.processed`, `refund.failed`.
- Verify `paymentId` and custom `_reconciledRefundId` are written to the `WebhookEvent` model.

#### [NEW] [payment.service.refund-webhook.test.ts](../../../apps/server/src/services/public/payment.service.refund-webhook.test.ts)
- Implement comprehensive tests covering all scenarios from the updated test matrix.

---

## 3. Verification Plan

### Automated
Execute the standard server quality and compilation guards:
```bash
pnpm test
pnpm type-check
pnpm build
```

### Manual Verification
1. **Mock Gateway Event Simulation:** Trigger Stripe `charge.refunded` mock payload via webhook verification tests on a mock database:
   - Verify `processedAt` and `reconciledAt` are populated.
   - Verify associated payment is locked during transaction.
   - Verify booking status transitions to `REFUNDED` if full refund.
2. **Watchdog Race Simulator:** Set a mock refund to `requested` status (simulating watchdog timeout), and run `reconcileStripeRefundWebhook()` with a successful payload. Assert refund transitions to `completed` and booking cancels.
3. **Stripe `refund.updated` Ignored Statuses:** Invoke reconciliation with Stripe status set to `pending`. Assert database refund status remains `processing` and method returns `{ status: 'skipped' }`.

---

## 4. Rollback Plan

- Remove webhook routing conditions in `payment.controller.ts`.
- Remove static methods in `payment.service.ts`.
- Drop sparse database index: `db.refunds.dropIndex('idx_refund_gateway_refund_id')`.
- Removing model schema additions is fully non-breaking as they are nullable.
