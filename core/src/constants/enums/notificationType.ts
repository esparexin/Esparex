/**
 * Notification Type Enum — Single Source of Truth
 *
 * Used across backend (model, dispatcher, intents),
 * frontend (api/user/notifications.ts, Notifications.tsx),
 * and admin-frontend (types/notification.ts).
 */

export const NOTIFICATION_TYPE = {
    SMART_ALERT:     'SMART_ALERT',
    ORDER_UPDATE:    'ORDER_UPDATE',
    AD_STATUS:       'AD_STATUS',
    BUSINESS_STATUS: 'BUSINESS_STATUS',
    SYSTEM:          'SYSTEM',
    PRICE_DROP:      'PRICE_DROP',
    CHAT:            'CHAT',
} as const;

export type NotificationTypeValue = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPE) as [
    NotificationTypeValue,
    ...NotificationTypeValue[]
];
