import mongoose from 'mongoose';
import SavedAd from '../../../../models/SavedAd';
import { getListingRepository } from '../../../../composition/listings';
import { hydrateAdMetadata, type HydratedAd } from '../ad/ad/AdAggregationService';
import { sanitizePersistedImageUrls } from '../../../../utils/s3';
import { serializeDoc } from '../../../../utils/serialize';
import { recordAdAnalyticsEvent } from '../../../../services/TrendingService';

export const getSavedAds = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;

    // Single $facet aggregation: replaces two separate queries (find + countDocuments)
    // that previously ran in parallel, each costing 1500ms+ on cold start.
    const [result] = await SavedAd.aggregate<{
        data: { adId: mongoose.Types.ObjectId; createdAt: Date }[];
        total: { count: number }[];
    }>([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $facet: {
                data: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    { $project: { adId: 1, createdAt: 1 } },
                ],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    const saved = result?.data ?? [];
    const total = result?.total?.[0]?.count ?? 0;

    if (saved.length === 0) {
        return { data: [], total };
    }

    const adIds = saved.filter((s) => s.adId).map((s) => s.adId);
    const listings = await getListingRepository().find({ ids: adIds.map((id) => id.toString()) });
    const rawAds: HydratedAd[] = listings.map((l) => ({
        ...l,
        _id: new mongoose.Types.ObjectId(l.id),
    } as unknown as HydratedAd));

    await hydrateAdMetadata(rawAds);

    const adMap = new Map(
        rawAds
            .map((ad) => {
                const adKey = ad._id ? ad._id.toString() : ad.id;
                return adKey ? [adKey, ad] as const : null;
            })
            .filter((entry): entry is readonly [string, HydratedAd] => Boolean(entry))
    );

    const data = saved
        .map((s) => {
            const adIdStr = s.adId?.toString();
            const ad = adIdStr ? adMap.get(adIdStr) : null;
            if (!ad) return null;

            const serialized = serializeDoc(ad) as Record<string, unknown>;
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
    const ad = await getListingRepository().findById(adId);
    if (!ad) return null;

    await SavedAd.create({ userId, adId });
    void recordAdAnalyticsEvent(adId, 'favorite');
    void getListingRepository().updateOne(adId, { $inc: { 'views.favorites': 1 } } as any);
    return true;
};

export const unsaveAd = async (userId: string, adId: string) => {
    const deleted = await SavedAd.findOneAndDelete({ userId, adId });
    if (deleted) {
        void getListingRepository().updateMany(
            { ids: [adId], favoritesGreaterThan: 0 },
            { $inc: { 'views.favorites': -1 } } as any
        );
    }
};
