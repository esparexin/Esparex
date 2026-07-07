# REFUND-004-IMPLEMENTATION-PLAN.md
## Refund Webhook Reconciliation — Implementation Plan

**Task:** REFUND-004
**Date:** 2026-06-20
**Branch:** refactor/refund-webhook-reconciliation (from develop)

---

## Manual Verification Gate

**Current branch:** develop
**Working tree:** clean (3 untracked audit docs only)
**Gate status:** PASS

---

## Goal

Implement refund webhook reconciliation to eliminate the gateway/database divergence
documented in REFUND-003. After this implementation:

1. Stripe `charge.refunded` and `refund.failed` events drive Refund state transitions
2. Razorpay `refund.processed` and `refund.failed` events drive Refund state transitions
3. All webhook processing is idempotent (safe for retries)
4. The crash-window scenario (Phase 2 success + crash) is automatically recovered
5. REFUND-002 concurrent protection is not weakened

Scope boundary: Schema additions, controller routing, service reconciliation handlers, tests.
Out of scope: Watchdog changes, processRefund changes, admin UI, audit trail hardening.

---

## Proposed Changes

---

### 1. `apps/server/src/models/refund.schema.ts` [MODIFY]

**Why:** Add 3 reconciliation fields (RFND-F04-E) and 1 index (RFND-F04-D).

**Changes:**

**a) Add to `IRefund` interface:**
```ts
gatewayRefundStatus?: string;   // authoritative state from gateway webhook
reconciledAt?: Date;            // when webhook confirmed the refund
webhookEventId?: string;        // link to the WebhookEvent.eventId that reconciled
```

**b) Add to schema definition:**
```ts
gatewayRefundStatus: { type: String },
reconciledAt: { type: Date },
webhookEventId: { type: String },
```

**c) Add sparse index for gatewayRefundId:**
```ts
refundSchema.index(
  { gatewayRefundId: 1 },
  { sparse: true, name: 'idx_refund_gateway_refund_id' }
);
```

**Risk:** Low. Purely additive. Existing refunds will have undefined for all three new fields.

---

### 2. `apps/server/src/services/public/payment.service.ts` [MODIFY]

**Why:** Add the two reconciliation handler methods (RFND-F04-A, RFND-F04-B).

**New method A: `PaymentService.reconcileStripeRefundWebhook()`**

Signature:
```ts
static async reconcileStripeRefundWebhook(
  charge: { id: string; refunds?: { data: Array<{ id: string; status: string }> } },
  webhookEventId: string,
  eventType: string
): Promise<{ status: 'completed' | 'failed' | 'anomaly' | 'skipped'; refundId?: string }>
```

Logic for `charge.refunded`:
1. Extract `gatewayRefundId = charge.refunds.data[0].id` (= `re_...`)
2. Primary lookup: `Refund.findOne({ gatewayRefundId })`
3. Fallback lookup: `Payment.findOne({ gatewayPaymentId: charge.id, gateway: 'stripe' })` → `Refund.findOne({ paymentId, status: 'processing' })`
4. If not found: log warning, return `{ status: 'skipped' }` (unknown refund; gateway-initiated)
5. If found with `status === 'completed'`: return `{ status: 'completed' }` (idempotent no-op)
6. If found with `status === 'processing'`: atomic transition inside transaction:
   ```ts
   Refund.findOneAndUpdate(
     { _id: refund._id, status: 'processing' },
     { $set: { status: 'completed', processedAt: now, gatewayRefundStatus: 'succeeded', reconciledAt: now, webhookEventId } },
     { session, new: true }
   )
   ```
   Update Payment status: `REFUNDED` or `PARTIALLY_REFUNDED`
   Emit auditLog: `REFUND_WEBHOOK_RECONCILED`
7. If found with `status === 'requested'` or `'failed'`: log anomaly, return `{ status: 'anomaly' }`

Logic for `refund.failed` (Stripe):
1. Extract `gatewayRefundId` from event data
2. Same lookup chain
3. If `status === 'processing'`: atomic `processing → failed`
4. If `status === 'completed'`: log critical anomaly (money never moved but DB says completed)
5. Emit auditLog: `REFUND_WEBHOOK_FAILED`

**New method B: `PaymentService.reconcileRazorpayRefundWebhook()`**

Signature:
```ts
static async reconcileRazorpayRefundWebhook(
  refundEntity: { id: string; payment_id: string; status: string; amount: number },
  eventType: string,
  webhookEventId: string
): Promise<{ status: 'completed' | 'failed' | 'anomaly' | 'skipped'; refundId?: string }>
```

