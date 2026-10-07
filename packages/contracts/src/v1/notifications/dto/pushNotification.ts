import type { NotificationTypeValue } from '../enums/notificationType';

/**
 * Phase 3a (§5) — canonical notification payloads.
 *
 * Relocated from `apps/mobile/src/features/notifications/domain/NotificationPayload.ts`
 * (`PushNotificationPayload`, `NotificationResponse`) and
 * `apps/web/src/lib/api/user/notifications.ts`
 * (`Notification`, `NotificationResponse`) — DECISION-GATE §5; evidence
 * `areas/04-contract-ssot.md` Finding 3 (unique API payloads with no contract home).
 *
 * CONFLICT (recorded, not merged — DECISION-GATE §10 forbids silent merges):
 * two same-named local `NotificationResponse` declarations with different shapes:
 * - `apps/mobile/src/features/notifications/domain/NotificationPayload.ts:15` —
 *   device tap interaction { actionIdentifier, notification }
 * - `apps/web/src/lib/api/user/notifications.ts:22` —
 *   notification list { success, notifications, pagination, unreadCount }
 * Canonicalized under distinct names below; each local file re-exports its
 * historic name as an alias. A future gate decision may unify them.
 */
export interface PushNotificationPayload {
    readonly id: string;
    readonly title?: string;
    readonly body?: string;
    readonly data?: Record<string, unknown>;
}

export interface PushNotificationActionResponse {
    readonly actionIdentifier: string;
    readonly notification: PushNotificationPayload;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationTypeValue;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high';
    channels?: string[];
    deliveryStatus?: Record<string, 'pending' | 'sent' | 'failed' | 'skipped'>;
    entityRef?: { domain: string; id: string };
}

export interface NotificationListResponse {
    success: boolean;
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    unreadCount: number;
}
