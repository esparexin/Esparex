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
exports.getSellerAdStats = exports.getAdEngagementMetrics = exports.incrementAdViewWithUniqueness = exports.incrementAdViewByFilter = exports.incrementAdView = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const LocationAnalyticsService_1 = require("./location/LocationAnalyticsService");
const TrendingService_1 = require("./TrendingService");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
// ─────────────────────────────────────────────────
// VIEW TRACKING
// ─────────────────────────────────────────────────
const ViewBufferingService_1 = require("./ViewBufferingService");
const incrementAdView = async (adId, viewerIp) => {
    void viewerIp;
    if (!mongoose_1.default.Types.ObjectId.isValid(String(adId))) {
        return;
    }
    const id = new mongoose_1.default.Types.ObjectId(String(adId));
    try {
        // 🚀 STAFF+ PRODUCTION HARDENING: Buffered increments
        // Decouples view tracking from DB write latency to prevent contention.
        await ViewBufferingService_1.ViewBufferingService.recordView(id);
        void (0, LocationAnalyticsService_1.touchLocationAnalytics)(id.toString(), 'ad_view', 1).catch(() => { });
        void (0, TrendingService_1.recordAdAnalyticsEvent)(id, 'view');
    }
    catch (error) {
        logger_1.default.error('Failed to increment ad view', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
    }
};
exports.incrementAdView = incrementAdView;
/**
 * Higher-order increment by a generic filter (e.g. slug).
 */
const incrementAdViewByFilter = async (filter) => Ad_1.default.findOneAndUpdate(filter, { $inc: { 'views.total': 1 } });
exports.incrementAdViewByFilter = incrementAdViewByFilter;
/**
 * Enterprise view increment with unique tracking support.
 * Updates both total and unique view counters.
 */
const incrementAdViewWithUniqueness = async (filter, isUnique) => {
    try {
        const update = {
            $inc: { 'views.total': 1 },
            $set: { 'views.lastViewedAt': new Date() }
        };
        if (isUnique) {
            update.$inc['views.unique'] = 1;
        }
        const result = await Ad_1.default.findOneAndUpdate(filter, update, { new: true }).select('_id location views').lean();
        if (result) {
            const adId = result._id;
            const locationId = result.location?.locationId?.toString?.();
            if (locationId) {
                void (0, LocationAnalyticsService_1.touchLocationAnalytics)(locationId, 'ad_view', 1).catch(() => { });
            }
            void (0, TrendingService_1.recordAdAnalyticsEvent)(adId, 'view');
        }
    }
    catch (error) {
        logger_1.default.error('Failed to increment unique ad view', { filter, error });
    }
};
exports.incrementAdViewWithUniqueness = incrementAdViewWithUniqueness;
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
        const activeAds = ads.filter(ad => ad.status === listingStatus_1.LISTING_STATUS.LIVE).length;
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