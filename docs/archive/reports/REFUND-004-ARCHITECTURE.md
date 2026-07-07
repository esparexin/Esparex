# REFUND-004-ARCHITECTURE.md
## Refund Webhook Reconciliation — Architecture Review

**Task:** REFUND-004
**Date:** 2026-06-20
**Branch target:** refactor/refund-webhook-reconciliation (from develop)
**Mode:** Architecture Review only. No code changes made yet.

---

## Audit Answers

### R004-A — How are Stripe webhooks currently processed?

**Controller:** `apps/server/src/controllers/public/payment.controller.ts`
- `stripeWebhook()` function (lines 45–193)
- Verifies HMAC signature via `stripe.webhooks.constructEvent(rawBody, sig, secret)`
- Derives idempotency key: uses Stripe's native `event.id` (signature-bound, canonical)

**WebhookEvent flow:**
1. Check `WebhookEvent.findOne({ eventId: event.id })`
2. If `success` or `ignored` → return 200 immediately (no mutation)
3. If `failed` or stale `processing` (>5 min) → `findOneAndUpdate` to reclaim as `processing`
4. If not found → create new with `status: 'received'` then transition to `processing`
5. If concurrent create collision (E11000) → return 200 already processed

**Event routing (lines 155–165):**
```
if (event.type === 'payment_intent.succeeded') {
  PaymentService.confirmFromWebhookStripe(intent, event.id)
}
// All other types fall through to success
webhookEvent.status = 'success';
```

**Service:** `PaymentService.confirmFromWebhookStripe()` (payment.service.ts line 688)
- Looks up Payment by `gatewayOrderId = intent.id`, gateway = 'stripe'
- Security: validates bookingId, bookingReference, amount, currency from metadata
- Calls `this.confirmBooking(booking, payment)` on success

**Retry behavior:** Gateway retries on 5xx. On 200 already-processed, no retry.
Stale `processing` events (>5 min) are eligible for re-processing on next delivery.

---

### R004-B — How are Razorpay webhooks currently processed?

**Controller:** `apps/server/src/controllers/public/payment.controller.ts`
- `razorpayWebhook()` function (lines 195–388)
- Verifies HMAC signature against raw body
- Derives idempotency key: body-fingerprint = `'razorpay:' + HMAC-SHA256(rawBody, secret)`
  (NOT the `x-razorpay-event-id` header, which is unauthenticated)

**WebhookEvent flow:** Identical pattern to Stripe above.

**Event routing (lines 334–384):**
```
if (razorpayOrderId && razorpayPaymentId) {
  PaymentService.confirmFromWebhook(orderId, paymentId, eventType, ...)
} else {
  webhookEvent.status = 'success'; // events without order/payment ID — acknowledged
}
```

**Service:** `PaymentService.confirmFromWebhook()` (payment.service.ts line 537)
- Routes by `eventType`:
  - `payment.captured` / `payment.authorized` → `confirmBooking()`
  - `payment.failed` → `failPaymentAndReleaseInventory()`
  - anything else → `{ status: 'skipped' }`
- Lookup: `Payment.findOne({ gatewayOrderId: razorpayOrderId, gateway: 'razorpay' })`

**Retry behavior:** Identical to Stripe. Gateway retries on 5xx.
Razorpay refund events (`refund.processed`, `refund.failed`) carry a different payload
structure — they reference `body.payload.refund.entity` not `body.payload.payment.entity`.

---

### R004-C — How should refund webhooks locate Refund records?

**Available lookup strategies:**

| Strategy | Field | Indexed | Reliable | Notes |
|---|---|---|---|---|
| `gatewayRefundId` | `refund.gatewayRefundId` | No | Yes | Direct gateway ID; set in Phase 2 |
| `paymentId + status` | `refund.paymentId` | Yes | Partial | Multiple refunds per payment |
| Internal `_id` via metadata | gateway metadata | N/A | No | Not stored in gateway by MAD |

**Recommendation: `gatewayRefundId` with sparse index (RFND-F04-D)**

Stripe sends `charge.refunded` with `charge.refunds.data[0].id` = `re_...`.
Razorpay sends `refund.processed` with `payload.refund.entity.id` = `rfnd_...`.

Both IDs are set as `refund.gatewayRefundId` during Phase 2 of `processRefund`.

The lookup will be: `Refund.findOne({ gatewayRefundId: gatewayRefundId })`.

A sparse index must be added before adding the handler (RFND-F04-D prerequisite).

**Fallback strategy (for crash-window case where Phase 2 succeeded but DB lacks gatewayRefundId):**

If Phase 2 issued the gateway call but crashed before Phase 3, the Refund document may
have `gatewayRefundId` unset (the assignment in Phase 3 is what sets it). In this case:

