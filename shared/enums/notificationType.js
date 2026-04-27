"use strict";
/**
 * Notification Type Enum — Single Source of Truth
 *
 * Used across backend (model, dispatcher, intents),
 * frontend (api/user/notifications.ts, Notifications.tsx),
 * and admin-frontend (types/notification.ts).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPE_VALUES = exports.NOTIFICATION_TYPE = void 0;
exports.NOTIFICATION_TYPE = {
    SMART_ALERT: 'SMART_ALERT',
    ORDER_UPDATE: 'ORDER_UPDATE',
    AD_STATUS: 'AD_STATUS',
    BUSINESS_STATUS: 'BUSINESS_STATUS',
    SYSTEM: 'SYSTEM',
    PRICE_DROP: 'PRICE_DROP',
    CHAT: 'CHAT',
};
exports.NOTIFICATION_TYPE_VALUES = Object.values(exports.NOTIFICATION_TYPE);
//# sourceMappingURL=notificationType.js.map