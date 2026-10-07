/**
 * Phase 3a (§5) — canonical payment-processing result contract.
 *
 * Relocated from `core/src/domains/payments/application/PaymentProcessingService.ts:17,28`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3). This is
 * the result contract of the payments-domain orchestration, consumed across
 * the core/backend boundary (jobs, workers, controllers).
 */
export type PaymentProcessResult = 'processed' | 'duplicate' | 'missing' | 'failed';

export interface ProcessPaymentResponse {
    result: PaymentProcessResult;
    transactionId?: string;
    invoiceId?: string;
    reason?: string;
}
