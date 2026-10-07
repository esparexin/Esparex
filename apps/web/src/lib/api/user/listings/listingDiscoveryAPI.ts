import { apiClient } from "@/lib/api/client";
import { API_ROUTES, sanitizeMongoObjectId } from '@esparex/shared';
import { toApiResult, toPaginatedApiResult, unwrapApiPayload } from '@/lib/api/result';
import logger from "@/lib/logger";
import { fetchUserApiJson, type ServerFetchOptions } from '../server';
import { createEmptyPageResult } from '../listingsShared';
import { normalizeListing, type ListingFilters, type ListingPageResult, type UserListing } from './normalizer';
import type { LocationLevel } from '@/types/location';

export const getNearbyAdsPage = async (filters: Pick<ListingFilters, "lat" | "lng" | "radiusKm" | "categoryId" | "page" | "limit">): Promise<ListingPageResult> => {
    if (typeof filters.lat !== "number" || typeof filters.lng !== "number") {
        return createEmptyPageResult<UserListing>(filters);
    }

    const params = new URLSearchParams();
    params.append("lat", String(filters.lat));
    params.append("lng", String(filters.lng));
    if (typeof filters.radiusKm === "number") params.append("radiusKm", String(filters.radiusKm));
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const { data: result } = await toPaginatedApiResult<UserListing>(
        apiClient.get(`${API_ROUTES.USER.LISTINGS_NEARBY}?${params.toString()}`, {
            silent: true,
        })
    );

    if (!result) return createEmptyPageResult<UserListing>(filters);

    return {
        data: result.data.map(normalizeListing),
        pagination: result.pagination,
    };
};
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
        const { data } = await toApiResult<{ suggestions: string[] }>(
            apiClient.get(`${API_ROUTES.USER.LISTINGS_SUGGESTIONS}?q=${encodeURIComponent(query.trim())}`, { silent: true })
        );
        return data?.suggestions || [];
    } catch {
        return [];
    }
};
// --- Feed & Search Payload Types ---

import type {
    HomeAdsPayload as CanonicalHomeAdsPayload,
    TrendingAdsPayload as CanonicalTrendingAdsPayload,
} from "@esparex/contracts";

/**
 * Phase 3a (§5): wire shapes of `HomeAdsPayload` / `TrendingAdsPayload`
 * relocated to `@esparex/contracts`. These client views extend the canonical
 * wire payloads with fetch-state fields and the normalized `UserListing[]`
 * item type — a derived client view, not a shadow contract.
 */
export interface HomeAdsPayload extends Omit<CanonicalHomeAdsPayload, "ads"> {
    ads: UserListing[];
    isFallback?: boolean;
    /** Set when the request was superseded (aborted) — consumers must skip it without clearing state. */
    aborted?: boolean;
}

export interface HomeAdsRequestParams {
    cursor?: string | { createdAt: string; id?: string };
    locationId?: string;
    level?: LocationLevel;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    limit?: number;
    listingType?: string;
}

export interface TrendingAdsPayload extends Omit<CanonicalTrendingAdsPayload, "ads"> {
    ads: UserListing[];
}

export interface TrendingAdsRequestParams {
    locationId?: string;
    categoryId?: string;
    limit?: number;
}

// --- Direct Listing Queries ---

const withQueryParams = (url: string, params: URLSearchParams): string => {
    const query = params.toString();
    if (!query) return url;
    return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
};

interface RawListingPayload {
    ads?: unknown[];
    nextCursor?: string | { createdAt: string; id?: string };
    hasMore?: boolean;
}

const fetchListingPayload = async <TPayload = unknown>(
    url: string,
    fetchOptions?: ServerFetchOptions,
    signal?: AbortSignal | null
): Promise<TPayload | null> => {
    const payload =
        typeof window === 'undefined'
            ? await fetchUserApiJson(url, fetchOptions).then(unwrapApiPayload)
            : await apiClient.get(url, signal ? { signal } : undefined).then((res: unknown) => unwrapApiPayload((res as { data: { data: unknown } }).data));
    return (payload ?? null) as TPayload | null;
};

