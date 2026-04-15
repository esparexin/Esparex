import mongoose from 'mongoose';
import Business from '../../models/Business';
import User from '../../models/User';
import { mutateStatus } from '../StatusMutationService';
import { BUSINESS_STATUS } from '../../../../shared/enums/businessStatus';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';

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
