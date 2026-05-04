"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUserStatusLogFn = exports.updateUserStatus = void 0;
const redis_1 = __importDefault(require("@core/config/redis"));
const User_1 = __importDefault(require("@core/models/User"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Business_1 = __importDefault(require("@core/models/Business"));
const SmartAlert_1 = __importDefault(require("@core/models/SmartAlert"));
const adminLogger_1 = require("@core/utils/adminLogger");
const logger_1 = __importDefault(require("@core/utils/logger"));
const userStatus_1 = require("@core/constants/enums/userStatus");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const actor_1 = require("@core/constants/enums/actor");
const StatusMutationService_1 = require("./StatusMutationService");
const AppError_1 = require("@core/utils/AppError");
/**
 * Centralized User Status Transitions
 * Handles side effects like deactivating ads and logging.
 */
const updateUserStatus = async (userId, newStatus, context) => {
    const isRestrictive = [userStatus_1.USER_STATUS.SUSPENDED, userStatus_1.USER_STATUS.BANNED, userStatus_1.USER_STATUS.DELETED]
        .includes(newStatus);
    const updateData = {
        status: newStatus,
        statusChangedAt: new Date(),
        statusReason: context.reason
    };
    if (newStatus === userStatus_1.USER_STATUS.DELETED) {
        updateData.deletedAt = new Date();
    }
    // Clear reasons if activating
    if (newStatus === userStatus_1.USER_STATUS.LIVE) {
        updateData.statusReason = undefined;
    }
    // 🔒 SECURITY: Increment tokenVersion on restrictive transitions.
    // This atomically invalidates ALL existing JWTs for this user,
    // closing the propagation-delay window from the Redis status cache.
    if (isRestrictive) {
        const user = await User_1.default.findByIdAndUpdate(userId, { ...updateData, $inc: { tokenVersion: 1 } }, { new: true });
        if (!user)
            throw new AppError_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        // Also delete the Redis status cache for immediate enforcement.
        // Without this, authMiddleware would serve the stale 'active' status
        // from cache for up to 300 seconds.
        try {
            await redis_1.default.del(`user:status:${userId}`);
        }
        catch (e) {
            logger_1.default.warn(`Failed to clear Redis status cache for user ${userId}`, e);
        }
        // --- Side Effects ---
        if (newStatus === userStatus_1.USER_STATUS.DELETED) {
            const deletedAt = new Date();
            await Promise.all([
                Ad_1.default.updateMany({ sellerId: userId, isDeleted: { $ne: true } }, { isDeleted: true, deletedAt }),
                Business_1.default.updateMany({ userId, isDeleted: { $ne: true } }, { isDeleted: true, deletedAt }),
            ]);
        }
        else {
            const liveListings = await Ad_1.default.find({ sellerId: userId, status: listingStatus_1.LISTING_STATUS.LIVE, isDeleted: { $ne: true } })
                .select('_id')
                .lean();
            if (liveListings.length > 0) {
                await (0, StatusMutationService_1.mutateStatuses)(liveListings.map((listing) => ({
                    domain: 'ad',
                    entityId: String(listing._id),
                    toStatus: listingStatus_1.LISTING_STATUS.REJECTED,
                    actor: {
                        type: actor_1.ACTOR_TYPE.SYSTEM,
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
                })));
            }
        }
        if ([userStatus_1.USER_STATUS.BANNED, userStatus_1.USER_STATUS.DELETED].includes(newStatus)) {
            await SmartAlert_1.default.updateMany({ userId }, { isActive: false });
        }
        // --- Admin Logging ---
        const actionVerb = newStatus.toUpperCase();
        if (context.actor === 'ADMIN') {
            if (context.logFn) {
                // Preferred: transport-free path
                await context.logFn(`STATUS_UPDATE_${actionVerb}`, 'User', userId, { reason: context.reason, ...context.metadata });
            }
        }
        return user;
    }
    // Non-restrictive transitions (e.g. ACTIVE) — no tokenVersion bump needed
    const user = await User_1.default.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user)
        throw new Error('User not found');
    // --- Admin Logging ---
    if (context.actor === 'ADMIN') {
        const actionVerb = newStatus === userStatus_1.USER_STATUS.LIVE ? 'ACTIVATED' : newStatus.toUpperCase();
        if (context.logFn) {
            await context.logFn(`STATUS_UPDATE_${actionVerb}`, 'User', userId, { reason: context.reason, ...context.metadata });
        }
    }
    return user;
};
exports.updateUserStatus = updateUserStatus;
/**
 * Transport-free convenience wrapper for admin callers that have
 * already extracted actorId / ip / userAgent from req.
 * Returns an AdminLogFn-compatible log callback scoped to a userId action.
 */
const buildUserStatusLogFn = (actorId, ip = '', userAgent = '') => (action, targetType, targetId, metadata) => (0, adminLogger_1.logAdminActionDirect)(actorId, action, targetType, targetId, metadata, ip, userAgent);
exports.buildUserStatusLogFn = buildUserStatusLogFn;
//# sourceMappingURL=UserStatusService.js.map