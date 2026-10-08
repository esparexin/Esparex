import { z } from "zod";
import { NOTIFICATION_TYPE_VALUES } from "@esparex/contracts";
import { commonSchemas } from "@esparex/core";

const notificationInboxFilterEnum = z.enum(["all", "unread"]);

const notificationTypeFilterEnum = z.enum([
    "all",
    ...NOTIFICATION_TYPE_VALUES,
] as ["all", ...(typeof NOTIFICATION_TYPE_VALUES)[number][]]);






export const userNotificationsQuerySchema = commonSchemas.pagination.extend({
    q: z.string().trim().min(1).max(100).optional(),
    filter: notificationInboxFilterEnum.default("all"),
    type: notificationTypeFilterEnum.default("all"),
});
