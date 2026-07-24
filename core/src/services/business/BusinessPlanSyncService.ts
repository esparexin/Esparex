import mongoose from 'mongoose';
import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import Ad from '../../models/Ad';
import { calculateUserPlan } from '../../domains/payments/application/PlanService';


import logger from '../../utils/logger';

type UserPlanWithPlanId = {
    planId: unknown;
    status?: string;
    endDate?: Date | null;
};

/**
 * BUSINESS PLAN SYNC SERVICE
 *
 * Internal helper responsible for keeping `Ad.sellerPriorityScore`
 * in sync with a seller's active business plan priority weight.
 *
 * Responsibilities:
 * - Resolve the seller's highest active plan priority via PlanEngine.
 * - Fall back to the Free default plan's priorityWeight (from DB)
 *   when no active business plan exists — never hardcodes a value.
 * - Write the resolved score to all seller's active/pending ads.
 *
 * Called by BusinessSubscriptionService on plan changes:
 * assignDefaultPlan, upgradePlan, renewPlan, expirePlan.
 *
 * Governance:
 * - Must never read or write business.isVerified.
 * - Must never touch wallet, transaction, or invoice records.
 */

/**
 * Resolves the free plan's priorityWeight as a safe fallback.
 * Queries the DB so Admin changes to the Free plan are honoured.
 */
async function resolveFreeplanPriority(): Promise<number> {
    try {
        const freePlan = await Plan.findOne({
            isDefault: true,
            userType: { $in: ['both', 'normal'] },
            active: true,
        })
            .select('features.priorityWeight')
            .lean();

        const weight = (freePlan as { features?: { priorityWeight?: number } } | null)
            ?.features?.priorityWeight;

        return typeof weight === 'number' && weight >= 1 ? weight : 1;
    } catch {
        return 1; // Safe minimum if DB is unavailable
    }
}

/**
 * Resolves and writes `sellerPriorityScore` to all active/pending ads
 * of the given seller based on their current active plans.
 *
 * @param userId - The seller's user ID (string or ObjectId).
 */
export async function syncPriorityScore(
    userId: string | mongoose.Types.ObjectId
): Promise<void> {
    const userIdStr = userId.toString();

    try {
        // 1. Fetch all active, non-expired UserPlan records for this seller
        const now = new Date();
        const activePlans = await UserPlan.find({
            userId: userIdStr,
            status: 'active',
            $or: [{ endDate: { $gte: now } }, { endDate: null }],
        })
            .populate('planId')
            .lean() as unknown as UserPlanWithPlanId[];

        const planDocs = activePlans
            .map((up) => up.planId)
            .filter(Boolean);

        // 2. Calculate the resolved priority score from active plans
        const permissions = calculateUserPlan(planDocs);
        let priorityScore = permissions.priorityScore;

        // 3. If no active plan grants a priority, fall back to Free plan weight
        if (!priorityScore || priorityScore < 1) {
            priorityScore = await resolveFreeplanPriority();
        }

        // 4. Clamp to valid range (1–10)
        const clampedScore = Math.min(10, Math.max(1, priorityScore));

        // 5. Write to all seller's active/pending ads
        await Ad.updateMany(
            {
                sellerId: new mongoose.Types.ObjectId(userIdStr),
                status: { $in: ['live', 'pending'] },
                isDeleted: { $ne: true },
            },
            { $set: { sellerPriorityScore: clampedScore } }
        );

        logger.debug('BusinessPlanSyncService: sellerPriorityScore synced', {
            userId: userIdStr,
            resolvedScore: clampedScore,
        });
    } catch (err) {
        logger.error('BusinessPlanSyncService: failed to sync sellerPriorityScore', {
            userId: userIdStr,
            error: err instanceof Error ? err.message : String(err),
        });
        // Non-fatal — do not rethrow. Sync failures degrade gracefully.
    }
}
