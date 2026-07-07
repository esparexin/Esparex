# REFUND-001 Findings & Vulnerabilities

This document details the vulnerabilities and inconsistencies discovered during the REFUND-001 Refund Integrity Guards Audit.

---

## RFND-F01 — Request-Level Idempotency Loophole
* **Severity**: Medium
* **Risk**: Duplicate Refund Requests. If the admin UI/client submits multiple concurrent creation requests without sending an explicit `idempotencyKey` field, `createRefund` creates a fresh random UUID (`manual-refund-${crypto.randomUUID()}`) which bypasses unique database constraints, creating duplicate refund records in the database.
* **Evidence**: [refund.service.ts:L150](../../../apps/server/src/services/admin/refund.service.ts#L150).
* **Affected Files**:
  - `apps/server/src/services/admin/refund.service.ts`
* **Recommended Remediation**: Require the client to send a client-generated UUID for `idempotencyKey` in the schema validator (`createRefundSchema`), or generate a deterministic key based on parameters (e.g. `manual-refund-${paymentId}-${amount}`) on the backend if none is supplied.

---

## RFND-F02 — Concurrent Approval Race Condition (Double-Refunding)
* **Severity**: Critical
* **Risk**: Multi-admin concurrency double-refunds. If two different refund requests exist for the same payment in `'requested'` status, and two admins concurrently approve them, both threads will query `Refund.find({ status: 'completed' })`. Since neither is completed yet, the checked balance is 0 for both. Both threads will call Stripe/Razorpay APIs concurrently, issuing duplicate refunds to the customer.
* **Evidence**: [refund.service.ts:L350-359](../../../apps/server/src/services/admin/refund.service.ts#L350-L359).
* **Affected Files**:
  - `apps/server/src/services/admin/refund.service.ts`
* **Recommended Remediation**: Acquire a row-lock or session transaction lock on the referenced `Payment` record inside `processRefund` before querying refund status or issuing gateway requests, and count `'processing'` refunds towards the cumulative cap.

---

## RFND-F03 — Absence of Audit Trail Actors (Untraceable Operations)
* **Severity**: High
* **Risk**: Internal Fraud / Lack of Accountability. The `Refund` schema does not have properties to record the actor ID (admin) who requested or approved the refund. Furthermore, all refund-related logs generated in the system hardcode the actor's ID to `'system'`.
* **Evidence**:
  - [refund.schema.ts:L3-19](../../../apps/server/src/models/refund.schema.ts#L3-L19) (No fields tracking admin IDs)
  - [refund.service.ts:L385](../../../apps/server/src/services/admin/refund.service.ts#L385) (Hardcoded actor: `system` in `REFUND_MANUAL_OVERRIDE`)
  - [booking.service.ts:L254](../../../apps/server/src/services/admin/booking.service.ts#L254) (Hardcoded actor: `system` in `BOOKING_REFUNDED`)
* **Affected Files**:
  - `apps/server/src/models/refund.schema.ts`
  - `apps/server/src/services/admin/refund.service.ts`
  - `apps/server/src/services/admin/booking.service.ts`
* **Recommended Remediation**: Add `requestedBy` and `processedBy` fields (referencing the Admin model) to the `Refund` schema. Modify controllers to pass the authenticated administrator's ID (`req.user.sub`) to the service methods.

---

## RFND-F04 — Missing Webhook Reconciliation (Gateway State Divergence)
* **Severity**: High
* **Risk**: Gateway-to-Database Desynchronization. Webhook endpoints completely ignore refund events (`charge.refunded` or `refund.processed`). If a refund succeeds or fails at the gateway directly or outside the API thread (e.g. server crash during DB update after gateway success), the database will permanently diverge.
* **Evidence**:
  - [payment.controller.ts:L156](../../../apps/server/src/controllers/public/payment.controller.ts#L156) (Only payment_intent.succeeded is matched)
  - [payment.controller.ts:L334](../../../apps/server/src/controllers/public/payment.controller.ts#L334) (Only payment captured/failed/authorized matches exist)
* **Affected Files**:
  - `apps/server/src/controllers/public/payment.controller.ts`
  - `apps/server/src/services/public/payment.service.ts`
* **Recommended Remediation**: Map refund events (`charge.refunded`, `refund.processed`, `refund.failed`) in webhook controller logic, and reconcile refund statuses in the database.

---

## RFND-F05 — Auto-Recovery Refund Mismatch Amount Bug
* **Severity**: High
* **Risk**: Stalled Auto-Recovery Refunds / Cash Leak. In `triggerRefundRequest` (which handles amount discrepancies and mismatch recoveries), the refund amount is set to `booking.totalAmount` instead of the actual `payment.amount`. If the customer paid less than the booking amount, approval is blocked by the cap check. If they paid more, the excess remains unrefunded.
* **Evidence**: [payment.service.ts:L1510](../../../apps/server/src/services/public/payment.service.ts#L1510).
* **Affected Files**:
  - `apps/server/src/services/public/payment.service.ts`
* **Recommended Remediation**: Set `amount: payment.amount` instead of `booking.totalAmount` in `triggerRefundRequest`.

---

## RFND-F06 — Currency Inconsistency (Defaults to INR)
* **Severity**: Medium
* **Risk**: Currency mismatch on refunds. The Mongoose `Refund` schema defaults `currency` to `'INR'`. During `createRefund`, the `currency` parameter is not mapped or passed. For manual refunds against payments made in non-INR currencies (e.g. USD), the refund is recorded in the DB as `'INR'`.
* **Evidence**:
  - [refund.schema.ts:L26](../../../apps/server/src/models/refund.schema.ts#L26)
  - [refund.service.ts:L215-225](../../../apps/server/src/services/admin/refund.service.ts#L215-L225)
* **Affected Files**:
  - `apps/server/src/services/admin/refund.service.ts`
* **Recommended Remediation**: Copy `currency: payment.currency` inside the Mongoose transaction in `createRefund`.

---

## RFND-F07 — Enum Status Mismatch (Rejected vs Failed)
* **Severity**: Low
* **Risk**: Semantic confusion. The shared package defines `RefundStatus.REJECTED = 'rejected'`, but the Mongoose schema status enum only contains `['requested', 'processing', 'completed', 'failed']`. Rejections map to `'failed'`.
* **Evidence**:
  - [refund.schema.ts:L30](../../../apps/server/src/models/refund.schema.ts#L30)
  - [refund.service.ts:L364](../../../apps/server/src/services/admin/refund.service.ts#L364)
  - [constants/index.ts:L219](../../../packages/shared/src/constants/index.ts#L219)
* **Affected Files**:
  - `apps/server/src/models/refund.schema.ts`
  - `apps/server/src/services/admin/refund.service.ts`
* **Recommended Remediation**: Add `'rejected'` to the Mongoose status enum, and update processRefund's reject path to use `'rejected'`.

---

## RFND-F08 — Unreachable Manual Override Feature
* **Severity**: Low
* **Risk**: Unreachable admin controls. The service implements `manualOverride`, but the Admin API client and Admin UI page do not expose or pass this flag, making it impossible to perform manual overrides via the UI.
* **Evidence**:
  - [booking.service.ts:L250](../../../apps/admin/src/lib/api/admin/booking.service.ts#L250)
  - [page.tsx:L39](../../../apps/admin/src/app/refunds/page.tsx#L39)
* **Affected Files**:
  - `apps/admin/src/app/refunds/page.tsx`
  - `apps/admin/src/lib/api/admin/booking.service.ts`
* **Recommended Remediation**: Add a "Manual Override" toggle and inputs in the admin refunds page modal, passing those flags to the REST API payload.
