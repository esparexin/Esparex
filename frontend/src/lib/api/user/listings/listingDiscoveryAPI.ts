import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from '../../routes';
import { toApiResult, toPaginatedApiResult, unwrapApiPayload } from '@/lib/api/result';
import logger from "@/lib/logger";
import { fetchUserApiJson, type ServerFetchOptions } from '../server';
import { createEmptyPageResult } from '../listingsShared';
import { normalizeListing, type ListingFilters, type ListingPageResult, type Listing, OBJECT_ID_PATTERN } from './normalizer';
import type { LocationLevel } from '@/types/location';

export const getNearbyAdsPage = async (filters: Pick<ListingFilters, "lat" | "lng" | "radiusKm" | "categoryId" | "page" | "limit">): Promise<ListingPageResult> => {
    if (typeof filters.lat !== "number" || typeof filters.lng !== "number") {
        return createEmptyPageResult<Listing>(filters);
    }

    const params = new URLSearchParams();
    params.append("lat", String(filters.lat));
    params.append("lng", String(filters.lng));
    if (typeof filters.radiusKm === "number") params.append("radiusKm", String(filters.radiusKm));
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const { data: result } = await toPaginatedApiResult<Listing>(
        apiClient.get(`${API_ROUTES.USER.ADS_NEARBY}?${params.toString()}`, {
            silent: true,
        })
    );

    if (!result) return createEmptyPageResult<Listing>(filters);

    return {
        data: result.data.map(normalizeListing),
        pagination: result.pagination,
    };
};
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
        const { data } = await toApiResult<{ suggestions: string[] }>(
            apiClient.get(`${API_ROUTES.USER.ADS_SUGGESTIONS}?q=${encodeURIComponent(query.trim())}`, { silent: true })
        );
        return data?.suggestions || [];
    } catch {
        return [];
    }
};
// --- Feed & Search Payload Types ---

export interface HomeAdsPayload {
    ads: Listing[];
    nextCursor: {
        createdAt: string;
        id: string;
    } | null;
    hasMore: boolean;
}

export interface HomeAdsRequestParams {
    cursor?: string | { createdAt: string; id?: string };
    location?: string;
    locationId?: string;
    level?: LocationLevel;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    limit?: number;
}

export interface TrendingAdsPayload {
    ads: Listing[];
}

export interface TrendingAdsRequestParams {
    location?: string;
    locationId?: string;
    category?: string;
    categoryId?: string;
    limit?: number;
}

// --- Direct Listing Queries ---

const withQueryParams = (url: string, params: URLSearchParams): string => {
    const query = params.toString();
    if (!query) return url;
    return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
};

const fetchListingPayload = async <TPayload = any>(
    url: string,
    fetchOptions?: ServerFetchOptions
): Promise<TPayload | null> => {
    const payload =
        typeof window === 'undefined'
            ? await fetchUserApiJson(url, fetchOptions).then(unwrapApiPayload)
            : await apiClient.get(url).then((res: any) => unwrapApiPayload(res.data));
    return (payload ?? null) as TPayload | null;
};

export const getAdsPage = async (
    filters?: ListingFilters,
    options?: { endpoint?: string; fetchOptions?: ServerFetchOptions }
): Promise<ListingPageResult> => {
    try {
        const params = new URLSearchParams();
        const baseEndpoint = options?.endpoint || API_ROUTES.USER.ADS;
        const normalizedCategoryId = typeof filters?.categoryId === 'string' ? filters.categoryId.trim() : '';
        const normalizedCategory = typeof filters?.category === 'string' ? filters.category.trim() : '';
        const resolvedCategoryId = normalizedCategoryId && OBJECT_ID_PATTERN.test(normalizedCategoryId)
            ? normalizedCategoryId
            : (normalizedCategory && OBJECT_ID_PATTERN.test(normalizedCategory) ? normalizedCategory : '');

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'search') {
                        params.append('q', String(value));
                    } else if (key === 'category') {
                        if (!resolvedCategoryId && normalizedCategory) {
                            params.append('category', normalizedCategory);
                        }
                    } else if (key === 'categoryId') {
                        if (resolvedCategoryId) {
                            params.append('categoryId', resolvedCategoryId);
                        }
                    } else {
                        params.append(key, String(value));
                    }
                }
            });
        }

        if (!params.has('categoryId') && resolvedCategoryId) {
            params.append('categoryId', resolvedCategoryId);
        }

        if (!params.has('status')) {
            params.append('status', 'live');
        }

        const endpoint = `${baseEndpoint}?${params.toString()}`;
        const { data: result } =
            typeof window === 'undefined'
                ? await toPaginatedApiResult<Listing>(
                    Promise.resolve(fetchUserApiJson(endpoint, options?.fetchOptions))
                )
                : await toPaginatedApiResult<Listing>(
                    apiClient.get(endpoint, { silent: true })
                );

        if (!result) return createEmptyPageResult<Listing>(filters ?? {});

        const fallbackPage = Number(filters?.page || 1);
        const fallbackLimit = Number(filters?.limit || 20);
        const resolvedPage =
            typeof result.pagination.page === 'number' && result.pagination.page > 0
                ? result.pagination.page
                : fallbackPage;
        const resolvedLimit =
            typeof result.pagination.limit === 'number' && result.pagination.limit > 0
                ? result.pagination.limit
                : fallbackLimit;
        const resolvedTotal =
            typeof result.pagination.total === 'number' ? result.pagination.total : undefined;
        const resolvedHasMore =
            typeof result.pagination.hasMore === 'boolean'
                ? result.pagination.hasMore
                : (typeof resolvedTotal === 'number' ? resolvedPage * resolvedLimit < resolvedTotal : false);

        return {
            data: result.data.map(normalizeListing),
            pagination: {
                ...result.pagination,
                page: resolvedPage,
                limit: resolvedLimit,
                total: resolvedTotal,
                hasMore: resolvedHasMore,
            },
        };
    } catch {
        return createEmptyPageResult<Listing>(filters ?? {});
    }
};

