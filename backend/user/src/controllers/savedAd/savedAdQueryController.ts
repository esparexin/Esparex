import { getSavedAds as getSavedAdsService } from '@esparex/core/services';;

import { Request, Response } from 'express';
import { respond } from '@esparex/core/utils';;;;
import { sendErrorResponse } from '@esparex/core/utils';;;;
import { SavedAdRequest, getUserId } from './shared';

import { logger } from '@esparex/core/utils';;;;

export const getSavedAds = async (req: Request, res: Response) => {
    try {
        const savedAdReq = req as SavedAdRequest;
        const userId = getUserId(savedAdReq);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const page = Math.min(1000, Math.max(1, Number(req.query.page) || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

        const { data, total } = await getSavedAdsService(userId, page, limit);
        const skip = (page - 1) * limit;

        res.json(respond({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + data.length < total,
            },
        }));
    } catch (error) {
        logger.error('[getSavedAds] Failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        sendErrorResponse(req, res, 500, 'Failed to fetch saved ads');
    }
};
