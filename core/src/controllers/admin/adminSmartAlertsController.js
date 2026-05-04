"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartAlertLogs = getSmartAlertLogs;
exports.getAllSmartAlerts = getAllSmartAlerts;
exports.deleteSmartAlertById = deleteSmartAlertById;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const SmartAlertService_1 = require("@esparex/core/services/SmartAlertService");
/**
 * GET /api/v1/admin/smart-alerts/logs
 * View smart alert delivery logs (admin visible UI)
 */
async function getSmartAlertLogs(req, res) {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const { logs, total } = await (0, SmartAlertService_1.getAlertDeliveryLogs)(skip, limit);
        return (0, adminBaseController_1.sendSuccessResponse)(res, {
            items: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
/**
 * GET /api/v1/admin/smart-alerts
 * List ALL smart alerts system-wide (no user-scoping).
 * Admin-only — does NOT filter by req.user._id.
 */
async function getAllSmartAlerts(req, res) {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const [alerts, total] = await Promise.all([
            SmartAlertService_1.SmartAlertModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
            SmartAlertService_1.SmartAlertModel.countDocuments({}),
        ]);
        return (0, adminBaseController_1.sendSuccessResponse)(res, {
            items: alerts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
/**
 * DELETE /api/v1/admin/smart-alerts/:id
 * Delete a smart alert by ID — admin-only, no ownership check.
 */
async function deleteSmartAlertById(req, res) {
    try {
        const id = req.params.id;
        if (!id)
            return (0, adminBaseController_1.sendAdminError)(req, res, "Missing ID", 400);
        await SmartAlertService_1.SmartAlertModel.findByIdAndDelete(id);
        return (0, adminBaseController_1.sendSuccessResponse)(res, { deleted: true });
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
}
//# sourceMappingURL=adminSmartAlertsController.js.map