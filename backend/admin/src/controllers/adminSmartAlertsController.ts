import { Request, Response } from "express";
import { getPaginationParams, sendAdminError, sendSuccessResponse } from '@esparex/core/utils/adminBaseController';
import { getAlertDeliveryLogs, SmartAlertModel } from '@esparex/core/services/SmartAlertService';

/**
 * GET /api/v1/admin/smart-alerts/logs
 * View smart alert delivery logs (admin visible UI)
 */
export async function getSmartAlertLogs(req: Request, res: Response) {
    try {
        const { page, limit, skip } = getPaginationParams(req);

        const { logs, total } = await getAlertDeliveryLogs(skip, limit);

        return sendSuccessResponse(res, {
            items: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

/**
 * GET /api/v1/admin/smart-alerts
 * List ALL smart alerts system-wide (no user-scoping).
 * Admin-only — does NOT filter by req.user._id.
 */
export async function getAllSmartAlerts(req: Request, res: Response) {
    try {
        const { page, limit, skip } = getPaginationParams(req);

        const [alerts, total] = await Promise.all([
            SmartAlertModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
            SmartAlertModel.countDocuments({}),
        ]);

        return sendSuccessResponse(res, {
            items: alerts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

/**
 * DELETE /api/v1/admin/smart-alerts/:id
 * Delete a smart alert by ID — admin-only, no ownership check.
 */
export async function deleteSmartAlertById(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        if (!id) return sendAdminError(req, res, "Missing ID", 400);
        await SmartAlertModel.findByIdAndDelete(id);
        return sendSuccessResponse(res, { deleted: true });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}
