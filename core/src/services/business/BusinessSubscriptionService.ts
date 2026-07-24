import mongoose from 'mongoose';
import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import { syncPriorityScore } from './BusinessPlanSyncService';
import logger from '../../utils/logger';

/**
 * BUSINESS SUBSCRIPTION SERVICE
 *
 * Owns the full lifecycle of business subscription plans:
 * assign, upgrade, renew, expire.
 *
 * This service orchestrates existing primitives (UserPlan CRUD,
 * PlanEngine, BusinessPlanSyncService). It adds no new payment,
 * wallet, invoice, or gateway logic.
 *
 * Governance (binding):
 * - Must never read or write business.isVerified.
 * - Verification is a permanent trust record controlled only by
 *   explicit Admin actions. Subscription lifecycle events must
 *   never modify it.
 * - All plan selection is dynamic — never hardcode plan codes.
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

function daysFromNow(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Resolves the default business plan dynamically.
 * Admin controls which plan is the default via isDefault flag.
 */
async function resolveDefaultBusinessPlan() {
    return Plan.findOne({
        isDefault: true,
        userType: 'business',
        active: true,
    }).lean();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Assigns the default business plan to a user on business approval.
 *
 * Trigger: business approval (approveBusiness in adminBusiness service).
 * Identifies the default plan dynamically — Admin controls the default.
 *
 * @param userId - The business owner's user ID.
 */
export async function assignDefaultPlan(
    userId: string | mongoose.Types.ObjectId
): Promise<void> {
    const userIdStr = userId.toString();

    try {
        const defaultPlan = await resolveDefaultBusinessPlan();

        if (!defaultPlan) {
            logger.warn('BusinessSubscriptionService.assignDefaultPlan: no default business plan found', {
                userId: userIdStr,
            });
            return;
        }

        const now = new Date();
        const planId = (defaultPlan as { _id: mongoose.Types.ObjectId })._id;
        const durationDays = (defaultPlan as { durationDays?: number }).durationDays ?? 365;

        await UserPlan.findOneAndUpdate(
            { userId: userIdStr, planId },
            {
                $set: {
                    startDate: now,
                    endDate: daysFromNow(durationDays),
                    status: 'active',
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.debug('BusinessSubscriptionService.assignDefaultPlan: plan assigned', {
            userId: userIdStr,
            planCode: (defaultPlan as { code?: string }).code,
        });
    } catch (err) {
        logger.error('BusinessSubscriptionService.assignDefaultPlan: failed', {
            userId: userIdStr,
            error: err instanceof Error ? err.message : String(err),
        });
        // Non-fatal on approval — plan assignment does not block business go-live.
    }

    // Fire-and-forget: sync ad priority scores asynchronously
    setImmediate(() => {
        void syncPriorityScore(userIdStr);
    });
}

/**
 * Activates a purchased business plan after payment confirmation.
 *
 * Trigger: PaymentProcessingService post-payment hook (business plans only).
 * Does NOT handle wallet, transaction, or invoice logic — those remain in
 * PaymentProcessingService/WalletService.
 *
 * @param userId - The buyer's user ID.
 * @param planId - The purchased plan's ID.
 * @param durationDays - Plan validity period in days (from plan.durationDays).
 */
export async function upgradePlan(
    userId: string | mongoose.Types.ObjectId,
    planId: string | mongoose.Types.ObjectId,
    durationDays = 365
): Promise<void> {
    const userIdStr = userId.toString();
    const planObjId = new mongoose.Types.ObjectId(planId.toString());

    try {
        const now = new Date();

        await UserPlan.findOneAndUpdate(
            { userId: userIdStr, planId: planObjId },
            {
                $set: {
                    startDate: now,
                    endDate: daysFromNow(durationDays),
                    status: 'active',
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.debug('BusinessSubscriptionService.upgradePlan: plan activated', {
            userId: userIdStr,
            planId: planId.toString(),
        });
    } catch (err) {
        logger.error('BusinessSubscriptionService.upgradePlan: failed', {
            userId: userIdStr,
            planId: planId.toString(),
            error: err instanceof Error ? err.message : String(err),
        });
    }

    setImmediate(() => {
        void syncPriorityScore(userIdStr);
    });
}

/**
 * Extends the active business plan on renewal.
 *
 * Trigger: BusinessLifecycleService.renewBusiness().
 * Extends from current endDate (or now) by durationDays.
 *
 * @param userId - The seller's user ID.
 * @param planId - The plan being renewed.
 * @param durationDays - Days to extend (from plan.durationDays).
 */
export async function renewPlan(
    userId: string | mongoose.Types.ObjectId,
    planId: string | mongoose.Types.ObjectId,
    durationDays = 365
): Promise<void> {
    const userIdStr = userId.toString();
    const planObjId = new mongoose.Types.ObjectId(planId.toString());

    try {
        const existing = await UserPlan.findOne({
            userId: userIdStr,
            planId: planObjId,
            status: { $in: ['active', 'expired'] },
        }).lean();

        const baseDate =
            existing?.endDate && new Date(existing.endDate) > new Date()
                ? new Date(existing.endDate)
                : new Date();

        const newEndDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await UserPlan.findOneAndUpdate(
            { userId: userIdStr, planId: planObjId },
            {
                $set: {
                    startDate: new Date(),
                    endDate: newEndDate,
                    status: 'active',
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        logger.debug('BusinessSubscriptionService.renewPlan: plan renewed', {
            userId: userIdStr,
            planId: planId.toString(),
            newEndDate,
        });
    } catch (err) {
        logger.error('BusinessSubscriptionService.renewPlan: failed', {
            userId: userIdStr,
            planId: planId.toString(),
            error: err instanceof Error ? err.message : String(err),
        });
    }

    setImmediate(() => {
        void syncPriorityScore(userIdStr);
    });
}

/**
 * Expires all active business plans for a user when their business
 * subscription lapses.
 *
 * Trigger: BusinessLifecycleService.expireBusinesses().
 *
 * GOVERNANCE: This function must never modify business.isVerified.
 * Verification is a permanent trust record. The badge disappears because
 * no active plan grants businessBadge:true, not because isVerified changes.
 *
 * @param userId - The seller whose plans have lapsed.
 */
export async function expirePlan(
    userId: string | mongoose.Types.ObjectId
): Promise<void> {
    const userIdStr = userId.toString();

    try {
        // Identify business plan IDs for this user by joining Plan collection
        const activeUserPlans = await UserPlan.find({
            userId: userIdStr,
            status: 'active',
        })
            .populate<{ planId: { _id: mongoose.Types.ObjectId; userType?: string } }>('planId', 'userType')
            .lean();

        const businessPlanIds = activeUserPlans
            .filter((up) => (up.planId as { userType?: string })?.userType === 'business')
            .map((up) => (up.planId as { _id: mongoose.Types.ObjectId })._id);

        if (businessPlanIds.length === 0) {
            return;
        }

        await UserPlan.updateMany(
            {
                userId: userIdStr,
                planId: { $in: businessPlanIds },
                status: 'active',
            },
            { $set: { status: 'expired' } }
        );

        logger.debug('BusinessSubscriptionService.expirePlan: business plans expired', {
            userId: userIdStr,
            count: businessPlanIds.length,
        });
    } catch (err) {
        logger.error('BusinessSubscriptionService.expirePlan: failed', {
            userId: userIdStr,
            error: err instanceof Error ? err.message : String(err),
        });
    }

    // Sync priority to Free plan fallback — resolved from DB, not hardcoded
    setImmediate(() => {
        void syncPriorityScore(userIdStr);
    });
}

