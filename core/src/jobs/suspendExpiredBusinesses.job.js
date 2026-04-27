"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSuspendExpiredBusinessesJob = void 0;
const Business_1 = __importDefault(require("@core/models/Business"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const jobRunner_1 = require("@core/utils/jobRunner");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const NotificationService_1 = require("@core/services/NotificationService");
const adStatus_1 = require("@core/constants/enums/adStatus");
const moderationStatus_1 = require("@core/constants/enums/moderationStatus");
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_DAYS = 7;
/**
 * Marks naturally-expired businesses as `suspended` (expiresAt has passed).
 * Also sends warning notifications 7 days before expiration.
 *
 * Deactivation Logic (Governance Audit Correction):
 *   When a business is suspended, its ads are automatically moved to
 *   status: 'pending' and moderationStatus: 'held_for_review'.
 *   This ensures expired business listings don't clutter the marketplace.
 */
const runSuspendExpiredBusinessesJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('suspend_expired_businesses', { ttlMs: 60 * 60 * 1000, failOpen: false }, async () => {
        await (0, jobRunner_1.jobRunner)('ExpireBusinesses', async () => {
            logger_1.default.info('Running Expire Businesses Job');
            // 1. Send expiration warnings (7 days before, ±12 hours window to avoid repeated warnings)
            const expiringBusinesses = await Business_1.default.find({
                status: 'live',
                isDeleted: { $ne: true },
                expiresAt: {
                    $gte: new Date(Date.now() + (EXPIRY_WARNING_DAYS - 0.5) * MS_IN_DAY),
                    $lte: new Date(Date.now() + (EXPIRY_WARNING_DAYS + 0.5) * MS_IN_DAY)
                }
            }).select('userId name expiresAt');
            for (const biz of expiringBusinesses) {
                try {
                    await (0, NotificationService_1.dispatchTemplatedNotification)(biz.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_EXPIRING_SOON', { name: biz.name, date: biz.expiresAt?.toLocaleDateString() }, { businessId: biz._id.toString(), status: 'expiring_soon' });
                }
                catch (e) {
                    logger_1.default.warn('Failed to send expiration warning', { businessId: biz._id, error: e });
                }
            }
            if (expiringBusinesses.length > 0) {
                logger_1.default.info('Sent expiration warnings', { count: expiringBusinesses.length });
            }
            // 2. Transition approved → suspended when expiresAt has passed
            const result = await Business_1.default.updateMany({
                status: 'live',
                expiresAt: { $lte: new Date() },
                isDeleted: { $ne: true }
            }, {
                $set: { status: 'suspended' }
            });
            if (result.matchedCount > 0) {
                logger_1.default.info('Suspended business accounts (natural expiry)', { count: result.modifiedCount });
                // Fetch the newly-suspended businesses to handle secondary effects and notifications
                const suspendedBusinesses = await Business_1.default.find({
                    status: 'suspended',
                    expiresAt: { $lte: new Date() },
                    isDeleted: { $ne: true }
                }).select('userId name');
                const suspendedUserIds = suspendedBusinesses.map(b => b.userId);
                // 3. Deactivate ads of suspended businesses (New Governance Policy)
                if (suspendedUserIds.length > 0) {
                    const adResult = await Ad_1.default.updateMany({
                        sellerId: { $in: suspendedUserIds },
                        status: adStatus_1.AD_STATUS.LIVE,
                        isDeleted: { $ne: true }
                    }, {
                        $set: {
                            status: adStatus_1.AD_STATUS.PENDING,
                            moderationStatus: moderationStatus_1.MODERATION_STATUS.HELD_FOR_REVIEW,
                            statusReason: 'Automatic deactivation: Business subscription expired'
                        }
                    });
                    if (adResult.modifiedCount > 0) {
                        logger_1.default.info('Deactivated ads for suspended businesses', { count: adResult.modifiedCount });
                    }
                }
                // Send suspension notifications
                for (const biz of suspendedBusinesses) {
                    try {
                        await (0, NotificationService_1.dispatchTemplatedNotification)(biz.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_SUSPENDED', { name: biz.name }, { businessId: biz._id.toString(), status: 'suspended' });
                    }
                    catch (e) {
                        logger_1.default.warn('Failed to send suspension notification', { businessId: biz._id, error: e });
                    }
                }
                logger_1.default.info('Processed suspension flow for expired businesses');
            }
            return { expiredCount: result.modifiedCount, warningsSent: expiringBusinesses.length };
        });
    });
};
exports.runSuspendExpiredBusinessesJob = runSuspendExpiredBusinessesJob;
//# sourceMappingURL=suspendExpiredBusinesses.job.js.map