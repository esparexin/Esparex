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

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [saved, total] = await Promise.all([
            SavedAd.find({ userId })
                .populate('adId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SavedAd.countDocuments({ userId })
        ]);

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
                        { fallbackToPlaceholder: false, allowPlaceholder: false }
                    ),
                    // When the user saved this ad — separate from ad's own createdAt
                    _savedAt: (s as any).createdAt,
                };
            });

        res.json(respond({
            success: true,
            data: ads,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + ads.length < total
            }
        }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to fetch saved ads');
    }
};
