/**
 * Ad Query Service
 * Handles ad searching, filtering, and listing operations
 *
 * Extracted from adService.ts for better separation of concerns
 */

import mongoose, { PipelineStage } from 'mongoose';
import BlockedUser from '../../../models/BlockedUser';
import { type ListingTypeValue } from '../../../../../shared/enums/listingType';
import logger from '../../../utils/logger';


import AdminMetrics from '../../../models/AdminMetrics';

// ─────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────

export interface AdFilters {
    search?: string;
    status?: string | string[];
    category?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    locationId?: string;
    level?: 'country' | 'state' | 'district' | 'city' | 'area' | 'village';
    district?: string;
    state?: string;
    country?: string;
    location?: string;
    lat?: number | string;
    lng?: number | string;
    radiusKm?: number;
    sparePartId?: string | mongoose.Types.ObjectId;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
    sortBy?: string;
    planType?: string;
    isSpotlight?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    flagged?: boolean;
    reportThreshold?: number;
    riskThreshold?: number;
    excludeIds?: string[];
    isDeleted?: { $ne: boolean };
    expiresAt?: { $gt: Date };
    priceMin?: number;
    priceMax?: number;
    onsiteService?: boolean;
    /** Filter by Ad record listingType. Use the `categoryEnumToRecord` helper if mapping from Category capability enums. */
    listingType?: ListingTypeValue | ListingTypeValue[];
}

export interface PaginationOptions {
    page: number;
    limit: number;
    cursor?: string;
}

export interface PublicQueryOptions {
    enforcePublicVisibility?: boolean;
    disableLocationIntelligence?: boolean;
    viewerId?: string;
    trackListingTypeCompatMetrics?: boolean;
}

export interface PublicAdViewer {
    userId?: string;
    role?: string;
    isAdmin?: boolean;
}

export type UnknownRecord = Record<string, unknown>;
export type AggregationStage = PipelineStage;
export type ListingTypeCompatMetricContext = 'getAds' | 'getAdCounts';

export type ListingTypeFilterBuildResult = {
    filter: Record<string, unknown> | string;
    compatibilityApplied: boolean;
};

export type BuildAdMatchStageOptions = {
    allowLegacyListingTypeNullCompat?: boolean;
    trackListingTypeCompatMetrics?: boolean;
    metricContext?: ListingTypeCompatMetricContext;
};

export const buildListingTypeFilter = (
    listingType: AdFilters['listingType'],
    allowLegacyListingTypeNullCompat: boolean
): ListingTypeFilterBuildResult | undefined => {
    if (!listingType) return undefined;

    if (Array.isArray(listingType)) {
        const values = [...listingType];
        // Legacy rows can miss listingType; treat them as "ad" during transition.
        if (allowLegacyListingTypeNullCompat && values.includes('ad')) {
            return {
                filter: { $in: [...values, null] },
                compatibilityApplied: true
            };
        }
        return {
            filter: { $in: values },
            compatibilityApplied: false
        };
    }

    if (allowLegacyListingTypeNullCompat && listingType === 'ad') {
        // `{ $in: ['ad', null] }` matches explicit "ad" and missing/null legacy rows.
        return {
            filter: { $in: ['ad', null] },
            compatibilityApplied: true
        };
    }

    return {
        filter: listingType,
        compatibilityApplied: false
    };
};

const LISTINGTYPE_COMPAT_METRIC_MODULE = 'ad_listingtype_compat';

export const normalizeMetricSegment = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';

export const recordListingTypeCompatMetric = async (
    context: ListingTypeCompatMetricContext,
    listingType: AdFilters['listingType']
): Promise<void> => {
    try {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const filterLabelRaw = Array.isArray(listingType)
            ? listingType.join('_')
            : String(listingType ?? 'unknown');
        const filterLabel = normalizeMetricSegment(filterLabelRaw);

        await AdminMetrics.findOneAndUpdate(
            { metricModule: LISTINGTYPE_COMPAT_METRIC_MODULE, aggregationDate: date },
            {
                $inc: {
                    'payload.total': 1,
                    [`payload.context.${context}`]: 1,
                    [`payload.filters.${filterLabel}`]: 1
                }
            },
            { upsert: true }
        );
    } catch (error) {
        logger.warn('Failed to record listingType compatibility metric', {
            context,
            listingType,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export interface AdsListResult {
    data: Array<Record<string, unknown>>;
    meta?: {
        effectiveRadiusKm?: number;
        /** Which fallback level resolved the feed. L1=geo, L2=city, L3=state, L4=India */
        locationHierarchyLevel?: 'L1' | 'L2' | 'L3' | 'L4';
    };
    pagination: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasMore?: boolean;
        nextCursor?: string;
        cursor?: string | null;
    };
}

export const AD_DETAIL_CACHE_TTL_SECONDS = 300;

export const getBlockedSellerIds = async (viewerId?: string): Promise<mongoose.Types.ObjectId[]> => {
    if (!viewerId || !mongoose.Types.ObjectId.isValid(viewerId)) return [];

    const records = await BlockedUser.find({
        blockerId: new mongoose.Types.ObjectId(viewerId),
    })
        .select('blockedId')
        .lean<Array<{ blockedId: mongoose.Types.ObjectId }>>();

    const deduped = new Set<string>();
    const blockedIds: mongoose.Types.ObjectId[] = [];
    for (const record of records) {
        const id = record?.blockedId;
        if (!id) continue;
        const str = String(id);
        if (deduped.has(str)) continue;
        deduped.add(str);
        blockedIds.push(id);
    }

    return blockedIds;
};

// ─────────────────────────────────────────────────
// FILTER & SORT BUILDERS (Helper Functions)
// ─────────────────────────────────────────────────

/**
 * CONSOLIDATION PLAN: buildAdMatchStage and buildAdFilterFromCriteria overlap. Align them into a single AdCriteriaTransformer utility to reduce logic drift.
 */
