import { Request, Response } from 'express';
import AdminLog from '../../models/AdminLog';
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendAdminError
} from './adminBaseController';

/**
 * GET /api/v1/admin/audit-logs
 * Fetch all admin action logs with pagination and filtering
 */
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const { action, targetType, adminId } = req.query;

        const query: Record<string, unknown> = {};

        if (action) {
            query.action = action;
        }

        if (targetType) {
            query.targetType = targetType;
        }

        if (adminId) {
            query.adminId = adminId;
        }

        const [logs, total] = await Promise.all([
            AdminLog.find(query)
                .skip(skip)
                .limit(limit)
                .populate('adminId', 'firstName lastName email')
                .sort({ createdAt: -1 }),
            AdminLog.countDocuments(query)
        ]);

        sendPaginatedResponse(res, logs, total, page, limit);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
