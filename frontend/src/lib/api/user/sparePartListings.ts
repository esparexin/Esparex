import { apiClient } from "@/lib/api/client";
import { toApiResult, toPaginatedApiResult, type PaginationEnvelope } from '@/lib/api/result';
import { API_ROUTES } from '../routes';
import { toSafeImageArray } from '@/lib/image/imageUrl';
import { createEmptyPageResult } from './listingsShared';
import { fetchUserApiJson, type ServerFetchOptions } from './server';

export interface SparePartListingFilters {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sparePartId?: string;
    locationId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
}

export interface SparePartListingPageResult {
    data: SparePartListing[];
    pagination: PaginationEnvelope;
}

export interface SparePartListing {
    id: string;
    title: string;
    description: string;
    price: number;
    categoryId: string | { id: string; name: string; slug: string };
    sparePartId: string | { id: string; name: string; slug: string };
    brandId?: string;
    images: string[];
    status: string;
    seoSlug: string;
    businessId: string | object;
    location?: {
        city?: string;
        state?: string;
        display?: string;
    };
    createdAt: string;
}

type SparePartListingPayload = Record<string, unknown>;

const normalizeSparePartListing = (listing: SparePartListing): SparePartListing => ({
    ...listing,
    images: toSafeImageArray(listing.images),
});

type FetchOptions = { fetchOptions?: ServerFetchOptions };

export const getSparePartListingsPage = async (
    filters: SparePartListingFilters = {},
    { fetchOptions }: FetchOptions = {}
): Promise<SparePartListingPageResult> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.search) params.set('search', filters.search);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.sparePartId) params.set('typeId', filters.sparePartId);
    if (filters.locationId) params.set('locationId', filters.locationId);
    if (filters.lat != null) params.set('lat', String(filters.lat));
    if (filters.lng != null) params.set('lng', String(filters.lng));
    if (filters.radiusKm != null) params.set('radiusKm', String(filters.radiusKm));

    const endpoint = `${API_ROUTES.USER.SPARE_PART_LISTINGS}?${params.toString()}`;

    const { data: result } = typeof window === 'undefined'
        ? await toPaginatedApiResult<SparePartListing>(
            Promise.resolve(fetchUserApiJson(endpoint, fetchOptions))
          )
        : await toPaginatedApiResult<SparePartListing>(apiClient.get(endpoint));

    if (!result) {
        return createEmptyPageResult<SparePartListing>(filters);
    }

    return {
        data: result.data.map(normalizeSparePartListing),
        pagination: result.pagination,
    };
};

export const createSparePartListing = async (
    data: SparePartListingPayload
): Promise<SparePartListing | null> => {
    const { data: listing, error } = await toApiResult<SparePartListing>(
        apiClient.post(API_ROUTES.USER.SPARE_PART_LISTINGS, data)
    );
    if (error) throw new Error(error.userMessage || error.technicalMessage || "Failed to create spare part listing");
    return listing ? normalizeSparePartListing(listing) : null;
};

export const getMySparePartListings = async (): Promise<SparePartListing[]> => {
    const { data: res } = await toApiResult<SparePartListing[]>(
        apiClient.get(API_ROUTES.USER.MY_SPARE_PART_LISTINGS)
    );
    return Array.isArray(res) ? res.map(normalizeSparePartListing) : [];
};



export const updateSparePartListing = async (
    id: string,
    data: SparePartListingPayload
): Promise<SparePartListing | null> => {
    const { data: listing, error } = await toApiResult<SparePartListing>(
        apiClient.put(API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(id), data)
    );
    if (error) throw new Error(error.userMessage || error.technicalMessage || "Failed to update spare part listing");
    return listing ? normalizeSparePartListing(listing) : null;
};

export const deactivateSparePartListing = async (id: string): Promise<boolean> => {
    const { data } = await toApiResult<unknown>(apiClient.patch(API_ROUTES.USER.SPARE_PART_DEACTIVATE(id)));
    return !!data;
};

export const repostSparePartListing = async (id: string): Promise<boolean> => {
    const { data } = await toApiResult<unknown>(apiClient.post(API_ROUTES.USER.SPARE_PART_REPOST(id)));
    return !!data;
};
