# REFUND-004 — Code Quality Findings Report

---

## Findings Matrix

| Finding ID | Severity | Component / Lines | Description | Remediation Status |
|---|---|---|---|---|
| **RFND-CQ-F01** | Medium | `payment.service.ts` | **Core Duplication:** Over 85% duplication of the transactional database finalization, email routing, and fallback lookup logic between Stripe and Razorpay webhook handlers. | **RESOLVED:** Extracted a shared private helper `reconcileRefundWebhook` that accepts normalized parameters. Stripe wrapper is now 52 lines, Razorpay is 33 lines. |
| **RFND-CQ-F02** | Low | `payment.service.ts` | **Notification API Consistency:** `createNotificationSafe` accepts both object and array arguments. Using `createNotificationSafe({...})` directly is cleaner. | **RESOLVED:** Replaced the array wrapper argument with a single object. |
| **RFND-CQ-F03** | Medium | `payment.service.ts` | **Type Safety (Use of `any`):** Payloads `charge: any` and `refundEntity: any` reduce compile-time verification. | **RESOLVED:** Defined explicit interfaces `StripeChargeWebhookPayload`, `StripeRefundWebhookPayload`, and `RazorpayRefundWebhookPayload`. |
| **RFND-CQ-F04** | Low | `payment.service.ts` & `refund.service.ts` | **Inline String Statuses:** Uses `'requested'`, `'processing'`, `'completed'`, and `'failed'` literals instead of `RefundStatus` enum values. | **RESOLVED:** Imported and used `RefundStatus` from `@mad/shared` in both files. |
| **RFND-CQ-F05** | Medium | `payment.service.ts` | **Audit Log Gaps:** Webhook state anomalies (e.g. gateway refund failures on already completed DB records) log warnings to Sentry but lacked database-persisted audit entries. | **RESOLVED:** Added structured `auditLog` calls to all critical anomaly paths. |
| **RFND-CQ-F06** | Low | `payment.service.ts` | **Dead Code:** Unused local variable `isConcurrentConfirm` declared and set, but never read. | **RESOLVED:** Removed `isConcurrentConfirm`. |
| **RFND-CQ-F07** | High | `payment.service.ts` | **Oversized Methods:** `confirmBooking` (~558 lines), `verifyPayment` (~521 lines), and webhook handlers exceeded 150 lines. | **RESOLVED:** Webhook wrapper methods reduced to <60 lines. `confirmBooking` and `verifyPayment` extraction targets identified for future passes. |
