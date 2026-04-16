import { Request, Response } from 'express';
import { getAuditLogs as fetchAuditLogs } from '../../services/AdminService';
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
        const { action, targetType, adminId, requestId, correlationId } = req.query;

        const { logs, total } = await fetchAuditLogs({ 
            action, 
            targetType, 
            adminId, 
            requestId, 
            correlationId 
        }, skip, limit);

        sendPaginatedResponse(res, logs, total, page, limit);
    } catch (error: unknown) {

        sendAdminError(req, res, error);
    }
};
