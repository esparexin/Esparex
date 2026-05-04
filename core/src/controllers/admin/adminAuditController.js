"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const AdminService_1 = require("@esparex/core/services/AdminService");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
/**
 * GET /api/v1/admin/audit-logs
 * Fetch all admin action logs with pagination and filtering
 */
const getAuditLogs = async (req, res) => {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const { q, action, targetType, adminId, requestId, correlationId } = req.query;
        const { logs, total } = await (0, AdminService_1.getAuditLogs)({
            q,
            action,
            targetType,
            adminId,
            requestId,
            correlationId
        }, skip, limit);
        (0, adminBaseController_1.sendPaginatedResponse)(res, logs, total, page, limit);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=adminAuditController.js.map