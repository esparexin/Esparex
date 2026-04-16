import Business from '../models/Business';
import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { dispatchTemplatedNotification } from '../services/NotificationService';


const MS_IN_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_DAYS = 7;

/**
 * Marks naturally-expired businesses as `expired` (expiresAt has passed).
 * Also sends warning notifications 7 days before expiration.
 *
 * Semantics after Option A operationalization:
 *   expired   = natural expiry (expiresAt <= now, no manual action)
 *   suspended = reserved for future manual admin suspension action
 *
 * The `suspended` status is deliberately NOT written here so the two concepts
 * remain distinguishable for analytics and future self-renew flows.
 */
export const runSuspendExpiredBusinessesJob = async () => {
    await runWithDistributedJobLock(
        'suspend_expired_businesses',
        { ttlMs: 60 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('ExpireBusinesses', async () => {
                logger.info('Running Expire Businesses Job');

                // 1. Send expiration warnings (7 days before, ±12 hours window to avoid repeated warnings)
                const expiringBusinesses = await Business.find({
                    status: 'live',
                    isDeleted: { $ne: true },
                    expiresAt: {
                        $gte: new Date(Date.now() + (EXPIRY_WARNING_DAYS - 0.5) * MS_IN_DAY),
                        $lte: new Date(Date.now() + (EXPIRY_WARNING_DAYS + 0.5) * MS_IN_DAY)
                    }
                }).select('userId name expiresAt');

                for (const biz of expiringBusinesses) {
                    try {
                        await dispatchTemplatedNotification(
                            biz.userId.toString(),
                            'BUSINESS_STATUS',
                            'BUSINESS_EXPIRING_SOON',
                            { name: biz.name, date: biz.expiresAt?.toLocaleDateString() },
                            { businessId: biz._id.toString(), status: 'expiring_soon' }
                        );

                    } catch (e) {
                        logger.warn('Failed to send expiration warning', { businessId: biz._id, error: e });
                    }
                }

                if (expiringBusinesses.length > 0) {
                    logger.info('Sent expiration warnings', { count: expiringBusinesses.length });
                }

                // 2. Transition approved → suspended when expiresAt has passed
                const result = await Business.updateMany(
                    {
                        status: 'live',
                        expiresAt: { $lte: new Date() },
                        isDeleted: { $ne: true }
                    },
                    {
                        $set: { status: 'suspended' }
                    }
                );

                if (result.matchedCount > 0) {
                    logger.info('Suspended business accounts (natural expiry)', { count: result.modifiedCount });

                    // Fetch the newly-suspended businesses to send notifications
                    const suspendedBusinesses = await Business.find({
                        status: 'suspended',
                        expiresAt: { $lte: new Date() },
                        isDeleted: { $ne: true }
                    }).select('userId name');

                    // Send suspension notifications
                    for (const biz of suspendedBusinesses) {
                        try {
                            await dispatchTemplatedNotification(
                                biz.userId.toString(),
                                'BUSINESS_STATUS',
                                'BUSINESS_SUSPENDED',
                                { name: biz.name },
                                { businessId: biz._id.toString(), status: 'suspended' }
                            );

                        } catch (e) {
                            logger.warn('Failed to send suspension notification', { businessId: biz._id, error: e });
                        }
                    }
                    
                    logger.info('Processed suspension flow for expired businesses');
                }

                return { expiredCount: result.modifiedCount, warningsSent: expiringBusinesses.length };
            });
        }
    );
};
