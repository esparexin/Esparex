"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMuteSchema = exports.adminDeleteMessageSchema = exports.adminListQuerySchema = exports.chatUploadUrlSchema = exports.messagesQuerySchema = exports.conversationListQuerySchema = exports.reportChatSchema = exports.blockChatSchema = exports.readReceiptSchema = exports.sendMessageSchema = exports.startChatSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const chatStatus_1 = require("@core/constants/enums/chatStatus");
/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
const objectId = () => zod_1.z
    .string()
    .refine((v) => mongoose_1.Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });
const isoDate = () => zod_1.z.string().datetime({ message: 'Invalid ISO 8601 date' }).optional();
/* -------------------------------------------------------------------------- */
/* Chat Schemas                                                                */
/* -------------------------------------------------------------------------- */
exports.startChatSchema = zod_1.z.object({
    adId: objectId(),
});
exports.sendMessageSchema = zod_1.z.object({
    conversationId: objectId(),
    text: zod_1.z
        .string()
        .min(1, 'Message cannot be empty')
        .max(2000, 'Message cannot exceed 2000 characters')
        .trim(),
    attachments: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().url('Attachment URL must be valid'),
        mimeType: zod_1.z.string().min(1),
        size: zod_1.z.number().positive().max(8 * 1024 * 1024, 'Attachment too large (max 8 MB)'),
        name: zod_1.z.string().trim().max(160).optional(),
    }))
        .max(5, 'Max 5 attachments per message')
        .optional()
        .default([]),
});
exports.readReceiptSchema = zod_1.z.object({
    conversationId: objectId(),
});
exports.blockChatSchema = zod_1.z.object({
    conversationId: objectId(),
    reason: zod_1.z.string().max(300).optional(),
});
exports.reportChatSchema = zod_1.z.object({
    conversationId: objectId(),
    messageId: objectId().optional(),
    reason: zod_1.z.enum(chatStatus_1.CHAT_REPORT_REASON_VALUES),
    description: zod_1.z.string().max(500).optional(),
});
exports.conversationListQuerySchema = zod_1.z.object({
    before: isoDate(),
    view: zod_1.z.enum(['active', 'archived']).optional().default('active'),
});
exports.messagesQuerySchema = zod_1.z
    .object({
    before: isoDate(),
    /** `after` is used for incremental polling — returns only messages NEWER than this timestamp */
    after: isoDate(),
})
    .superRefine((value, ctx) => {
    if (value.before && value.after) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Use either "before" or "after", not both',
            path: ['after'],
        });
    }
});
exports.chatUploadUrlSchema = zod_1.z.object({
    conversationId: objectId(),
    contentType: zod_1.z.string().min(1, 'contentType is required'),
    filename: zod_1.z.string().trim().max(160).optional(),
});
/* -------------------------------------------------------------------------- */
/* Admin Schemas                                                               */
/* -------------------------------------------------------------------------- */
exports.adminListQuerySchema = zod_1.z.object({
    filter: zod_1.z.enum(['all', 'reported', 'high_risk', 'blocked', 'closed']).optional().default('all'),
    riskMin: zod_1.z.coerce.number().min(0).max(1).optional().default(0.8),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
    q: zod_1.z.string().max(100).optional().default(''),
}).strict();
exports.adminDeleteMessageSchema = zod_1.z.object({
    reason: zod_1.z.string().max(300).optional(),
});
exports.adminMuteSchema = zod_1.z.object({
    reason: zod_1.z.string().max(300).optional(),
});
//# sourceMappingURL=chat.validator.js.map