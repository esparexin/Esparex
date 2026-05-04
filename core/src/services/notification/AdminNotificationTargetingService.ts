import mongoose from "mongoose";

import {
    ADMIN_NOTIFICATION_TARGET_TYPE,
    ADMIN_NOTIFICATION_TOPIC,
    ADMIN_NOTIFICATION_TOPIC_VALUES,
    type AdminNotificationTargetTypeValue,
    type AdminNotificationTopicValue,
} from "@esparex/shared/constants/adminNotificationTargets";
import User from "@esparex/core/models/User";

type NotificationTargetParams = {
    targetType: AdminNotificationTargetTypeValue;
    targetValue?: string;
    userIds?: string[];
};

import { USER_STATUS } from "@esparex/core/constants/enums/userStatus";
import { Role } from "@esparex/core/constants/enums/roles";

const ACTIVE_USER_QUERY: Record<string, any> = {
    isDeleted: { $ne: true },
    status: { $nin: [USER_STATUS.DELETED, USER_STATUS.BANNED] },
    role: { $in: [Role.USER, Role.BUSINESS] },
};

const TOPIC_PLATFORM_MAP: Record<AdminNotificationTopicValue, "web" | "android" | "ios"> = {
    [ADMIN_NOTIFICATION_TOPIC.PLATFORM_WEB]: "web",
    [ADMIN_NOTIFICATION_TOPIC.PLATFORM_ANDROID]: "android",
    [ADMIN_NOTIFICATION_TOPIC.PLATFORM_IOS]: "ios",
};

export const isAdminNotificationTopic = (value: unknown): value is AdminNotificationTopicValue =>
    typeof value === "string" &&
    (ADMIN_NOTIFICATION_TOPIC_VALUES as readonly string[]).includes(value);

export const sanitizeNotificationUserIds = (userIds: unknown): string[] =>
    Array.isArray(userIds)
        ? userIds
            .filter((id): id is string => typeof id === "string" && mongoose.Types.ObjectId.isValid(id))
            .map((id) => id.trim())
        : [];

export function buildAdminNotificationTargetQuery({
    targetType,
    targetValue,
    userIds,
}: NotificationTargetParams) {
    if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.ALL) {
        return ACTIVE_USER_QUERY;
    }

    if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC) {
        if (!isAdminNotificationTopic(targetValue)) {
            throw new Error("Invalid notification topic");
        }

        return {
            ...ACTIVE_USER_QUERY,
            "fcmTokens.platform": TOPIC_PLATFORM_MAP[targetValue],
        };
    }

    if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.USERS) {
        const sanitizedUserIds = sanitizeNotificationUserIds(userIds);
        if (sanitizedUserIds.length === 0) {
            throw new Error("User IDs required");
        }

        return {
            ...ACTIVE_USER_QUERY,
            _id: { $in: sanitizedUserIds },
        };
    }

    throw new Error("Invalid notification target");
}

export function createAdminNotificationTargetCursor(params: NotificationTargetParams) {
    return User.find(buildAdminNotificationTargetQuery(params)).select("_id").cursor();
}
