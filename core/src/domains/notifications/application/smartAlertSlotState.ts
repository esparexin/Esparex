import { PLATFORM_QUOTAS } from '@esparex/contracts';
import UserWallet from '../../../models/UserWallet';
import Entitlement from '../../../models/Entitlement';

export interface SmartAlertWalletSnapshot {
    smartAlertSlots?: unknown;
    monthlyFreeAlertsUsed?: unknown;
}

export interface SmartAlertSlotState {
    wallet: SmartAlertWalletSnapshot | null;
    activePaidSlots: number;
    freeAlertBase: number;
}

/**
 * Fetches the wallet + active SMART_ALERT_SLOT entitlements for a user and
 * computes the paid slot balance. Shared by SmartAlertMutationService and
 * SmartAlertQueryService (identical fetch + reduce block).
 */
export const fetchSmartAlertSlotState = async (userId: string): Promise<SmartAlertSlotState> => {
    const freeAlertBase = PLATFORM_QUOTAS.FREE_SMART_ALERT_LIMIT;
    const [wallet, rawEntitlements] = await Promise.all([
        UserWallet.findOne({ userId }).lean(),
        Entitlement.find({
            userId,
            type: 'SMART_ALERT_SLOT',
            status: 'ACTIVE',
            remaining: { $gt: 0 },
            $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }],
        }).lean(),
    ]);

    const entitlements = rawEntitlements as { remaining?: unknown }[];
    const activePaidSlots = entitlements.length > 0
        ? entitlements.reduce((acc, e) => acc + (typeof e.remaining === 'number' ? e.remaining : 0), 0)
        : Math.max(0, ((wallet?.smartAlertSlots as number | undefined) || freeAlertBase) - freeAlertBase);

    return {
        wallet: wallet as SmartAlertWalletSnapshot | null,
        activePaidSlots,
        freeAlertBase,
    };
};
