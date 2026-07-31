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
import mongoose, { type ClientSession, Types } from 'mongoose';
import { getUserConnection } from '../../../config/db';
import { AppError } from '../../../utils/AppError';
import { calculateUserPlan } from '../domain/policies/PlanEngine';
export { calculateUserPlan };
import logger from '../../../utils/logger';
import UserWallet from '../../../models/UserWallet';
import { withUserPostingLock } from '../../boosts/application/services/AdSlotService';

export type UserPlanWithPlanId = { planId: unknown };

// ─── Default Free Plan SSOT ───────────────────────────────────────────────────

/**
 * Canonical resolver for the active Default Free Plan.
 * Single Source of Truth for user registration, entitlement calculations,
 * quota resets, and all fallback logic.
 *
 * Throws APP_ERROR('NO_ACTIVE_DEFAULT_PLAN') if no active default exists.
 * All callers must handle this error or let it propagate to surface the config issue.
 */
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

/**
 * Atomically demotes the current default plan and promotes the new plan.
 * Must be called inside an active MongoDB session/transaction.
 *
 * - Step 1: Demote the existing default (isDefault → false). Does NOT deactivate it.
 * - Step 2: Promote the target plan (isDefault → true, isSystemPlan → true, active → true).
 *
 * The partial unique index `unique_active_default_plan` on {isDefault:true, active:true}
 * will catch any concurrent race that bypasses this guard.
 */
const atomicDemoteAndPromoteDefault = async (
    newPlanId: unknown,
    session: ClientSession
): Promise<void> => {
    const targetId = newPlanId as Types.ObjectId | string;
    await Plan.updateOne(
        { isDefault: true, active: true, _id: { $ne: targetId } },
        { $set: { isDefault: false } },
        { session }
    );
    await Plan.updateOne(
        { _id: targetId },
        { $set: { isDefault: true, isSystemPlan: true, active: true, status: 'ACTIVE' } },
        { session }
    );
};

const syncPlanStatusAndActive = (payload: Record<string, unknown>): void => {
    if (payload.status === 'ACTIVE' || payload.active === true) {
        payload.status = 'ACTIVE';
        payload.active = true;
    } else if (payload.status === 'INACTIVE' || payload.status === 'ARCHIVED' || payload.active === false) {
        payload.status = payload.status ?? 'INACTIVE';
        payload.active = false;
    }
};

// ─── Admin Plan CRUD ─────────────────────────────────────────────────────────

/**
 * Creates a new plan.
 * If `isDefault: true`, runs an atomic transaction to demote the previous default
 * and promote this plan. Enforces: the default plan must be free (price === 0).
 */
