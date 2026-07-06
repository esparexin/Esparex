import { getAlertDeliveryLogs, SmartAlertModel, adminBulkResendAlertWarnings as bulkResendAlertWarnings } from '@esparex/core/services';;

import { Request, Response } from "express";
import { getPaginationParams, sendAdminError, sendSuccessResponse } from '@esparex/core/utils';;;;

import { logAdminActionDirect } from '@esparex/core/utils';;;;
import type { IAuthUser } from '@esparex/core/types';;
import type { AdminLogFn } from '@esparex/core/services';;;

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const getActorId = (req: Request): string =>
    (req.user as IAuthUser)?._id?.toString() ?? (req.user as IAuthUser)?.id ?? '';

const getIp = (req: Request): string =>
    (((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();

const getUserAgent = (req: Request): string =>
    (req.headers['user-agent'] as string) || '';

const buildLogFn = (req: Request): AdminLogFn =>
    (action, targetType, targetId, metadata) =>
        logAdminActionDirect(
            getActorId(req),
            action,
            targetType,
            targetId,
            metadata,
            getIp(req),
            getUserAgent(req)
        );

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
        const logFn = buildLogFn(req);
        await SmartAlertModel.findByIdAndDelete(id);
        await logFn('delete', 'SmartAlert', id, { reason: 'Admin deletion' });
        return sendSuccessResponse(res, { deleted: true });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
}

/**
 * POST /api/v1/admin/smart-alerts/bulk-resend-warnings
 * Bulk resend expiry warnings for alerts.
 */
export async function adminBulkResendAlertWarnings(req: Request, res: Response) {
    try {
        const { ids } = req.body as { ids: string[] };
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
