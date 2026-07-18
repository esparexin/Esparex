/**
 * Notification Type Enum — Single Source of Truth
 *
 * Used across backend (model, dispatcher, intents),
 * frontend (api/user/notifications.ts, Notifications.tsx),
 * and apps/admin (types/notification.ts).
 */
export declare const NOTIFICATION_TYPE: {
    readonly SMART_ALERT: "SMART_ALERT";
    readonly ORDER_UPDATE: "ORDER_UPDATE";
    readonly AD_STATUS: "AD_STATUS";
    readonly BUSINESS_STATUS: "BUSINESS_STATUS";
    readonly SYSTEM: "SYSTEM";
    readonly PRICE_DROP: "PRICE_DROP";
    readonly CHAT: "CHAT";
    readonly CATALOG_ITEM_APPROVED: "CATALOG_ITEM_APPROVED";
};
export type NotificationTypeValue = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export declare const NOTIFICATION_TYPE_VALUES: [NotificationTypeValue, ...NotificationTypeValue[]];
