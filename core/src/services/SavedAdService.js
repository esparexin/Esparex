"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsaveAd = exports.saveAd = exports.getSavedAds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SavedAd_1 = __importDefault(require("@core/models/SavedAd"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const AdAggregationService_1 = require("./ad/AdAggregationService");
const s3_1 = require("@core/utils/s3");
const serialize_1 = require("@core/utils/serialize");
const TrendingService_1 = require("./TrendingService");
const getSavedAds = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    // Single $facet aggregation: replaces two separate queries (find + countDocuments)
    // that previously ran in parallel, each costing 1500ms+ on cold start.
    const [result] = await SavedAd_1.default.aggregate([
        { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
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
    const rawAds = await Ad_1.default.find({ _id: { $in: adIds } })
        .select('title images price location categoryId brandId modelId listingType seoSlug status createdAt')
        .lean();
    await (0, AdAggregationService_1.hydrateAdMetadata)(rawAds);
    const adMap = new Map(rawAds
        .map((ad) => {
        const adKey = ad._id ? ad._id.toString() : ad.id;
        return adKey ? [adKey, ad] : null;
    })
        .filter((entry) => Boolean(entry)));
    const data = saved
        .map((s) => {
        const adIdStr = s.adId?.toString();
        const ad = adIdStr ? adMap.get(adIdStr) : null;
        if (!ad)
            return null;
        const serialized = (0, serialize_1.serializeDoc)(ad);
        const rawImages = Array.isArray(serialized.images) ? serialized.images : [];
        return {
            ...serialized,
            images: (0, s3_1.sanitizePersistedImageUrls)(rawImages.filter((img) => typeof img === 'string'), { fallbackToPlaceholder: false, allowPlaceholder: false }),
            _savedAt: s.createdAt,
        };
    })
        .filter(Boolean);
    return { data, total };
};
exports.getSavedAds = getSavedAds;
const saveAd = async (userId, adId) => {
    const ad = await Ad_1.default.findById(adId).select('_id').lean();
    if (!ad)
        return null;
    await SavedAd_1.default.create({ userId, adId });
    void (0, TrendingService_1.recordAdAnalyticsEvent)(adId, 'favorite');
    void Ad_1.default.findByIdAndUpdate(adId, { $inc: { 'views.favorites': 1 } });
    return true;
};
exports.saveAd = saveAd;
const unsaveAd = async (userId, adId) => {
    const deleted = await SavedAd_1.default.findOneAndDelete({ userId, adId });
    if (deleted) {
        void Ad_1.default.findOneAndUpdate({ _id: adId, 'views.favorites': { $gt: 0 } }, { $inc: { 'views.favorites': -1 } });
    }
};
exports.unsaveAd = unsaveAd;
//# sourceMappingURL=SavedAdService.js.map