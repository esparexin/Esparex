# REFUND-003-FINDINGS.md
## Refund Webhook Reconciliation — Findings

**Audit date:** 2026-06-20
**Branch:** develop

---

## RFND-F04-A: No Refund Webhook Handlers (Stripe)

**Finding ID:** RFND-F04-A
**Severity:** Critical
**Risk:** Gateway refund state can permanently diverge from database state.

**Evidence:**
- E001: Stripe webhook handler only processes `payment_intent.succeeded`
- E003: Zero matches for `charge.refunded`, `refund.updated`, `refund.failed` in codebase
- payment.controller.ts line 156: single `if (event.type === 'payment_intent.succeeded')` block

**Affected Files:**
- `apps/server/src/controllers/public/payment.controller.ts` (lines 155–165)
- `apps/server/src/services/public/payment.service.ts`

**Impact:**
1. Stripe-initiated refunds (dashboard, fraud rules, disputes) are never recorded in the database.
2. If `processRefund` runs and Stripe completes the refund, then a `charge.refunded` event arrives — it is silently marked `success` with no database update.
3. A `refund.failed` event (Stripe failed to process the refund asynchronously) is never detected. Database remains `completed` while money was never returned.

**Recommended Remediation:**
Add handlers for:
- `charge.refunded`: look up Refund by `gatewayRefundId`, mark completed if not already
- `refund.updated`: reconcile status if Stripe changes refund state (e.g., failed)
- `refund.failed`: mark Refund as failed, alert admin, trigger retry

---

## RFND-F04-B: No Refund Webhook Handlers (Razorpay)

**Finding ID:** RFND-F04-B
**Severity:** Critical
**Risk:** Same gateway divergence as F04-A.

**Evidence:**
- E002: `confirmFromWebhook()` only matches `payment.captured`, `payment.authorized`, `payment.failed`
- E003: Zero matches for `refund.processed`, `refund.failed` in codebase
- payment.service.ts lines 680–685: unmatched eventTypes return `{ status: 'skipped' }` silently

**Affected Files:**
- `apps/server/src/services/public/payment.service.ts` (lines 607–685)
- `apps/server/src/controllers/public/payment.controller.ts` (lines 334–385)

**Impact:**
Same as F04-A for Razorpay gateway. `refund.processed` (Razorpay's confirmation that a refund reached the customer's account) is never reconciled.

**Recommended Remediation:**
Add handlers for:
- `refund.processed`: mark Refund as completed, update Payment status
- `refund.failed`: mark Refund as failed, alert admin

---

## RFND-F04-C: Crash Window Between Phase 2 and Phase 3 Creates Duplicate Refund Risk

**Finding ID:** RFND-F04-C
**Severity:** High
**Risk:** Customer receives two refunds; financial loss.

**Evidence:**
- E007: Phase 2 (gateway call) succeeds → crash → Phase 3 (DB commit) never runs
- E005: Watchdog resets `processing → requested` after 15 minutes
- E004: `requested` state is eligible for admin re-approval

**Scenario:**
1. Admin approves refund. Phase 1 commits: `requested → processing`.
2. Phase 2 executes: Stripe/Razorpay issues refund. Customer money returned.
3. Server crashes or Phase 3 MongoDB transaction fails (E008).
4. Database: refund remains `processing`.
5. Watchdog (15 min later): resets to `requested`.
6. Admin sees `requested` refund, re-approves.
7. Phase 2 executes again: second refund issued to customer.

**No safeguard exists** to detect that the gateway already completed this refund.

**Affected Files:**
- `apps/server/src/services/admin/refund.service.ts` (lines 432–545)
- `apps/server/src/services/consistency.service.ts` (lines 900–934)

**Recommended Remediation:**
Before issuing a gateway refund call in Phase 2, query the gateway API to check
whether a refund with the same idempotency key already exists. If it does, skip
the gateway call and proceed directly to Phase 3 finalization. This closes the
crash-window duplicate risk without requiring webhook handlers.

Alternatively (preferred): implement `charge.refunded` / `refund.processed` webhook
handlers that atomically mark `processing → completed` when the gateway confirms,
preventing the watchdog from ever having to reset a legitimately completed refund.

---

## RFND-F04-D: gatewayRefundId Not Indexed

**Finding ID:** RFND-F04-D
**Severity:** Medium
**Risk:** Any future refund webhook handler will perform full collection scans.

**Evidence:**
- E011: `refund.schema.ts` line 35: `gatewayRefundId: String,` — no index
- E003: No current handlers use this field for lookup
- E004: State machine uses `_id` for all transitions

**Affected Files:**
- `apps/server/src/models/refund.schema.ts` (line 35)

**Impact:**
If webhook handlers are added to look up a Refund by `gatewayRefundId` (Stripe `re_...` or Razorpay `rfnd_...`), each lookup will scan the entire Refunds collection. At scale this will cause performance degradation and increased latency on the webhook endpoint.

**Recommended Remediation:**
Add a sparse index:
```ts
refundSchema.index({ gatewayRefundId: 1 }, { sparse: true, name: 'idx_refund_gateway_refund_id' });
```

---

## RFND-F04-E: No Gateway Reconciliation Fields on Refund Schema

