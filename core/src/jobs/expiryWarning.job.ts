import { addJobWithTrace, type TraceableJobData } from '../utils/queueWrapper';
import { Queue } from 'bullmq';
import { redisConnection, shouldDisableQueueConnection } from '../queues/redisConnection';
import { createNoopQueue } from '../queues/queueDefaults';
import logger from '../utils/logger';
import Business from '../models/Business';
import Ad from '../models/Ad';
import SmartAlert from '../models/SmartAlert';
import { BUSINESS_STATUS, LISTING_STATUS, ACTOR_TYPE } from '@esparex/contracts';
import { formatAppDate } from '@esparex/shared';
import { dispatchTemplatedNotification } from '../domains/notifications/application/NotificationService';
import { renderBusinessExpiryAlertEmail } from '../domains/notifications/templates/EmailLayout';
import { getFrontendAppUrl } from '../utils/appUrl';
import AdminLog from '../models/AdminLog';

const expiryWarningQueue = shouldDisableQueueConnection
    ? createNoopQueue<TraceableJobData>()
    : new Queue('expiry_warning_queue', { connection: redisConnection });

/**
 * ⏰ Expiry Warning Job
 * 
 * Daily proactive notification system to warn users before their 
 * entities (Businesses, Listings, Alerts) expire.
 */
