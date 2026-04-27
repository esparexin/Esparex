"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_NOTIFICATION_TOPIC_OPTIONS = exports.ADMIN_NOTIFICATION_TOPIC_VALUES = exports.ADMIN_NOTIFICATION_TOPIC = exports.ADMIN_NOTIFICATION_TARGET_TYPE = void 0;
exports.ADMIN_NOTIFICATION_TARGET_TYPE = {
    ALL: "all",
    TOPIC: "topic",
    USERS: "users",
};
exports.ADMIN_NOTIFICATION_TOPIC = {
    PLATFORM_WEB: "platform_web",
    PLATFORM_ANDROID: "platform_android",
    PLATFORM_IOS: "platform_ios",
};
exports.ADMIN_NOTIFICATION_TOPIC_VALUES = Object.values(exports.ADMIN_NOTIFICATION_TOPIC);
exports.ADMIN_NOTIFICATION_TOPIC_OPTIONS = [
    {
        value: exports.ADMIN_NOTIFICATION_TOPIC.PLATFORM_WEB,
        label: "Web App Users",
        description: "Users with an active web push registration.",
    },
    {
        value: exports.ADMIN_NOTIFICATION_TOPIC.PLATFORM_ANDROID,
        label: "Android Users",
        description: "Users with an active Android push registration.",
    },
    {
        value: exports.ADMIN_NOTIFICATION_TOPIC.PLATFORM_IOS,
        label: "iOS Users",
        description: "Users with an active iOS push registration.",
    },
];
//# sourceMappingURL=adminNotificationTargets.js.map