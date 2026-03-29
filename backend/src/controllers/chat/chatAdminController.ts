import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import {
  adminListConversations,
  adminGetConversation,
  adminDeleteMessage,
  adminMuteConversation,
  adminExportConversation,
  resolveReport,
} from '../../services/chatService';
import {
  adminListQuerySchema,
  adminDeleteMessageSchema,
  adminMuteSchema,
} from '../../validators/chatValidator';

/* -------------------------------------------------------------------------- */
/* Helper                                                                      */
/* -------------------------------------------------------------------------- */

function getAdminId(req: Request): string {
  const admin = req.admin as { id?: string; _id?: { toString(): string } } | undefined;
  const id = admin?.id || admin?._id?.toString();
  if (!id) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return String(id);
}

/* -------------------------------------------------------------------------- */
/* GET /api/v1/admin/chat/list                                                 */
/* -------------------------------------------------------------------------- */

export const adminListChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = adminListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid query');
      return;
    }
    const { filter, riskMin, page, limit, search } = parsed.data;
    const { convs, total } = await adminListConversations(filter, riskMin, page, limit, search);
    res.json(respond({ success: true, data: convs, total, page, limit }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[ChatAdmin] adminListChats error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to list chats');
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/v1/admin/chat/:id                                                  */
/* -------------------------------------------------------------------------- */

export const adminGetChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id ?? '');
    if (!id) { sendErrorResponse(req, res, 400, 'Missing id'); return; }
    const data = await adminGetConversation(id);
    res.json(respond({ success: true, ...data }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[ChatAdmin] adminGetChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to load chat');
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE /api/v1/admin/chat/message/:msgId                                   */
/* -------------------------------------------------------------------------- */

export const adminDeleteMsg = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = getAdminId(req);
    const msgId = String(req.params.msgId ?? '');
    if (!msgId) { sendErrorResponse(req, res, 400, 'Missing msgId'); return; }
    const parsed = adminDeleteMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    await adminDeleteMessage(msgId, adminId, parsed.data.reason);
    res.json(respond({ success: true, message: 'Message deleted' }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[ChatAdmin] adminDeleteMsg error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to delete message');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/admin/chat/mute/:id                                           */
/* -------------------------------------------------------------------------- */

export const adminMuteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = getAdminId(req);
    const id = String(req.params.id ?? '');
    if (!id) { sendErrorResponse(req, res, 400, 'Missing id'); return; }
    const parsed = adminMuteSchema.safeParse(req.body);
    if (!parsed.success) {
      sendErrorResponse(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
      return;
    }
    await adminMuteConversation(id, adminId, parsed.data.reason);
    res.json(respond({ success: true, message: 'Conversation muted' }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[ChatAdmin] adminMuteChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to mute chat');
  }
};

/* -------------------------------------------------------------------------- */
/* POST /api/v1/admin/chat/export/:id                                         */
/* -------------------------------------------------------------------------- */

export const adminExportChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id ?? '');
    if (!id) { sendErrorResponse(req, res, 400, 'Missing id'); return; }
    const exportData = await adminExportConversation(id);
    res
      .setHeader('Content-Type', 'application/json')
      .setHeader('Content-Disposition', `attachment; filename="chat_${id}.json"`)
      .json(exportData);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[ChatAdmin] adminExportChat error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to export chat');
  }
};

/* -------------------------------------------------------------------------- */
/* PATCH /api/v1/admin/chat/report/:id                                         */
/* -------------------------------------------------------------------------- */

export const adminResolveReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = getAdminId(req);
    const reportId = String(req.params.id ?? '');
    if (!reportId) { sendErrorResponse(req, res, 400, 'Missing report id'); return; }
    const { status, adminNote } = req.body as { status: 'resolved' | 'dismissed'; adminNote?: string };
    if (status !== 'resolved' && status !== 'dismissed') {
      sendErrorResponse(req, res, 400, 'status must be "resolved" or "dismissed"');
      return;
    }
    const report = await resolveReport(reportId, adminId, status, adminNote);
    res.json(respond({ success: true, data: report }));
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    logger.error('[ChatAdmin] adminResolveReport error', err);
    sendErrorResponse(req, res, e.status ?? 500, e.message ?? 'Failed to resolve report');
  }
};
