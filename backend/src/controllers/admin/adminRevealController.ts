import { Request, Response } from 'express';
import PhoneRevealLog from '../../models/PhoneRevealLog';
import PhoneRequest from '../../models/PhoneRequest';
import { handlePaginatedContent } from '../../utils/contentHandler';
import { sendAdminError } from './adminBaseController';

/**
 * Get all phone reveal logs for auditing (Admin only)
 */
export const getPhoneRevealLogs = async (req: Request, res: Response) => {
    try {
        const { buyerId, sellerId, entityId, entityType, ipAddress } = req.query;

        const filters: any = {};
        if (buyerId) filters.buyerId = buyerId;
        if (sellerId) filters.sellerId = sellerId;
        if (entityId) filters.entityId = entityId;
        if (entityType) filters.entityType = entityType;
        if (ipAddress) filters.ipAddress = ipAddress;

        return handlePaginatedContent(req, res, PhoneRevealLog, {
            publicQuery: filters,
            adminQuery: filters,
            populate: [
                { path: 'buyerId', select: 'name email avatar' },
                { path: 'sellerId', select: 'name email avatar' }
            ],
            defaultSort: { revealedAt: -1 }
        });
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
        const filters: any = {};
        if (status) filters.status = status;

        return handlePaginatedContent(req, res, PhoneRequest, {
            publicQuery: filters,
            adminQuery: filters,
            populate: [
                { path: 'buyerId', select: 'name email' },
                { path: 'sellerId', select: 'name email' }
            ],
            defaultSort: { createdAt: -1 }
        });
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};
