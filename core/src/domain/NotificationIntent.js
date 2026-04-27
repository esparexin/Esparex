"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationIntent = void 0;
const crypto_1 = __importDefault(require("crypto"));
const notificationType_1 = require("@core/constants/enums/notificationType");
class NotificationIntent {
    userId;
    type;
    entityRef;
    message;
    priority;
    dedupKey;
    channels;
    metadata;
    constructor(init) {
        this.userId = init.userId;
        this.type = init.type;
        this.entityRef = init.entityRef;
        this.message = init.message;
        this.priority = init.priority || 'medium';
        this.channels = init.channels && init.channels.length > 0 ? init.channels : ['in-app'];
        this.metadata = init.metadata;
        // Ensure partial dedup uniqueness (per user, per domain id, per type)
        // Note: TTL index in schema handles temporal deduplication window (e.g. 24h)
        this.dedupKey = init.dedupKey || crypto_1.default
            .createHash('sha256')
            .update(`${this.userId}:${this.type}:${this.entityRef.domain}:${this.entityRef.id}`)
            .digest('hex');
    }
    static fromSmartAlert(userId, alertName, adId, alertId, channels = ['push', 'in-app']) {
        return new NotificationIntent({
            userId,
            type: notificationType_1.NOTIFICATION_TYPE.SMART_ALERT,
            entityRef: { domain: 'ad', id: adId },
            message: {
                title: 'New Ad Alert',
                body: `A new ad matches your alert: ${alertName}`,
                data: { adId, alertId, type: notificationType_1.NOTIFICATION_TYPE.SMART_ALERT }
            },
            priority: 'high',
            channels,
            metadata: { alertId }
        });
    }
    static fromSchedulerJob(userId, jobId, title, body, targetType, actionUrl) {
        return new NotificationIntent({
            userId,
            type: notificationType_1.NOTIFICATION_TYPE.SYSTEM,
            entityRef: { domain: 'admin_broadcast', id: jobId },
            message: {
                title,
                body,
                data: {
                    kind: 'admin_broadcast_scheduled',
                    targetType,
                    ...(actionUrl ? { actionUrl, link: actionUrl } : {}),
                }
            },
            priority: 'medium',
            channels: ['push', 'in-app']
        });
    }
    static fromAdminBroadcast(userId, broadcastId, title, body, kind = 'admin_broadcast', targetType, actionUrl) {
        return new NotificationIntent({
            userId,
            type: notificationType_1.NOTIFICATION_TYPE.SYSTEM,
            entityRef: { domain: 'admin_broadcast', id: broadcastId },
            message: {
                title,
                body,
                data: {
                    kind,
                    targetType,
                    ...(actionUrl ? { actionUrl, link: actionUrl } : {}),
                }
            },
            priority: 'medium',
            channels: ['push', 'in-app']
        });
    }
}
exports.NotificationIntent = NotificationIntent;
//# sourceMappingURL=NotificationIntent.js.map