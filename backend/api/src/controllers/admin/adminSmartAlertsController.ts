import { Request, Response } from "express";
import { getPaginationParams, sendAdminError, sendSuccessResponse, getActorId, buildLogFn } from '../../utils/adminBaseController';
import { getAlertDeliveryLogs, adminBulkResendAlertWarnings as bulkResendAlertWarnings } from "@esparex/core/domains/notifications/application/SmartAlertService";
import { deleteSmartAlertMutation } from "@esparex/core/domains/notifications/application/SmartAlertMutationService";
import { getAllSmartAlerts as getAllSmartAlertsFromQueryService } from "@esparex/core/services/SmartAlertQueryService";

/**
 * GET /api/v1/admin/smart-alerts/logs
 * View smart alert delivery logs (admin visible UI)
 */
export async function getSmartAlertLogs(req: Request, res: Response) {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

        const { logs, total } = await getAlertDeliveryLogs(skip, limit, q);

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
        const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

        const { alerts, total } = await getAllSmartAlertsFromQueryService(skip, limit, q);

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
 * Delete a smart alert by ID — admin-only, restores user wallet slot if active.
 */
export async function deleteSmartAlertById(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        if (!id) return sendAdminError(req, res, "Missing ID", 400);
        const logFn = buildLogFn(req);
        
        const result = await deleteSmartAlertMutation({
            alertId: id,
            admin: req.user as any,
        });

        await logFn('delete', 'SmartAlert', id, { reason: 'Admin deletion' });
        return sendSuccessResponse(res, result);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

/**
 * POST /api/v1/admin/smart-alerts/bulk-resend-warnings
 * Bulk resend expiry warnings for alerts (Max 100 per call).
 */
export async function adminBulkResendAlertWarnings(req: Request, res: Response) {
    try {
        const { ids } = req.body as { ids: string[] };
        if (!Array.isArray(ids) || ids.length === 0) {
            return sendAdminError(req, res, "A non-empty array of alert IDs is required", 400);
        }
        if (ids.length > 100) {
            return sendAdminError(req, res, "Maximum 100 alert IDs allowed per bulk request", 400);
        }

        const result = await bulkResendAlertWarnings(
            ids,
            getActorId(req),
            buildLogFn(req)
        );
        return sendSuccessResponse(res, result, 'Bulk re-send alert warnings completed');
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

