import mongoose, { type ClientSession } from 'mongoose';
import UserPlan from '../../../models/UserPlan';
import Plan, { type IPlan } from '../../../models/Plan';
import { type AdPostingSlotSource } from '../../boosts/application/services/AdSlotService';
import { LISTING_TYPE } from '@esparex/contracts';
import { getListingRepository } from '../../../composition/listings';
import { 
    AdSlotService, 
    getMonthlyCycleStart,
    getAdPostingBalance as adSlotGetBalance
} from '../../boosts/application/services/AdSlotService';
import { AppError } from '../../../utils/AppError';
import { calculateUserPlan } from '../domain/policies/PlanEngine';
export { calculateUserPlan };
import logger from '../../../utils/logger';
import UserWallet from '../../../models/UserWallet';
import { withUserPostingLock } from '../../boosts/application/services/AdSlotService';
import { findPlanByIdOrCode } from './planQueryHelpers';
export { findPlanByIdOrCode };

export {
    adminCreatePlan,
    adminUpdatePlan,
    adminArchivePlan,
    adminRestorePlan,
} from './AdminPlanService';

export type UserPlanWithPlanId = { planId: unknown };

// ─── Default Free Plan SSOT ───────────────────────────────────────────────────

export const getActiveFreeDefaultPlan = async (): Promise<IPlan> => {
    const plan = await Plan.findOne({ isDefault: true, active: true, isSystemPlan: true });
    if (!plan) {
        logger.error('[CRITICAL] No active Default Free Plan found. Platform entitlement engine is degraded.', {
            alert: 'NO_ACTIVE_DEFAULT_PLAN',
            severity: 'CRITICAL',
        });
        throw new AppError(
            'No active Default Free Plan found. Please configure one in the admin panel.',
            500,
            'NO_ACTIVE_DEFAULT_PLAN'
        );
    }
    return plan;
};

export const getDefaultPlan = async (): Promise<IPlan | null> => {
    return Plan.findOne({ isDefault: true, active: true });
};

export const adminGetPlans = (query: Record<string, unknown>): Promise<IPlan[]> =>
    Plan.find(query).sort({ createdAt: -1 });

export const getPlanById = (planId: string): Promise<IPlan | null> => {
    return findPlanByIdOrCode(planId);
};

export const adminGetPlanById = getPlanById;

export const getActivePlans = async (query: Record<string, unknown>) => {
    return Plan.find(query).sort({ price: 1 });
};

export const upsertUserPlan = async (
    userId: string | mongoose.Types.ObjectId,
    planId: string | mongoose.Types.ObjectId | undefined,
    startDate: Date,
    endDate: Date
) => {
    return UserPlan.findOneAndUpdate(
        { userId, planId },
        { $set: { startDate, endDate, status: 'ACTIVE' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const renewBusinessPlan = async (
    userId: string | mongoose.Types.ObjectId,
    planId: string | mongoose.Types.ObjectId,
    durationDays: number = 365
) => {
    const existing = await UserPlan.findOne({ userId, planId, status: 'active' });
    const baseDate = (existing?.endDate && new Date(existing.endDate) > new Date())
        ? new Date(existing.endDate)
        : new Date();

    const newEndDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return UserPlan.findOneAndUpdate(
        { userId, planId },
        { $set: { startDate: new Date(), endDate: newEndDate, status: 'active' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const resetWalletsForNewCycle = async (now: Date = new Date()) => {
    const cycleStart = getMonthlyCycleStart(now);
    const result = await UserWallet.updateMany(
        {
            $or: [
                { lastMonthlyReset: { $exists: false } },
                { lastMonthlyReset: { $lt: cycleStart } }
            ]
        },
        {
            $set: {
                lastMonthlyReset: now,
                monthlyFreeAdsUsed: 0
            }
        }
    );

    return { cycleStart, modifiedCount: result.modifiedCount };
};

export const consumeAdPostingSlot = async (
    userId: string,
    session?: ClientSession,
    adId?: string
): Promise<{ source: AdPostingSlotSource }> => {
    return AdSlotService.consumeSlot(userId, session, adId);
};

/**
 * Check if a user can post a new item based on their plan + wallet.
 * @param userId - The ID of the user trying to post.
 * @param type - The type of content ('ad', 'service', 'spare_part_listing').
 * @throws Error if limit reached.
 */
export const checkPostLimit = async (
    userId: string,
    type: 'ad' | 'service' | 'spare_part_listing',
    session?: ClientSession
): Promise<boolean> => {
    return withUserPostingLock(userId, 15, async () => {
        let activeUserPlansQuery = UserPlan.find({
            userId,
            status: 'active',
            $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
        }).populate('planId');
        if (session) activeUserPlansQuery = activeUserPlansQuery.session(session);
        const activeUserPlans = await activeUserPlansQuery.lean();

        const plans = activeUserPlans.map((up) => (up as UserPlanWithPlanId).planId).filter(Boolean);
        const permissions = calculateUserPlan(plans);

        let limit = 0;

        if (type === 'ad') {
            const balance = await adSlotGetBalance(userId, session);
            if (balance.totalRemaining <= 0) {
                throw new AppError(
                    'No ad posting slots available this month. Buy Ad Pack credits or wait for monthly reset.',
                    422,
                    'QUOTA_EXCEEDED'
                );
            }
            return true;
        } else if (type === 'service') {
            limit = (permissions.maxServices || 100);
        } else if (type === 'spare_part_listing') {
            limit = (permissions.maxParts || 100);
        }

        let currentCount = 0;

        if (type === 'service') {
            currentCount = await getListingRepository().countActiveBySeller({
                sellerId: userId,
                listingType: LISTING_TYPE.SERVICE,
                session,
            });
        } else if (type === 'spare_part_listing') {
            currentCount = await getListingRepository().countActiveBySeller({
                sellerId: userId,
                listingType: LISTING_TYPE.SPARE_PART,
                session,
            });
        }

        if (currentCount >= limit) {
            throw new AppError(
                `Active slot limit reached (${currentCount}/${limit}). Upgrade your plan or buy "Ad Packs" to increase capacity.`,
                422,
                'QUOTA_EXCEEDED'
            );
        }

        return true;
    });
};

// ── Typed model wrappers for controller shared files ─────────────────────────
const rawPlanModel: unknown = Plan;
export const PlanModel = rawPlanModel as { 
    create: (payload: Record<string, unknown>) => Promise<Record<string, unknown> | Record<string, unknown>[]>;
    findByIdAndUpdate: (id: string, payload: Record<string, unknown>, options: { new: boolean }) => Promise<unknown>;
    find: (query: Record<string, unknown>) => {
        sort: (sort: Record<string, 1 | -1>) => Promise<unknown[]>;
        lean: () => Promise<unknown[]>;
    };
    findById: (id: string) => Promise<{ active: boolean; save: () => Promise<unknown> } | null>;
    findOne: (query: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
};

const rawUserPlanModel: unknown = UserPlan;
export const UserPlanModel = rawUserPlanModel as { 
    find: (query: Record<string, unknown>) => {
        lean: () => Promise<Array<{ planId: unknown }>>;
    } & PromiseLike<unknown>;
};
