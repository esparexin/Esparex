import Notification from '../../models/Notification';
import { NotificationIntent } from '../../domain/NotificationIntent';
import logger from '../../utils/logger';

interface DispatchOptions {
    shadowDispatch?: boolean;
}

export class NotificationDispatcher {
    /**
     * Centralized gateway for all notifications.
     */
    static async dispatch(intent: NotificationIntent, options: DispatchOptions = {}): Promise<void> {
        try {
            const { shadowDispatch = false } = options;

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
                    fcm: 'pending',
                    email: 'skipped',
                    sms: 'skipped'
                },
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
                    return;
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
                return;
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
        } catch (error: any) {
            logger.error(`[Dispatcher] Critical failure processing intent`, { error: error.message, intent });
            throw error;
        }
    }

    /**
     * Batch API for worker optimisation
     */
    static async bulkDispatch(intents: NotificationIntent[], options: DispatchOptions = {}): Promise<void> {
        // Simple Promise.all dispatcher. 
        // Note: For massive scale, this would break into chunks of X or use Notification.insertMany
        // with `ordered: false` to silently catch duplicates en-masse, then dispatch the successful inserts.
        const promises = intents.map(intent => this.dispatch(intent, options).catch(err => {
            logger.warn(`[Dispatcher:Bulk] Single intent failed inside batch`, { dedupKey: intent.dedupKey, error: err.message });
        }));
        
        await Promise.all(promises);
    }
}
