# REFUND-001 Evidence Discovery

This document details the source-code evidence gathered during the REFUND-001 Refund Integrity Guards Audit.

---

## 1. File Inventory
The following files compose the refund domain and its boundaries:
1. **[refund.schema.ts](../../../apps/server/src/models/refund.schema.ts)**: Defines the `Refund` database schema, properties, and indexes.
2. **[refund.service.ts](../../../apps/server/src/services/admin/refund.service.ts)**: Handles the creation, validation, and execution of refunds (including gateway API integrations).
3. **[refund.controller.ts](../../../apps/server/src/controllers/admin/refund.controller.ts)**: Processes HTTP requests for admin refund CRUD operations.
4. **[refund.routes.ts](../../../apps/server/src/routes/admin/refund.routes.ts)**: Configures REST endpoints and maps RBAC rules.
5. **[payment.service.ts](../../../apps/server/src/services/public/payment.service.ts)**: Orchestrates payment intents, validation, webhook confirmation, and auto-refund triggers.
6. **[payment.controller.ts](../../../apps/server/src/controllers/public/payment.controller.ts)**: Handles Stripe and Razorpay webhook entry points and signatures validation.
7. **[booking.service.ts](../../../apps/server/src/services/admin/booking.service.ts)**: Manages admin cancellation side-effects and updates sold capacity.
8. **[admin-content.validation.ts](../../../apps/server/src/validations/admin-content.validation.ts)**: Details Zod validation schemas for administrative actions (`createRefundSchema`, `processRefundSchema`).
9. **[index.ts](../../../packages/shared/src/constants/index.ts)**: Defines enums (`RefundStatus`, `PaymentStatus`, `BookingStatus`).
10. **[page.tsx](../../../apps/admin/src/app/refunds/page.tsx)**: Portal interface to process pending refund requests.

---

## 2. Function Inventory
* **`createRefund(data)`** ([refund.service.ts:L135-242](../../../apps/server/src/services/admin/refund.service.ts#L135-L242)): Creates a pending refund request record. Checks boundaries inside a Mongoose transaction.
* **`processRefund(id, action, ...)`** ([refund.service.ts:L274-671](../../../apps/server/src/services/admin/refund.service.ts#L274-L671)): Approves or rejects a refund. Performs gateway refund calls and cancels bookings.
* **`triggerRefundRequest(booking, payment, ...)`** ([payment.service.ts:L1490-1534](../../../apps/server/src/services/public/payment.service.ts#L1490-L1534)): Generates an automated refund request document under mismatch or duplicate payment scenarios.
* **`cancelBooking(id, reason, ...)`** ([booking.service.ts:L353-529](../../../apps/server/src/services/admin/booking.service.ts#L353-L529)): Cancels bookings, decrements coupon usage, releases seats, and marks tickets as voided.
* **`stripeWebhook(req, res)`** ([payment.controller.ts:L45-193](../../../apps/server/src/controllers/public/payment.controller.ts#L45-L193)): Receives Stripe events and forwards `payment_intent.succeeded` to confirmation services.
* **`razorpayWebhook(req, res)`** ([payment.controller.ts:L195-388](../../../apps/server/src/controllers/public/payment.controller.ts#L195-L388)): Receives Razorpay events and forwards captured/authorized/failed payments.

---

## 3. Status Transition Matrix
The database model only supports `'requested' | 'processing' | 'completed' | 'failed'` status states ([refund.schema.ts:L30](../../../apps/server/src/models/refund.schema.ts#L30)).

| Source Status | Trigger Action | Target Status | Code Reference |
| :--- | :---: | :--- | :--- |
| *None* | `createRefund` | `requested` | [refund.service.ts:L220](../../../apps/server/src/services/admin/refund.service.ts#L220) |
| `requested` | `processRefund` claim | `processing` | [refund.service.ts:L285](../../../apps/server/src/services/admin/refund.service.ts#L285) |
| `processing` | `processRefund` (reject) | `failed` | [refund.service.ts:L364](../../../apps/server/src/services/admin/refund.service.ts#L364) |
| `processing` | `processRefund` (approve) | `completed` | [refund.service.ts:L455](../../../apps/server/src/services/admin/refund.service.ts#L455) |
| `processing` | Exception during processing | `requested` | [refund.service.ts:L510](../../../apps/server/src/services/admin/refund.service.ts#L510) |

---

## 4. Gateway Integration Map
* **Stripe**:
  - API call executed via `stripe.refunds.create(...)` ([refund.service.ts:L405](../../../apps/server/src/services/admin/refund.service.ts#L405)).
  - Uses `refund._id.toString()` as the Stripe Idempotency Key.
* **Razorpay**:
  - API call executed via direct Axios POST to `https://api.razorpay.com/v1/payments/${payment.gatewayPaymentId}/refund` ([refund.service.ts:L422-434](../../../apps/server/src/services/admin/refund.service.ts#L422-L434)).
  - Uses `X-Refund-Idempotency: refund._id.toString()` header.

---

## 5. Webhook Interaction Map
* **Stripe**: Handles `payment_intent.succeeded` event only. Webhooks for refund actions (e.g., `charge.refunded`) are unmapped and ignored.
* **Razorpay**: Handles `payment.captured`, `payment.authorized`, and `payment.failed` events only. Webhooks for refund statuses (e.g., `refund.processed` or `refund.failed`) are unmapped and ignored.

---

## 6. Queue/Background Job Interaction Map
* **Email Queue**: Post-commit triggers in `processRefund` enqueue email dispatches on `notification-queue` using `QueueService.enqueue` ([refund.service.ts:L621](../../../apps/server/src/services/admin/refund.service.ts#L621)):
  - Job IDs structured as `refund-${updated._id}-${Date.now()}`.
  - Job details include recipient email, HTML bodies generated via `fullRefundHtml()` or `partialRefundHtml()`, and types mapping (`NotificationType.FULL_REFUND` or `NotificationType.PARTIAL_REFUND`).
