import UserPlan from '../models/UserPlan';
import Plan, { type IPlan } from '../models/Plan';
import { type AdPostingSlotSource } from './AdSlotService';
import { SERVICE_STATUS } from '../../../shared/enums/serviceStatus';
import { LISTING_TYPE } from '../../../shared/enums/listingType';
import { INVENTORY_STATUS } from '../../../shared/enums/inventoryStatus';
import AdModel from '../models/Ad';
import { 
    AdSlotService, 
    getMonthlyCycleStart,
    getAdPostingBalance as adSlotGetBalance
} from './AdSlotService';
import type { ClientSession } from 'mongoose';
import { AppError } from '../utils/AppError';
import { calculateUserPlan } from './PlanEngine';
import UserWallet from '../models/UserWallet';
import { withUserPostingLock } from './AdSlotService'; // Import the lock

export type UserPlanWithPlanId = { planId: unknown };

// ─── Admin Plan CRUD ─────────────────────────────────────────────────────────

export const adminCreatePlan = (payload: Record<string, unknown>): Promise<IPlan> =>
    Plan.create(payload);

export const adminUpdatePlan = (planId: string, payload: Record<string, unknown>): Promise<IPlan | null> =>
    Plan.findByIdAndUpdate(planId, payload, { new: true });

export const adminGetPlans = (query: Record<string, unknown>): Promise<IPlan[]> =>
    Plan.find(query).sort({ createdAt: -1 });

export const adminGetPlanById = (planId: string): Promise<IPlan | null> =>
    Plan.findById(planId);

// ─────────────────────────────────────────────────────────────────────────────

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
        // 1. Get All Active Plans (Stacking)
    let activeUserPlansQuery = UserPlan.find({
        userId,
        status: 'active',
        $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
    }).populate('planId');
    if (session) activeUserPlansQuery = activeUserPlansQuery.session(session);
    const activeUserPlans = await activeUserPlansQuery.lean();

    // 2. Calculate Permissions from Plans
    const plans = activeUserPlans.map((up) => (up as UserPlanWithPlanId).planId).filter(Boolean);
    const permissions = calculateUserPlan(plans);

    // 4. Determine Limits
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

    // 5. Count Current Usage (Active Inventory)
    let currentCount = 0;

    if (type === 'service') {
        let serviceQuery = AdModel.countDocuments({
            sellerId: userId,
            listingType: LISTING_TYPE.SERVICE,
            status: { $in: [SERVICE_STATUS.LIVE, SERVICE_STATUS.PENDING] },
            isDeleted: { $ne: true }
        });
        if (session) serviceQuery = serviceQuery.session(session);
        currentCount = await serviceQuery;
    } else if (type === 'spare_part_listing') {
        let splQuery = AdModel.countDocuments({
            sellerId: userId,
            listingType: LISTING_TYPE.SPARE_PART,
            status: { $in: [INVENTORY_STATUS.LIVE, INVENTORY_STATUS.PENDING] },
            isDeleted: { $ne: true }
        });
        if (session) splQuery = splQuery.session(session);
        currentCount = await splQuery;
    }

    // 6. Enforce
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
export const PlanModel = Plan as unknown as {
    create: (payload: Record<string, unknown>) => Promise<Record<string, unknown> | Record<string, unknown>[]>;
    findByIdAndUpdate: (id: string, payload: Record<string, unknown>, options: { new: boolean }) => Promise<unknown>;
    find: (query: Record<string, unknown>) => {
        sort: (sort: Record<string, 1 | -1>) => Promise<unknown[]>;
        lean: () => Promise<unknown[]>;
    };
    findById: (id: string) => Promise<{ active: boolean; save: () => Promise<unknown> } | null>;
    findOne: (query: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
};

export const UserPlanModel = UserPlan as unknown as {
    find: (query: Record<string, unknown>) => {
        lean: () => Promise<Array<{ planId: unknown }>>;
    } & PromiseLike<unknown>;
};
