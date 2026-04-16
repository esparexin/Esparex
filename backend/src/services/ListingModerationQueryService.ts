import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { getAds } from './ad/AdAggregationService';
import { getAnyAdById } from './ad/AdDetailService';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { LISTING_TYPE_VALUES, ListingTypeValue } from '../../../shared/enums/listingType';
import { buildPublicAdFilter } from '../utils/FeedVisibilityGuard';

export const MODERATION_STATUSES = [
    AD_STATUS.PENDING,
    AD_STATUS.LIVE,
    AD_STATUS.REJECTED,
    AD_STATUS.EXPIRED,
    AD_STATUS.SOLD,
    AD_STATUS.DEACTIVATED,
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];
export type ModerationListingType = ListingTypeValue;

export type ListingModerationFilters = {
    status?: string | string[];
    sellerId?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    isSpotlight?: boolean;
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

export type PublicLiveListingCounts = {
    total: number;
    byListingType: Record<ModerationListingType, number>;
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
            isSpotlight: filters.isSpotlight,
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

const createEmptyListingTypeCounts = (): Record<ModerationListingType, number> => ({
    ad: 0,
    service: 0,
    spare_part: 0,
});

export const getModerationCounts = async (listingType?: ModerationListingType) => {
    const publicLiveCounts = await getPublicLiveListingCounts(listingType);

    const match: Record<string, unknown> = {
        isDeleted: { $ne: true },
        status: { $in: [...MODERATION_STATUSES] },
    };

    if (listingType) {
        match.listingType = listingType;
    }

    const now = new Date();
    const spotlightMatch: Record<string, unknown> = {
        ...buildPublicAdFilter(),
        isSpotlight: true,
        spotlightExpiresAt: { $gt: now },
    };

    if (listingType) {
        spotlightMatch.listingType = listingType;
    }

    const [rows, spotlight] = await Promise.all([
        Ad.aggregate<RawAggregationRow>([
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
        ]),
        Ad.countDocuments(spotlightMatch),
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

        if (!LISTING_TYPE_VALUES.includes(type)) return;
    if (!isModerationStatus(status)) return;

    byListingType[type][status] += row.count;
    byListingType[type].total += row.count;

    byStatus[status] += row.count;
    total += row.count;
});

byStatus.live = publicLiveCounts.total;
for (const type of LISTING_TYPE_VALUES) {
    byListingType[type].live = publicLiveCounts.byListingType[type];
}

return {
    total,
    ...byStatus,
    spotlight,
    byStatus,
    byListingType,
};
};

type PublicLiveAggregationRow = {
_id: ModerationListingType;
count: number;
};

export const getPublicLiveListingCounts = async (listingType?: ModerationListingType): Promise<PublicLiveListingCounts> => {
const match: Record<string, unknown> = {
    ...buildPublicAdFilter(),
};

if (listingType) {
    match.listingType = listingType;
}

const rows = await Ad.aggregate<PublicLiveAggregationRow>([
    {
        $match: match,
    },
    {
        $group: {
            _id: { $ifNull: ['$listingType', 'ad'] },
            count: { $sum: 1 },
        },
    },
]);

const byListingType = createEmptyListingTypeCounts();
let total = 0;

for (const row of rows) {
    if (!LISTING_TYPE_VALUES.includes(row._id)) {
        continue;
    }
    byListingType[row._id] += row.count;
    total += row.count;
}

return {
    total,
    byListingType,
};
};

export const isValidListingType = (value: unknown): value is ModerationListingType =>
typeof value === 'string' && LISTING_TYPE_VALUES.includes(value as ModerationListingType);

export const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);
