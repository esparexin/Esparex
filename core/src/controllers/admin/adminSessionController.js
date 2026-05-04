"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAdminSessionById = exports.getAdminSessions = void 0;
const AdminSessionService_1 = require("@esparex/core/services/AdminSessionService");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const requestParams_1 = require("@esparex/core/utils/requestParams");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const getAdminSessions = async (req, res) => {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const adminId = typeof req.query.adminId === 'string' ? req.query.adminId.trim() : '';
        const now = new Date();
        const query = {};
        if (adminId)
            query.adminId = adminId;
        if (status === 'active') {
            query.revokedAt = { $exists: false };
            query.expiresAt = { $gt: now };
        }
        else if (status === 'revoked') {
            query.revokedAt = { $exists: true };
        }
        else if (status === 'expired') {
            query.revokedAt = { $exists: false };
            query.expiresAt = { $lte: now };
        }
        const { items, total } = await (0, AdminSessionService_1.getAdminSessions)(query, skip, limit);
        (0, adminBaseController_1.sendPaginatedResponse)(res, items, total, page, limit);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAdminSessions = getAdminSessions;
const revokeAdminSessionById = async (req, res) => {
    try {
        const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid session ID' });
        if (!id)
            return;
        const session = await (0, AdminSessionService_1.revokeAdminSessionById)(id);
        if (!session) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Admin session not found', 404);
        }
        await (0, adminLogger_1.logAdminAction)(req, 'REVOKE_ADMIN_SESSION', 'Admin', String(session.adminId), {
            sessionId: session._id.toString(),
            tokenId: session.tokenId,
        });
        (0, adminBaseController_1.sendSuccessResponse)(res, session, 'Admin session revoked successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.revokeAdminSessionById = revokeAdminSessionById;
//# sourceMappingURL=adminSessionController.js.map