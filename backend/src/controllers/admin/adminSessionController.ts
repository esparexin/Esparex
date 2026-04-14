import { Request, Response } from 'express';
import { getAdminSessions as fetchAdminSessions, revokeAdminSessionById as revokeSessionById } from '../../services/AdminSessionService';
import { getPaginationParams, sendPaginatedResponse, sendSuccessResponse, sendAdminError } from './adminBaseController';
import { getSingleParam } from '../../utils/requestParams';
import { logAdminAction } from '../../utils/adminLogger';


export const getAdminSessions = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const adminId = typeof req.query.adminId === 'string' ? req.query.adminId.trim() : '';

        const now = new Date();
        const query: Record<string, unknown> = {};

        if (adminId) query.adminId = adminId;
        if (status === 'active') {
            query.revokedAt = { $exists: false };
            query.expiresAt = { $gt: now };
        } else if (status === 'revoked') {
            query.revokedAt = { $exists: true };
        } else if (status === 'expired') {
            query.revokedAt = { $exists: false };
            query.expiresAt = { $lte: now };
        }

        const { items, total } = await fetchAdminSessions(query, skip, limit);

        sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const revokeAdminSessionById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid session ID' });
        if (!id) return;

        const session = await revokeSessionById(id);

        if (!session) {
            return sendAdminError(req, res, 'Admin session not found', 404);
        }

        await logAdminAction(req, 'REVOKE_ADMIN_SESSION', 'Admin', String(session.adminId), {
            sessionId: session._id.toString(),
            tokenId: session.tokenId,
        });

        sendSuccessResponse(res, session, 'Admin session revoked successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
