import type { AdminListingsQuery } from './types';
import { AppError } from '../../../../../utils/AppError';
import {
    listModerationListings,
    getModerationListingById,
    getModerationCounts,
    normalizeModerationStatusFilter,
    type ListingModerationFilters,
} from '../ListingModerationQueryService';
import { isValidListingType } from '../ListingModerationQueryService';
import type { ListingTypeValue } from '@esparex/contracts';
import {
    parsePositiveInt, asString, asNumber, resolveListingTypeFilter, validateListingId,
} from './helpers';

export const adminListListings = async (query: AdminListingsQuery) => {
    const page = parsePositiveInt(query.page, 1, { min: 1, max: 100000 });
    const limit = parsePositiveInt(query.limit, 20, { min: 1, max: 100 });
    const listingType = resolveListingTypeFilter(query.listingType) as ListingTypeValue | undefined;
    const result = await listModerationListings(
        {
            status: normalizeModerationStatusFilter(asString(query.status)),
            sellerId: asString(query.sellerId),
            categoryId: asString(query.categoryId),
            brandId: asString(query.brandId),
            modelId: asString(query.modelId),
            locationId: asString(query.locationId),
            q: asString(query.q || query.search),
            minPrice: asNumber(query.minPrice),
            maxPrice: asNumber(query.maxPrice),
            createdAfter: asString(query.createdAfter),
            createdBefore: asString(query.createdBefore),
            listingType,
            sortBy: asString(query.sortBy) as ListingModerationFilters['sortBy'],
            expiryWarningStatus: asString(query.expiryWarningStatus) as ListingModerationFilters['expiryWarningStatus'],
            expiringWithinDays: asNumber(query.expiringWithinDays),
            spotlightWarningStatus: asString(query.spotlightWarningStatus) as ListingModerationFilters['spotlightWarningStatus'],
            spotlightExpiringWithinDays: asNumber(query.spotlightExpiringWithinDays),
        },
        { page, limit }
    );
    const total = result.pagination.total || 0;
    const totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(total / Math.max(1, limit)));
    return { items: result.data, page, limit, total, totalPages };
};

export const adminGetListingById = async (id: string) => {
    validateListingId(id);
    const listing = await getModerationListingById(id);
    if (!listing) throw new AppError('Listing not found', 404);
    return listing;
};

export const adminGetListingCounts = async (listingTypeRaw?: unknown) => {
    const lt = typeof listingTypeRaw === 'string' && isValidListingType(listingTypeRaw.trim().toLowerCase()) ? listingTypeRaw.trim().toLowerCase() as ListingTypeValue : undefined;
    return getModerationCounts(lt);
};
