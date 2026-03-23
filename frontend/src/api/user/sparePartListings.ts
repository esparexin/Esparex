import { apiClient } from '../../lib/api/client';
import { toApiResult, toPaginatedApiResult, type PaginationEnvelope } from '@/lib/api/result';
import { API_ROUTES, API_V1_BASE_PATH, DEFAULT_LOCAL_API_ORIGIN } from '../routes';
import { toSafeImageArray } from '@/lib/image/imageUrl';

const USER_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

const fetchSparePartApiJson = async (
    endpoint: string,
    fetchOptions?: RequestInit & { next?: { revalidate?: number } }
): Promise<unknown> => {
    const base = USER_API_BASE_URL.endsWith('/') ? USER_API_BASE_URL : `${USER_API_BASE_URL}/`;
    const url = new URL(endpoint.replace(/^\//, ''), base).toString();
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json', ...((fetchOptions?.headers as Record<string, string>) ?? {}) },
        ...fetchOptions,
    });
    if (!response.ok) throw new Error(`Failed to load ${endpoint}: ${response.status}`);
    return response.json().catch(() => null);
};

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
    compatibleModels?: Array<string | { id: string; name: string; slug: string }>;
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

type FetchOptions = { fetchOptions?: RequestInit & { next?: { revalidate?: number } } };

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
            Promise.resolve(fetchSparePartApiJson(endpoint, fetchOptions))
          )
        : await toPaginatedApiResult<SparePartListing>(apiClient.get(endpoint));

    if (!result) {
        return {
            data: [],
            pagination: { page: filters.page ?? 1, limit: filters.limit ?? 20, hasMore: false },
        };
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

export const getSparePartListingDetail = async (
    id: string
): Promise<SparePartListing | null> => {
    const { data: listing } = await toApiResult<SparePartListing>(
        apiClient.get(API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(id))
    );
    return listing ? normalizeSparePartListing(listing) : null;
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
