import type { ClientSession, Types } from 'mongoose';
import Plan, { type IPlan } from '../../../models/Plan';
import UserPlan from '../../../models/UserPlan';
import { getUserConnection } from '../../../config/db';
import { AppError } from '../../../utils/AppError';
import { findPlanByIdOrCode } from './planQueryHelpers';

export const atomicDemoteAndPromoteDefault = async (
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

export const syncPlanStatusAndActive = (payload: Record<string, unknown>): void => {
    if (payload.status === 'ACTIVE' || payload.active === true) {
        payload.status = 'ACTIVE';
        payload.active = true;
    } else if (payload.status === 'INACTIVE' || payload.status === 'ARCHIVED' || payload.active === false) {
        payload.status = payload.status ?? 'INACTIVE';
        payload.active = false;
    }
};

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

export const adminUpdatePlan = async (planId: string, payload: Record<string, unknown>): Promise<IPlan | null> => {
    syncPlanStatusAndActive(payload);
    const existing = await findPlanByIdOrCode(planId);
    if (!existing) {
        return null;
    }

    if (existing.isDefault && payload.active === false) {
        throw new AppError(
            'The active Default Free Plan cannot be deactivated. Designate a new default plan first.',
            400,
            'DEFAULT_PLAN_PROTECTED'
        );
    }

    if (existing.isDefault && payload.isDefault === false) {
        throw new AppError(
            'Cannot remove the default designation without first designating a replacement plan as the new default.',
            400,
            'CANNOT_REMOVE_SOLE_DEFAULT'
        );
    }

    if (existing.isDefault && typeof payload.price === 'number' && payload.price > 0) {
        throw new AppError(
            'The Default Free Plan must always have a price of 0.',
            400,
            'DEFAULT_PLAN_MUST_BE_FREE'
        );
    }

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

    if (payload.isDefault === true && typeof payload.price === 'number' && payload.price > 0) {
        throw new AppError(
            'A plan designated as the Default Free Plan must have a price of 0.',
            400,
            'DEFAULT_PLAN_MUST_BE_FREE'
        );
    }

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

export const adminArchivePlan = async (
    planId: string,
    adminId: string,
    reason?: string
): Promise<IPlan> => {
    const existing = await findPlanByIdOrCode(planId);
    if (!existing) {
        throw new AppError('Plan not found', 404, 'PLAN_NOT_FOUND');
    }

    if (existing.isSystemPlan || existing.isDefault || existing.type === 'FREE_DEFAULT') {
        throw new AppError(
            'System fallback plans cannot be archived as they serve as core platform dependencies.',
            400,
            'SYSTEM_PLAN_PROTECTED'
        );
    }

    const currentStatus = (existing.status as string | undefined) ?? (existing.active ? 'ACTIVE' : 'INACTIVE');
    if (currentStatus !== 'INACTIVE' && currentStatus !== 'DRAFT') {
        throw new AppError(
            `Cannot archive plan currently in '${currentStatus}' status. Deactivate the plan first.`,
            400,
            'INVALID_STATE_TRANSITION'
        );
    }

    const activeSubs = await UserPlan.countDocuments({ planId: existing._id, status: 'active' });
    if (activeSubs > 0) {
        throw new AppError(
            `Cannot archive plan '${existing.name}' because ${activeSubs} user(s) currently have active subscriptions.`,
            400,
            'PLAN_HAS_ACTIVE_SUBSCRIPTIONS'
        );
    }

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
