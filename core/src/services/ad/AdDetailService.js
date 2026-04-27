"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdIdBySlug = exports.getAdsByStatus = exports.getAdSuggestions = exports.getReportedAdsAggregation = exports.getListingDetailById = exports.getAdForModerationById = exports.getAnyAdById = void 0;
const adServiceBase_1 = require("./_shared/adServiceBase");
const AdAggregationService_1 = require("./AdAggregationService");
const logger_1 = __importDefault(require("@core/utils/logger"));
const extractRefId = (value) => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (value && typeof value === 'object') {
        const record = value;
        const candidate = record._id ?? record.id;
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
        if (candidate instanceof adServiceBase_1.mongoose.Types.ObjectId) {
            return candidate.toString();
        }
    }
    if (value instanceof adServiceBase_1.mongoose.Types.ObjectId) {
        return value.toString();
    }
    return undefined;
};
const canonicalizeListingContract = (detail) => {
    const categoryId = extractRefId(detail.categoryId);
    const brandId = extractRefId(detail.brandId);
    const modelId = extractRefId(detail.modelId);
    const businessId = extractRefId(detail.businessId);
    const sellerRecord = detail.sellerId && typeof detail.sellerId === 'object'
        ? detail.sellerId
        : null;
    const sellerId = extractRefId(detail.sellerId);
    if (categoryId)
        detail.categoryId = categoryId;
    if (brandId)
        detail.brandId = brandId;
    if (modelId)
        detail.modelId = modelId;
    if (businessId)
        detail.businessId = businessId;
    if (sellerId)
        detail.sellerId = sellerId;
    if (sellerRecord && typeof sellerRecord.name === 'string' && sellerRecord.name.trim().length > 0) {
        detail.sellerName = sellerRecord.name.trim();
    }
    if (sellerRecord && typeof sellerRecord.isVerified === 'boolean') {
        detail.verified = sellerRecord.isVerified;
    }
    return detail;
};
/**
 * Returns a specific ad by its ID with full seller details and flattened DTO shape.
 * Used for admin lookups and specialized public detail views.
 */
const getAnyAdById = async (adId, _requesterId) => {
    void _requesterId;
    if (!adServiceBase_1.mongoose.Types.ObjectId.isValid(adId))
        return null;
    const id = new adServiceBase_1.mongoose.Types.ObjectId(adId);
    try {
        const ad = await adServiceBase_1.Ad.findOne({ _id: id })
            .setOptions({ withDeleted: true })
            .populate('sellerId', 'name avatar isVerified role trustScore')
            .lean();
        if (!ad)
            return null;
        // Perform Split-DB hydration for catalog references
        await (0, AdAggregationService_1.hydrateAdMetadata)([ad]);
        // Use DTO/interface for ad
        const result = { ...ad };
        delete result.password;
        delete result.otp;
        delete result.otpExpiry;
        return canonicalizeListingContract(result);
    }
    catch (error) {
        logger_1.default.error('Failed to get ad by ID', {
            error: error instanceof Error ? error.message : String(error),
            adId
        });
        throw error;
    }
};
exports.getAnyAdById = getAnyAdById;
/**
 * Lightweight lookup for moderation checks.
 */
