
import redis from '@core/config/redis';
import User from '@core/models/User';
import Ad from '@core/models/Ad';
import Business from '@core/models/Business';
import SmartAlert from '@core/models/SmartAlert';
import { logAdminActionDirect } from '@core/utils/adminLogger';
import logger from '@core/utils/logger';

import { USER_STATUS, UserStatusValue } from '@core/constants/enums/userStatus';
import { AD_STATUS } from '@core/constants/enums/adStatus';
import { ACTOR_TYPE } from '@core/constants/enums/actor';
import { mutateStatuses } from './StatusMutationService';
import { AppError } from '@core/utils/AppError';
import type { AdminLogFn } from '@core/utils/adminLogger';

export type { UserStatusValue as UserStatus };

/**
 * Transport-free status update context.
 * Preferred for all new call sites — no express.Request dependency.
 */
export interface StatusUpdateContext {
    actor: 'USER' | 'ADMIN';

    /** Injected log callback — preferred over adminReq */
    logFn?: AdminLogFn;
    reason?: string;
    /** Optional extra metadata forwarded to the audit log (IP, UA, etc.) */
    metadata?: Record<string, unknown>;
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
    const isRestrictive = ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED, USER_STATUS.DELETED] as UserStatusValue[])
        .includes(newStatus);

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
            await redis.del(`user:status:${userId}`);
        } catch (e) {
            logger.warn(`Failed to clear Redis status cache for user ${userId}`, e);
        }

        // --- Side Effects ---
        if (newStatus === USER_STATUS.DELETED) {
            const deletedAt = new Date();
            await Promise.all([
                Ad.updateMany(
                    { sellerId: userId, isDeleted: { $ne: true } },
                    { isDeleted: true, deletedAt }
                ),
                Business.updateMany(
                    { userId, isDeleted: { $ne: true } },
                    { isDeleted: true, deletedAt }
                ),
            ]);
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

        if (([USER_STATUS.BANNED, USER_STATUS.DELETED] as UserStatusValue[]).includes(newStatus)) {
            await SmartAlert.updateMany({ userId }, { isActive: false });
        }

        // --- Admin Logging ---
        const actionVerb = newStatus.toUpperCase();
        if (context.actor === 'ADMIN') {
            if (context.logFn) {
                // Preferred: transport-free path
                await context.logFn(
                    `STATUS_UPDATE_${actionVerb}`,
                    'User',
                    userId,
                    { reason: context.reason, ...context.metadata }
                );
            }
        }

        return user;
    }

    // Non-restrictive transitions (e.g. ACTIVE) — no tokenVersion bump needed
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) throw new Error('User not found');

    // --- Admin Logging ---
    if (context.actor === 'ADMIN') {
        const actionVerb = newStatus === USER_STATUS.ACTIVE ? 'ACTIVATED' : newStatus.toUpperCase();
        if (context.logFn) {
            await context.logFn(
                `STATUS_UPDATE_${actionVerb}`,
                'User',
                userId,
                { reason: context.reason, ...context.metadata }
            );
        }
    }

    return user;
};

/**
 * Transport-free convenience wrapper for admin callers that have
 * already extracted actorId / ip / userAgent from req.
 * Returns an AdminLogFn-compatible log callback scoped to a userId action.
 */
export const buildUserStatusLogFn = (
    actorId: string,
    ip = '',
    userAgent = ''
): AdminLogFn =>
    (action, targetType, targetId, metadata) =>
        logAdminActionDirect(actorId, action, targetType, targetId, metadata, ip, userAgent);
