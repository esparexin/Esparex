import {
    mongoose,
    Ad,
    normalizeAdStatus,
    AD_STATUS,
    FeatureFlag,
    isEnabled,
    recordListingTypeCompatMetric,
    buildListingTypeFilter
} from './_shared/adServiceBase';
import type { AdFilters } from './_shared/adServiceBase';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';

interface ListingStatusGroup { _id: { listingType: string; status: string }; count: number }

/**
 * High-level counts for service-specific dashboard.
 */
export const getServiceAnalyticsStats = async () => {
    const [totalServices, pendingServices, activeServices] = await Promise.all([
        Ad.countDocuments({ listingType: LISTING_TYPE.SERVICE }),
        Ad.countDocuments({ listingType: LISTING_TYPE.SERVICE, status: 'pending' }),
        Ad.countDocuments({ listingType: LISTING_TYPE.SERVICE, status: AD_STATUS.LIVE }),
    ]);
    return { totalServices, pendingServices, activeServices };
};

export const getAdCounts = async (
    filters: AdFilters,
    options: { trackListingTypeCompatMetrics?: boolean } = {}
) => {
    const allowLegacyListingTypeNullCompat = await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);
    const query: Record<string, unknown> = { isDeleted: { $ne: true } };
    
    if (filters.sellerId && mongoose.Types.ObjectId.isValid(String(filters.sellerId))) {
        query.sellerId = new mongoose.Types.ObjectId(String(filters.sellerId));
    }

    if (filters.listingType) {
        const listingTypeFilterResult = buildListingTypeFilter(filters.listingType, allowLegacyListingTypeNullCompat);
        if (listingTypeFilterResult !== undefined) {
            query.listingType = listingTypeFilterResult.filter;
            if (listingTypeFilterResult.compatibilityApplied && options.trackListingTypeCompatMetrics) {
                setImmediate(() => {
                    void recordListingTypeCompatMetric('getAdCounts', filters.listingType);
                });
            }
        }
    }

    const [live, pending, sold, rejected, expired, deactivated, total] = await Promise.all([
        Ad.countDocuments({ ...query, status: AD_STATUS.LIVE }),
        Ad.countDocuments({ ...query, status: AD_STATUS.PENDING }),
        Ad.countDocuments({ ...query, status: AD_STATUS.SOLD }),
        Ad.countDocuments({ ...query, status: AD_STATUS.REJECTED }),
        Ad.countDocuments({ ...query, status: AD_STATUS.EXPIRED }),
        Ad.countDocuments({ ...query, status: AD_STATUS.DEACTIVATED }),
        Ad.countDocuments(query)
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

/**
 * Returns a full breakdown of moderation status counts per listing type.
 * Aggregates in one pass for performance.
 */
export const computeModerationSummaryByType = async () => {
    const results = await Ad.aggregate<ListingStatusGroup>([
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

    const summary: Record<string, Record<string, number>> = {
        ad: { total: 0 },
        service: { total: 0 },
        spare_part: { total: 0 }
    };

    results.forEach(res => {
        const type = res._id.listingType;
        const status = res._id.status;
        if (!summary[type]) summary[type] = { total: 0 };
        const typeSummary = summary[type];
        typeSummary[status] = res.count;
        typeSummary.total = (typeSummary.total ?? 0) + res.count;


    });

    return summary;
};
/**
 * Returns a breakdown of listing stats for a specific seller across all listing types.
 * Used for the 'My Listings' dashboard to show counts on status pills.
 */
export const getSellerListingStats = async (sellerId: string) => {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid Seller ID');
    }

    const results = await Ad.aggregate<ListingStatusGroup>([
        {
            $match: {
                sellerId: new mongoose.Types.ObjectId(sellerId),
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

    const stats: Record<string, Record<string, number>> = {
        ad: { total: 0 },
        service: { total: 0 },
        spare_part: { total: 0 }
    };

    results.forEach(res => {
        const type = res._id.listingType;
        // Normalize status using the legacy-aware logic
        const status = normalizeAdStatus(res._id.status);

        if (!stats[type]) stats[type] = { total: 0 };
        const typeStats = stats[type];
        typeStats[status] = (typeStats[status] ?? 0) + res.count;
        typeStats.total = (typeStats.total ?? 0) + res.count;

    });

    return stats;
};

// ─────────────────────────────────────────────────
// PUBLIC AD RETRIEVAL (No auth required)
// ─────────────────────────────────────────────────





