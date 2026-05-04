"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdSortStage = exports.buildAdMatchStage = void 0;
const statusQueryMapper_1 = require("@core/utils/statusQueryMapper");
const adServiceBase_1 = require("./_shared/adServiceBase");
const buildAdMatchStage = async (filters, options = {}) => {
    const allowLegacyListingTypeNullCompat = options.allowLegacyListingTypeNullCompat
        ?? await (0, adServiceBase_1.isEnabled)(adServiceBase_1.FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT);
    if (!filters.status) {
        filters.status = adServiceBase_1.LISTING_STATUS.LIVE;
    }
    let resolvedCategoryId = filters.categoryId;
    const legacyCategory = typeof filters.category === 'string' ? filters.category.trim() : '';
    if (!resolvedCategoryId && legacyCategory) {
        if (adServiceBase_1.mongoose.Types.ObjectId.isValid(legacyCategory)) {
            resolvedCategoryId = legacyCategory;
        }
        else {
            // Cache slug → ObjectId to avoid a DB round-trip on every public browse call.
            // The regex name-match arm was removed: it always caused a full collection scan
            // and slug lookup covers all real-world frontend category filters.
            const cacheKey = `catalog:category:slug:${legacyCategory.toLowerCase()}`;
            const cached = await (0, adServiceBase_1.getCache)(cacheKey);
            if (cached) {
                resolvedCategoryId = cached;
            }
            else {
                const resolvedCategory = await adServiceBase_1.Category.findOne({
                    isDeleted: { $ne: true },
                    isActive: true,
                    slug: legacyCategory.toLowerCase(),
                }).select('_id').lean();
                resolvedCategoryId = resolvedCategory?._id?.toString();
                if (resolvedCategoryId) {
                    // 6-hour TTL — category slugs are stable, rarely renamed
                    void (0, adServiceBase_1.setCache)(cacheKey, resolvedCategoryId, 21600);
                }
            }
        }
    }
    const requestedStatus = filters.status || adServiceBase_1.LISTING_STATUS.LIVE;
    const statusQuery = (0, statusQueryMapper_1.getStatusMatchCriteria)(requestedStatus);
    let match = (0, adServiceBase_1.buildAdFilterFromCriteria)({
        ...filters,
        lat: filters.lat,
        lng: filters.lng,
        categoryId: resolvedCategoryId,
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
        const listingTypeFilterResult = (0, adServiceBase_1.buildListingTypeFilter)(filters.listingType, allowLegacyListingTypeNullCompat);
        if (listingTypeFilterResult !== undefined) {
            match.listingType = listingTypeFilterResult.filter;
            if (listingTypeFilterResult.compatibilityApplied && options.trackListingTypeCompatMetrics && options.metricContext) {
                setImmediate(() => {
                    void (0, adServiceBase_1.recordListingTypeCompatMetric)(options.metricContext, filters.listingType);
                });
            }
        }
    }
    // Spare Part Specific Filter
    if (filters.sparePartId && adServiceBase_1.mongoose.Types.ObjectId.isValid(String(filters.sparePartId))) {
        match.sparePartIds = new adServiceBase_1.mongoose.Types.ObjectId(String(filters.sparePartId));
    }
    if (Array.isArray(filters.excludeIds) && filters.excludeIds.length > 0) {
        const excludedObjectIds = filters.excludeIds
            .filter((id) => adServiceBase_1.mongoose.Types.ObjectId.isValid(id))
            .map((id) => new adServiceBase_1.mongoose.Types.ObjectId(id));
        if (excludedObjectIds.length > 0) {
            match._id = { ...(match._id || {}), $nin: excludedObjectIds };
        }
    }
    // Business Storefront Filter
    if (filters.businessId && adServiceBase_1.mongoose.Types.ObjectId.isValid(String(filters.businessId))) {
        match.businessId = new adServiceBase_1.mongoose.Types.ObjectId(String(filters.businessId));
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
        let reportedAdIds = [];
        const cachedIds = await (0, adServiceBase_1.getCache)(cacheKey);
        if (cachedIds) {
            reportedAdIds = cachedIds
                .filter((id) => adServiceBase_1.mongoose.Types.ObjectId.isValid(id))
                .map((id) => new adServiceBase_1.mongoose.Types.ObjectId(id));
        }
        else {
            const reportGroups = await adServiceBase_1.Report.aggregate([
                { $match: { status: { $in: ['open', 'pending', 'reviewed'] } } },
                { $group: { _id: '$adId', reportCount: { $sum: 1 } } },
                { $match: { reportCount: { $gte: reportThreshold } } },
                { $project: { _id: 1 } }
            ]);
            reportedAdIds = reportGroups.map((group) => group._id);
            // 60s freshness is acceptable for admin moderation views
            await (0, adServiceBase_1.setCache)(cacheKey, reportedAdIds.map((id) => id.toString()), 60);
        }
        const flaggedOr = [
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
exports.buildAdMatchStage = buildAdMatchStage;
const buildAdSortStage = (filters) => (0, adServiceBase_1.buildAdSortStageFromHelper)(filters);
exports.buildAdSortStage = buildAdSortStage;
// ─────────────────────────────────────────────────
// COMPLEX SEARCH (Full aggregation with geo support)
// ─────────────────────────────────────────────────
/**
 * Hydrates a list of ad documents with metadata from the Admin database.
 * This performs application-level joins for Category, Brand, Model, and SparePart
 * collections that reside on the Admin connection, bypassing MongoDB $lookup limitations.
 */
//# sourceMappingURL=AdSearchService.js.map