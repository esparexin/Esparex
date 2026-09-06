import crypto from 'crypto';

import { NOTIFICATION_TYPE, type NotificationTypeValue } from '@esparex/contracts';

export interface EntityRef {
    domain: string;
    id: string;
}

export interface FromSmartAlertParams {
    userId: string;
    alertName: string;
    adId: string;
    alertId: string;
    channels?: string[];
}

export interface FromSchedulerJobParams {
    userId: string;
    jobId: string;
    title: string;
    body: string;
    targetType: string;
    actionUrl?: string;
}

export interface FromAdminBroadcastParams {
    userId: string;
    broadcastId: string;
    title: string;
    body: string;
    kind?: string;
    targetType?: string;
    actionUrl?: string;
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

    static fromSmartAlert(params: FromSmartAlertParams): NotificationIntent {
        const channels = params.channels ?? ['push', 'in-app'];
        return new NotificationIntent({
            userId: params.userId,
            type: NOTIFICATION_TYPE.SMART_ALERT,
            entityRef: { domain: 'ad', id: params.adId },
            message: {
                title: 'New Ad Alert',
                body: `A new ad matches your alert: ${params.alertName}`,
                data: { adId: params.adId, alertId: params.alertId, type: NOTIFICATION_TYPE.SMART_ALERT }
            },
            priority: 'high',
            channels,
            metadata: { alertId: params.alertId }
        });
    }

    static fromSchedulerJob(params: FromSchedulerJobParams): NotificationIntent {
        return new NotificationIntent({
            userId: params.userId,
            type: NOTIFICATION_TYPE.SYSTEM,
            entityRef: { domain: 'admin_broadcast', id: params.jobId },
            message: {
                title: params.title,
                body: params.body,
                data: {
                    kind: 'admin_broadcast_scheduled',
                    targetType: params.targetType,
                    ...(params.actionUrl ? { actionUrl: params.actionUrl, link: params.actionUrl } : {}),
                }
            },
            priority: 'medium',
            channels: ['push', 'in-app']
        });
    }

    static fromAdminBroadcast(params: FromAdminBroadcastParams): NotificationIntent {
        const kind = params.kind ?? 'admin_broadcast';
        return new NotificationIntent({
            userId: params.userId,
            type: NOTIFICATION_TYPE.SYSTEM,
            entityRef: { domain: 'admin_broadcast', id: params.broadcastId },
            message: {
                title: params.title,
                body: params.body,
                data: {
                    kind,
                    targetType: params.targetType,
                    ...(params.actionUrl ? { actionUrl: params.actionUrl, link: params.actionUrl } : {}),
                }
            },
            priority: 'medium',
            channels: ['push', 'in-app']
        });
    }
}

