import { z } from "zod";
import { NOTIFICATION_TYPE_VALUES } from "@esparex/contracts";
import { ADMIN_NOTIFICATION_TARGET_TYPE, ADMIN_NOTIFICATION_TOPIC_VALUES } from "@esparex/contracts";
import { commonSchemas } from "@esparex/core";

const adminNotificationTargetTypeEnum = z.enum([
    ADMIN_NOTIFICATION_TARGET_TYPE.ALL,
    ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC,
    ADMIN_NOTIFICATION_TARGET_TYPE.USERS,
]);

const adminNotificationTopicEnum = z.enum(
    ADMIN_NOTIFICATION_TOPIC_VALUES
);

const notificationHistoryStatusEnum = z.enum(["all", "sent", "failed", "scheduled"]);

const notificationInboxFilterEnum = z.enum(["all", "unread"]);

const notificationTypeFilterEnum = z.enum([
    "all",
    ...NOTIFICATION_TYPE_VALUES,
] as ["all", ...(typeof NOTIFICATION_TYPE_VALUES)[number][]]);

const localDateTimeSchema = z
    .string()
    .trim()
    .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/,
        "Invalid scheduled date"
    );

const notificationActionUrlSchema = z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
        (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
        "Action URL must start with / or http(s)://"
    );




export const userNotificationsQuerySchema = commonSchemas.pagination.extend({
    q: z.string().trim().min(1).max(100).optional(),
    filter: notificationInboxFilterEnum.default("all"),
    type: notificationTypeFilterEnum.default("all"),
});