export const runExpiryWarningJob = async (_job?: TraceableJobData): Promise<void> => {
    const startTime = Date.now();
    logger.info('[expiryWarningJob] Starting proactive expiry warning scan...');

    try {
        const warningWindow = new Date();
        warningWindow.setDate(warningWindow.getDate() + 3);

        const now = new Date();

        // 1. Process Businesses
        const expiringBusinesses = await Business.find({
            status: BUSINESS_STATUS.LIVE,
            expiresAt: { $gte: now, $lte: warningWindow },
            expiryWarningSentAt: { $exists: false },
            isDeleted: false
        });

        const renewUrl = `${getFrontendAppUrl()}/account/business`;

        for (const biz of expiringBusinesses) {
            try {
                const expiryDateStr = biz.expiresAt ? formatAppDate(biz.expiresAt) : 'N/A';
                const daysLeft = biz.expiresAt
                    ? Math.max(1, Math.ceil((biz.expiresAt.getTime() - Date.now()) / 86_400_000))
                    : 3;
                const emailHtml = renderBusinessExpiryAlertEmail({
                    businessName: biz.name,
                    expiryDate: expiryDateStr,
                    daysLeft,
                    renewUrl,
                });

                await dispatchTemplatedNotification(
                    biz.userId.toString(),
                    'BUSINESS_STATUS',
                    'BUSINESS_EXPIRY_WARNING_3D',
                    { name: biz.name, date: expiryDateStr },
                    {
                        businessId: biz._id.toString(),
                        channels: ['in-app', 'push', 'email'],
                        emailHtml,
                        emailSubject: `Your Business Expires in ${daysLeft} Day${daysLeft === 1 ? '' : 's'} — Esparex`,
                    }
                );

                biz.expiryWarningSentAt = new Date();
                biz.expiryWarningCount = (biz.expiryWarningCount || 0) + 1;
                biz.lastExpiryWarningChannel = 'email';
                await biz.save();

                await AdminLog.create({
                    action: 'expiry_warning_sent',
                    targetType: 'ExpiryWarning',
                    targetId: biz._id,
                    metadata: {
                        entityType: 'Business',
                        channel: 'email',
                        daysLeft,
                        expiresAt: biz.expiresAt,
                        actorType: ACTOR_TYPE.SYSTEM
                    }
                });
            } catch (err) {
                logger.error(`[expiryWarningJob] Failed to process business ${biz._id}:`, err);
            }
        }

        // 2. Process Ads (Listing Expiry)
        const expiringAds = await Ad.find({
            status: LISTING_STATUS.LIVE,
            expiresAt: { $gte: now, $lte: warningWindow },
            expiryWarningSentAt: { $exists: false },
            isDeleted: false
        });

        for (const ad of expiringAds) {
            try {
                await dispatchTemplatedNotification(
                    ad.sellerId.toString(),
                    'SYSTEM',
                    'LISTING_EXPIRY_WARNING_3D',
                    {
                        title: ad.title,
                        date: ad.expiresAt ? formatAppDate(ad.expiresAt) : 'N/A'
                    },
                    {
                        adId: ad._id.toString(),
                        channels: ['in-app', 'push', 'email'],
                        emailSubject: `Your Listing Expires Soon — Esparex`,
                    }
                );

                ad.expiryWarningSentAt = new Date();
                ad.expiryWarningCount = (ad.expiryWarningCount || 0) + 1;
                ad.lastExpiryWarningChannel = 'email';
                await ad.save();

                await AdminLog.create({
                    action: 'expiry_warning_sent',
                    targetType: 'ExpiryWarning',
                    targetId: ad._id,
                    metadata: {
                        entityType: 'Ad',
                        channel: 'email',
                        expiresAt: ad.expiresAt,
                        actorType: ACTOR_TYPE.SYSTEM
                    }
                });
            } catch (err) {
                logger.error(`[expiryWarningJob] Failed to process ad ${ad._id}:`, err);
            }
        }

        // 3. Process Spotlight Promotions (Optional but requested)
        const expiringSpotlights = await Ad.find({
            isSpotlight: true,
            spotlightExpiresAt: { $gte: now, $lte: warningWindow },
            spotlightWarningSentAt: { $exists: false },
            isDeleted: false
        });

        for (const ad of expiringSpotlights) {
            try {
                await dispatchTemplatedNotification(
                    ad.sellerId.toString(),
                    'SYSTEM',
                    'SPOTLIGHT_EXPIRY_WARNING_3D',
                    {
                        title: ad.title,
                        date: ad.spotlightExpiresAt ? formatAppDate(ad.spotlightExpiresAt) : 'N/A'
                    },
                    {
                        adId: ad._id.toString(),
                        type: 'spotlight',
                        channels: ['in-app', 'push', 'email'],
                        emailSubject: `Your Spotlight Promotion Expires Soon — Esparex`,
                    }
                );

                ad.spotlightWarningSentAt = new Date();
                ad.spotlightWarningCount = (ad.spotlightWarningCount || 0) + 1;
                await ad.save();

                await AdminLog.create({
                    action: 'expiry_warning_sent',
                    targetType: 'SpotlightPromotion',
                    targetId: ad._id,
                    metadata: {
                        type: 'spotlight',
                        channel: 'email',
                        expiresAt: ad.spotlightExpiresAt,
                        actorType: ACTOR_TYPE.SYSTEM
                    }
                });
            } catch (err) {
                logger.error(`[expiryWarningJob] Failed to process spotlight ${ad._id}:`, err);
            }
        }

        // 4. Process Smart Alerts
        const expiringAlerts = await SmartAlert.find({
            isActive: true,
            expiresAt: { $gte: now, $lte: warningWindow },
            expiryWarningSentAt: { $exists: false }
        });

        for (const alert of expiringAlerts) {
            try {
                await dispatchTemplatedNotification(
                    alert.userId.toString(),
                    'SYSTEM',
                    'SMART_ALERT_EXPIRY_WARNING_3D',
                    {
                        name: alert.name || 'Saved Search',
                        date: alert.expiresAt ? formatAppDate(alert.expiresAt) : 'N/A'
                    },
                    {
                        alertId: alert._id.toString(),
                        channels: ['in-app', 'push', 'email'],
                        emailSubject: `Your Saved Search Expires Soon — Esparex`,
                    }
                );

                alert.expiryWarningSentAt = new Date();
                alert.expiryWarningCount = (alert.expiryWarningCount || 0) + 1;
                alert.lastExpiryWarningChannel = 'email';
                await alert.save();

                await AdminLog.create({
                    action: 'expiry_warning_sent',
                    targetType: 'SmartAlert',
                    targetId: alert._id,
                    metadata: {
                        subType: 'SmartAlert',
                        channel: 'email',
                        expiresAt: alert.expiresAt,
                        actorType: ACTOR_TYPE.SYSTEM
                    }
                });
            } catch (err) {
                logger.error(`[expiryWarningJob] Failed to process alert ${alert._id}:`, err);
            }
        }

        const duration = Date.now() - startTime;
        logger.info(`[expiryWarningJob] Proactive scan completed. Found: ${expiringBusinesses.length} biz, ${expiringAds.length} ads, ${expiringSpotlights.length} spotlights, ${expiringAlerts.length} alerts. Duration: ${duration}ms`);

    } catch (error) {
        logger.error('[expiryWarningJob] CRITICAL FAILURE:', error);
        throw error;
    }
};

/**
 * 🛠️ Register the job to the queue
 */
export const scheduleExpiryWarningJob = async (correlationId: string): Promise<void> => {
    await addJobWithTrace(
        expiryWarningQueue,
        'proactive_expiry_warning',
        {},
        {
            repeat: { pattern: '0 8 * * *' }, // Run daily at 8:00 AM
            removeOnComplete: true,
            removeOnFail: 1000,
        },
        correlationId
    );
};
