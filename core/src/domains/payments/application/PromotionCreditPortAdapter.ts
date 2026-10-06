/**
 * Payments-owned implementation of the boosts `PromotionCreditPort` (P0-1 consolidation).
 *
 * Survivor debit semantics (DECISION-GATE §1 P0-1), extracted from the retired
 * `PromotionService.applyBoost/applySpotlight` (core/src/domains/payments/application/PromotionService.ts):
 * entitlement-first with wallet-projection fallback, now ordered FEFO and routed
 * through the entitlements-owned wallet write API:
 *   1. Try each entitlement type FEFO (PUSH_TO_TOP for boostCredits;
 *      SPOTLIGHT_CAT then SPOTLIGHT_HP for spotlightCredits). A live pack alone
 *      suffices — the wallet projection is decremented best-effort, clamped at 0.
 *   2. Otherwise fall back to the canonical wallet debit, which enforces the
 *      wallet balance, syncs the entitlement ledger FEFO, and writes the audit record.
 */
import type { ClientSession } from 'mongoose';
import UserWallet from '../../../models/UserWallet';
import type {
    PromotionCreditPort,
    DebitPromotionCreditParams,
    PromotionCreditType,
} from '../../boosts/application/ports/PromotionCreditPort';
import { debit } from './WalletService';
import { FEFOEntitlementConsumptionEngine } from '../../entitlements/application/FEFOEntitlementConsumptionEngine';
import { adjustWalletCredits } from '../../entitlements/application/EntitlementWalletWriter';
import type { EntitlementType } from '@esparex/contracts';

const ENTITLEMENT_TYPES: Record<PromotionCreditType, EntitlementType[]> = {
    boostCredits: ['PUSH_TO_TOP'],
    spotlightCredits: ['SPOTLIGHT_CAT', 'SPOTLIGHT_HP'],
};

export const paymentsPromotionCreditPort: PromotionCreditPort = {
    async debitPromotionCredit({
        userId,
        creditType,
        amount = 1,
        reason,
        metadata,
        session,
    }: DebitPromotionCreditParams): Promise<void> {
        // Leg 1 — entitlement-first (retired flow A semantics): a live entitlement
        // pack alone funds the promotion; the wallet projection follows, clamped at 0.
        for (const entitlementType of ENTITLEMENT_TYPES[creditType]) {
            const consumed = await FEFOEntitlementConsumptionEngine.consumeFEFO({
                userId,
                type: entitlementType,
                amount,
                reason,
                session: session as ClientSession | undefined,
            });
            if (consumed.success) {
                const wallet = await UserWallet.findOne({ userId })
                    .session(session ?? null)
                    .lean();
                if (wallet && Number(wallet[creditType] || 0) > 0) {
                    await adjustWalletCredits({
                        userId,
                        delta: { [creditType]: -amount } as Record<PromotionCreditType, number>,
                        session,
                    });
                }
                return;
            }
        }

        // Leg 2 — wallet fallback: canonical debit enforces the wallet balance,
        // syncs the entitlement ledger FEFO, and records the audit transaction.
        await debit({
            userId,
            amount: { [creditType]: amount },
            reason,
            metadata,
            session,
        });
    },
};
