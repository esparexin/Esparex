import {
    mongoose,
    Business,
    Report,
    LISTING_STATUS,
    isBusinessPublishedStatus
} from './_shared/adServiceBase';
import type { PaginationOptions } from './_shared/adServiceBase';
import { getListingRepository } from '../../../../../composition/listings';

import { hydrateAdMetadata } from './AdAggregationService';
import type { IAd } from '../../../../../models/Ad';
import logger from '../../../../../utils/logger';

const extractRefId = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const candidate = record._id ?? record.id;
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
        if (candidate instanceof mongoose.Types.ObjectId) {
            return candidate.toString();
        }
    }

    if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
    }

    return undefined;
};

const canonicalizeListingContract = (detail: Record<string, unknown>) => {
    const categoryId = extractRefId(detail.categoryId);
    const brandId = extractRefId(detail.brandId);
    const modelId = extractRefId(detail.modelId);
    const businessId = extractRefId(detail.businessId);
    const sellerRecord =
        detail.sellerId && typeof detail.sellerId === 'object'
            ? detail.sellerId as Record<string, unknown>
            : null;
    const sellerId = extractRefId(detail.sellerId);

    if (categoryId) detail.categoryId = categoryId;
    if (brandId) detail.brandId = brandId;
    if (modelId) detail.modelId = modelId;
    if (businessId) detail.businessId = businessId;
    if (sellerId) detail.sellerId = sellerId;

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
export const getAnyAdById = async (
    adId: string,
    _requesterId?: string
): Promise<Record<string, unknown> | null> => {
    void _requesterId;
    if (!mongoose.Types.ObjectId.isValid(adId)) return null;

    const id = new mongoose.Types.ObjectId(adId);

    try {
        const ad = await getListingRepository().findOne({ ids: [adId], isDeleted: { $in: [true, false] } as any });
        if (!ad) return null;

        const User = (await import('../../../../../models/User')).default;
        const seller = await User.findById(ad.sellerId).select('name avatar isVerified role trustScore').lean();
        const adRecord = { ...ad, sellerId: seller ? seller : ad.sellerId };

        if (!adRecord) return null;

        // Perform Split-DB hydration for catalog references
        await hydrateAdMetadata([adRecord as any]);

        // Use DTO/interface for ad
        const result = { ...adRecord } as unknown as Partial<IAd> & Record<string, unknown>;
        delete result.password;
        delete result.otp;
        delete result.otpExpiry;

        return canonicalizeListingContract(result);
    } catch (error) {
        logger.error('Failed to get ad by ID', {
            error: error instanceof Error ? error.message : String(error),
            adId
        });
        throw error;
    }
};

/**
 * Lightweight lookup for moderation checks.
 */
export const getAdForModerationById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const ad = await getListingRepository().findById(id);
    if (!ad) return null;
    return { status: String(ad.status), reviewVersion: ad.reviewVersion as number, listingType: String(ad.listingType), isDeleted: Boolean(ad.isDeleted) };
};

export const getListingDetailById = async (adId: string) => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return null;
    }

    const ad = await getListingRepository().findById(adId);
    if (!ad) return null;

    const User = (await import('../../../../../models/User')).default;
    const seller = await User.findById(ad.sellerId).select('name avatar trustScore isVerified status mobileVisibility role').lean();
    const adRecord = { ...ad, sellerId: seller ? seller : ad.sellerId };

    await hydrateAdMetadata([adRecord as any]);

    const detail = adRecord as unknown as Record<string, unknown> & {
        categoryId?: unknown;
        brandId?: unknown;
        modelId?: unknown;
        businessId?: unknown;
        sellerId?: unknown;
        sellerType?: unknown;
    };

    canonicalizeListingContract(detail);
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

            // Two-Condition Gate: Verified Badge requires BOTH
            // 1. business.isVerified === true (administrative trust record)
            // 2. activePlan.features.businessBadge === true (subscription entitlement)
            let planAllowsBadge = false;
            const sellerIdStr = typeof detail.sellerId === 'string'
                ? detail.sellerId
                : (detail.sellerId as { _id?: unknown; id?: string })?._id?.toString() || (detail.sellerId as { id?: string })?.id || '';

            if (sellerIdStr && mongoose.Types.ObjectId.isValid(sellerIdStr)) {
                try {
                    const UserPlan = (await import('../../../../../models/UserPlan')).default;
                    const now = new Date();
                    const activeUserPlans = await UserPlan.find({
                        userId: sellerIdStr,
                        status: 'active',
                        $or: [{ endDate: { $gte: now } }, { endDate: null }],
                    }).populate<{ planId?: { features?: { businessBadge?: boolean } } }>('planId', 'features.businessBadge').lean();

                    planAllowsBadge = activeUserPlans.some(
                        (up) => (up.planId as { features?: { businessBadge?: boolean } })?.features?.businessBadge === true
                    );
                } catch {
                    planAllowsBadge = false;
                }
            }

            detail.verified = businessRecord.isVerified === true && planAllowsBadge;
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
                isAutoHidden: { $eq: ['$adDetails.moderationStatus', LISTING_STATUS.REJECTED] }
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
    const docs = await getListingRepository().findWithLimit(
        { title: { $regex: regex } as any, status: LISTING_STATUS.LIVE, isDeleted: { $ne: true } as any },
        undefined,
        limit
    );
    return Array.from(new Set(docs.map((d) => d.title).filter(Boolean) as string[]));
};

// ─────────────────────────────────────────────────
// AD QUEUE (Admin Moderation)
// ─────────────────────────────────────────────────

/**
 * Returns paginated ads filtered by a specific status.
 * Used for Admin moderation queues (e.g., pending review queue).
 */
export const getAdsByStatus = async (
    status: IAd['status'],
    pagination: PaginationOptions
): Promise<{ data: Record<string, unknown>[]; total: number }> => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        getListingRepository().findWithLimit({ status, isDeleted: { $ne: true } as any }, { createdAt: 1 }, limit, skip),
        getListingRepository().count({ status, isDeleted: { $ne: true } as any })
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
    const found = await getListingRepository().findOne(slugQuery);
    if (found) return found.id;

    // 2. Fallback: Check if the slug is in 'name-slug-ID' format (common in frontend routing)
    // Extract the last 24 hex characters at the end of a hyphenated string.
    const match = slug.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (match && match[2]) {
        const potentialId = match[2];
        const foundById = await getListingRepository().findOne({ ids: [potentialId], ...visibilityFilter });
        if (foundById) return foundById.id;
    }

    return null;
};

/**
 * Builds the aggregation pipeline for the homepage feed.
 * Pushes heavy lifting (facet matching, sorting, spotlight/boost separation) to MongoDB.
 */
