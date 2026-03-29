import { NOTIFICATION_TYPE, type NotificationTypeValue } from "@shared/enums/notificationType";

import User from "../../models/User";

type NotificationChannel = "push" | "email" | "sms" | "in-app";

type NotificationPreferenceSnapshot = {
    adUpdates?: boolean;
    promotions?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    dailyDigest?: boolean;
    instantAlerts?: boolean;
    email?: boolean;
    push?: boolean;
};

type DeliveryPlanInput = {
    userId: string;
    type: NotificationTypeValue;
    entityDomain?: string;
    channels: string[];
};

type DeliveryPlan = {
    suppress: boolean;
    channels: NotificationChannel[];
};

const normalizeSnapshot = (raw: unknown): NotificationPreferenceSnapshot => {
    if (!raw || typeof raw !== "object") {
        return {};
    }

    const source = raw as Record<string, unknown>;

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

export async function resolveNotificationDeliveryPlan({
    userId,
    type,
    entityDomain,
    channels,
}: DeliveryPlanInput): Promise<DeliveryPlan> {
    const user = await User.findById(userId).select("notificationSettings").lean();
    const settings = normalizeSnapshot(user?.notificationSettings);

    if (
        (type === NOTIFICATION_TYPE.AD_STATUS || type === NOTIFICATION_TYPE.BUSINESS_STATUS) &&
        settings.adUpdates === false
    ) {
        return { suppress: true, channels: [] };
    }

    if (type === NOTIFICATION_TYPE.SMART_ALERT && settings.instantAlerts === false) {
        return { suppress: true, channels: [] };
    }

    if (type === NOTIFICATION_TYPE.SYSTEM && entityDomain === "admin_broadcast" && settings.promotions === false) {
        return { suppress: true, channels: [] };
    }

    const filteredChannels = channels.filter((channel): channel is NotificationChannel => {
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
