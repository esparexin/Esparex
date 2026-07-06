import crypto from 'crypto';
import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import { notificationMatchQueue } from '../../queues/adQueue';
import { assertListingApprovedEvent } from '../../services/lifecycle/LifecyclePolicyGuard';
import {
    releaseQueueIdempotencySlot,
    reserveQueueIdempotencySlot
} from '../../queues/queueIdempotency';
import { withQueueDefaults } from '../../queues/queueDefaults';
import { isQueueConnectionAvailable } from '../../queues/redisConnection';
import { addJobWithTrace } from '../../infrastructure/bullmq/queueWrapper';
import { emitReliabilityAlert } from '../../infrastructure/telemetry/reliabilityAlerts';
import { reliabilityAlertsTotal } from '../../infrastructure/telemetry/metrics';

export const registerNotificationTriggerListener = () => {
    lifecycleEvents.on('listing.approved', async (payload) => {
        let reservedJobId: string | null = null;
        try {
            const event = assertListingApprovedEvent(payload);
            const adId = event.listingId;

            const rawKey = `${adId}:LISTING_APPROVED`;
            const jobId = crypto.createHash('sha256').update(rawKey).digest('hex');

            logger.info('[NotificationTrigger] listing.approved intercepted', {
                listingId: event.listingId,
                listingType: event.listingType,
                approvedAt: event.approvedAt,
            });

            if (!isQueueConnectionAvailable()) {
                reliabilityAlertsTotal.labels('QUEUE_PAUSED_REDIS_UNAVAILABLE', 'high').inc();
                void emitReliabilityAlert({
                    type: 'QUEUE_PAUSED_REDIS_UNAVAILABLE',
                    title: 'Queue paused due to Redis outage',
                    severity: 'high',
                    summary: 'notification.match.queue is unavailable',
                    dedupeKey: 'queue_paused_notification_match',
                    metadata: {
                        queueName: 'notification.match.queue',
                        listingId: event.listingId,
                    },
                });
                return;
            }

            const reserved = await reserveQueueIdempotencySlot('notification.match.queue', jobId, 6 * 60 * 60);
            if (!reserved) {
                logger.info('[NotificationTrigger] Duplicate process_smart_alerts enqueue skipped', {
                    listingId: event.listingId,
                    jobId,
                });
                return;
            }
            reservedJobId = jobId;

            await addJobWithTrace(
                notificationMatchQueue,
                'process_smart_alerts',
                { adId },
                withQueueDefaults({
                    jobId,
                    removeOnComplete: 500,
                    removeOnFail: 1_000,
                })
            );

            logger.info(`[NotificationTrigger] Enqueued process_smart_alerts`, {
                adId,
                jobId,
            });
        } catch (error) {
            if (reservedJobId) {
                await releaseQueueIdempotencySlot('notification.match.queue', reservedJobId);
            }
            logger.error('[NotificationTrigger] Failed to process listing.approved event', {
                error: error instanceof Error ? error.message : String(error),
                payload,
            });
        }
    }, 'NotificationTrigger_ListingApproved');

    logger.info('[NotificationTrigger] Listener registered successfully.');
};
