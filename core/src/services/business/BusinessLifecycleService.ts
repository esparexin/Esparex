import mongoose from 'mongoose';
import Business from '../../models/Business';
import User from '../../models/User';
import { mutateStatus } from '../StatusMutationService';
import { BUSINESS_STATUS } from '../../constants/enums/businessStatus';
import { ACTOR_TYPE, type ActorTypeValue } from '../../constants/enums/actor';


export const approveBusiness = async (id: string, moderatorId: string = 'SYSTEM') => {
    const existing = await Business.findById(id).lean();
    if (!existing) return null;
    if (existing.status === BUSINESS_STATUS.LIVE) {
        await User.findByIdAndUpdate(existing.userId, { role: 'business' });
        return existing;
    }

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const isSystem = moderatorId === 'SYSTEM' || !mongoose.Types.ObjectId.isValid(moderatorId);

    const business = await mutateStatus({
        domain: 'business',
        entityId: id,
        toStatus: BUSINESS_STATUS.LIVE,
        actor: {
            type: isSystem ? ACTOR_TYPE.SYSTEM : ACTOR_TYPE.ADMIN,
            id: isSystem ? undefined : moderatorId
        },
        reason: 'Business profile approval',
        patch: {
            approvedAt: new Date(),
            expiresAt,
            isVerified: true
        }
    });

    if (!business) return null;

    await User.findByIdAndUpdate(business.userId, { role: 'business' });
    return business;
};

export const rejectBusiness = async (id: string, reason: string, moderatorId: string = 'SYSTEM') => {
    const existing = await Business.findById(id).select('userId').lean();
    const isSystem = moderatorId === 'SYSTEM' || !mongoose.Types.ObjectId.isValid(moderatorId);

    const business = await mutateStatus({
        domain: 'business',
        entityId: id,
        toStatus: BUSINESS_STATUS.REJECTED,
        actor: {
            type: isSystem ? ACTOR_TYPE.SYSTEM : ACTOR_TYPE.ADMIN,
            id: isSystem ? undefined : moderatorId
        },
        reason,
        patch: {
            rejectionReason: reason,
            isVerified: false
        }
    });

    if (existing?.userId) {
        await User.findByIdAndUpdate(existing.userId, { role: 'user' });
    }

    return business;
};

export const withdrawBusiness = async (userId: string) => {
    const business = await Business.findOne({ userId, status: BUSINESS_STATUS.PENDING });
    if (!business) return null;

    await (business as unknown as { softDelete(): Promise<void> }).softDelete();

    await User.findByIdAndUpdate(userId, {
        $unset: { businessId: 1 }
    });

    return business;
};

export const softDeleteBusiness = async (id: string) => {
    const business = await Business.findById(id);
    if (!business) return null;

    await (business as unknown as { softDelete(): Promise<void> }).softDelete();

    await User.findByIdAndUpdate(business.userId, {
        $unset: { businessId: 1 },
        role: 'user'
    });

    return business;
};

export const deactivateBusiness = async (userId: string) => {
    const business = await Business.findOne({ userId, status: BUSINESS_STATUS.LIVE });
    if (!business) return null;

    return await mutateStatus({
        domain: 'business',
        entityId: business._id.toString(),
        toStatus: BUSINESS_STATUS.DEACTIVATED,
        actor: { type: ACTOR_TYPE.USER, id: userId },
        reason: 'User-initiated business deactivation'
    });
};

export const reactivateBusiness = async (userId: string) => {
    // Reactivate only if currently deactivated. If pending, it must go through admin.
    const business = await Business.findOne({ userId, status: BUSINESS_STATUS.DEACTIVATED });
    if (!business) return null;

    return await mutateStatus({
        domain: 'business',
        entityId: business._id.toString(),
        toStatus: BUSINESS_STATUS.LIVE,
        actor: { type: ACTOR_TYPE.USER, id: userId },
        reason: 'User-initiated business reactivation'
    });
};

export const closeBusiness = async (userId: string) => {
    const business = await Business.findOne({ userId, status: { $in: [BUSINESS_STATUS.LIVE, BUSINESS_STATUS.EXPIRED] } });
    if (!business) return null;

    const result = await mutateStatus({
        domain: 'business',
        entityId: business._id.toString(),
        toStatus: BUSINESS_STATUS.CLOSED,
        actor: { type: ACTOR_TYPE.USER, id: userId },
        reason: 'User-initiated business closure'
    });

    if (result) {
        await User.findByIdAndUpdate(userId, { role: 'user' });
    }

    return result;
};

export const renewBusiness = async (id: string, actor: { type: ActorTypeValue; id: string }) => {
    const business = await Business.findById(id);
    if (!business) return null;

    // Standard renewal: +1 year from current expiry or now, whichever is later.
    const currentExpiry = business.expiresAt ? new Date(business.expiresAt).getTime() : 0;
    const baseDate = Math.max(currentExpiry, Date.now());
    const nextExpiry = new Date(baseDate + 365 * 24 * 60 * 60 * 1000);

    return await mutateStatus({
        domain: 'business',
        entityId: id,
        toStatus: BUSINESS_STATUS.LIVE,
        actor,
        reason: 'Business renewal extension',
        patch: {
            expiresAt: nextExpiry,
            isVerified: true,
            expiryWarningSentAt: null,
            expiryWarningCount: 0,
            lastExpiryWarningChannel: null,
        }
    });
};

export const expireBusinesses = async () => {
    const now = new Date();
    const expiring = await Business.find({
        status: BUSINESS_STATUS.LIVE,
        expiresAt: { $lt: now }
    }).lean();

    if (!expiring.length) return [];

    const processed = [];
    
    // Process each to ensure audit history
    for (const biz of expiring) {
        try {
            await mutateStatus({
                domain: 'business',
                entityId: biz._id.toString(),
                toStatus: BUSINESS_STATUS.EXPIRED,
                actor: { type: ACTOR_TYPE.SYSTEM },
                reason: 'Automated business expiry'
            });
            processed.push(biz);
        } catch (err) {
            // Skip failing ones to ensure bulk job finishes
        }
    }

    return processed;
};

