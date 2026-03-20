import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { ApiResponse } from '../../../../shared/types/Api';
import {
    createSavedSearch,
    deleteSavedSearch,
    getSavedSearches
} from '../../services/SavedSearchService';
import type { SavedSearchCreatePayload } from '../../../../shared/schemas/savedSearch.schema';

const getUserId = (req: Request): string | null => {
    const user = req.user;
    if (!user) return null;
    return (user.id || user._id)?.toString() || null;
};

export const listSavedSearches = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const data = await getSavedSearches(userId);
        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data
        }));
    } catch (error) {
        logger.error('Failed to fetch saved searches', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch saved searches');
    }
};

export const createSavedSearchEntry = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const payload = req.body as SavedSearchCreatePayload;
        const created = await createSavedSearch(userId, payload);
        res.status(201).json(respond<ApiResponse<unknown>>({
            success: true,
            data: created
        }));
    } catch (error) {
        logger.error('Failed to create saved search', error);
        sendErrorResponse(req, res, 400, 'Failed to create saved search');
    }
};

export const deleteSavedSearchEntry = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const id = typeof req.params.id === 'string' ? req.params.id : '';
        const removed = await deleteSavedSearch(userId, id);
        if (!removed) {
            sendErrorResponse(req, res, 404, 'Saved search not found');
            return;
        }

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: 'Saved search deleted',
            data: { id }
        }));
    } catch (error) {
        logger.error('Failed to delete saved search', error);
        sendErrorResponse(req, res, 500, 'Failed to delete saved search');
    }
};
