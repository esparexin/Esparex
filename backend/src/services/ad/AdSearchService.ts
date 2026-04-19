import { getStatusMatchCriteria } from '../../utils/statusQueryMapper';
import {
    mongoose,
    Category,
    Report,
    buildAdFilterFromCriteria,
    getCache,
    setCache,
    buildAdSortStageFromHelper,
    AD_STATUS,
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
    AdFilterCriteria,
    SortStage
} from './_shared/adServiceBase';

export const buildAdMatchStage = async (
    filters: AdFilters,
    options: BuildAdMatchStageOptions = {}
): Promise<UnknownRecord> => {
    const allowLegacyListingTypeNullCompat = options.allowLegacyListingTypeNullCompat
        ?? await isEnabled(FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);

    if (!filters.status) {
        filters.status = AD_STATUS.LIVE;
    }

    let resolvedCategoryId = filters.categoryId;
    const legacyCategory = typeof filters.category === 'string' ? filters.category.trim() : '';
    if (!resolvedCategoryId && legacyCategory) {
        if (mongoose.Types.ObjectId.isValid(legacyCategory)) {
            resolvedCategoryId = legacyCategory;
        } else {
            // Cache slug → ObjectId to avoid a DB round-trip on every public browse call.
            // The regex name-match arm was removed: it always caused a full collection scan
            // and slug lookup covers all real-world frontend category filters.
            const cacheKey = `catalog:category:slug:${legacyCategory.toLowerCase()}`;
            const cached = await getCache<string>(cacheKey);
            if (cached) {
                resolvedCategoryId = cached;
            } else {
                const resolvedCategory = await Category.findOne({
                    isDeleted: { $ne: true },
                    isActive: true,
                    slug: legacyCategory.toLowerCase(),
                }).select('_id').lean<{ _id: mongoose.Types.ObjectId } | null>();
                resolvedCategoryId = resolvedCategory?._id?.toString();
                if (resolvedCategoryId) {
                    // 6-hour TTL — category slugs are stable, rarely renamed
                    void setCache(cacheKey, resolvedCategoryId, 21600);
                }
            }
        }
    }

    const requestedStatus = filters.status || AD_STATUS.LIVE;
    const statusQuery = getStatusMatchCriteria(requestedStatus);

    let match = buildAdFilterFromCriteria({
        ...filters,
        lat: filters.lat,
        lng: filters.lng,
        categoryId: resolvedCategoryId,
        keywords: filters.search, // Map 'search' to 'keywords' for the helper
        location: filters.location,
        status: statusQuery
    } as AdFilterCriteria & { lat?: number | string; lng?: number | string; });

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
            match._id = { ...(match._id as UnknownRecord || {}), $nin: excludedObjectIds };
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