const getAdForModerationById = async (id) => {
    if (!adServiceBase_1.mongoose.Types.ObjectId.isValid(id))
        return null;
    return adServiceBase_1.Ad.findById(id)
        .select('status reviewVersion listingType isDeleted')
        .lean();
};
exports.getAdForModerationById = getAdForModerationById;
const getListingDetailById = async (adId) => {
    if (!adServiceBase_1.mongoose.Types.ObjectId.isValid(adId)) {
        return null;
    }
    const objectId = new adServiceBase_1.mongoose.Types.ObjectId(adId);
    const ad = await adServiceBase_1.Ad.findById(objectId)
        .populate('sellerId', 'name avatar trustScore isVerified status mobileVisibility role')
        .lean();
    if (!ad) {
        return null;
    }
    await (0, AdAggregationService_1.hydrateAdMetadata)([ad]);
    const detail = ad;
    canonicalizeListingContract(detail);
    detail.isBusiness = detail.sellerType === 'business' || Boolean(detail.businessId);
    if (detail.businessId && adServiceBase_1.mongoose.Types.ObjectId.isValid(String(detail.businessId))) {
        const business = await adServiceBase_1.Business.findById(detail.businessId)
            .select('name businessTypes location expiresAt isVerified status slug')
            .lean();
        if (business) {
            const businessRecord = business;
            if (typeof businessRecord.name === 'string' && businessRecord.name.trim().length > 0) {
                detail.businessName = businessRecord.name.trim();
            }
            if (Array.isArray(businessRecord.businessTypes) && businessRecord.businessTypes.length > 0) {
                const primaryType = businessRecord.businessTypes.find((type) => typeof type === 'string' && type.trim().length > 0);
                if (primaryType) {
                    detail.businessType = primaryType;
                    detail.businessCategory = primaryType;
                }
            }
            if (businessRecord.location && typeof businessRecord.location === 'object') {
                const location = businessRecord.location;
                if (typeof location.city === 'string') {
                    detail.businessCity = location.city;
                }
                if (typeof location.state === 'string') {
                    detail.businessState = location.state;
                }
            }
            if (businessRecord.expiresAt) {
                detail.businessExpiresAt = businessRecord.expiresAt;
            }
            detail.verified =
                businessRecord.isVerified === true || (0, adServiceBase_1.isBusinessPublishedStatus)(businessRecord.status);
        }
    }
    return detail;
};
exports.getListingDetailById = getListingDetailById;
const getReportedAdsAggregation = async (filters, pagination) => {
    const { status, reason, search } = filters;
    const { skip, limit } = pagination;
    const matchQuery = {};
    if (status && status !== 'all')
        matchQuery.status = status;
    if (reason && reason !== 'all')
        matchQuery.reason = reason;
    const pipeline = [
        { $match: matchQuery },
        {
            $group: {
                _id: '$adId',
                reportCount: { $sum: 1 },
                reports: { $push: '$$ROOT' },
                latestReportAt: { $max: '$createdAt' }
            }
        },
        {
            $lookup: {
                from: 'ads',
                localField: '_id',
                foreignField: '_id',
                as: 'adDetails'
            }
        },
        { $unwind: '$adDetails' },
        {
            $lookup: {
                from: 'users',
                localField: 'adDetails.sellerId',
                foreignField: '_id',
                as: 'sellerDetails'
            }
        },
        { $unwind: { path: '$sellerDetails', preserveNullAndEmptyArrays: true } },
        ...(search ? [{
                $match: {
                    $or: [
                        { 'adDetails.title': { $regex: String(search), $options: 'i' } },
                        { 'reports.description': { $regex: String(search), $options: 'i' } }
                    ]
                }
            }] : []),
        {
            $addFields: {
                isAutoHidden: { $eq: ['$adDetails.moderationStatus', adServiceBase_1.AD_STATUS.REJECTED] }
            }
        },
        {
            $sort: {
                isAutoHidden: -1,
                reportCount: -1,
                latestReportAt: -1
            }
        }
    ];
    const [results, totalResults] = await Promise.all([
        adServiceBase_1.Report.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        adServiceBase_1.Report.aggregate([...pipeline, { $count: 'count' }])
    ]);
    const total = totalResults[0]?.count ?? 0;
    const transformedData = results.map(group => {
        const latestReport = group.reports[group.reports.length - 1];
        return {
            id: String(group._id),
            reportId: String(latestReport._id),
            reason: latestReport.reason,
            status: latestReport.status,
            ad: group.adDetails,
            reportedAt: latestReport.createdAt,
            reporter: group.reports.map((r) => r.reportedBy),
            reportCount: group.reportCount,
            isAutoHidden: group.isAutoHidden
        };
    });
    return { data: transformedData, total };
};
exports.getReportedAdsAggregation = getReportedAdsAggregation;
// ─────────────────────────────────────────────────
// AD SUGGESTIONS (Autocomplete)
// ─────────────────────────────────────────────────
/**
 * Returns lightweight ad title suggestions for search autocomplete.
 * Moved from adQueryController to service layer.
 */
const getAdSuggestions = async (q, limit = 10) => {
    if (!q || q.length < 2)
        return [];
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const docs = await adServiceBase_1.Ad.find({ title: regex, status: adServiceBase_1.AD_STATUS.LIVE, isDeleted: { $ne: true } }, { title: 1 }).limit(limit).lean();
    return Array.from(new Set(docs.map((d) => d.title).filter(Boolean)));
};
exports.getAdSuggestions = getAdSuggestions;
// ─────────────────────────────────────────────────
// AD QUEUE (Admin Moderation)
// ─────────────────────────────────────────────────
/**
 * Returns paginated ads filtered by a specific status.
 * Used for Admin moderation queues (e.g., pending review queue).
 */
const getAdsByStatus = async (status, pagination) => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        adServiceBase_1.Ad.find({ status, isDeleted: { $ne: true } })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        adServiceBase_1.Ad.countDocuments({ status, isDeleted: { $ne: true } })
    ]);
    return { data: data, total };
};
exports.getAdsByStatus = getAdsByStatus;
// ─────────────────────────────────────────────────
// AD LOOKUP BY SLUG (Public)
// ─────────────────────────────────────────────────
/**
 * Returns the MongoDB _id for an ad matched by its seoSlug with optional visibility filter.
 * Moved from adQueryController to service layer.
 */
const getAdIdBySlug = async (slug, visibilityFilter = {}) => {
    // 1. Direct match (canonical behavior)
    const slugQuery = { seoSlug: slug, ...visibilityFilter };
    const found = await adServiceBase_1.Ad.findOne(slugQuery).select('_id').lean();
    if (found)
        return (found._id).toString();
    // 2. Fallback: Check if the slug is in 'name-slug-ID' format (common in frontend routing)
    // Extract the last 24 hex characters at the end of a hyphenated string.
    const match = slug.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (match && match[2]) {
        const potentialId = match[2];
        const foundById = await adServiceBase_1.Ad.findOne({ _id: potentialId, ...visibilityFilter })
            .select('_id')
            .lean();
        if (foundById)
            return (foundById._id).toString();
    }
    return null;
};
exports.getAdIdBySlug = getAdIdBySlug;
/**
 * Builds the aggregation pipeline for the homepage feed.
 * Pushes heavy lifting (facet matching, sorting, spotlight/boost separation) to MongoDB.
 */
//# sourceMappingURL=AdDetailService.js.map