Stripe: `charge.refunded` payload contains `charge.id` (= `gatewayPaymentId` on Payment).
Look up: `Payment.findOne({ gatewayPaymentId: chargeId })` → then `Refund.findOne({ paymentId, status: 'processing' })`.

Razorpay: `refund.processed` payload contains `entity.payment_id` (= `gatewayPaymentId`).
Look up: `Payment.findOne({ gatewayPaymentId: entity.payment_id, gateway: 'razorpay' })` → then `Refund.findOne({ paymentId, status: 'processing' })`.

**Primary lookup:** `gatewayRefundId` (with index).
**Fallback lookup:** `paymentId + status = processing` (when gatewayRefundId is absent).

---

### R004-D — How should reconciliation interact with REFUND-002?

REFUND-002 established the two-phase atomic claim:
- Phase 1: `requested → processing` (atomic, transaction-protected)
- Phase 2: Gateway call (no transaction)
- Phase 3: `processing → completed` (transaction)
- Phase 4 catch: `processing → requested` (failure rollback)

**Interaction rules for webhook reconciliation:**

| Webhook event | Refund status seen | Reconciliation action | REFUND-002 safe? |
|---|---|---|---|
| charge.refunded / refund.processed | `processing` | `processing → completed` ✅ | YES — extends Phase 3 |
| charge.refunded / refund.processed | `completed` | no-op (idempotent) ✅ | YES |
| charge.refunded / refund.processed | `requested` | log anomaly, no change ✅ | YES |
| charge.refunded / refund.processed | `failed` | log anomaly, no change ✅ | YES |
| refund.failed | `processing` | `processing → failed` ✅ | YES — extends Phase 4 |
| refund.failed | `completed` | log anomaly (money gone but gateway says failed) ✅ | YES |
| refund.failed | `requested` | log anomaly ✅ | YES |

**Critical design rule:** The reconciliation handler must use an atomic conditional update:
```ts
Refund.findOneAndUpdate(
  { _id: refund._id, status: 'processing' },
  { $set: { status: 'completed', ... } },
  { session, new: true }
)
```
This prevents a race where the webhook arrives simultaneously with a watchdog reset:
- Webhook claims the `processing` record atomically
- Watchdog's `{ status: 'processing' }` condition fails → no reset

REFUND-002's `requested → processing` atomic claim is not touched by reconciliation.
REFUND-002's cumulative balance check is not re-run on webhook (already validated at claim time).

---

### R004-E — Can webhook retries safely re-run?

**Answer: YES, if designed correctly.**

The WebhookEvent infrastructure already provides outer idempotency:
- First delivery: `WebhookEvent.create({ eventId, status: 'received' })`
- Duplicate delivery: `findOne({ eventId })` → `status === 'success'` → return 200, no re-processing
- Failed/stale processing: `findOneAndUpdate` to reclaim, then re-process

The reconciliation handler itself must also be inner-idempotent:
- On `charge.refunded` with Refund already `completed` → return `{ status: 'already_completed' }`, no mutation
- On `charge.refunded` with Refund at `processing` → atomic `findOneAndUpdate({ status: 'processing' })` → exactly-once semantics
- On `charge.refunded` with Refund not found by gatewayRefundId → fallback lookup by paymentId+processing → log if not found

The `findOneAndUpdate({ status: 'processing' })` conditional is the key idempotency mechanism.
A second delivery that arrives after the first completed will find status = 'completed' and be a no-op.

---

## Architecture Decision Summary

### Decision 1: Handler placement — payment.service.ts, not refund.service.ts

Webhook handlers live in `payment.service.ts` for consistency with existing pattern
(`confirmFromWebhook`, `confirmFromWebhookStripe`). The new methods will be:
- `PaymentService.reconcileStripeRefundWebhook(chargeOrRefundObj, webhookEventId)`
- `PaymentService.reconcileRazorpayRefundWebhook(refundEntity, paymentId, eventType, webhookEventId)`

Rationale: The controller dispatches to `PaymentService.*` for all webhook processing.
Adding to `refund.service.ts` would break this consistent dispatch pattern and require
the controller to import from a different module.

### Decision 2: Controller routing — extend existing if/else chain

In `stripeWebhook()`, add routing for:
```
} else if (event.type === 'charge.refunded') { ... }
} else if (event.type === 'refund.updated') { ... }
} else if (event.type === 'refund.failed') { ... }
```

In `razorpayWebhook()`, the current design routes by reading `eventType` and `razorpayOrderId`/`razorpayPaymentId`
from the payment entity path. Refund events use a different payload path:
`body.payload.refund.entity.*` instead of `body.payload.payment.entity.*`.

The Razorpay controller must be extended to also parse refund entity fields:
```ts
let razorpayRefundId: string | undefined;
let razorpayRefundPaymentId: string | undefined;
// ...
razorpayRefundId = body.payload?.refund?.entity?.id;
razorpayRefundPaymentId = body.payload?.refund?.entity?.payment_id;
```

