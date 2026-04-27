"use strict";
/**
 * Ad Engagement Service
 * Handles ad views, engagement metrics, and buyer interactions
 *
 * Extracted from adService.ts for better separation of concerns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerAdStats = exports.getAdEngagementMetrics = exports.incrementAdViewByFilter = exports.incrementAdView = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const LocationAnalyticsService_1 = require("./location/LocationAnalyticsService");
const TrendingService_1 = require("./TrendingService");
const adStatus_1 = require("@core/constants/enums/adStatus");
// ─────────────────────────────────────────────────
// VIEW TRACKING
// ─────────────────────────────────────────────────
const incrementAdView = async (adId, viewerIp) => {
    void viewerIp;
    if (!mongoose_1.default.Types.ObjectId.isValid(String(adId))) {
        return null;
    }
    const id = new mongoose_1.default.Types.ObjectId(String(adId));
    try {
        const result = await Ad_1.default.findByIdAndUpdate(id, { $inc: { 'views.total': 1 } }, { new: true });
        if (!result) {
            return null;
        }
        const locationId = result.location?.locationId?.toString?.();
        if (locationId) {
            void (0, LocationAnalyticsService_1.touchLocationAnalytics)(locationId, 'ad_view', 1).catch((error) => {
                logger_1.default.warn('Failed to update location analytics for ad_view', {
                    adId: String(id),
                    locationId,
                    error: error instanceof Error ? error.message : String(error)
                });
            });
        }
        void (0, TrendingService_1.recordAdAnalyticsEvent)(id, 'view');
        return result.views?.total || 0;
    }
    catch (error) {
        logger_1.default.error('Failed to increment ad view', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return null;
    }
};
exports.incrementAdView = incrementAdView;
/**
 * Higher-order increment by a generic filter (e.g. slug).
 */
const incrementAdViewByFilter = async (filter) => Ad_1.default.findOneAndUpdate(filter, { $inc: { 'views.total': 1 } });
exports.incrementAdViewByFilter = incrementAdViewByFilter;
// ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────
// ENGAGEMENT METRICS (Aggregate statistics)
// ─────────────────────────────────────────────────
const getAdEngagementMetrics = async (adId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        return null;
    }
    const id = new mongoose_1.default.Types.ObjectId(adId);
    try {
        const ad = await Ad_1.default.findById(id)
            .select('views')
            .lean();
        if (!ad) {
            return null;
        }
        return {
            views: ad.views?.total || 0,
            inquiries: 0, // Placeholder for future implementation
            shares: 0 // Placeholder for future implementation
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get engagement metrics', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return null;
    }
};
exports.getAdEngagementMetrics = getAdEngagementMetrics;
// ─────────────────────────────────────────────────
// TRAFFIC ANALYTICS (Per seller or per category)
// ─────────────────────────────────────────────────
const getSellerAdStats = async (sellerId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(sellerId)) {
        return null;
    }
    const id = new mongoose_1.default.Types.ObjectId(sellerId);
    try {
        const ads = await Ad_1.default.find({ sellerId: id, isDeleted: { $ne: true } })
            .select('views status')
            .lean();
        const totalViews = ads.reduce((sum, ad) => sum + (ad.views?.total || 0), 0);
        const activeAds = ads.filter(ad => ad.status === adStatus_1.AD_STATUS.LIVE).length;
        return {
            totalViews,
            activeAds,
            avgViewsPerAd: activeAds > 0 ? Math.round(totalViews / activeAds) : 0
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get seller ad stats', {
            error: error instanceof Error ? error.message : String(error),
            sellerId
        });
        return null;
    }
};
exports.getSellerAdStats = getSellerAdStats;
//# sourceMappingURL=AdEngagementService.js.map