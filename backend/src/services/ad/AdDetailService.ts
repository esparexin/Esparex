import {
    mongoose,
    Ad,
    Business,
    Report,
    AD_STATUS,
    isBusinessPublishedStatus
} from './_shared/adServiceBase';
import type { PaginationOptions } from './_shared/adServiceBase';

import { hydrateAdMetadata } from './AdAggregationService';
export const getListingDetailById = async (adId: string) => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return null;
    }

    const objectId = new mongoose.Types.ObjectId(adId);
    const ad = await Ad.findById(objectId)
        .populate('sellerId', 'name avatar trustScore isVerified status mobileVisibility role')
        .lean();

    if (!ad) {
        return null;
    }

    await hydrateAdMetadata([ad]);

    const detail = ad as unknown as Record<string, unknown> & {
        categoryId?: unknown;
        brandId?: unknown;
        modelId?: unknown;
        businessId?: unknown;
        sellerId?: unknown;
        sellerType?: unknown;
    };

    if (detail.categoryId) detail.categoryId = String(detail.categoryId);
    if (detail.brandId) detail.brandId = String(detail.brandId);
    if (detail.modelId) detail.modelId = String(detail.modelId);
    if (detail.businessId) detail.businessId = String(detail.businessId);

    const seller = detail.sellerId && typeof detail.sellerId === 'object'
        ? detail.sellerId as Record<string, unknown>
        : null;

    if (seller?.name && typeof seller.name === 'string') {
        detail.sellerName = seller.name;
    }
    if (typeof seller?.isVerified === 'boolean') {
        detail.verified = seller.isVerified;
    }
    detail.isBusiness = detail.sellerType === 'business' || Boolean(detail.businessId);

    if (detail.businessId && mongoose.Types.ObjectId.isValid(String(detail.businessId))) {
        const business = await Business.findById(detail.businessId)
            .select('name businessTypes location expiresAt isVerified status slug')
            .lean();

        if (business) {
            const businessRecord = business as unknown as Record<string, unknown> & {
                name?: string;
                businessTypes?: string[];
                location?: { city?: string; state?: string } | null;
                expiresAt?: Date | string | null;
                isVerified?: boolean;
                status?: unknown;
            };

            if (typeof businessRecord.name === 'string' && businessRecord.name.trim().length > 0) {
                detail.businessName = businessRecord.name.trim();
            }
            if (Array.isArray(businessRecord.businessTypes) && businessRecord.businessTypes.length > 0) {
                const primaryType = businessRecord.businessTypes.find(
                    (type): type is string => typeof type === 'string' && type.trim().length > 0
                );
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
                businessRecord.isVerified === true || isBusinessPublishedStatus(businessRecord.status);
        }
    }

    return detail;
};

export const getReportedAdsAggregation = async (filters: { status?: string, reason?: string, search?: string }, pagination: { skip: number, limit: number }) => {
    const { status, reason, search } = filters;
    const { skip, limit } = pagination;

    const matchQuery: Record<string, unknown> = {};
    if (status && status !== 'all') matchQuery.status = status;
    if (reason && reason !== 'all') matchQuery.reason = reason;

    const pipeline: mongoose.PipelineStage[] = [
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
                isAutoHidden: { $eq: ['$adDetails.moderationStatus', AD_STATUS.REJECTED] }
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

    interface ReportDoc {
        _id: unknown;
        reason: string;
        status: string;
        createdAt: Date;
        reportedBy?: unknown;
    }
    interface ReportGroupDoc {
        _id: unknown;
        reportCount: number;
        reports: ReportDoc[];
        adDetails: unknown;
        isAutoHidden: boolean;
    }

    const [results, totalResults] = await Promise.all([
        Report.aggregate<ReportGroupDoc>([...pipeline, { $skip: skip }, { $limit: limit }]),
        Report.aggregate<{ count: number }>([...pipeline, { $count: 'count' }])
    ]);

    const total = totalResults[0]?.count ?? 0;

    const transformedData = results.map(group => {
        const latestReport = group.reports[group.reports.length - 1] as ReportDoc;
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

// ─────────────────────────────────────────────────
// AD SUGGESTIONS (Autocomplete)
// ─────────────────────────────────────────────────

/**
 * Returns lightweight ad title suggestions for search autocomplete.
 * Moved from adQueryController to service layer.
 */
export const getAdSuggestions = async (q: string, limit = 10): Promise<string[]> => {
    if (!q || q.length < 2) return [];
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const docs = await Ad.find(
        { title: regex, status: AD_STATUS.LIVE, isDeleted: { $ne: true } },
        { title: 1 }
    ).limit(limit).lean();
    return Array.from(new Set(docs.map((d) => d.title).filter(Boolean)));
};

// ─────────────────────────────────────────────────
// AD QUEUE (Admin Moderation)
// ─────────────────────────────────────────────────

/**
 * Returns paginated ads filtered by a specific status.
 * Used for Admin moderation queues (e.g., pending review queue).
 */
export const getAdsByStatus = async (
    status: string,
    pagination: PaginationOptions
): Promise<{ data: Record<string, unknown>[]; total: number }> => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Ad.find({ status, isDeleted: { $ne: true } })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Ad.countDocuments({ status, isDeleted: { $ne: true } })
    ]);
    return { data: data as unknown as Record<string, unknown>[], total };
};

// ─────────────────────────────────────────────────
// AD LOOKUP BY SLUG (Public)
// ─────────────────────────────────────────────────

/**
 * Returns the MongoDB _id for an ad matched by its seoSlug with optional visibility filter.
 * Moved from adQueryController to service layer.
 */
export const getAdIdBySlug = async (
    slug: string,
    visibilityFilter: Record<string, unknown> = {}
): Promise<string | null> => {
    // 1. Direct match (canonical behavior)
    const slugQuery: Record<string, unknown> = { seoSlug: slug, ...visibilityFilter };
    const found = await Ad.findOne(slugQuery).select('_id').lean();
    if (found) return (found._id).toString();

    // 2. Fallback: Check if the slug is in 'name-slug-ID' format (common in frontend routing)
    // Extract the last 24 hex characters at the end of a hyphenated string.
    const match = slug.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (match && match[2]) {
        const potentialId = match[2];
        const foundById = await Ad.findOne({ _id: potentialId, ...visibilityFilter })
            .select('_id')
            .lean();
        if (foundById) return (foundById._id).toString();
    }

    return null;
};

/**
 * Builds the aggregation pipeline for the homepage feed.
 * Pushes heavy lifting (facet matching, sorting, spotlight/boost separation) to MongoDB.
 */
