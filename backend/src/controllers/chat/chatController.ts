import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import {
  startConversation,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  blockConversation,
  hideConversation,
  reportConversation,
} from '../../services/chatService';
import {
  startChatSchema,
  sendMessageSchema,
  readReceiptSchema,
  blockChatSchema,
  reportChatSchema,
  conversationListQuerySchema,
  messagesQuerySchema,
} from '../../validators/chatValidator';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function getUserId(req: Request): string {
  const id = (req.user as { id?: string; _id?: { toString(): string } } | undefined)?.id
    || (req.user as { _id?: { toString(): string } } | undefined)?._id?.toString();
  if (!id) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return String(id);
}

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/start                                                     */
/* -------------------------------------------------------------------------- */

export const startChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = startChatSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    const result = await startConversation(parsed.data.adId, userId);
    res.status(result.isNew ? 201 : 200).json(respond({ success: true, ...result }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] startChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to start chat');
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/v1/chat/list                                                       */
/* -------------------------------------------------------------------------- */

export const getChatList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = conversationListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid query');
      return;
    }
    const { convs, nextCursor } = await listConversations(userId, parsed.data.before);
    res.json(respond({ success: true, data: convs, nextCursor }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] getChatList error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to load chat list');
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/v1/chat/:id/messages                                              */
/* -------------------------------------------------------------------------- */

export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const conversationId = String(req.params.id ?? '');
    if (!conversationId) {
      sendErrorResponse(req, res, 400, 'Missing conversation id');
      return;
    }
    const parsed = messagesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid query');
      return;
    }
    const { msgs, nextCursor } = await getMessages(conversationId, userId, parsed.data.before, parsed.data.after);
    res.json(respond({ success: true, data: msgs, nextCursor }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] getConversationMessages error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to load messages');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/send                                                      */
/* -------------------------------------------------------------------------- */

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    const { conversationId, text, attachments } = parsed.data;
    const msg = await sendMessage(conversationId, userId, text, attachments);
    res.status(201).json(respond({ success: true, message: msg }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number; code?: string };
    logger.error('[Chat] sendChatMessage error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to send message');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/read                                                      */
/* -------------------------------------------------------------------------- */

export const markChatRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = readReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    await markRead(parsed.data.conversationId, userId);
    res.json(respond({ success: true, message: 'Marked as read' }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] markChatRead error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to mark read');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/block                                                     */
/* -------------------------------------------------------------------------- */

export const blockChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = blockChatSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    await blockConversation(parsed.data.conversationId, userId);
    res.json(respond({ success: true, message: 'Chat blocked' }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] blockChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to block chat');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/hide                                                      */
/* -------------------------------------------------------------------------- */

export const hideChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = blockChatSchema.safeParse(req.body); // reuse schema (same fields)
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    await hideConversation(parsed.data.conversationId, userId);
    res.json(respond({ success: true, message: 'Conversation hidden' }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] hideChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to hide chat');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/report                                                    */
/* -------------------------------------------------------------------------- */

export const reportChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const parsed = reportChatSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    const { conversationId, reason, description, messageId } = parsed.data;
    const report = await reportConversation(conversationId, userId, reason, description, messageId);
    res.status(201).json(respond({ success: true, data: report }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[Chat] reportChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to submit report');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/chat/upload-url                                               */
/* -------------------------------------------------------------------------- */

export const getChatUploadUrl = async (_req: Request, res: Response): Promise<void> => {
  // Placeholder endpoint to keep API contract synchronized while chat attachments
  // continue to use existing send-message payload flow.
  res.status(200).json(respond({
    success: true,
    data: {
      uploadUrl: null,
      expiresInSeconds: 0,
      method: 'POST',
    },
    message: 'Chat upload URL is not configured on this environment.',
  }));
};
