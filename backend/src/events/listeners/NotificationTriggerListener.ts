import crypto from 'crypto';
import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import { notificationMatchQueue } from '../../queues/adQueue';
import { assertListingApprovedEvent } from '../../services/LifecyclePolicyGuard';

export const registerNotificationTriggerListener = () => {
    lifecycleEvents.on('listing.approved', async (payload) => {
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

            await notificationMatchQueue.add(
                'process_smart_alerts',
                { adId },
                {
                    jobId,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                }
            );

            logger.info(`[NotificationTrigger] Enqueued process_smart_alerts`, {
                adId,
                jobId,
            });
        } catch (error) {
            logger.error('[NotificationTrigger] Failed to process listing.approved event', {
                error: error instanceof Error ? error.message : String(error),
                payload,
            });
        }
    }, 'NotificationTrigger_ListingApproved');

    logger.info('[NotificationTrigger] Listener registered successfully.');
};
