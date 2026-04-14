import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { SavedAdRequest, getUserId } from './shared';
import { getSavedAds as getSavedAdsService } from '../../services/SavedAdService';

export const getSavedAds = async (req: Request, res: Response) => {
    try {
        const savedAdReq = req as SavedAdRequest;
        const userId = getUserId(savedAdReq);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const page = Math.max(1, Number(req.query.page) || 1);
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
        console.error('[getSavedAds] Failed:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch saved ads');
    }
};

