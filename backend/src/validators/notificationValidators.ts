import { z } from "zod";

import {
    ADMIN_NOTIFICATION_TARGET_TYPE,
    ADMIN_NOTIFICATION_TOPIC_VALUES,
} from "../../../shared/constants/adminNotificationTargets";
import { NOTIFICATION_TYPE_VALUES } from "../../../shared/enums/notificationType";
import { commonSchemas, sanitizeString } from "../middleware/validateRequest";

const adminNotificationTargetTypeEnum = z.enum([
    ADMIN_NOTIFICATION_TARGET_TYPE.ALL,
    ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC,
    ADMIN_NOTIFICATION_TARGET_TYPE.USERS,
]);

const adminNotificationTopicEnum = z.enum(
    ADMIN_NOTIFICATION_TOPIC_VALUES as [
        (typeof ADMIN_NOTIFICATION_TOPIC_VALUES)[number],
        ...(typeof ADMIN_NOTIFICATION_TOPIC_VALUES)[number][]
    ]
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

export const adminNotificationSendSchema = z
    .object({
        title: sanitizeString(1, 100),
        body: sanitizeString(1, 500),
        targetType: adminNotificationTargetTypeEnum,
        targetValue: adminNotificationTopicEnum.optional(),
        userIds: z.array(commonSchemas.objectId).max(1000).optional(),
        actionUrl: notificationActionUrlSchema.optional(),
        sendAt: localDateTimeSchema.optional(),
    })
    .superRefine((value, ctx) => {
        if (value.targetType === ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC && !value.targetValue) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["targetValue"],
                message: "Topic is required when targetType is topic",
            });
        }

        if (value.targetType === ADMIN_NOTIFICATION_TARGET_TYPE.USERS) {
            if (!value.userIds || value.userIds.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["userIds"],
                    message: "userIds are required when targetType is users",
                });
            }
        }
    });

export const adminNotificationHistoryQuerySchema = commonSchemas.pagination.extend({
    q: z.string().trim().min(1).max(100).optional(),
    status: notificationHistoryStatusEnum.default("all"),
    targetType: adminNotificationTargetTypeEnum.optional(),
});

export const adminNotificationRecipientQuerySchema = z.object({
    q: z.string().trim().min(2).max(100),
    limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const userNotificationsQuerySchema = commonSchemas.pagination.extend({
    q: z.string().trim().min(1).max(100).optional(),
    filter: notificationInboxFilterEnum.default("all"),
    type: notificationTypeFilterEnum.default("all"),
});
