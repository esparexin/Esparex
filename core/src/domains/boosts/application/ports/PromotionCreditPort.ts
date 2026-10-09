import type { ClientSession } from 'mongoose';

/** Wallet credit pools that can fund a promotion. */
export type PromotionCreditType = 'boostCredits' | 'spotlightCredits';

export interface DebitPromotionCreditParams {
    userId: string;
    creditType: PromotionCreditType;
    /** The unified flow always debits exactly 1 credit per promotion. */
    amount?: number;
    reason: string;
    metadata?: Record<string, unknown>;
    session?: ClientSession;
}

/**
 * Credit-debit port owned by the payments domain (DECISION-GATE §3, P0-1).
 * The boosts domain depends on this port — never on payments internals.
 * Implemented by `payments/application/PromotionCreditPortAdapter.ts`.
 */
export interface PromotionCreditPort {
    debitPromotionCredit(params: DebitPromotionCreditParams): Promise<void>;
}
