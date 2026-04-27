"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminResolveReport = exports.adminExportChat = exports.adminMuteChat = exports.adminDeleteMsg = exports.adminGetChat = exports.adminListChats = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const errorResponse_1 = require("@core/utils/errorResponse");
const respond_1 = require("@core/utils/respond");
const chatService_1 = require("@core/services/chatService");
const chat_validator_1 = require("@core/validators/chat.validator");
/* -------------------------------------------------------------------------- */
/* Helper                                                                      */
/* -------------------------------------------------------------------------- */
function getAdminId(req) {
    const admin = req.admin;
    const id = admin?.id || admin?._id?.toString();
    if (!id)
        throw Object.assign(new Error('Unauthorized'), { status: 401 });
    return String(id);
}
/* -------------------------------------------------------------------------- */
/* GET /api/v1/admin/chat/list                                                 */
/* -------------------------------------------------------------------------- */
const adminListChats = async (req, res) => {
    try {
        const parsed = chat_validator_1.adminListQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid query');
            return;
        }
        const { filter, riskMin, page, limit, q } = parsed.data;
        const { convs, total } = await (0, chatService_1.adminListConversations)(filter, riskMin, page, limit, q);
        res.json((0, respond_1.respond)({ success: true, data: convs, total, page, limit }));
    }
    catch (err) {
        const e = err;
        logger_1.default.error('[ChatAdmin] adminListChats error', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, e.status ?? 500, e.message ?? 'Failed to list chats');
    }
};
exports.adminListChats = adminListChats;
/* -------------------------------------------------------------------------- */
/* GET /api/v1/admin/chat/:id                                                  */
/* -------------------------------------------------------------------------- */
const adminGetChat = async (req, res) => {
    try {
        const id = String(req.params.id ?? '');
        if (!id) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Missing id');
            return;
        }
        const data = await (0, chatService_1.adminGetConversation)(id);
        res.json((0, respond_1.respond)({ success: true, ...data }));
    }
    catch (err) {
        const e = err;
        logger_1.default.error('[ChatAdmin] adminGetChat error', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, e.status ?? 500, e.message ?? 'Failed to load chat');
    }
};
exports.adminGetChat = adminGetChat;
/* -------------------------------------------------------------------------- */
/* DELETE /api/v1/admin/chat/message/:msgId                                   */
/* -------------------------------------------------------------------------- */
const adminDeleteMsg = async (req, res) => {
    try {
        const adminId = getAdminId(req);
        const msgId = String(req.params.msgId ?? '');
        if (!msgId) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Missing msgId');
            return;
        }
        const parsed = chat_validator_1.adminDeleteMessageSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
            return;
        }
        await (0, chatService_1.adminDeleteMessage)(msgId, adminId, parsed.data.reason);
        res.json((0, respond_1.respond)({ success: true, message: 'Message deleted' }));
    }
    catch (err) {
        const e = err;
        logger_1.default.error('[ChatAdmin] adminDeleteMsg error', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, e.status ?? 500, e.message ?? 'Failed to delete message');
    }
};
exports.adminDeleteMsg = adminDeleteMsg;
/* -------------------------------------------------------------------------- */
/* POST /api/v1/admin/chat/mute/:id                                           */
/* -------------------------------------------------------------------------- */
const adminMuteChat = async (req, res) => {
    try {
        const adminId = getAdminId(req);
        const id = String(req.params.id ?? '');
        if (!id) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Missing id');
            return;
        }
        const parsed = chat_validator_1.adminMuteSchema.safeParse(req.body);
        if (!parsed.success) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, parsed.error.errors[0]?.message ?? 'Invalid payload');
            return;
        }
        await (0, chatService_1.adminMuteConversation)(id, adminId, parsed.data.reason);
        res.json((0, respond_1.respond)({ success: true, message: 'Conversation muted' }));
    }
    catch (err) {
        const e = err;
        logger_1.default.error('[ChatAdmin] adminMuteChat error', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, e.status ?? 500, e.message ?? 'Failed to mute chat');
    }
};
exports.adminMuteChat = adminMuteChat;
/* -------------------------------------------------------------------------- */
/* POST /api/v1/admin/chat/export/:id                                         */
/* -------------------------------------------------------------------------- */
const adminExportChat = async (req, res) => {
    try {
        const id = String(req.params.id ?? '');
        if (!id) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Missing id');
            return;
        }
        const exportData = await (0, chatService_1.adminExportConversation)(id);
        res
            .setHeader('Content-Type', 'application/json')
            .setHeader('Content-Disposition', `attachment; filename="chat_${id}.json"`)
            .json(exportData);
    }
    catch (err) {
        const e = err;
        logger_1.default.error('[ChatAdmin] adminExportChat error', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, e.status ?? 500, e.message ?? 'Failed to export chat');
    }
};
exports.adminExportChat = adminExportChat;
/* -------------------------------------------------------------------------- */
/* PATCH /api/v1/admin/chat/report/:id                                         */
/* -------------------------------------------------------------------------- */
const adminResolveReport = async (req, res) => {
    try {
        const adminId = getAdminId(req);
        const reportId = String(req.params.id ?? '');
        if (!reportId) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Missing report id');
            return;
        }
        const { status, adminNote } = req.body;
        if (status !== 'resolved' && status !== 'dismissed') {
            (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'status must be "resolved" or "dismissed"');
            return;
        }
        const report = await (0, chatService_1.resolveReport)(reportId, adminId, status, adminNote);
        res.json((0, respond_1.respond)({ success: true, data: report }));
    }
    catch (err) {
        const e = err;
        logger_1.default.error('[ChatAdmin] adminResolveReport error', err);
        (0, errorResponse_1.sendErrorResponse)(req, res, e.status ?? 500, e.message ?? 'Failed to resolve report');
    }
};
exports.adminResolveReport = adminResolveReport;
//# sourceMappingURL=chatAdminController.js.map