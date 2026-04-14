import SavedAd from '../models/SavedAd';
import Ad from '../models/Ad';
import { hydrateAdMetadata } from './ad/AdAggregationService';
import { sanitizePersistedImageUrls } from '../utils/s3';
import { serializeDoc } from '../utils/serialize';
import { recordAdAnalyticsEvent } from './TrendingService';

export const getSavedAds = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [saved, total] = await Promise.all([
        SavedAd.find({ userId })
            .select('adId createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SavedAd.countDocuments({ userId }),
    ]);

    if (saved.length === 0) {
        return { data: [], total };
    }

    const adIds = saved.filter((s) => s.adId).map((s) => s.adId);
    const rawAds = await Ad.find({ _id: { $in: adIds } })
        .select('title images price location categoryId brandId modelId listingType seoSlug status createdAt')
        .lean();

    await hydrateAdMetadata(rawAds);

    const adMap = new Map(rawAds.map((ad) => [ad._id.toString(), ad]));

    const data = saved
        .map((s) => {
            const adIdStr = s.adId?.toString();
            const ad = adIdStr ? adMap.get(adIdStr) : null;
            if (!ad) return null;

            const serialized = serializeDoc(ad) as any;
            const rawImages = Array.isArray(serialized.images) ? serialized.images : [];

            return {
                ...serialized,
                images: sanitizePersistedImageUrls(
                    rawImages.filter((img: unknown): img is string => typeof img === 'string'),
                    { fallbackToPlaceholder: false, allowPlaceholder: false }
                ),
                _savedAt: s.createdAt,
            };
        })
        .filter(Boolean);

    return { data, total };
};

export const saveAd = async (userId: string, adId: string) => {
    const ad = await Ad.findById(adId).select('_id').lean();
    if (!ad) return null;

    await SavedAd.create({ userId, adId });
    void recordAdAnalyticsEvent(adId, 'favorite');
    void Ad.findByIdAndUpdate(adId, { $inc: { 'views.favorites': 1 } });
    return true;
};

export const unsaveAd = async (userId: string, adId: string) => {
    const deleted = await SavedAd.findOneAndDelete({ userId, adId });
    if (deleted) {
        void Ad.findOneAndUpdate(
            { _id: adId, 'views.favorites': { $gt: 0 } },
            { $inc: { 'views.favorites': -1 } }
        );
    }
};
