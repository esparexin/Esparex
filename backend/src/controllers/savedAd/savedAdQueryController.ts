import { Request, Response } from 'express';
import SavedAd from '../../models/SavedAd';
import Ad from '../../models/Ad';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { SavedAdRequest, getUserId } from './shared';
import { sanitizePersistedImageUrls } from '../../utils/s3';
import { hydrateAdMetadata } from '../../services/ad/AdAggregationService';
import { serializeDoc } from '../../utils/serialize';

export const getSavedAds = async (req: Request, res: Response) => {
    try {
        const savedAdReq = req as SavedAdRequest;
        const userId = getUserId(savedAdReq);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // 1. Fetch Saved Ad records (lightweight)
        const [saved, total] = await Promise.all([
            SavedAd.find({ userId })
                .select('adId createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SavedAd.countDocuments({ userId })
        ]);

        if (saved.length === 0) {
            return res.json(respond({
                success: true,
                data: [],
                pagination: { page, limit, total, hasMore: false }
            }));
        }

        // 2. Extract Ad IDs and fetch Ad documents in bulk
        const adIds = saved.filter(s => s.adId).map(s => s.adId);
        const rawAds = await Ad.find({ _id: { $in: adIds } })
            .select('title images price location categoryId brandId modelId listingType seoSlug status createdAt')
            .lean();

        // 3. Hydrate metadata (Categories, Brands, Models) using batch caching
        await hydrateAdMetadata(rawAds);

        // 4. Map back to saved order and sanitize
        const adMap = new Map(rawAds.map(ad => [ad._id.toString(), ad]));
        
        const data = saved
            .map((s) => {
                const adIdStr = s.adId?.toString();
                const ad = adIdStr ? adMap.get(adIdStr) : null;
                if (!ad) return null;

                const serializedAd = serializeDoc(ad) as any;
                const rawImages = Array.isArray(serializedAd.images) ? serializedAd.images : [];
                
                return {
                    ...serializedAd,
                    images: sanitizePersistedImageUrls(
                        rawImages.filter((image: unknown): image is string => typeof image === 'string'),
                        { fallbackToPlaceholder: false, allowPlaceholder: false }
                    ),

                    _savedAt: s.createdAt,
                };
            })
            .filter(Boolean);

        res.json(respond({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + data.length < total
            }
        }));
    } catch (error) {
        console.error('[getSavedAds] Failed:', error);
        sendErrorResponse(req, res, 500, 'Failed to fetch saved ads');
    }
};

