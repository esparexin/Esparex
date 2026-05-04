"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeNotificationUserIds = exports.isAdminNotificationTopic = void 0;
exports.buildAdminNotificationTargetQuery = buildAdminNotificationTargetQuery;
exports.createAdminNotificationTargetCursor = createAdminNotificationTargetCursor;
const mongoose_1 = __importDefault(require("mongoose"));
const adminNotificationTargets_1 = require("@shared/constants/adminNotificationTargets");
const User_1 = __importDefault(require("@core/models/User"));
const userStatus_1 = require("@core/constants/enums/userStatus");
const roles_1 = require("@core/constants/enums/roles");
const ACTIVE_USER_QUERY = {
    isDeleted: { $ne: true },
    status: { $nin: [userStatus_1.USER_STATUS.DELETED, userStatus_1.USER_STATUS.BANNED] },
    role: { $in: [roles_1.Role.USER, roles_1.Role.BUSINESS] },
};
const TOPIC_PLATFORM_MAP = {
    [adminNotificationTargets_1.ADMIN_NOTIFICATION_TOPIC.PLATFORM_WEB]: "web",
    [adminNotificationTargets_1.ADMIN_NOTIFICATION_TOPIC.PLATFORM_ANDROID]: "android",
    [adminNotificationTargets_1.ADMIN_NOTIFICATION_TOPIC.PLATFORM_IOS]: "ios",
};
const isAdminNotificationTopic = (value) => typeof value === "string" &&
    adminNotificationTargets_1.ADMIN_NOTIFICATION_TOPIC_VALUES.includes(value);
exports.isAdminNotificationTopic = isAdminNotificationTopic;
const sanitizeNotificationUserIds = (userIds) => Array.isArray(userIds)
    ? userIds
        .filter((id) => typeof id === "string" && mongoose_1.default.Types.ObjectId.isValid(id))
        .map((id) => id.trim())
    : [];
exports.sanitizeNotificationUserIds = sanitizeNotificationUserIds;
function buildAdminNotificationTargetQuery({ targetType, targetValue, userIds, }) {
    if (targetType === adminNotificationTargets_1.ADMIN_NOTIFICATION_TARGET_TYPE.ALL) {
        return ACTIVE_USER_QUERY;
    }
    if (targetType === adminNotificationTargets_1.ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC) {
        if (!(0, exports.isAdminNotificationTopic)(targetValue)) {
            throw new Error("Invalid notification topic");
        }
        return {
            ...ACTIVE_USER_QUERY,
            "fcmTokens.platform": TOPIC_PLATFORM_MAP[targetValue],
        };
    }
    if (targetType === adminNotificationTargets_1.ADMIN_NOTIFICATION_TARGET_TYPE.USERS) {
        const sanitizedUserIds = (0, exports.sanitizeNotificationUserIds)(userIds);
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
function createAdminNotificationTargetCursor(params) {
    return User_1.default.find(buildAdminNotificationTargetQuery(params)).select("_id").cursor();
}
//# sourceMappingURL=AdminNotificationTargetingService.js.map