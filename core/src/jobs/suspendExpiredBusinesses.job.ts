import Business from '@esparex/core/models/Business';
import Ad from '@esparex/core/models/Ad';
import { jobRunner } from '@esparex/core/utils/jobRunner';
import logger from '@esparex/core/utils/logger';
import { runWithDistributedJobLock } from '@esparex/core/utils/distributedJobLock';
import { dispatchTemplatedNotification } from '@esparex/core/services/NotificationService';
import { LISTING_STATUS } from "@esparex/core/constants/enums/listingStatus";
import { mutateStatusesBulk } from '@esparex/core/services/StatusMutationService';
import { ACTOR_TYPE } from '@esparex/core/constants/enums/actor';


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
                const businessesToSuspend = await Business.find({
                    status: 'live',
                    expiresAt: { $lte: new Date() },
                    isDeleted: { $ne: true }
                }).select('_id').lean();

                const suspendedIds = businessesToSuspend.map(b => b._id.toString());
                const suspendedCount = await mutateStatusesBulk(
                    'business',
                    suspendedIds,
                    'suspended',
                    { type: ACTOR_TYPE.SYSTEM, id: 'cron_expireBusinesses' },
                    'Business account expired (natural expiry)'
                );

                if (suspendedCount > 0) {
                    logger.info('Suspended business accounts (natural expiry)', { count: suspendedCount });

                    // Fetch the newly-suspended businesses to handle secondary effects and notifications
                    const suspendedBusinesses = await Business.find({
                        _id: { $in: suspendedIds },
                        isDeleted: { $ne: true }
                    }).select('userId name');

                    const suspendedUserIds = suspendedBusinesses.map(b => b.userId);

                    // 3. Deactivate ads of suspended businesses (New Governance Policy)
                    if (suspendedUserIds.length > 0) {
                        const adsToDeactivate = await Ad.find({
                            sellerId: { $in: suspendedUserIds },
                            status: LISTING_STATUS.LIVE,
                            isDeleted: { $ne: true }
                        }).select('_id').lean();

                        const adIds = adsToDeactivate.map(a => a._id.toString());
                        const deactivatedAdCount = await mutateStatusesBulk(
                            'ad',
                            adIds,
                            LISTING_STATUS.PENDING,
                            { type: ACTOR_TYPE.SYSTEM, id: 'cron_expireBusinesses' },
                            'Automatic deactivation: Business subscription expired'
                        );

                        if (deactivatedAdCount > 0) {
                            logger.info('Deactivated ads for suspended businesses', { count: deactivatedAdCount });
                        }
                    }

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

                return { expiredCount: suspendedCount, warningsSent: expiringBusinesses.length };
            });
        }
    );
};
