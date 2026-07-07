# REFUND-003-EXECUTIVE-SUMMARY.md
## Refund Webhook Reconciliation — Executive Summary

**Audit date:** 2026-06-20
**Branch:** develop (clean)
**Mode:** Evidence Discovery only. No code changes made.

---

## Executive Questions

### 1. Are refund webhooks currently reconciled?

**NO.**

Neither Stripe nor Razorpay refund webhook events are handled anywhere in the codebase.

- Stripe: `charge.refunded`, `refund.updated`, `refund.failed` — all fall through to silent `success`
  acknowledgement with zero processing. Evidence: E001, E003.
- Razorpay: `refund.processed`, `refund.failed` — all return `status: 'skipped'` with a debug log.
  Evidence: E002, E003.

The system has a complete webhook infrastructure (WebhookEvent deduplication, stale processing
recovery, audit logging) built for payment events. None of it is wired to refund events.

---

### 2. Can gateway state diverge from database state?

**YES — in multiple scenarios.**

**Scenario A — Crash window (High risk):**
Admin approves refund → Phase 2 calls gateway → gateway issues refund (money sent to customer) →
server crashes → Phase 3 never commits → DB remains `processing` → watchdog resets to `requested` →
admin re-approves → gateway issues second refund → duplicate financial loss.
Evidence: E007, RFND-F04-C.

**Scenario B — Phase 3 DB failure (High risk):**
Gateway call succeeds → MongoDB transaction in Phase 3 fails (session timeout, network partition) →
Phase 4 catch resets to `requested` → admin re-approves → duplicate refund.
Evidence: E008, RFND-F04-C.

**Scenario C — Gateway async refund failure (Critical):**
Admin processes refund, DB marks `completed`. Stripe asynchronously rejects the refund
(card closed, bank error) and sends `refund.failed`. Webhook is received and silently
marked `success` by the controller. DB stays `completed`. Customer never receives money.
Evidence: E001, RFND-F04-A.

**Scenario D — Gateway-initiated refund (Critical):**
Stripe dashboard operator or fraud rule triggers a refund outside MAD's processRefund path.
`charge.refunded` webhook arrives. DB has no record. Webhook silently succeeds. Customer
receives refund with no corresponding record in the MAD database. No audit trail.
Evidence: E001, RFND-F04-A.

---

### 3. Can crashes leave refunds permanently stuck?

**YES — but with conditional duplicate refund risk as the recovery mechanism.**

The watchdog (`repairStuckProcessingRefunds`) prevents permanent `processing` lock-up by
resetting to `requested` after 15 minutes. However:

- This reset is the correct recovery for crash-before-gateway-call scenarios.
- For crash-after-gateway-call scenarios, this reset creates a duplicate refund risk
  because the gateway has already issued the refund.

The system cannot distinguish between these two cases. It has no gateway reconciliation
query to verify whether the refund was actually issued before resetting.

Evidence: E005, E007, E008, RFND-F04-F.

---

### 4. Are refund webhooks idempotent?

**The infrastructure supports idempotency; the handlers do not exist.**

The `WebhookEvent` collection with `eventId` unique index correctly deduplicates
repeat deliveries for handled events. The stale processing recovery (5-minute
threshold) allows safe replay of failed handlers.

If refund webhook handlers were added, this infrastructure would provide correct
idempotency protection with minimal additional work.

Evidence: E006.

---

### 5. Is refund processing production safe?

**PARTIALLY — with known financial integrity gaps.**

What works:
- Concurrent duplicate approval prevention (RFND-F02, implemented in REFUND-002)
- Idempotent refund document creation via idempotency key unique index
- Watchdog prevents permanent `processing` lockup
- Production mock payment guards prevent mock refunds in production

What does not work:
- No reconciliation of gateway-reported refund outcomes
- No detection of async refund failures from Stripe/Razorpay
- Crash window between Phase 2 and Phase 3 creates duplicate refund exposure
- No way to detect or prevent gateway-initiated refunds from bypassing MAD's records
- `gatewayRefundId` not indexed, making any future webhook lookup O(n)

---

### 6. What is the highest priority remediation?

**Priority 1 — RFND-F04-C: Close the crash-window duplicate refund risk**

Before calling the gateway in Phase 2, query the gateway API to check whether
a refund with the same idempotency key (refund._id) already exists:
- Stripe: `stripe.refunds.list({ payment_intent: ..., limit: 10 })`
- Razorpay: `GET /v1/payments/{paymentId}/refunds`

If a matching refund already exists at the gateway, skip the API call and proceed
directly to Phase 3 finalization. This prevents duplicate refunds regardless of
webhook handler status.

**Priority 2 — RFND-F04-A/B: Add refund webhook handlers**

Implement handlers for:
- `charge.refunded` (Stripe) → mark Refund `completed`, update Payment status
- `refund.failed` (Stripe) → mark Refund `failed`, alert admin
- `refund.processed` (Razorpay) → mark Refund `completed`, update Payment status
- `refund.failed` (Razorpay) → mark Refund `failed`, alert admin

This closes the gap where async gateway state changes are never reconciled.

**Priority 3 — RFND-F04-D: Index gatewayRefundId**

Required prerequisite for any webhook handler that looks up a Refund by gateway ID.

---

## Finding Summary

| Finding ID | Severity | Title |
|---|---|---|
| RFND-F04-A | Critical | No Stripe refund webhook handlers |
| RFND-F04-B | Critical | No Razorpay refund webhook handlers |
| RFND-F04-C | High | Crash window creates duplicate refund risk |
| RFND-F04-D | Medium | gatewayRefundId not indexed |
| RFND-F04-E | Medium | No gateway reconciliation fields on Refund schema |
| RFND-F04-F | Medium | Watchdog threshold may reset legitimately active refunds |

---

## Scope Boundary

This audit is EVIDENCE DISCOVERY only.

No code was modified.
No branches were created.
No remediation was implemented.
No speculative findings are included — all findings are backed by source-code evidence.

Next step requires explicit developer approval per MAD Governance Protocol:
Architecture Review → Implementation Plan → Manual Verification Gate → Implementation.

