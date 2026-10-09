/**
 * Phase 3a (§5) — canonical payment-order creation payload.
 *
 * Relocated from
 * `apps/mobile/src/features/payment/application/mappers/CreatePaymentOrderMapper.ts:1`
 * (DECISION-GATE §5; evidence `areas/04-contract-ssot.md` Finding 3 — unique
 * API payload with no contract home). The mapper now imports this symbol.
 */
export interface CreatePaymentOrderPayload {
    planId: string;
}
