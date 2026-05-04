"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveNotificationDeliveryPlan = resolveNotificationDeliveryPlan;
const notificationType_1 = require("@core/constants/enums/notificationType");
const User_1 = __importDefault(require("@core/models/User"));
const normalizeSnapshot = (raw) => {
    if (!raw || typeof raw !== "object") {
        return {};
    }
    const source = raw;
    return {
        adUpdates: typeof source.adUpdates === "boolean" ? source.adUpdates : undefined,
        promotions: typeof source.promotions === "boolean" ? source.promotions : undefined,
        emailNotifications: typeof source.emailNotifications === "boolean" ? source.emailNotifications : undefined,
        pushNotifications: typeof source.pushNotifications === "boolean" ? source.pushNotifications : undefined,
        dailyDigest: typeof source.dailyDigest === "boolean" ? source.dailyDigest : undefined,
        instantAlerts: typeof source.instantAlerts === "boolean" ? source.instantAlerts : undefined,
        email: typeof source.email === "boolean" ? source.email : undefined,
        push: typeof source.push === "boolean" ? source.push : undefined,
    };
};
async function resolveNotificationDeliveryPlan({ userId, type, entityDomain, channels, }) {
    const user = await User_1.default.findById(userId).select("notificationSettings").lean();
    const settings = normalizeSnapshot(user?.notificationSettings);
    if ((type === notificationType_1.NOTIFICATION_TYPE.LISTING_STATUS || type === notificationType_1.NOTIFICATION_TYPE.BUSINESS_STATUS) &&
        settings.adUpdates === false) {
        return { suppress: true, channels: [] };
    }
    if (type === notificationType_1.NOTIFICATION_TYPE.SMART_ALERT && settings.instantAlerts === false) {
        return { suppress: true, channels: [] };
    }
    if (type === notificationType_1.NOTIFICATION_TYPE.SYSTEM && entityDomain === "admin_broadcast" && settings.promotions === false) {
        return { suppress: true, channels: [] };
    }
    const filteredChannels = channels.filter((channel) => {
        if (channel !== "push" && channel !== "email" && channel !== "sms" && channel !== "in-app") {
            return false;
        }
        if (channel === "push" && (settings.pushNotifications === false || settings.push === false)) {
            return false;
        }
        if (channel === "email" && (settings.emailNotifications === false || settings.email === false)) {
            return false;
        }
        // Admin broadcasts should still land in-app even when push is disabled.
        if (channel === "in-app" && entityDomain === "admin_broadcast") {
            return true;
        }
        return true;
    });
    return {
        suppress: filteredChannels.length === 0,
        channels: filteredChannels,
    };
}
//# sourceMappingURL=NotificationPreferenceService.js.map