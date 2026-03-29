import crypto from 'crypto';

import { NOTIFICATION_TYPE, type NotificationTypeValue } from '@shared/enums/notificationType';

export interface EntityRef {
    domain: string;
    id: string;
}

export class NotificationIntent {
    userId: string;
    type: NotificationTypeValue;
    entityRef: EntityRef;
    message: { title: string; body: string; data?: Record<string, unknown> };
    priority: 'high' | 'medium' | 'low';
    dedupKey: string;
    channels: string[];
    metadata?: Record<string, unknown>;

    constructor(init: {
        userId: string;
        type: NotificationTypeValue;
        entityRef: EntityRef;
        message: { title: string; body: string; data?: Record<string, unknown> };
        priority?: 'high' | 'medium' | 'low';
        channels?: string[];
        metadata?: Record<string, unknown>;
        dedupKey?: string;
    }) {
        this.userId = init.userId;
        this.type = init.type;
        this.entityRef = init.entityRef;
        this.message = init.message;
        this.priority = init.priority || 'medium';
        this.channels = init.channels && init.channels.length > 0 ? init.channels : ['in-app'];
        this.metadata = init.metadata;
        
        // Ensure partial dedup uniqueness (per user, per domain id, per type)
        // Note: TTL index in schema handles temporal deduplication window (e.g. 24h)
        this.dedupKey = init.dedupKey || crypto
            .createHash('sha256')
            .update(`${this.userId}:${this.type}:${this.entityRef.domain}:${this.entityRef.id}`)
            .digest('hex');
    }

    static fromSmartAlert(
        userId: string,
        alertName: string,
        adId: string,
        alertId: string,
        channels: string[] = ['push', 'in-app']
    ): NotificationIntent {
        return new NotificationIntent({
            userId,
            type: NOTIFICATION_TYPE.SMART_ALERT,
            entityRef: { domain: 'ad', id: adId },
            message: {
                title: 'New Ad Alert',
                body: `A new ad matches your alert: ${alertName}`,
                data: { adId, alertId, type: NOTIFICATION_TYPE.SMART_ALERT }
            },
            priority: 'high',
            channels,
            metadata: { alertId }
        });
    }

    static fromSchedulerJob(
        userId: string,
        jobId: string,
        title: string,
        body: string,
        targetType: string,
        actionUrl?: string
    ): NotificationIntent {
        return new NotificationIntent({
            userId,
            type: NOTIFICATION_TYPE.SYSTEM,
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

    static fromAdminBroadcast(
        userId: string,
        broadcastId: string,
        title: string,
        body: string,
        kind: string = 'admin_broadcast',
        targetType?: string,
        actionUrl?: string
    ): NotificationIntent {
        return new NotificationIntent({
            userId,
            type: NOTIFICATION_TYPE.SYSTEM,
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
