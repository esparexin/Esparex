import { Request, Response } from 'express';

import AdminSession from '../../models/AdminSession';
import { getPaginationParams, sendPaginatedResponse, sendSuccessResponse } from './adminBaseController';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getSingleParam } from '../../utils/requestParams';
import { logAdminAction } from '../../utils/adminLogger';

const sendSessionError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Failed to manage admin sessions';
    sendErrorResponse(req, res, 500, message);
};

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

        const [items, total] = await Promise.all([
            AdminSession.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('adminId', 'firstName lastName email role'),
            AdminSession.countDocuments(query)
        ]);

        sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        sendSessionError(req, res, error);
    }
};

export const revokeAdminSessionById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid session ID' });
        if (!id) return;

        const session = await AdminSession.findByIdAndUpdate(
            id,
            { revokedAt: new Date() },
            { new: true }
        );

        if (!session) {
            return sendErrorResponse(req, res, 404, 'Admin session not found');
        }

        await logAdminAction(req, 'REVOKE_ADMIN_SESSION', 'Admin', String(session.adminId), {
            sessionId: session._id.toString(),
            tokenId: session.tokenId,
        });

        sendSuccessResponse(res, session, 'Admin session revoked successfully');
    } catch (error: unknown) {
        sendSessionError(req, res, error);
    }
};
