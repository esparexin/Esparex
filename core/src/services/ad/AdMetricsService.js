"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerListingStats = exports.computeModerationSummaryByType = exports.getAdCounts = exports.getServiceAnalyticsStats = void 0;
const adServiceBase_1 = require("./_shared/adServiceBase");
const listingType_1 = require("@core/constants/enums/listingType");
/**
 * High-level counts for service-specific dashboard.
 */
const getServiceAnalyticsStats = async () => {
    const [totalServices, pendingServices, activeServices] = await Promise.all([
        adServiceBase_1.Ad.countDocuments({ listingType: listingType_1.LISTING_TYPE.SERVICE }),
        adServiceBase_1.Ad.countDocuments({ listingType: listingType_1.LISTING_TYPE.SERVICE, status: 'pending' }),
        adServiceBase_1.Ad.countDocuments({ listingType: listingType_1.LISTING_TYPE.SERVICE, status: adServiceBase_1.AD_STATUS.LIVE }),
    ]);
    return { totalServices, pendingServices, activeServices };
};
exports.getServiceAnalyticsStats = getServiceAnalyticsStats;
const getAdCounts = async (filters, options = {}) => {
    const allowLegacyListingTypeNullCompat = await (0, adServiceBase_1.isEnabled)(adServiceBase_1.FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);
    const query = { isDeleted: { $ne: true } };
    if (filters.sellerId && adServiceBase_1.mongoose.Types.ObjectId.isValid(String(filters.sellerId))) {
        query.sellerId = new adServiceBase_1.mongoose.Types.ObjectId(String(filters.sellerId));
    }
    if (filters.listingType) {
        const listingTypeFilterResult = (0, adServiceBase_1.buildListingTypeFilter)(filters.listingType, allowLegacyListingTypeNullCompat);
        if (listingTypeFilterResult !== undefined) {
            query.listingType = listingTypeFilterResult.filter;
            if (listingTypeFilterResult.compatibilityApplied && options.trackListingTypeCompatMetrics) {
                setImmediate(() => {
                    void (0, adServiceBase_1.recordListingTypeCompatMetric)('getAdCounts', filters.listingType);
                });
            }
        }
    }
    const [live, pending, sold, rejected, expired, deactivated, total] = await Promise.all([
        adServiceBase_1.Ad.countDocuments({ ...query, status: adServiceBase_1.AD_STATUS.LIVE }),
        adServiceBase_1.Ad.countDocuments({ ...query, status: adServiceBase_1.AD_STATUS.PENDING }),
        adServiceBase_1.Ad.countDocuments({ ...query, status: adServiceBase_1.AD_STATUS.SOLD }),
        adServiceBase_1.Ad.countDocuments({ ...query, status: adServiceBase_1.AD_STATUS.REJECTED }),
        adServiceBase_1.Ad.countDocuments({ ...query, status: adServiceBase_1.AD_STATUS.EXPIRED }),
        adServiceBase_1.Ad.countDocuments({ ...query, status: adServiceBase_1.AD_STATUS.DEACTIVATED }),
        adServiceBase_1.Ad.countDocuments(query)
    ]);
    return {
        live,
        pending,
        sold,
        rejected,
        expired,
        deactivated,
        total
    };
};
exports.getAdCounts = getAdCounts;
/**
 * Returns a full breakdown of moderation status counts per listing type.
 * Aggregates in one pass for performance.
 */
const computeModerationSummaryByType = async () => {
    const results = await adServiceBase_1.Ad.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
            $group: {
                _id: {
                    listingType: { $ifNull: ['$listingType', 'ad'] },
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        }
    ]);
    const summary = {
        ad: { total: 0 },
        service: { total: 0 },
        spare_part: { total: 0 }
    };
    results.forEach(res => {
        const type = res._id.listingType;
        const status = res._id.status;
        if (!summary[type])
            summary[type] = { total: 0 };
        const typeSummary = summary[type];
        typeSummary[status] = res.count;
        typeSummary.total = (typeSummary.total ?? 0) + res.count;
    });
    return summary;
};
exports.computeModerationSummaryByType = computeModerationSummaryByType;
/**
 * Returns a breakdown of listing stats for a specific seller across all listing types.
 * Used for the 'My Listings' dashboard to show counts on status pills.
 */
const getSellerListingStats = async (sellerId) => {
    if (!adServiceBase_1.mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid Seller ID');
    }
    const results = await adServiceBase_1.Ad.aggregate([
        {
            $match: {
                sellerId: new adServiceBase_1.mongoose.Types.ObjectId(sellerId),
                isDeleted: { $ne: true }
            }
        },
        {
            $group: {
                _id: {
                    listingType: { $ifNull: ['$listingType', 'ad'] },
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        }
    ]);
    const stats = {
        ad: { total: 0 },
        service: { total: 0 },
        spare_part: { total: 0 }
    };
    results.forEach(res => {
        const type = res._id.listingType;
        // Normalize status using the legacy-aware logic
        const status = (0, adServiceBase_1.normalizeAdStatus)(res._id.status);
        if (!stats[type])
            stats[type] = { total: 0 };
        const typeStats = stats[type];
        typeStats[status] = (typeStats[status] ?? 0) + res.count;
        typeStats.total = (typeStats.total ?? 0) + res.count;
    });
    return stats;
};
exports.getSellerListingStats = getSellerListingStats;
// ─────────────────────────────────────────────────
// PUBLIC AD RETRIEVAL (No auth required)
// ─────────────────────────────────────────────────
//# sourceMappingURL=AdMetricsService.js.map