### Decision 3: WebhookEvent — no changes needed

Existing `IWebhookEvent` schema already supports `refundId` implicitly through `rawPayload`.
We will store `refundId` in `webhookEvent.bookingId`-style by using `rawPayload` — no schema change.
The `WebhookEvent` already has `30d TTL`, `status`, `eventId` unique index — all sufficient.

Note: `IWebhookEvent` has no `refundId` field. We do NOT add one — keeping schema changes minimal.
We track refund ID in the service log and auditLog only.

### Decision 4: Refund schema additions (RFND-F04-D and RFND-F04-E)

Add to `refund.schema.ts`:
- Interface field: `gatewayRefundStatus?: string` — gateway's reported state
- Interface field: `reconciledAt?: Date` — when webhook reconciled
- Interface field: `webhookEventId?: string` — the webhookEvent.eventId that reconciled
- Schema field: `gatewayRefundStatus: { type: String }` 
- Schema field: `reconciledAt: { type: Date }`
- Schema field: `webhookEventId: { type: String }`
- New index: `{ gatewayRefundId: 1 }, { sparse: true }` (RFND-F04-D)

### Decision 5: Crash-window recovery behavior

**Before REFUND-004:** Gateway issues refund → crash → watchdog resets to `requested` → duplicate risk.

**After REFUND-004:**
1. Gateway issues refund (Phase 2).
2. Server crashes before Phase 3.
3. Refund remains `processing` in DB.
4. Gateway sends `charge.refunded` / `refund.processed` webhook.
5. Webhook handler looks up Refund by `gatewayRefundId` (or paymentId+processing fallback).
6. Finds Refund in `processing` state.
7. Atomically transitions `processing → completed`, sets `gatewayRefundStatus`, `reconciledAt`.
8. Watchdog 15-min threshold is no longer reached (status is now `completed`).
9. No duplicate refund possible.

**Key insight:** The webhook races the watchdog. If the webhook arrives before 15 minutes,
it wins and completes the refund correctly. If the watchdog fires first (unlikely for crash
recovery since gateways retry quickly), the refund goes back to `requested` — but by then
the `charge.refunded` webhook has already been received. The stale `processing` recovery
path in the WebhookEvent controller (>5 min) would then re-process the webhook, but the
refund is now `requested` — not `processing`. The reconciliation handler must treat
`requested` + gateway-completed as an anomaly (log it), because we cannot complete a
`requested` refund without the REFUND-002 Phase 1 atomic claim.

This residual race is a known limitation. To fully close it, the watchdog would need to
check the gateway API before resetting. That is out of scope for REFUND-004.

---

## Risk Assessment

| Change | Risk Level | Rationale |
|---|---|---|
| `refund.schema.ts` — add 3 fields + 1 index | Low | Additive only; no existing logic changes |
| `payment.controller.ts` — add 5 event type branches | Low | Existing branch/no-op pattern; no removal |
| `payment.service.ts` — add 2 new static methods | Low | New methods; no modification to existing |
| `payment.service.ts` — new Refund model usage | Low | Already imports Refund |
| Gateway lookup by `gatewayRefundId` before index exists | Medium | Must add index first in same PR |

**High-risk areas NOT touched:**
- `processRefund` Phase 1/2/3/4 logic — unchanged
- REFUND-002 atomic claim logic — unchanged
- Stripe/Razorpay payment confirmation flow — unchanged
- Auth/session/booking logic — unchanged

---

## Files to Change

| File | Change type | Risk |
|---|---|---|
| `apps/server/src/models/refund.schema.ts` | MODIFY — add 3 fields, 1 index | Low |
| `apps/server/src/controllers/public/payment.controller.ts` | MODIFY — add 5 event routing branches | Low |
| `apps/server/src/services/public/payment.service.ts` | MODIFY — add 2 reconciliation methods | Low |
| `apps/server/src/services/admin/refund.service.test.ts` | MODIFY — add reconciliation handler tests | Low |
| `apps/server/src/controllers/public/payment.controller.webhook.test.ts` | MODIFY — add refund webhook routing tests | Low |

**Files NOT changed:**
- `apps/server/src/services/admin/refund.service.ts` — Phase 1/2/3/4 untouched
- `apps/server/src/services/consistency.service.ts` — watchdog untouched
- All admin routes, auth, and booking logic — untouched

---

## Architecture Verdict

**Approved for Implementation Plan.**

The design reuses 100% of the existing webhook infrastructure (WebhookEvent, idempotency, controller pattern).
No new framework, no new queue, no new models beyond field additions.
The reconciliation is atomic, idempotent, and does not break REFUND-002 protections.