Logic for `refund.processed`:
1. `gatewayRefundId = refundEntity.id` (= `rfnd_...`)
2. Primary lookup: `Refund.findOne({ gatewayRefundId })`
3. Fallback: `Payment.findOne({ gatewayPaymentId: refundEntity.payment_id, gateway: 'razorpay' })` → `Refund.findOne({ paymentId, status: 'processing' })`
4. Same state-machine transitions as Stripe (above)

Logic for `refund.failed`:
- Same as Stripe refund.failed

**Transaction safety:**
Both methods wrap the `findOneAndUpdate` + Payment update in `runInTransaction()`.
The `findOneAndUpdate({ status: 'processing' })` conditional ensures exactly-once semantics.
If the transaction fails, the Refund remains `processing`, the webhook returns 500,
gateway retries, and the handler runs again — safely.

**Idempotency:**
- If Refund is already `completed` when webhook arrives: return `completed` no-op.
- If WebhookEvent is already `success`: controller short-circuits before calling the handler.
- Combined: a webhook processed N times produces identical final state.

---

### 3. `apps/server/src/controllers/public/payment.controller.ts` [MODIFY]

**Why:** Route the 5 new refund event types (RFND-F04-A, RFND-F04-B).

**Stripe controller changes (stripeWebhook):**

Add to the event parsing section (before the `if (event.type === 'payment_intent.succeeded')` block):

```ts
if (event.type === 'payment_intent.succeeded') {
  // ... existing
} else if (
  event.type === 'charge.refunded' ||
  event.type === 'refund.updated' ||
  event.type === 'refund.failed'
) {
  const charge = event.data.object as any;
  const result = await PaymentService.reconcileStripeRefundWebhook(
    charge,
    event.id,
    event.type
  );
  // webhookEvent.bookingId not set for refund events (no booking reference needed)
  if (result.status === 'anomaly') {
    logger.warn({ eventId: event.id, eventType: event.type, result }, 'Stripe refund webhook anomaly — logged, not failing webhook');
    // Do NOT throw — anomalies are logged but webhook is acknowledged to prevent infinite retry
  }
}
```

Note: `refund.updated` is mapped to the same handler as `charge.refunded` since both carry
refund status information and may represent a refund becoming `succeeded`.

**Razorpay controller changes (razorpayWebhook):**

Add refund entity extraction alongside the existing payment entity extraction:

```ts
// Existing:
razorpayPaymentId = body.payload?.payment?.entity?.id;
razorpayOrderId = body.payload?.payment?.entity?.order_id;
// New:
let razorpayRefundId: string | undefined;
let razorpayRefundPaymentId: string | undefined;
razorpayRefundId = body.payload?.refund?.entity?.id;
razorpayRefundPaymentId = body.payload?.refund?.entity?.payment_id;
```

Add refund event routing in the processing block:

```ts
if (razorpayOrderId && razorpayPaymentId) {
  // ... existing payment routing
} else if (razorpayRefundId && (eventType === 'refund.processed' || eventType === 'refund.failed')) {
  const refundEntity = body.payload?.refund?.entity;
  result = await PaymentService.reconcileRazorpayRefundWebhook(
    refundEntity,
    eventType,
    eventId
  );
  if (result.status === 'anomaly') {
    logger.warn({ eventId, eventType, result }, 'Razorpay refund webhook anomaly — logged, not failing webhook');
  }
} else {
  // existing: ack without processing
}
```

---

### 4. `apps/server/src/services/admin/refund.service.test.ts` [MODIFY]

**Why:** Existing refund tests must continue passing. No changes to them.
The reconciliation service methods are on `PaymentService`, not `refund.service`.
Tests for reconciliation handlers go in a new test file.

**Actually:** Add reconciliation tests to a new file:

---

### 5. `apps/server/src/controllers/public/payment.controller.webhook.test.ts` [MODIFY]

**Why:** Add tests covering the 5 new refund webhook routing cases.

Tests to add (Stripe):
- `charge.refunded` routes to `PaymentService.reconcileStripeRefundWebhook`
- `refund.updated` routes to `PaymentService.reconcileStripeRefundWebhook`
- `refund.failed` routes to `PaymentService.reconcileStripeRefundWebhook`
- `charge.refunded` with anomaly result logs warning but returns 200
- Unknown event type still falls through to no-op success (regression test)

