export const ADMIN_NOTIFICATION_TARGET_TYPE = {
  ALL: "all",
  TOPIC: "topic",
  USERS: "users",
} as const;

export type AdminNotificationTargetTypeValue =
  (typeof ADMIN_NOTIFICATION_TARGET_TYPE)[keyof typeof ADMIN_NOTIFICATION_TARGET_TYPE];

export const ADMIN_NOTIFICATION_TOPIC = {
  PLATFORM_WEB: "platform_web",
  PLATFORM_ANDROID: "platform_android",
  PLATFORM_IOS: "platform_ios",
} as const;

export type AdminNotificationTopicValue =
  (typeof ADMIN_NOTIFICATION_TOPIC)[keyof typeof ADMIN_NOTIFICATION_TOPIC];

export const ADMIN_NOTIFICATION_TOPIC_VALUES = Object.values(
  ADMIN_NOTIFICATION_TOPIC
) as [AdminNotificationTopicValue, ...AdminNotificationTopicValue[]];

export const ADMIN_NOTIFICATION_TOPIC_OPTIONS: Array<{
  value: AdminNotificationTopicValue;
  label: string;
  description: string;
}> = [
  {
    value: ADMIN_NOTIFICATION_TOPIC.PLATFORM_WEB,
    label: "Web App Users",
    description: "Users with an active web push registration.",
  },
  {
    value: ADMIN_NOTIFICATION_TOPIC.PLATFORM_ANDROID,
    label: "Android Users",
    description: "Users with an active Android push registration.",
  },
  {
    value: ADMIN_NOTIFICATION_TOPIC.PLATFORM_IOS,
    label: "iOS Users",
    description: "Users with an active iOS push registration.",
  },
];
