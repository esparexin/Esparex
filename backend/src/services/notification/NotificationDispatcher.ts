import Notification from '../../models/Notification';
import { NotificationIntent } from '../../domain/NotificationIntent';
import logger from '../../utils/logger';
import { resolveNotificationDeliveryPlan } from './NotificationPreferenceService';

interface DispatchOptions {
    shadowDispatch?: boolean;
}

export interface NotificationDispatchResult {
    success: boolean;
    skipped?: boolean;
}

export interface NotificationBulkDispatchResult {
    successCount: number;
    skippedCount: number;
    failureCount: number;
}

export class NotificationDispatcher {
    /**
     * Centralized gateway for all notifications.
     */
    static async dispatch(intent: NotificationIntent, options: DispatchOptions = {}): Promise<NotificationDispatchResult> {
        try {
            const { shadowDispatch = false } = options;
            const { suppress, channels } = await resolveNotificationDeliveryPlan({
                userId: intent.userId,
                type: intent.type,
                entityDomain: intent.entityRef.domain,
                channels: intent.channels,
            });

            if (suppress) {
                logger.info("[Dispatcher] Notification suppressed by user preferences", {
                    userId: intent.userId,
                    type: intent.type,
                    entityDomain: intent.entityRef.domain,
                });
                return { success: true, skipped: true };
            }

            intent.channels = channels;

            // 1. Persist to Inbox (Handles Deduplication Unique Constraint)
            const dbRecord = new Notification({
                userId: intent.userId,
                type: intent.type,
                title: intent.message.title,
                message: intent.message.body,
                data: intent.message.data,
                priority: intent.priority,
                channels: intent.channels,
                dedupKey: intent.dedupKey,
                isRead: false,
                deliveryStatus: {
                    fcm: intent.channels.includes('push') ? 'pending' : 'skipped',
                    email: 'skipped',
                    sms: 'skipped'
                },
                actionUrl:
                    typeof intent.message.data?.link === 'string'
                        ? intent.message.data.link
                        : typeof intent.message.data?.actionUrl === 'string'
                            ? intent.message.data.actionUrl
                            : undefined,
                entityRef: intent.entityRef,
                version: 1,
                retryCount: 0
            });

            try {
                await dbRecord.save();
            } catch (err: any) {
                if (err.code === 11000) {
                    // E11000 duplicate key error, means idempotency protected the user
                    logger.debug(`[Dispatcher] Ignored duplicate NotificationIntent`, { dedupKey: intent.dedupKey, userId: intent.userId });
                    return { success: true, skipped: true };
                }
                throw err;
            }

            // 2. Realtime Emit (Websocket push using inbox_version strategy)
            try {
                const { NotificationVersionService } = await import('./NotificationVersionService');
                const newVersion = await NotificationVersionService.incrementVersion(intent.userId);
                
                // Keep the DB record version in sync
                dbRecord.version = newVersion;
                await dbRecord.save();

                // Direct or proxied websocket emit (frontend cache invalidation)
                try {
                    const { getIO } = require('../../config/socket'); // Typical socket abstraction
                    getIO().to(intent.userId).emit('inbox_updated', {
                        userId: intent.userId,
                        version: newVersion,
                        delta: +1
                    });
                } catch (e) {
                    // Ignore missing socket route during standalone worker execution decoupling
                }
            } catch (syncError: any) {
                logger.error('[Dispatcher] Non-fatal realtime sync error', { error: syncError.message });
            }

            // 3. Shadow Mode Guard
            if (shadowDispatch) {
                logger.info(`[Dispatcher:SHADOW] Skipped push dispatch for NotificationIntent`, { recordId: dbRecord._id });
                return { success: true, skipped: true };
            }

            // 4. Channel Dispatch (FCM Push)
            if (intent.channels.includes('push')) {
                try {
                    const { sendNotification } = await import('../NotificationService');
                    // FCM expects string values for all data keys
                    const fcmData = (intent.message.data as Record<string, string>) || {};
                    await sendNotification(intent.userId, intent.message.title, intent.message.body, fcmData);
                    
                    dbRecord.deliveryStatus = dbRecord.deliveryStatus || { fcm: 'pending', email: 'skipped', sms: 'skipped' };
                    dbRecord.deliveryStatus.fcm = 'sent';
                    await dbRecord.save();
                } catch (pushError: any) {
                    dbRecord.retryCount = (dbRecord.retryCount || 0) + 1;
                    dbRecord.deliveryStatus = dbRecord.deliveryStatus || { fcm: 'pending', email: 'skipped', sms: 'skipped' };
                    dbRecord.deliveryStatus.fcm = 'failed';
                    await dbRecord.save();
                    
                    logger.error(`[Dispatcher] FCM push failed`, { error: pushError.message, recordId: dbRecord._id });
                    // Throw to BullMQ for exponential backoff if running in a worker context
                    throw pushError;
                }
            }
            return { success: true };
        } catch (error: any) {
            logger.error(`[Dispatcher] Critical failure processing intent`, { error: error.message, intent });
            throw error;
        }
    }

    /**
     * Batch API for worker optimisation
     */
    static async bulkDispatch(
        intents: NotificationIntent[],
        options: DispatchOptions = {}
    ): Promise<NotificationBulkDispatchResult> {
        // Simple Promise.all dispatcher. 
        // Note: For massive scale, this would break into chunks of X or use Notification.insertMany
        // with `ordered: false` to silently catch duplicates en-masse, then dispatch the successful inserts.
        let successCount = 0;
        let skippedCount = 0;
        let failureCount = 0;

        const promises = intents.map(async (intent) => {
            try {
                const result = await this.dispatch(intent, options);
                if (result.skipped) {
                    skippedCount += 1;
                    return;
                }
                successCount += 1;
            } catch (err: any) {
                failureCount += 1;
                logger.warn(`[Dispatcher:Bulk] Single intent failed inside batch`, { dedupKey: intent.dedupKey, error: err.message });
            }
        });

        await Promise.all(promises);
        return { successCount, skippedCount, failureCount };
    }
}
