# ADR-009: PaymentRefundService Decomposition

## Metadata
- **Status**: Implemented
- **Date**: 2026-07-06
- **Authors**: Antigravity AI Pair
- **Reviewers**: Repository Governance Owner
- **Decision Category**: Architecture | Payments
- **Related Documents**: [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Related GitHub Issues**: None
- **Related Pull Requests**: None

---

## Context
The `PaymentRefundService` monolith (`apps/server/src/services/public/payment-refund.service.ts`) grew to over 740 lines. It contains a mix of gateway-specific payload parsing, type mapping, and currency conversion logic for Stripe and Razorpay, combined with core refund business orchestration (such as MongoDB transaction scopes, database model updates, email dispatching, socket alerts, and audit logging).

## Problem Statement
Having provider-specific details (like Stripe's webhook structure vs. Razorpay's paise calculation rules) nested alongside general business logic creates tight coupling and high cognitive load. This complexity increases the risk of code churn and regression errors in refund processing. We need a modular architecture that cleanly separates gateway payload normalization from core orchestration.

## Decision
We will decouple `PaymentRefundService` by extracting gateway payload translation into focused sub-services:
1. **`StripeRefundService`** (`apps/server/src/services/public/payment/stripe-refund.service.ts`)
2. **`RazorpayRefundService`** (`apps/server/src/services/public/payment/razorpay-refund.service.ts`)

To avoid circular dependencies, the gateway services will not call `PaymentRefundService` directly. Instead, they will act as pure translators, converting webhook payloads into a unified internal representation:

```typescript
export interface ParsedRefundWebhook {
  gateway: 'stripe' | 'razorpay';
  gatewayPaymentId: string;
  gatewayRefundId: string;
  amountMajorUnits: number;
  gatewayStatus: 'succeeded' | 'failed';
  webhookEventId: string;
}

export type ParseRefundResult =
  | { status: 'skipped' }
  | { status: 'process'; data: ParsedRefundWebhook };
```

`PaymentRefundService` will remain the orchestrator, executing database transactions, status mappings, notifications, and cancellations based on the unified `ParsedRefundWebhook` output.

### Responsibility Matrix

| Responsibility | Stripe | Razorpay | Shared | Decoupled Location |
| :--- | :---: | :---: | :---: | :--- |
| Webhook payload structure validation | ✅ | ✅ | ❌ | Gateway Services |
| Provider status translation/mapping | ✅ | ✅ | ❌ | Gateway Services |
| Currency parsing (cents/paise to Major) | ✅ | ✅ | ❌ | Gateway Services |
| Logger warning/skipping decisions | ✅ | ✅ | ❌ | Gateway Services |
| Idempotency / DB duplicate checks | ❌ | ❌ | ✅ | `PaymentRefundService` |
| Serialization locking on payments | ❌ | ❌ | ✅ | `PaymentRefundService` |
| Database transaction boundaries | ❌ | ❌ | ✅ | `PaymentRefundService` |
| Booking cancellations & side-effects | ❌ | ❌ | ✅ | `PaymentRefundService` |
| Customer email enqueuing | ❌ | ❌ | ✅ | `PaymentRefundService` |
| Admin / Client socket alerts | ❌ | ❌ | ✅ | `PaymentRefundService` |

---

## Alternatives Considered

### Alternative A: Keep everything in one file
* **Pros**: Simple code location.
* **Cons**: Monolithic design, violates Single Responsibility Principle, and increases file size.

### Alternative B: Direct circular delegation
* **Pros**: Simple delegation structure.
* **Cons**: Circular imports (`PaymentRefundService` <-> `StripeRefundService`), which violates compiler hygiene guidelines.

---

## Consequences
- **Pros**: Clear separation of concerns, isolation of payment providers, zero circular dependencies, and a testable/pure translation layer.
- **Cons**: Introduce two new files and a shared type definition.

---

## Technical & Operational Impact

### Migration Strategy
This refactor will happen in five incremental, reviewable pull requests:
1. **Stage 1**: Discovery & ADR Creation (Committed under `docs/decisions/`).
2. **Stage 2**: Extract `StripeRefundService` translation helper.
3. **Stage 3**: Extract `RazorpayRefundService` translation helper.
4. **Stage 4**: Refactor `PaymentRefundService` to orchestrate using these helpers.
5. **Stage 5**: Architecture validation and cleanup.

### Testing Strategy
- Core test suite (`payment.service.test.ts` and `payment.service.refund-webhook.test.ts`) must run and pass.
- Public method signatures will remain identical to avoid regressions.

### Rollback Strategy
If any issues occur, revert the facade updates in `PaymentRefundService` and remove the new `payment/` subdirectory files.
