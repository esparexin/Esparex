import PhoneRevealLog from '../models/PhoneRevealLog';
import PhoneRequest from '../models/PhoneRequest';
import { handlePaginatedContent } from '../utils/contentHandler';
import type { Request, Response } from 'express';

export const getPhoneRevealLogsPaginated = (
    req: Request,
    res: Response,
    filters: Record<string, unknown>
) => {
    return handlePaginatedContent(req, res, PhoneRevealLog, {
        publicQuery: filters,
        adminQuery: filters,
        populate: [
            { path: 'buyerId', select: 'name email avatar' },
            { path: 'sellerId', select: 'name email avatar' },
        ],
        defaultSort: { revealedAt: -1 },
    });
};

export const getPhoneRequestsPaginated = (
    req: Request,
    res: Response,
    filters: Record<string, unknown>
) => {
    return handlePaginatedContent(req, res, PhoneRequest, {
        publicQuery: filters,
        adminQuery: filters,
        populate: [
            { path: 'buyerId', select: 'name email' },
            { path: 'sellerId', select: 'name email' },
        ],
        defaultSort: { createdAt: -1 },
    });
};
