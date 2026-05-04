export declare const ADMIN_NOTIFICATION_TARGET_TYPE: {
    readonly ALL: "all";
    readonly TOPIC: "topic";
    readonly USERS: "users";
};
export type AdminNotificationTargetTypeValue = (typeof ADMIN_NOTIFICATION_TARGET_TYPE)[keyof typeof ADMIN_NOTIFICATION_TARGET_TYPE];
export declare const ADMIN_NOTIFICATION_TOPIC: {
    readonly PLATFORM_WEB: "platform_web";
    readonly PLATFORM_ANDROID: "platform_android";
    readonly PLATFORM_IOS: "platform_ios";
};
export type AdminNotificationTopicValue = (typeof ADMIN_NOTIFICATION_TOPIC)[keyof typeof ADMIN_NOTIFICATION_TOPIC];
export declare const ADMIN_NOTIFICATION_TOPIC_VALUES: [AdminNotificationTopicValue, ...AdminNotificationTopicValue[]];
export declare const ADMIN_NOTIFICATION_TOPIC_OPTIONS: Array<{
    value: AdminNotificationTopicValue;
    label: string;
    description: string;
}>;
//# sourceMappingURL=adminNotificationTargets.d.ts.map