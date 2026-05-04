"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatcher = void 0;
const adQueue_1 = require("@core/queues/adQueue");
const Notification_1 = __importDefault(require("@core/models/Notification"));
const NotificationVersionService_1 = require("./NotificationVersionService");
const socket_1 = require("@core/config/socket");
const PushGatewayService_1 = require("./PushGatewayService");
const logger_1 = __importDefault(require("@core/utils/logger"));
const NotificationPreferenceService_1 = require("./NotificationPreferenceService");
class NotificationDispatcher {
    /**
     * Entry point for all notifications.
     * Pushes the intent to a background queue for processing.
     */
    static async dispatch(intent, options = {}) {
        try {
            const jobData = {
                intent: { ...intent },
                options
            };
            await adQueue_1.notificationDeliveryQueue.add(intent.type === 'SYSTEM' ? 'system_notification' : 'user_notification', jobData, {
                jobId: intent.dedupKey,
                priority: intent.priority === 'high' ? 1 : (intent.priority === 'medium' ? 2 : 3),
            });
            return { success: true };
        }
        catch (error) {
            logger_1.default.error('[Dispatcher] Failed to enqueue notification', {
                userId: intent.userId,
                type: intent.type,
                error: error instanceof Error ? error.message : String(error)
            });
            // Fallback to sync dispatch in case of queue failure for resiliency
            return this.executeDispatch(intent, options);
        }
    }
    /**
     * Execution engine: Persists to DB, updates real-time version, and pushes to FCM.
     * Called by the background worker.
     */
    static async executeDispatch(intent, options = {}) {
        try {
            const { shadowDispatch = false } = options;
            const { suppress, channels } = await (0, NotificationPreferenceService_1.resolveNotificationDeliveryPlan)({
                userId: intent.userId,
                type: intent.type,
                entityDomain: intent.entityRef.domain,
                channels: intent.channels,
            });
            if (suppress) {
                logger_1.default.info("[Dispatcher] Notification suppressed by user preferences", {
                    userId: intent.userId,
                    type: intent.type,
                    entityDomain: intent.entityRef.domain,
                });
                return { success: true, skipped: true };
            }
            intent.channels = channels;
            // 1. Persist to Inbox (Handles Deduplication Unique Constraint)
            const dbRecord = new Notification_1.default({
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
                actionUrl: typeof intent.message.data?.link === 'string'
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
            }
            catch (err) {
                if (err.code === 11000) {
                    // E11000 duplicate key error, means idempotency protected the user
                    logger_1.default.debug(`[Dispatcher] Ignored duplicate NotificationIntent`, { dedupKey: intent.dedupKey, userId: intent.userId });
                    return { success: true, skipped: true };
                }
                throw err;
            }
            // 2. Realtime Emit (Websocket push using inbox_version strategy)
            try {
                const newVersion = await NotificationVersionService_1.NotificationVersionService.incrementVersion(intent.userId);
                // Keep the DB record version in sync
                dbRecord.version = newVersion;
                await dbRecord.save();
                // Direct or proxied websocket emit (frontend cache invalidation)
                try {
                    (0, socket_1.getIO)().to(intent.userId).emit('inbox_updated', {
                        userId: intent.userId,
                        version: newVersion,
                        delta: +1
                    });
                }
                catch {
                    // Ignore missing socket route during standalone worker execution decoupling
                }
            }
            catch (syncError) {
                logger_1.default.error('[Dispatcher] Non-fatal realtime sync error', { error: syncError.message });
            }
            // 3. Shadow Mode Guard
            if (shadowDispatch) {
                logger_1.default.info(`[Dispatcher:SHADOW] Skipped push dispatch for NotificationIntent`, { recordId: dbRecord._id });
                return { success: true, skipped: true };
            }
            // 4. Channel Dispatch (FCM Push)
            if (intent.channels.includes('push')) {
                try {
                    // FCM expects string values for all data keys
                    const fcmData = intent.message.data || {};
                    await (0, PushGatewayService_1.sendNotification)(intent.userId, intent.message.title, intent.message.body, fcmData);
                    dbRecord.deliveryStatus = dbRecord.deliveryStatus || { fcm: 'pending', email: 'skipped', sms: 'skipped' };
                    dbRecord.deliveryStatus.fcm = 'sent';
                    await dbRecord.save();
                }
                catch (pushError) {
                    dbRecord.retryCount = (dbRecord.retryCount || 0) + 1;
                    dbRecord.deliveryStatus = dbRecord.deliveryStatus || { fcm: 'pending', email: 'skipped', sms: 'skipped' };
                    dbRecord.deliveryStatus.fcm = 'failed';
                    await dbRecord.save();
                    logger_1.default.error(`[Dispatcher] FCM push failed`, { error: pushError.message, recordId: dbRecord._id });
                    // Throw to BullMQ for exponential backoff if running in a worker context
                    throw pushError;
                }
            }
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`[Dispatcher] Critical failure processing intent`, { error: error.message, intent });
            throw error;
        }
    }
    /**
     * Batch API for worker optimisation
     */
    static async bulkDispatch(intents, options = {}) {
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
            }
            catch (err) {
                failureCount += 1;
                logger_1.default.warn(`[Dispatcher:Bulk] Single intent failed inside batch`, { dedupKey: intent.dedupKey, error: err.message });
            }
        });
        await Promise.all(promises);
        return { successCount, skippedCount, failureCount };
    }
}
exports.NotificationDispatcher = NotificationDispatcher;
//# sourceMappingURL=NotificationDispatcher.js.map