export const getAdsPage = async (
    filters?: ListingFilters,
    options?: { endpoint?: string; fetchOptions?: ServerFetchOptions }
): Promise<ListingPageResult> => {
    try {
        const params = new URLSearchParams();
        const baseEndpoint = options?.endpoint || API_ROUTES.USER.LISTINGS;

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'search') {
                        params.append('q', String(value));
                    } else if (key === 'location') {
                        return;
                    } else if (key === 'category') {
                        if (!filters.categoryId && value) {
                            params.append('category', String(value));
                        }
                    } else if (key === 'type') {
                        if (value && value !== 'all') {
                            params.append('listingType', String(value));
                        }
                    } else {
                        params.append(key, String(value));
                    }

                }
            });
        }

        if (!params.has('status')) {
            params.append('status', 'live');
        }

        const endpoint = `${baseEndpoint}?${params.toString()}`;
        const { data: result } =
            typeof window === 'undefined'
                ? await toPaginatedApiResult<UserListing>(
                    Promise.resolve(fetchUserApiJson(endpoint, options?.fetchOptions))
                )
                : await toPaginatedApiResult<UserListing>(
                    apiClient.get(endpoint, { silent: true })
                );

        if (!result) return createEmptyPageResult<UserListing>(filters ?? {});

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
        return createEmptyPageResult<UserListing>(filters ?? {});
    }
};

export const getHomeAds = async (
    paramsInput?: HomeAdsRequestParams,
    options?: { fetchOptions?: ServerFetchOptions; signal?: AbortSignal }
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
    const signal = options?.signal ?? options?.fetchOptions?.signal;
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
        if (effectiveParams.locationId) {
            const validLocationId = sanitizeMongoObjectId(effectiveParams.locationId);
            if (validLocationId) params.append('locationId', validLocationId);
        }
        if (effectiveParams.level) params.append('level', effectiveParams.level);
        if (typeof effectiveParams.lat === 'number' && Number.isFinite(effectiveParams.lat)) params.append('lat', String(effectiveParams.lat));
        if (typeof effectiveParams.lng === 'number' && Number.isFinite(effectiveParams.lng)) params.append('lng', String(effectiveParams.lng));
        if (typeof effectiveParams.radiusKm === 'number' && Number.isFinite(effectiveParams.radiusKm)) params.append('radiusKm', String(effectiveParams.radiusKm));
        if (effectiveParams.listingType && effectiveParams.listingType !== 'all') {
            params.append('listingType', effectiveParams.listingType);
        }
        if (typeof effectiveParams.limit === 'number' && Number.isFinite(effectiveParams.limit)) {
            params.append('limit', String(Math.min(48, Math.max(1, Math.floor(effectiveParams.limit)))));
        }
        const url = withQueryParams(API_ROUTES.USER.HOME_FEED, params);
        const fetchOptions =
            signal && !options?.fetchOptions?.signal
                ? { ...options?.fetchOptions, signal }
                : options?.fetchOptions;
        const result = await fetchListingPayload<RawListingPayload>(url, fetchOptions, signal);

        if (!result) return { ads: [], nextCursor: fallbackCursor, hasMore: false };

        return {
            ads: (result.ads || []).map((ad: unknown) => normalizeListing(ad as Record<string, unknown>)),
            nextCursor: (result.nextCursor && typeof result.nextCursor === 'object' && typeof (result.nextCursor as Record<string, unknown>).createdAt === 'string')
                ? {
                    createdAt: (result.nextCursor as Record<string, unknown>).createdAt as string,
                    id: typeof (result.nextCursor as Record<string, unknown>).id === 'string' ? (result.nextCursor as Record<string, unknown>).id as string : ''
                }
                : (typeof result.nextCursor === 'string' ? { createdAt: result.nextCursor, id: '' } : fallbackCursor),
            hasMore: result.hasMore === true
        };
    } catch (e) {
        if (
            signal?.aborted ||
            (e as { code?: string })?.code === 'ERR_CANCELED' ||
            (e as { name?: string })?.name === 'AbortError'
        ) {
            return { ads: [], nextCursor: fallbackCursor, hasMore: false, aborted: true };
        }
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

        if (effectiveParams.locationId) {
            const validLocationId = sanitizeMongoObjectId(effectiveParams.locationId);
            if (validLocationId) params.append('locationId', validLocationId);
        }
        if (effectiveParams.categoryId) params.append('categoryId', effectiveParams.categoryId);
        if (effectiveParams.limit) params.append('limit', String(effectiveParams.limit));
        const url = withQueryParams(API_ROUTES.USER.LISTINGS_TRENDING, params);
        const result = await fetchListingPayload<RawListingPayload>(url, options?.fetchOptions);

        if (!result) return { ads: [] };

        return { ads: (result.ads || []).map(normalizeListing) };
    } catch (e) {
        logger.error('Failed to fetch trending ads', e);
        return { ads: [] };
    }
};

export const getAds = async (filters?: ListingFilters, options?: { endpoint?: string }): Promise<UserListing[]> => {
    const result = await getAdsPage(filters, options);
    return result.data;
};