export const adminCreatePlan = async (payload: Record<string, unknown>): Promise<IPlan> => {
    syncPlanStatusAndActive(payload);

    if (payload.isDefault === true && payload.type !== 'FREE_DEFAULT') {
        throw new AppError(
            'Only Free Plans can be designated as the platform system default.',
            400,
            'INVALID_DEFAULT_PLAN_TYPE'
        );
    }

    if (payload.isDefault !== true) {
        return Plan.create(payload);
    }

    // Business Rule: Default Free Plan must always be a free plan.
    if (typeof payload.price === 'number' && payload.price > 0) {
        throw new AppError(
            'The Default Free Plan must have a price of 0.',
            400,
            'DEFAULT_PLAN_MUST_BE_FREE'
        );
    }

    const db = getUserConnection();
    const session = await db.startSession();
    let created: IPlan;
    try {
        session.startTransaction();
        created = (await Plan.create([{ ...payload, isSystemPlan: true, active: true, status: 'ACTIVE' }], { session }))[0];
        await atomicDemoteAndPromoteDefault(created._id, session);
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
    return created;
};

/**
 * Updates an existing plan with full singleton governance:
 * - Atomic default-swap transaction when promoting a new default.
 * - Blocks deactivating the sole active default.
 * - Blocks manually un-defaulting without a replacement.
 * - Blocks setting a non-zero price on the active default.
 */
export const adminUpdatePlan = async (planId: string, payload: Record<string, unknown>): Promise<IPlan | null> => {
    syncPlanStatusAndActive(payload);
    const existing = await findPlanByIdOrCode(planId);
    if (!existing) {
        return null;
    }

    // Guard: active default plan cannot be deactivated directly.
    if (existing.isDefault && payload.active === false) {
        throw new AppError(
            'The active Default Free Plan cannot be deactivated. Designate a new default plan first.',
            400,
            'DEFAULT_PLAN_PROTECTED'
        );
    }

    // Guard: admin cannot manually strip isDefault without designating a replacement.
    if (existing.isDefault && payload.isDefault === false) {
        throw new AppError(
            'Cannot remove the default designation without first designating a replacement plan as the new default.',
            400,
            'CANNOT_REMOVE_SOLE_DEFAULT'
        );
    }

    // Guard: the active default plan must always be free.
    if (existing.isDefault && typeof payload.price === 'number' && payload.price > 0) {
        throw new AppError(
            'The Default Free Plan must always have a price of 0.',
            400,
            'DEFAULT_PLAN_MUST_BE_FREE'
        );
    }

    // Guard: only FREE_DEFAULT plans can be promoted to default.
    if (payload.isDefault === true) {
        const targetType = (payload.type as string) ?? existing.type;
        if (targetType !== 'FREE_DEFAULT') {
            throw new AppError(
                'Only Free Plans can be designated as the platform system default.',
                400,
                'INVALID_DEFAULT_PLAN_TYPE'
            );
        }
    }

    // Guard: any plan promoted to default must be free.
    if (payload.isDefault === true && typeof payload.price === 'number' && payload.price > 0) {
        throw new AppError(
            'A plan designated as the Default Free Plan must have a price of 0.',
            400,
            'DEFAULT_PLAN_MUST_BE_FREE'
        );
    }

    // Atomic default-swap: promote this plan and demote the previous default.
    if (payload.isDefault === true && !existing.isDefault) {
        const db = getUserConnection();
        const session = await db.startSession();
        try {
            session.startTransaction();
            await atomicDemoteAndPromoteDefault(existing._id, session);
            const updated = await Plan.findByIdAndUpdate(
                existing._id,
                { ...payload, isSystemPlan: true, active: true },
                { new: true, session }
            );
            await session.commitTransaction();
            return updated;
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    return Plan.findByIdAndUpdate(existing._id, payload, { new: true });
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

// ─── Admin Plan Lifecycle: Archive & Restore ──────────────────────────────────

export const adminArchivePlan = async (
    planId: string,
    adminId: string,
    reason?: string
): Promise<IPlan> => {
    const existing = await findPlanByIdOrCode(planId);
    if (!existing) {
        throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    // Single SSOT System Plan Protection Guard
    if (existing.isSystemPlan || existing.isDefault || existing.type === 'FREE_DEFAULT') {
        throw new AppError(
            'System fallback plans cannot be archived as they serve as core platform dependencies.',
            400,
            'SYSTEM_PLAN_PROTECTED'
        );
    }

    // State Transition Guard: must be INACTIVE or DRAFT
    const currentStatus = (existing.status as string | undefined) ?? (existing.active ? 'ACTIVE' : 'INACTIVE');
    if (currentStatus !== 'INACTIVE' && currentStatus !== 'DRAFT') {
        throw new AppError(
            `Cannot archive plan currently in '${currentStatus}' status. Deactivate the plan first.`,
            400,
            'INVALID_STATE_TRANSITION'
        );
    }

    // Active Subscription Reference Guard
    const activeSubs = await UserPlan.countDocuments({ planId: existing._id, status: 'active' });
    if (activeSubs > 0) {
        throw new AppError(
            `Cannot archive plan '${existing.name}' because ${activeSubs} user(s) currently have active subscriptions.`,
            400,
            'PLAN_HAS_ACTIVE_SUBSCRIPTIONS'
        );
    }

    // Atomic update with concurrency precondition guard
    const updated = await Plan.findOneAndUpdate(
        { _id: existing._id, isSystemPlan: { $ne: true } },
        {
            $set: {
                status: 'ARCHIVED',
                active: false,
                archivedAt: new Date(),
                archivedByAdmin: adminId,
                archiveReason: reason ?? 'Admin archived plan',
            },
        },
        { new: true }
    );

    if (!updated) {
        throw new AppError(
            'Plan status was modified concurrently by another process',
            409,
            'CONCURRENCY_CONFLICT'
        );
    }

    return updated;
};

export const adminRestorePlan = async (
    planId: string,
    adminId: string
): Promise<IPlan> => {
    const existing = await findPlanByIdOrCode(planId);
    if (!existing) {
        throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    const currentStatus = (existing.status as string | undefined) ?? 'ACTIVE';
    if (currentStatus !== 'ARCHIVED') {
        throw new AppError('Only archived plans can be restored', 400, 'INVALID_RESTORE_STATE');
    }

    // Atomic update with concurrency precondition guard
    const updated = await Plan.findOneAndUpdate(
        { _id: existing._id, status: 'ARCHIVED' },
        {
            $set: {
                status: 'INACTIVE',
                active: false,
                restoredAt: new Date(),
                restoredByAdmin: adminId,
            },
        },
        { new: true }
    );

    if (!updated) {
        throw new AppError(
            'Plan status was modified concurrently by another process',
            409,
            'CONCURRENCY_CONFLICT'
        );
    }

    return updated;
};

export const getActivePlans = async (query: Record<string, unknown>) => {
    return Plan.find(query).sort({ price: 1 });
};

export const findPlanByIdOrCode = async (value: unknown): Promise<IPlan | null> => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(normalized)) {
        const plan = await Plan.findById(new mongoose.Types.ObjectId(normalized));
        if (plan) {
            return plan;
        }
    }

    return Plan.findOne({ code: { $eq: normalized } });
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
