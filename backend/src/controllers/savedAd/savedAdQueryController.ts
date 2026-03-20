import { Request, Response } from 'express';
import SavedAd from '../../models/SavedAd';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { SavedAdRequest, getUserId } from './shared';
import { sanitizePersistedImageUrls } from '../../utils/s3';

export const getSavedAds = async (req: Request, res: Response) => {
    try {
        const savedAdReq = req as SavedAdRequest;
        const userId = getUserId(savedAdReq);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const saved = await SavedAd.find({ userId })
            .populate('adId')
            .sort({ createdAt: -1 })
            .lean();

        const ads = saved
            .filter(s => s.adId)
            .map((s) => {
                const ad = s.adId as unknown;
                if (!ad || typeof ad !== 'object') {
                    return ad;
                }
                const adRecord = ad as Record<string, unknown>;
                const rawImages = Array.isArray(adRecord.images) ? adRecord.images : [];
                return {
                    ...adRecord,
                    images: sanitizePersistedImageUrls(
                        rawImages.filter((image): image is string => typeof image === 'string'),
                        false
                    )
                };
            });

        res.json(respond({ success: true, data: ads }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch saved ads');
    }
};