**Finding ID:** RFND-F04-E
**Severity:** Medium
**Risk:** No audit trail linking a database refund to its gateway confirmation.

**Evidence:**
- E014: Refund schema has no `gatewayRefundStatus`, `reconciledAt`, `webhookEventId`
- E007/E008: Phase 3 failure leaves no record of gateway outcome in DB

**Affected Files:**
- `apps/server/src/models/refund.schema.ts`

**Impact:**
When a refund is `completed` in the database, there is no way to verify from the
database record alone whether the gateway actually processed it, or whether it was
marked complete via manual override. No reconciliation audit is possible.

**Recommended Remediation:**
Add optional fields:
- `gatewayRefundStatus: string` — authoritative state from gateway webhook
- `reconciledAt: Date` — when webhook confirmed the refund
- `webhookEventId: string` — link to the WebhookEvent that finalized the refund

---

## RFND-F04-F: Watchdog Resets Legitimately Processing Refunds

**Finding ID:** RFND-F04-F
**Severity:** Medium
**Risk:** Watchdog incorrectly resets a refund that is still processing normally.

**Evidence:**
- E005: Threshold is 15 minutes from `updatedAt`
- E007: Phase 2 (Razorpay axios call) has no explicit timeout set in refund.service.ts
- A slow gateway response could hold the refund in `processing` for >15 minutes legitimately

**Affected Files:**
- `apps/server/src/services/consistency.service.ts` (lines 900–934)
- `apps/server/src/services/admin/refund.service.ts` (lines 452–472)

**Impact:**
Watchdog resets refund to `requested` while admin is still waiting for gateway
response. Gateway call completes. DB and gateway are now diverged: DB says
`requested`, gateway has issued refund.

**Recommended Remediation:**
Add explicit `AbortSignal` timeout to the Razorpay axios call and Stripe SDK call
so Phase 2 cannot run longer than, say, 5 minutes. This guarantees the 15-minute
watchdog threshold is always a true indicator of a stuck process, not a slow one.

---

## R003 Required Questions — Summary

### R003-A: Which refund webhook events are currently handled?

**NONE.** No refund webhook event is handled by either Stripe or Razorpay webhook endpoints.

| Event | Gateway | Handled | Handler | Final Action |
|---|---|---|---|---|
| charge.refunded | Stripe | NO | — | Silent success (no processing) |
| refund.updated | Stripe | NO | — | Silent success (no processing) |
| refund.failed | Stripe | NO | — | Silent success (no processing) |
| refund.processed | Razorpay | NO | — | skipped (debug log only) |
| refund.failed | Razorpay | NO | — | skipped (debug log only) |

---

### R003-B: Which refund webhook events are NOT handled?

All of them. See R003-A.

---

### R003-C: Can gateway refund success occur without database reconciliation?

**YES.** Evidence: E007, E008.

Two scenarios:
1. Server crash between Phase 2 (gateway success) and Phase 3 (DB commit)
2. Stripe/Razorpay sends `charge.refunded`/`refund.processed` confirming async refund — ignored

---

### R003-D: Can gateway refund failure occur without database reconciliation?

**YES.** Evidence: E001, E002, RFND-F04-A, RFND-F04-B.

If Stripe sends `refund.failed` after `processRefund` marked DB as `completed`:
- Stripe: refund FAILED (money never returned)
- Database: status = `completed`
- Customer: never receives money back

No detection mechanism exists.

---

### R003-E: Are webhook events idempotent?

**Partially.** The WebhookEvent deduplication (E006) correctly prevents duplicate processing
of the same event delivery. The mechanism works for handled events. Since refund webhook
events are not handled, this idempotency is irrelevant to the refund domain.

For future refund webhook handlers, the existing WebhookEvent infrastructure provides
the correct idempotency scaffold — it just needs to be used.

---

### R003-F: Can webhook retries repair a crashed refund workflow?

**NO.** Evidence: E003, E007.

Gateway retries a webhook after server crash. The webhook is received, deduplicated
(or re-processed if stale), and falls through to `skipped` for refund events.
No repair occurs. The database remains in `processing` until the watchdog fires.

---

### R003-G: Can webhook processing create duplicate refunds?

Webhook processing cannot create duplicates because no refund webhook handler
exists to drive any state transition. The risk of duplicate refunds comes from
the crash-window scenario (RFND-F04-C) driven by the watchdog + admin re-approval,
not from webhook processing itself.

---

### R003-H: Current state machine evaluation

| Transition | Safe? | Evidence |
|---|---|---|
| requested → processing | YES (atomic claim) | REFUND-002 |
| processing → completed | Partially (Phase 3 can fail after gateway success) | E007, E008 |
| processing → failed (gateway rejected) | YES (Phase 4 catch) | refund.service.ts:536-545 |
| completed → completed (idempotent) | N/A (no webhook path drives this) | E003 |
| failed → failed (idempotent) | N/A (no webhook path drives this) | E003 |
| processing → requested (crash recovery) | Creates duplicate risk | E005, E007, RFND-F04-C |

The state machine is incomplete. It has no webhook-driven completion path, making
`processing → completed` dependent solely on the server surviving Phase 3.

