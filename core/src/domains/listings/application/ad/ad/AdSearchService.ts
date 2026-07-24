import { getStatusMatchCriteria } from '../../../../../utils/statusQueryMapper';
import {
    mongoose,
    Category,
    Report,
    buildAdFilterFromCriteria,
    getCache,
    setCache,
    buildAdSortStageFromHelper,
    LISTING_STATUS,
    FeatureFlag,
    isEnabled,
    recordListingTypeCompatMetric,
    buildListingTypeFilter
} from './_shared/adServiceBase';
import type {
    AdFilters,
    UnknownRecord,
    ListingTypeCompatMetricContext,
    BuildAdMatchStageOptions,
    SortStage
} from './_shared/adServiceBase';

export const buildAdMatchStage = async (
    filters: AdFilters,
    options: BuildAdMatchStageOptions = {}
): Promise<UnknownRecord> => {
    const allowLegacyListingTypeNullCompat = options.allowLegacyListingTypeNullCompat
        ?? await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);

    if (!filters.status) {
        filters.status = LISTING_STATUS.LIVE;
    }

    const inputCategory = filters.categoryId || (typeof filters.category === 'string' ? filters.category.trim() : undefined);
    let resolvedCategoryIds: string[] | undefined = undefined;
    if (inputCategory) {
        const cacheKey = `catalog:category:expanded_ids:${inputCategory.toLowerCase()}`;
        const cached = await getCache<string[]>(cacheKey);
        if (cached && Array.isArray(cached)) {
            resolvedCategoryIds = cached;
        } else {
            const { resolveCategoryWithSubcategoryIds } = await import('../../../../catalog/application/services/CatalogCategoryService');
            const hierarchy = await resolveCategoryWithSubcategoryIds(inputCategory);
            resolvedCategoryIds = hierarchy.categoryIds;
            if (resolvedCategoryIds.length > 0) {
                void setCache(cacheKey, resolvedCategoryIds, 3600);
            }
        }
    }

    const requestedStatus = filters.status || LISTING_STATUS.LIVE;
    const statusQuery = getStatusMatchCriteria(requestedStatus);

    let match = buildAdFilterFromCriteria({
        ...filters,
        lat: filters.lat,
        lng: filters.lng,
        categoryIds: inputCategory ? (resolvedCategoryIds ?? []) : undefined,
        keywords: filters.search, // Map 'search' to 'keywords' for the helper
        location: filters.location,
        status: statusQuery
    });



    if (filters.isDeleted) {
        match.isDeleted = filters.isDeleted;
    }
    if (filters.expiresAt) {
        match.expiresAt = filters.expiresAt;
    }

    // listingType — ad | service | spare_part
    if (filters.listingType) {
        const listingTypeFilterResult = buildListingTypeFilter(filters.listingType, allowLegacyListingTypeNullCompat);
        if (listingTypeFilterResult !== undefined) {
            match.listingType = listingTypeFilterResult.filter;
            if (listingTypeFilterResult.compatibilityApplied && options.trackListingTypeCompatMetrics && options.metricContext) {
                setImmediate(() => {
                    void recordListingTypeCompatMetric(options.metricContext as ListingTypeCompatMetricContext, filters.listingType);
                });
            }
        }
    }

    // Spare Part Specific Filter
    if (filters.sparePartId && mongoose.Types.ObjectId.isValid(String(filters.sparePartId))) {
        match.sparePartIds = new mongoose.Types.ObjectId(String(filters.sparePartId));
    }

    if (Array.isArray(filters.excludeIds) && filters.excludeIds.length > 0) {
        const excludedObjectIds = filters.excludeIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        if (excludedObjectIds.length > 0) {
            match._id = { ...(match._id || {}), $nin: excludedObjectIds };
        }
    }

    // Business Storefront Filter
    if (filters.businessId && mongoose.Types.ObjectId.isValid(String(filters.businessId))) {
        match.businessId = new mongoose.Types.ObjectId(String(filters.businessId));
    }

    // Admin moderation flagged filter: include ads with elevated fraud/duplicate
    // signals and/or ads crossing a report-count threshold.
    // Cache key uses reportThreshold as part of key so different thresholds stay isolated.
    if (filters.flagged === true) {
        const riskThreshold = Number.isFinite(Number(filters.riskThreshold))
            ? Number(filters.riskThreshold)
            : 70;
        const reportThreshold = Number.isFinite(Number(filters.reportThreshold))
            ? Number(filters.reportThreshold)
            : 2;

        // Cache the expensive Report aggregation (compound index adId+status already exists)
        const cacheKey = `admin:flagged_report_ids:${reportThreshold}`;
        let reportedAdIds: mongoose.Types.ObjectId[] = [];

        const cachedIds = await getCache<string[]>(cacheKey);
        if (cachedIds) {
            reportedAdIds = cachedIds
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));
        } else {
            const reportGroups = await Report.aggregate<{ _id: mongoose.Types.ObjectId }>([
                { $match: { status: { $in: ['open', 'pending', 'reviewed'] } } },
                { $group: { _id: '$adId', reportCount: { $sum: 1 } } },
                { $match: { reportCount: { $gte: reportThreshold } } },
                { $project: { _id: 1 } }
            ]);
            reportedAdIds = reportGroups.map((group) => group._id);
            // 60s freshness is acceptable for admin moderation views
            await setCache(cacheKey, reportedAdIds.map((id) => id.toString()), 60);
        }

        const flaggedOr: UnknownRecord[] = [
            { fraudScore: { $gte: riskThreshold } },
            { isDuplicateFlag: true }
        ];
        if (reportedAdIds.length > 0) {
            flaggedOr.push({ _id: { $in: reportedAdIds } });
        }

        match = Object.keys(match).length > 0
            ? { $and: [match, { $or: flaggedOr }] }
            : { $or: flaggedOr };
    }

    // Expiry Warning Filters
    if (filters.expiryWarningStatus === 'sent') {
        match.expiryWarningSentAt = { $ne: null };
    } else if (filters.expiryWarningStatus === 'not_sent') {
        match.expiryWarningSentAt = null;
    }

    if (filters.expiringWithinDays) {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + Number(filters.expiringWithinDays));
        match.expiresAt = { $gte: now, $lte: future };
    }

    // Spotlight Warning Filters
    if (filters.spotlightWarningStatus === 'sent') {
        match.spotlightWarningSentAt = { $ne: null };
    } else if (filters.spotlightWarningStatus === 'not_sent') {
        match.spotlightWarningSentAt = null;
    }

    if (filters.spotlightExpiringWithinDays) {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + Number(filters.spotlightExpiringWithinDays));
        match.spotlightExpiresAt = { $gte: now, $lte: future };
    }

    return match;
};

export const buildAdSortStage = (filters: AdFilters): SortStage => buildAdSortStageFromHelper(filters);



// ─────────────────────────────────────────────────
// COMPLEX SEARCH (Full aggregation with geo support)
// ─────────────────────────────────────────────────

/**
 * Hydrates a list of ad documents with metadata from the Admin database.
 * This performs application-level joins for Category, Brand, Model, and SparePart
 * collections that reside on the Admin connection, bypassing MongoDB $lookup limitations.
 */
