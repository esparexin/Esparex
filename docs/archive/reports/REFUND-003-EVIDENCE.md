# REFUND-003-EVIDENCE.md
## Refund Webhook Reconciliation — Evidence Discovery

**Branch at audit:** `develop`
**Working tree:** clean
**Audit date:** 2026-06-20

---

## E001 — Stripe Webhook Event Type Routing

**File:** `apps/server/src/controllers/public/payment.controller.ts` line 156

Only one branch exists in the Stripe handler body:

```
if (event.type === 'payment_intent.succeeded') { ... }
webhookEvent.status = 'success';  // all other types fall here
```

Only `payment_intent.succeeded` triggers processing. All other Stripe event types
(including `charge.refunded`, `refund.updated`, `refund.failed`) fall through to
immediate `success` acknowledgement with no processing.

---

## E002 — Razorpay Webhook Event Type Routing

**File:** `apps/server/src/services/public/payment.service.ts` lines 607, 648, 682–685

Three event types handled:
- `payment.captured` → confirmBooking()
- `payment.authorized` → confirmBooking()
- `payment.failed` → failPaymentAndReleaseInventory()

All other eventTypes (including `refund.processed`, `refund.failed`) hit:
```
logger.debug(..., 'PR-03: Razorpay webhook event type not actionable — acknowledging without processing')
return { status: 'skipped' };
```

---

## E003 — Zero Refund Webhook Handlers in Codebase

Search terms run across `apps/server/src/`:
- `charge.refunded` → 0 results
- `refund.updated` → 0 results
- `refund.created` → 0 results
- `refund.processed` → 0 results
- `refund.failed` → 0 results (only in error message strings inside refund.service.ts)

Confirmed: no refund-specific webhook event is handled anywhere in the server codebase.

---

## E004 — Refund State Machine

**File:** `apps/server/src/models/refund.schema.ts` lines 9, 29–33

States: requested | processing | completed | failed

State transitions found in source:

| Transition | File:Line | Trigger |
|---|---|---|
| requested → processing | refund.service.ts:293-296 | Admin approval Phase 1 atomic claim |
| processing → completed | refund.service.ts:488 | Phase 3 finalization |
| processing → requested (rollback) | refund.service.ts:540-541 | Phase 4 gateway/db failure catch |
| requested → failed | refund.service.ts:398-400 | Admin rejection |
| processing → requested (watchdog) | consistency.service.ts:910-912 | 15-min timeout |

No webhook-driven state transitions exist for any refund status.

---

## E005 — Stuck Processing Refund Watchdog

**File:** `apps/server/src/services/consistency.service.ts` lines 900–934

The watchdog:
1. Finds refunds with status='processing' and updatedAt <= now-15min
2. Resets them to 'requested'
3. Does NOT complete them

Critical gap: If gateway call succeeded but server crashed before Phase 3:
- Gateway: COMPLETED
- Database: processing (until watchdog fires)
- After watchdog: requested
- Admin re-approves → second gateway call → duplicate refund issued

---

## E006 — WebhookEvent Schema Idempotency

**File:** `apps/server/src/models/webhook-event.schema.ts` line 21

`eventId: { type: String, required: true, unique: true, index: true }`

- Stripe: eventId = Stripe's event.id (signature-verified, canonical)
- Razorpay: eventId = 'razorpay:' + HMAC-SHA256(rawBody, secret) (body-bound fingerprint)

Stale processing recovery: events in `processing` for >5 minutes are eligible for
retry by a new webhook delivery (controller lines 89–103).

This idempotency infrastructure works correctly for handled events but is never
exercised for refund events since none are handled.

---

## E007 — Phase 2/Phase 3 Crash Window

**File:** `apps/server/src/services/admin/refund.service.ts` lines 432–545

Sequence:
Phase 1 (transaction) commits → refund.status = 'processing'
Phase 2 (no transaction) → stripe.refunds.create() [CRASH WINDOW]
Phase 3 (transaction) → refund.status = 'completed'
Phase 4 (catch) → refund.status = 'requested'

If crash occurs between Phase 2 success and Phase 3 commit:
- Gateway state: REFUNDED
- DB state: processing → watchdog resets to requested
- Risk: admin re-approves → duplicate refund at gateway

---

## E008 — Phase 3 DB-Failure After Gateway Success

If Phase 3 runInTransaction throws after gateway succeeded:
- Gateway: COMPLETED
- DB: processing (Phase 3 aborted before commit)
- Phase 4 catch: resets to requested
- Risk: admin re-approves → duplicate refund

---

## E009 — Razorpay Idempotency Design

**File:** `apps/server/src/controllers/public/payment.controller.ts` lines 259–262

Body-fingerprint eventId is deterministic and replay-proof. Correct design.
However irrelevant to refunds since refund.processed/refund.failed are not handled.

---

## E010 — No Refund Logic in Workers

Workers directory: booking.worker.ts, consistency.worker.ts, email.worker.ts, pdf.worker.ts
Search for 'refund' in apps/server/src/workers/ → Zero matches.

No background worker reconciles refund state from gateway callbacks.

---

## E011 — gatewayRefundId Not Indexed

**File:** `apps/server/src/models/refund.schema.ts` line 35

`gatewayRefundId: String,` — no index.

If a refund webhook (charge.refunded, refund.updated) arrives with a gateway refund ID,
there is no efficient lookup path to find the corresponding MAD Refund record.

---

## E012 — Idempotency Key Protects Creation Only

**File:** `apps/server/src/models/refund.schema.ts` lines 63–73

Partial unique index on idempotencyKey prevents duplicate Refund document creation.
Does not prevent:
- A gateway completing a refund that the DB still shows as processing
- A webhook driving a duplicate completion (since no webhook handler exists)

---

## E013 — Watchdog Runs in Repair Cycle

**File:** `apps/server/src/services/consistency.service.ts` lines 1125–1155

repairStuckProcessingRefunds() is called in runRepairCycle() alongside all other
watchdog checks. It is the only automated mechanism touching stuck refunds.
It resets — it does not complete.

---

## E014 — No Reconciliation Fields on Refund Schema

**File:** `apps/server/src/models/refund.schema.ts`

Missing fields:
- gatewayRefundStatus (authoritative gateway state)
- refundWebhookProcessedAt
- reconciledAt
- webhookEventId (link from refund to triggering webhook event)

No mechanism records whether a gateway has confirmed or denied a refund.

---

## Evidence Summary

| ID | Category | Key Finding |
|---|---|---|
| E001 | Stripe routing | Only payment_intent.succeeded handled; refund events fall through to success |
| E002 | Razorpay routing | Only payment.captured/authorized/failed handled; refund events skipped silently |
| E003 | Search | Zero refund webhook event names in codebase |
| E004 | State machine | All transitions admin-driven only; no webhook path |
| E005 | Watchdog | Resets processing→requested at 15min; never completes |
| E006 | Idempotency | WebhookEvent dedup works; unused for refunds |
| E007 | Crash window | Phase 2 success + crash → processing stuck → reset → duplicate risk |
| E008 | Phase 3 fail | DB failure after gateway success → same duplicate risk path |
| E009 | Razorpay ID | Body fingerprint correct; irrelevant to unhandled refund events |
| E010 | Workers | Zero refund processing in any worker |
| E011 | Schema | gatewayRefundId unindexed; no lookup path |
| E012 | Idempotency | Protects document creation; not webhook-driven completion |
| E013 | Watchdog | Single automated mechanism; resets only |
| E014 | Schema | No gateway reconciliation fields on Refund |
