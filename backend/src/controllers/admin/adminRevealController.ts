import { Request, Response } from 'express';
import { sendAdminError } from './adminBaseController';
import {
    getPhoneRevealLogsPaginated,
    getPhoneRequestsPaginated,
} from '../../services/AdminRevealService';

/**
 * Get all phone reveal logs for auditing (Admin only)
 */
export const getPhoneRevealLogs = async (req: Request, res: Response) => {
    try {
        const { buyerId, sellerId, entityId, entityType, ipAddress } = req.query;

        const filters: Record<string, unknown> = {};
        if (buyerId) filters.buyerId = buyerId;
        if (sellerId) filters.sellerId = sellerId;
        if (entityId) filters.entityId = entityId;
        if (entityType) filters.entityType = entityType;
        if (ipAddress) filters.ipAddress = ipAddress;

        return getPhoneRevealLogsPaginated(req, res, filters);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Get all phone requests across the platform (Admin only)
 */
export const getAllPhoneRequests = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const filters: Record<string, unknown> = {};
        if (status) filters.status = status;

        return getPhoneRequestsPaginated(req, res, filters);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};
