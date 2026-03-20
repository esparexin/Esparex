import { z } from 'zod';
import { Types } from 'mongoose';
import { CHAT_REPORT_REASON_VALUES } from '@shared/enums/chatStatus';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const objectId = () =>
  z
    .string()
    .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

const isoDate = () =>
  z.string().datetime({ message: 'Invalid ISO 8601 date' }).optional();

/* -------------------------------------------------------------------------- */
/* Chat Schemas                                                                */
/* -------------------------------------------------------------------------- */

export const startChatSchema = z.object({
  adId: objectId(),
});

export const sendMessageSchema = z.object({
  conversationId: objectId(),
  text: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
  attachments: z
    .array(
      z.object({
        url: z.string().url('Attachment URL must be valid'),
        mimeType: z.string().min(1),
        size: z.number().positive().max(8 * 1024 * 1024, 'Attachment too large (max 8 MB)'),
      })
    )
    .max(5, 'Max 5 attachments per message')
    .optional()
    .default([]),
});

export const readReceiptSchema = z.object({
  conversationId: objectId(),
});

export const blockChatSchema = z.object({
  conversationId: objectId(),
  reason: z.string().max(300).optional(),
});

export const reportChatSchema = z.object({
  conversationId: objectId(),
  messageId: objectId().optional(),
  reason: z.enum(CHAT_REPORT_REASON_VALUES),
  description: z.string().max(500).optional(),
});

export const conversationListQuerySchema = z.object({
  before: isoDate(),
});

export const messagesQuerySchema = z.object({
  before: isoDate(),
  /** `after` is used for incremental polling — returns only messages NEWER than this timestamp */
  after: isoDate(),
});

/* -------------------------------------------------------------------------- */
/* Admin Schemas                                                               */
/* -------------------------------------------------------------------------- */

export const adminListQuerySchema = z.object({
  filter: z.enum(['all', 'reported', 'high_risk', 'blocked', 'closed']).optional().default('all'),
  riskMin: z.coerce.number().min(0).max(1).optional().default(0.8),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(100).optional().default(''),
});

export const adminDeleteMessageSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const adminMuteSchema = z.object({
  reason: z.string().max(300).optional(),
});
