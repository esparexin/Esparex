import { Request } from 'express';
import User from '../models/User';
import Ad from '../models/Ad';
import SmartAlert from '../models/SmartAlert';
import { logAdminAction } from '../utils/adminLogger';
import logger from '../utils/logger';

import { USER_STATUS, UserStatusValue } from '../../../shared/enums/userStatus';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { mutateStatuses } from './StatusMutationService';
import { AppError } from '../utils/AppError';

export type { UserStatusValue as UserStatus };

export interface StatusUpdateContext {
    actor: 'USER' | 'ADMIN';
    adminReq?: Request; // For logging
    reason?: string;
}

/**
 * Centralized User Status Transitions
 * Handles side effects like deactivating ads and logging.
 */
export const updateUserStatus = async (
    userId: string,
    newStatus: UserStatusValue,
    context: StatusUpdateContext
) => {
    const isRestrictive = [USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.DELETED]
        .includes(newStatus as any);

    const updateData: Record<string, unknown> = {
        status: newStatus,
        statusChangedAt: new Date(),
        statusReason: context.reason
    };

    if (newStatus === USER_STATUS.DELETED) {
        updateData.deletedAt = new Date();
    }

    // Clear reasons if activating
    if (newStatus === USER_STATUS.ACTIVE) {
        updateData.statusReason = undefined;
    }

    // 🔒 SECURITY: Increment tokenVersion on restrictive transitions.
    // This atomically invalidates ALL existing JWTs for this user,
    // closing the propagation-delay window from the Redis status cache.
    if (isRestrictive) {
        const user = await User.findByIdAndUpdate(
            userId,
            { ...updateData, $inc: { tokenVersion: 1 } },
            { new: true }
        );
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        // Also delete the Redis status cache for immediate enforcement.
        // Without this, authMiddleware would serve the stale 'active' status
        // from cache for up to 300 seconds.
        try {
            const redisClient = (await import('../config/redis')).default;
            await redisClient.del(`user:status:${userId}`);
        } catch (e) {
            logger.warn(`Failed to clear Redis status cache for user ${userId}`, e);
        }

        // --- Side Effects ---
        if (newStatus === USER_STATUS.DELETED) {
            await Ad.updateMany(
                { sellerId: userId, isDeleted: { $ne: true } },
                { isDeleted: true, deletedAt: new Date() }
            );
        } else {
            const liveListings = await Ad.find(
                { sellerId: userId, status: AD_STATUS.LIVE, isDeleted: { $ne: true } }
            )
                .select('_id')
                .lean<Array<{ _id: unknown }>>();

            if (liveListings.length > 0) {
                await mutateStatuses(
                    liveListings.map((listing) => ({
                        domain: 'ad',
                        entityId: String(listing._id),
                        toStatus: AD_STATUS.REJECTED,
                        actor: {
                            type: ACTOR_TYPE.SYSTEM,
                            id: `user_status_${newStatus}`,
                        },
                        reason: `Listing rejected due to seller status ${newStatus}`,
                        metadata: {
                            action: 'user_status_enforcement',
                            sourceRoute: 'UserStatusService.updateUserStatus',
                        },
                        patch: {
                            moderationStatus: 'rejected',
                        },
                    }))
                );
            }
        }

        if ([USER_STATUS.BANNED, USER_STATUS.DELETED].includes(newStatus as any)) {
            await SmartAlert.updateMany({ userId }, { isActive: false });
        }

        // Admin Logging
        if (context.actor === 'ADMIN' && context.adminReq) {
            const actionVerb = newStatus.toUpperCase();
            await logAdminAction(
                context.adminReq,
                `STATUS_UPDATE_${actionVerb}`,
                'User',
                userId,
                { reason: context.reason }
            );
        }

        return user;
    }

    // Non-restrictive transitions (e.g. ACTIVE) — no tokenVersion bump needed
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) throw new Error('User not found');

    // Admin Logging
    if (context.actor === 'ADMIN' && context.adminReq) {
        const actionVerb = newStatus === USER_STATUS.ACTIVE ? 'ACTIVATED' : newStatus.toUpperCase();
        await logAdminAction(
            context.adminReq,
            `STATUS_UPDATE_${actionVerb}`,
            'User',
            userId,
            { reason: context.reason }
        );
    }

    return user;
};
