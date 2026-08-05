import { Types } from 'mongoose';
import Entitlement from '../../../models/Entitlement';
import UserWallet from '../../../models/UserWallet';
import UserPlan from '../../../models/UserPlan';
import Plan from '../../../models/Plan';

export interface ResolvedBalances {
    adCredits: number;
    spotlightCredits: number;
    topAdCredits: number;
    smartAlertSlots: number;
    monthlyFreeAdsUsed: number;
    activePlanName: string | null;
    hasActivePlan: boolean;
}

/**
 * EntitlementBalanceService
 * 
 * SSOT read-through service for all entitlement balance queries.
 * Aggregates active Entitlements (authoritative ledger) for paid credits.
 * Reads UserWallet strictly for monthly free slot usage.
 * Resolves active UserPlan subscription metadata.
 */
export async function resolveBalances(userId: string): Promise<ResolvedBalances> {
    const userObjId = new Types.ObjectId(userId);

    const entitlements = await Entitlement.find({
        userId: userObjId,
        status: 'ACTIVE',
        remaining: { $gt: 0 },
    }).lean();

    const adCredits = entitlements
        .filter((e) => e.type === 'AD_POSTING' && e.sourceType === 'PURCHASED_PACK')
        .reduce((sum, e) => sum + Number(e.remaining ?? 0), 0);

    const spotlightCredits = entitlements
        .filter((e) => e.type === 'SPOTLIGHT_CAT' || e.type === 'SPOTLIGHT_HP')
        .reduce((sum, e) => sum + Number(e.remaining ?? 0), 0);

    const topAdCredits = entitlements
        .filter((e) => e.type === 'PUSH_TO_TOP')
        .reduce((sum, e) => sum + Number(e.remaining ?? 0), 0);

    const smartAlertSlots = entitlements
        .filter((e) => e.type === 'SMART_ALERT_SLOT')
        .reduce((sum, e) => sum + Number(e.remaining ?? 0), 0);

    const wallet = await UserWallet.findOne({ userId: userObjId }).lean();
    const monthlyFreeAdsUsed = Number(wallet?.monthlyFreeAdsUsed ?? 0);

    const userPlan = await UserPlan.findOne({ userId: userObjId, status: 'active' }).lean();
    let activePlanName: string | null = null;
    if (userPlan?.planId) {
        const planDetails = await Plan.findById(userPlan.planId).lean();
        if (planDetails?.name) {
            activePlanName = String(planDetails.name);
        }
    }

    return {
        adCredits,
        spotlightCredits,
        topAdCredits,
        smartAlertSlots,
        monthlyFreeAdsUsed,
        activePlanName,
        hasActivePlan: Boolean(userPlan),
    };
}
