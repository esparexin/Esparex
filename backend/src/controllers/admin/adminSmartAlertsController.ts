import { Request, Response } from "express";
import { getPaginationParams, sendAdminError, sendSuccessResponse } from "./adminBaseController";
import AlertDeliveryLog from "../../models/AlertDeliveryLog";

/**
 * GET /api/v1/admin/smart-alerts/logs
 * View smart alert delivery logs (admin visible UI)
 */
export async function getSmartAlertLogs(req: Request, res: Response) {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        
        const [logs, total] = await Promise.all([
            AlertDeliveryLog.find({})
                .sort({ deliveredAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("alertId", "name criteria user")
                .populate("adId", "title price location status")
                .lean(),
            AlertDeliveryLog.countDocuments()
        ]);

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