export const getHomeAds = async (
    paramsInput?: HomeAdsRequestParams,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<HomeAdsPayload> => {
    const shouldLogHomeFeedFallback =
        typeof window !== 'undefined' || process.env.NODE_ENV === 'development';
    const fallbackCursor = (
        typeof paramsInput?.cursor === 'string'
            ? { createdAt: paramsInput.cursor, id: '' }
            : (paramsInput?.cursor && typeof paramsInput.cursor === 'object' && typeof paramsInput.cursor.createdAt === 'string'
                ? {
                    createdAt: paramsInput.cursor.createdAt,
                    id: typeof paramsInput.cursor.id === 'string' ? paramsInput.cursor.id : ''
                }
                : null)
    );
    try {
        const effectiveParams = paramsInput ?? {};
        const params = new URLSearchParams();

        if (typeof effectiveParams.cursor === 'string' && effectiveParams.cursor.trim().length > 0) {
            params.append('cursor', effectiveParams.cursor.trim());
        } else if (
            effectiveParams.cursor &&
            typeof effectiveParams.cursor === 'object' &&
            typeof effectiveParams.cursor.createdAt === 'string' &&
            effectiveParams.cursor.createdAt.trim().length > 0
        ) {
            params.append('cursor', effectiveParams.cursor.createdAt.trim());
            if (typeof effectiveParams.cursor.id === 'string' && effectiveParams.cursor.id.trim().length > 0) {
                params.append('cursorId', effectiveParams.cursor.id.trim());
            }
        }
        if (effectiveParams.location) params.append('location', effectiveParams.location);
        if (effectiveParams.locationId) params.append('locationId', effectiveParams.locationId);
        if (effectiveParams.level) params.append('level', effectiveParams.level);
        if (typeof effectiveParams.lat === 'number' && Number.isFinite(effectiveParams.lat)) params.append('lat', String(effectiveParams.lat));
        if (typeof effectiveParams.lng === 'number' && Number.isFinite(effectiveParams.lng)) params.append('lng', String(effectiveParams.lng));
        if (typeof effectiveParams.radiusKm === 'number' && Number.isFinite(effectiveParams.radiusKm)) params.append('radiusKm', String(effectiveParams.radiusKm));
        const url = withQueryParams(API_ROUTES.USER.HOME_FEED, params);
        const result = await fetchListingPayload<any>(url, options?.fetchOptions);

        if (!result) return { ads: [], nextCursor: fallbackCursor, hasMore: false };

        return {
            ads: (result.ads || []).map(normalizeListing),
            nextCursor: (result.nextCursor && typeof result.nextCursor === 'object' && typeof result.nextCursor.createdAt === 'string')
                ? { createdAt: result.nextCursor.createdAt, id: typeof result.nextCursor.id === 'string' ? result.nextCursor.id : '' }
                : (typeof result.nextCursor === 'string' ? { createdAt: result.nextCursor, id: '' } : fallbackCursor),
            hasMore: result.hasMore === true
        };
    } catch (e) {
        if (shouldLogHomeFeedFallback) {
            logger.warn('Failed to fetch home ads', e);
        }
        return { ads: [], nextCursor: fallbackCursor, hasMore: false };
    }
};

export const getTrendingAds = async (
    paramsInput?: TrendingAdsRequestParams,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<TrendingAdsPayload> => {
    try {
        const effectiveParams = paramsInput ?? {};
        const params = new URLSearchParams();

        if (effectiveParams.location) params.append('location', effectiveParams.location);
        if (effectiveParams.locationId) params.append('locationId', effectiveParams.locationId);
        if (effectiveParams.category) params.append('category', effectiveParams.category);
        if (effectiveParams.categoryId) params.append('categoryId', effectiveParams.categoryId);
        if (effectiveParams.limit) params.append('limit', String(effectiveParams.limit));
        const url = withQueryParams(API_ROUTES.USER.ADS_TRENDING, params);
        const result = await fetchListingPayload<any>(url, options?.fetchOptions);

        if (!result) return { ads: [] };

        return { ads: (result.ads || []).map(normalizeListing) };
    } catch (e) {
        logger.error('Failed to fetch trending ads', e);
        return { ads: [] };
    }
};

export const getAds = async (filters?: ListingFilters, options?: { endpoint?: string }): Promise<Listing[]> => {
    const result = await getAdsPage(filters, options);
    return result.data;
};