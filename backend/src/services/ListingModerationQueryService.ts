import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { getAds, getAnyAdById } from './AdService';
import { AD_STATUS } from '../../../shared/enums/adStatus';

export const MODERATION_STATUSES = [
    AD_STATUS.PENDING,
    AD_STATUS.LIVE,
    AD_STATUS.REJECTED,
    AD_STATUS.EXPIRED,
    AD_STATUS.SOLD,
    AD_STATUS.DEACTIVATED,
] as const;

export const MODERATION_LISTING_TYPES = ['ad', 'service', 'spare_part'] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];
export type ModerationListingType = (typeof MODERATION_LISTING_TYPES)[number];

export type ListingModerationFilters = {
    status?: string | string[];
    sellerId?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    location?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    createdAfter?: string;
    createdBefore?: string;
    listingType?: ModerationListingType;
    sortBy?: 'newest' | 'oldest' | 'price_high' | 'price_low' | 'most_viewed' | 'risk_desc';
};

export type ModerationPagination = {
    page: number;
    limit: number;
};

const isModerationStatus = (status: string): status is ModerationStatus =>
    MODERATION_STATUSES.includes(status as ModerationStatus);

export const normalizeModerationStatusFilter = (status?: string): string | string[] => {
    if (!status || status === 'all') return [...MODERATION_STATUSES];
    const normalized = status.trim().toLowerCase();
    if (!isModerationStatus(normalized)) return [...MODERATION_STATUSES];
    return normalized;
};

export const listModerationListings = async (
    filters: ListingModerationFilters,
    pagination: ModerationPagination
) => {
    const normalizedStatusFilter = Array.isArray(filters.status)
        ? filters.status
        : normalizeModerationStatusFilter(typeof filters.status === 'string' ? filters.status : undefined);

    return getAds(
        {
            status: normalizedStatusFilter,
            sellerId: filters.sellerId,
            categoryId: filters.categoryId,
            brandId: filters.brandId,
            modelId: filters.modelId,
            location: filters.location,
            search: filters.search,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            createdAfter: filters.createdAfter,
            createdBefore: filters.createdBefore,
            listingType: filters.listingType,
            sortBy: filters.sortBy,
        },
        pagination,
        {
            trackListingTypeCompatMetrics: false,
        }
    );
};

export const getModerationListingById = async (id: string) => {
    return getAnyAdById(id);
};

type RawAggregationRow = {
    _id: {
        listingType: ModerationListingType;
        status: ModerationStatus;
    };
    count: number;
};

const createEmptyStatusMap = () => ({
    pending: 0,
    live: 0,
    rejected: 0,
    expired: 0,
    sold: 0,
    deactivated: 0,
});

const createEmptyCounts = () => ({
    total: 0,
    ...createEmptyStatusMap(),
});

export const getModerationCounts = async (listingType?: ModerationListingType) => {
    const match: Record<string, unknown> = {
        isDeleted: { $ne: true },
        status: { $in: [...MODERATION_STATUSES] },
    };

    if (listingType) {
        match.listingType = listingType;
    }

    const rows = await Ad.aggregate<RawAggregationRow>([
        { $match: match },
        {
            $group: {
                _id: {
                    listingType: { $ifNull: ['$listingType', 'ad'] },
                    status: '$status',
                },
                count: { $sum: 1 },
            },
        },
    ]);

    const byListingType: Record<ModerationListingType, ReturnType<typeof createEmptyCounts>> = {
        ad: createEmptyCounts(),
        service: createEmptyCounts(),
        spare_part: createEmptyCounts(),
    };

    const byStatus = createEmptyStatusMap();
    let total = 0;

    rows.forEach((row) => {
        const type = row._id.listingType;
        const status = row._id.status;

        if (!MODERATION_LISTING_TYPES.includes(type)) return;
        if (!isModerationStatus(status)) return;

        byListingType[type][status] += row.count;
        byListingType[type].total += row.count;

        byStatus[status] += row.count;
        total += row.count;
    });

    return {
        total,
        ...byStatus,
        byStatus,
        byListingType,
    };
};

export const isValidListingType = (value: unknown): value is ModerationListingType =>
    typeof value === 'string' && MODERATION_LISTING_TYPES.includes(value as ModerationListingType);

export const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);
