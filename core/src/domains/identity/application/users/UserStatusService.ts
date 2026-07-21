
import redis from '../../../../config/redis';
import User from '../../../../models/User';
import { getListingRepository } from '../../../../composition/listings';
import Business from '../../../../models/Business';
import SmartAlert from '../../../../models/SmartAlert';
import { logAdminActionDirect } from '../../../../utils/adminLogger';
import logger from '../../../../utils/logger';
import mongoose from 'mongoose';

import { USER_STATUS, UserStatusValue } from '@esparex/contracts';
import { LISTING_STATUS } from '@esparex/contracts';
import { ACTOR_TYPE } from '@esparex/contracts';
import { mutateStatuses } from '../../../../services/lifecycle/StatusMutationService';
import { AppError } from '../../../../utils/AppError';
import type { AdminLogFn } from '../../../../utils/adminLogger';

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

    // 🔒 SECURITY: Inline ObjectId validation — CodeQL recognizes this exact pattern
    // as a sanitization barrier. Cross-file helper calls (toObjectId) are not tracked
    // by CodeQL's interprocedural taint analysis for custom sanitizers.
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }
    const normalizedUserId = new mongoose.Types.ObjectId(userId);
    // Canonical safe string — used for all post-validation DB/cache sinks.
    const safeUserId = normalizedUserId.toHexString();

    const updateData: Record<string, unknown> = {
        status: newStatus,
        statusChangedAt: new Date(),
        // Sanitize reason: ensure it's a string, trim, and cap length
        statusReason: typeof context.reason === 'string'
            ? context.reason.trim().slice(0, 500)
            : undefined,
    };

    if (newStatus === USER_STATUS.DELETED) {
        updateData.deletedAt = new Date();
    }

    // Clear reasons if activating
    if (newStatus === USER_STATUS.LIVE) {
        updateData.statusReason = undefined;
    }

    // 🔒 SECURITY: Increment tokenVersion on restrictive transitions.
    // This atomically invalidates ALL existing JWTs for this user,
    // closing the propagation-delay window from the Redis status cache.
    if (isRestrictive) {
        const user = await User.findByIdAndUpdate(
            normalizedUserId,
            { ...updateData, $inc: { tokenVersion: 1 } },
            { new: true }
        );
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        // Also delete the Redis status cache for immediate enforcement.
        // Without this, authMiddleware would serve the stale 'active' status
        // from cache for up to 300 seconds.
        try {
            await redis.del(`user:status:${safeUserId}`);
        } catch (e) {
            logger.warn(`Failed to clear Redis status cache for user ${safeUserId}`, e);
        }

        // --- Side Effects ---
        if (newStatus === USER_STATUS.DELETED) {
            const deletedAt = new Date();
            await Promise.all([
                // Port interface accepts plain string — safeUserId is already validated.
                getListingRepository().updateMany(
                    { sellerId: safeUserId, isDeleted: { $ne: true } },
                    { isDeleted: true, deletedAt }
                ),
                // Direct Mongoose call — explicit $eq closes the raw-value taint path.
                Business.updateMany(
                    { userId: { $eq: safeUserId }, isDeleted: { $ne: true } },
                    { isDeleted: true, deletedAt }
                ),
            ]);
        } else {
            // Port interface accepts plain string — safeUserId is already validated.
            const liveListings = await getListingRepository().find(
                { sellerId: safeUserId, status: LISTING_STATUS.LIVE, isDeleted: { $ne: true } }
            );

            if (liveListings.length > 0) {
                await mutateStatuses(
                    liveListings.map((listing) => ({
                        domain: 'ad',
                        entityId: listing.id,
                        toStatus: LISTING_STATUS.REJECTED,
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
    const user = await User.findByIdAndUpdate(normalizedUserId, updateData, { new: true });
    if (!user) throw new Error('User not found');

    // --- Admin Logging ---
    if (context.actor === 'ADMIN') {
        const actionVerb = newStatus === USER_STATUS.LIVE ? 'ACTIVATED' : newStatus.toUpperCase();
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