Tests to add (Razorpay):
- `refund.processed` routes to `PaymentService.reconcileRazorpayRefundWebhook`
- `refund.failed` routes to `PaymentService.reconcileRazorpayRefundWebhook`
- Payload with no refund entity falls through to no-op (regression test)

---

### 6. `apps/server/src/services/public/payment.service.refund-webhook.test.ts` [NEW]

**Why:** Unit tests for the two new reconciliation methods.

Tests for `reconcileStripeRefundWebhook`:
- `processing → completed` on `charge.refunded` (happy path)
- `completed → completed` no-op (idempotent retry)
- `requested → anomaly` (log anomaly, no mutation)
- `failed → anomaly` on `charge.refunded`
- `processing → failed` on `refund.failed` (happy path)
- `completed → anomaly` on `refund.failed` (critical — money gone)
- Refund not found by gatewayRefundId → fallback by paymentId+processing
- Refund not found by either → skipped

Tests for `reconcileRazorpayRefundWebhook`:
- `processing → completed` on `refund.processed` (happy path)
- `completed → completed` no-op (idempotent retry)
- `processing → failed` on `refund.failed` (happy path)
- `completed → anomaly` on `refund.failed`
- Refund not found → skipped

Crash-window test:
- Refund has `gatewayRefundId` set (Phase 2 partially wrote it) → found by primary lookup → completed
- Refund has no `gatewayRefundId` set (Phase 2 crashed before assignment) → found by fallback → completed

---

## Verification Plan

### Automated
```bash
pnpm test
pnpm type-check
pnpm build
```

### Manual Verification — Crash Window Scenario

Verify that the following scenario produces `completed` (not `requested`):

1. Create mock Refund with `status: 'processing'`, `gatewayRefundId: 're_test_xyz'`
2. Call `reconcileStripeRefundWebhook({ id: 'ch_test', refunds: { data: [{ id: 're_test_xyz', status: 'succeeded' }] } }, ...)`
3. Assert: Refund status = `completed`, `reconciledAt` set, `gatewayRefundStatus = 'succeeded'`
4. Call same method again (retry simulation)
5. Assert: Refund status still = `completed`, no error

### Manual Verification — Anomaly Logging

Verify that `refund.failed` on an already-`completed` refund:
1. Logs a critical-level warning
2. Returns `{ status: 'anomaly' }`
3. Webhook controller returns 200 (not 500) — no gateway retry storm
4. Refund status remains `completed` — no mutation

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| 1 | Stripe `charge.refunded` routed to reconciliation handler |
| 2 | Stripe `refund.updated` routed to reconciliation handler |
| 3 | Stripe `refund.failed` routed to reconciliation handler |
| 4 | Razorpay `refund.processed` routed to reconciliation handler |
| 5 | Razorpay `refund.failed` routed to reconciliation handler |
| 6 | `processing → completed` transition exists and is transaction-safe |
| 7 | `processing → failed` transition exists and is transaction-safe |
| 8 | `completed` on second delivery is no-op (idempotent) |
| 9 | `gatewayRefundId` sparse index added |
| 10 | 3 reconciliation fields added to Refund schema |
| 11 | Crash-window recovery test passes |
| 12 | No regression to REFUND-002 tests |
| 13 | `pnpm test` passes |
| 14 | `pnpm type-check` passes |
| 15 | `pnpm build` passes |

---

## Rollback Plan

All changes are additive:
- Schema fields: removing them is a non-breaking migration
- Index: `db.refunds.dropIndex('idx_refund_gateway_refund_id')` — safe, no data loss
- Controller branches: removing the new `else if` blocks restores prior behavior exactly
- New service methods: removing them restores prior behavior exactly

If the branch must be reverted: `git revert` or `git checkout develop -- <files>`.

---

## Out of Scope (Do NOT include in this PR)

- RFND-F03: Audit trail hardening
- RFND-F05: Auto-recovery amount bug
- RFND-F06: Currency inheritance
- RFND-F07: Enum cleanup
- RFND-F08: Manual override UI
- Watchdog timeout threshold changes
- `processRefund` Phase 1/2/3/4 changes
- Admin refund API changes

---

## Waiting for Approval

This plan is submitted for developer review.

Required before implementation begins:
1. Developer explicitly approves the exact files to edit
2. Developer approves the branch name: `refactor/refund-webhook-reconciliation`
3. Developer approves the commit scope

DO NOT edit files until approval is received.
