import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from '../routes';
import { type Ad, AdSchema } from '@shared/schemas/ad.schema';
import { toApiResult, toPaginatedApiResult, unwrapApiPayload, type PaginationEnvelope } from '@/lib/api/result';
import { normalizeAdStatus } from '@/lib/status/statusNormalization';
import { toSafeImageArray, toSafeImageSrc } from '@/lib/image/imageUrl';
import { normalizeToAppLocation as normalizeLocation } from '@/lib/location/locationService';
import { createEmptyPageResult } from './listingsShared';
import type { LocationLevel } from '@/types/location';
import logger from "@/lib/logger";
import { stripEmptyObjectIdFields as stripSharedObjectIdFields } from './listingsShared';
import { fetchUserApiJson, type ServerFetchOptions } from './server';
import { LISTING_TYPE, type ListingTypeValue } from '@shared/enums/listingType';

// --- Shared Constants & Types ---

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
export const LISTING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_LISTING_IDENTIFIERS = new Set([
    '', 'undefined', 'null', 'nan', 'true', 'false', 'favicon.ico',
]);

export interface Listing extends Ad {
    priceMin?: number | null;
    priceMax?: number | null;
    isChatLocked?: boolean;
    serviceId?: string;
    sparePartId?: string;
    onsiteService?: boolean;
    turnaroundTime?: string;
}

export interface ListingFilters {
    category?: string;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    location?: string;
    locationId?: string;
    level?: LocationLevel;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    cursor?: string;
    sellerId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    sortBy?: string;
    type?: string; 
}

export interface ListingPageResult {
    data: Listing[];
    pagination: PaginationEnvelope;
}

function getDeleteListingEndpoint(id: string | number, listingType: ListingTypeValue): string {
    switch (listingType) {
        case LISTING_TYPE.SERVICE:
            return `${API_ROUTES.USER.SERVICES}/${encodeURIComponent(String(id))}`;
        case LISTING_TYPE.SPARE_PART:
            return API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(String(id));
        case LISTING_TYPE.AD:
        default:
            return API_ROUTES.USER.AD_DETAIL(id);
    }
}

function getRepostListingEndpoint(id: string | number, listingType: ListingTypeValue): string {
    switch (listingType) {
        case LISTING_TYPE.SERVICE:
            return API_ROUTES.USER.SERVICE_REPOST(String(id));
        case LISTING_TYPE.SPARE_PART:
            return API_ROUTES.USER.SPARE_PART_REPOST(String(id));
        case LISTING_TYPE.AD:
        default:
            return API_ROUTES.USER.AD_REPOST(id);
    }
}

// --- Helpers ---

export function normalizeListingIdentifier(value: string | number): string {
    const raw = String(value).trim();
    if (!raw) return '';
    try {
        return decodeURIComponent(raw).trim();
    } catch {
        return raw;
    }
}

export function isValidListingIdentifier(value: string | number): boolean {
    const identifier = normalizeListingIdentifier(value);
    if (!identifier || identifier.length > 200) return false;
    if (RESERVED_LISTING_IDENTIFIERS.has(identifier.toLowerCase())) return false;
    if (identifier.includes("/") || identifier.includes("\\")) return false;

    if (OBJECT_ID_PATTERN.test(identifier)) return true;
    if (identifier.length < 2) return false;
    return LISTING_SLUG_PATTERN.test(identifier.toLowerCase());
}

export const isValidAdIdentifier = isValidListingIdentifier;

export function extractId(value: unknown): string | undefined {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return String(record.id || record._id || '');
    }
    return undefined;
}

function normalizeImageUrl(url: string): string {
    const normalized = toSafeImageSrc(url, '').trim();
    if (!normalized) return normalized;
    try {
        const parsed = new URL(normalized);
        if (parsed.hostname !== 'placehold.co') return normalized;
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length === 0) return normalized;
        const hasExplicitFormat = parts.length >= 2 && ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(parts[1]!.toLowerCase());
        if (hasExplicitFormat) return normalized;
        parsed.pathname = `/${parts[0]}/png`;
        return parsed.toString();
    } catch { return normalized; }
}

function toListingSchemaCompatible(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;
    const record = { ...(data as Record<string, unknown>) };
    const normalizedId = extractId(record.id) ?? extractId(record._id);
    if (normalizedId) record.id = normalizedId;
    if (record.createdAt instanceof Date) record.createdAt = record.createdAt.toISOString();
    if (record.updatedAt instanceof Date) record.updatedAt = record.updatedAt.toISOString();

    const toLegacyStringField = (value: unknown): string | undefined => {
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (value && typeof value === 'object') {
            const objectValue = value as Record<string, unknown>;
            if (typeof objectValue.name === 'string' && objectValue.name.trim().length > 0) return objectValue.name.trim();
            if (typeof objectValue.title === 'string' && objectValue.title.trim().length > 0) return objectValue.title.trim();
            return extractId(objectValue);
        }
        return undefined;
    };

    const normalizedSellerId = extractId(record.sellerId);
    const normalizedUserId = extractId(record.userId) ?? '';
    if (normalizedSellerId) record.sellerId = normalizedSellerId;
    record.userId = normalizedUserId;

    if (record.category !== undefined) {
        const norm = toLegacyStringField(record.category);
        norm ? record.category = norm : delete record.category;
    }
    if (record.brand !== undefined) {
        const norm = toLegacyStringField(record.brand);
        norm ? record.brand = norm : delete record.brand;
    }
    if (record.model !== undefined) {
        const norm = toLegacyStringField(record.model);
        norm ? record.model = norm : delete record.model;
    }
    return record;
}

function coerceListingFallback(data: unknown): Listing {
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const id = extractId(record.id) ?? extractId(record._id) ?? '';
    const title = typeof record.title === 'string' ? record.title : '';
    const description = typeof record.description === 'string' ? record.description : '';
    const price = typeof record.price === 'number' ? record.price : (typeof record.price === 'string' ? Number(record.price) : 0);
    const createdAt = typeof record.createdAt === 'string' ? record.createdAt : (record.createdAt instanceof Date ? record.createdAt.toISOString() : new Date(0).toISOString());

    return {
        id, title, description,
        price: Number.isFinite(price) ? price : 0,
        images: Array.isArray(record.images) ? record.images.filter((img): img is string => typeof img === 'string').map(normalizeImageUrl) : [],
        location: (record.location && typeof record.location === 'object' && !Array.isArray(record.location)) ? (record.location as any) : { city: "" },
        userId: extractId(record.userId) ?? extractId(record.sellerId) ?? '',
        status: normalizeAdStatus(typeof record.status === 'string' ? record.status : 'pending'),
        sellerId: extractId(record.sellerId) || '',
        createdAt,
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : (record.updatedAt instanceof Date ? record.updatedAt.toISOString() : undefined),
        views: typeof record.views === 'number' ? record.views : 0,
        spareParts: Array.isArray(record.spareParts) ? record.spareParts as string[] : undefined,
    } as Listing;
}

export function unwrapListingPayload(data: unknown, depth = 0): unknown {
    if (depth > 3 || !data || typeof data !== 'object') return data;
    const record = data as Record<string, unknown>;
    if (record.ad && typeof record.ad === 'object') return record.ad;
    if (record.listing && typeof record.listing === 'object') return record.listing;
    if (record.data && typeof record.data === 'object') return unwrapListingPayload(record.data, depth + 1);
    return data;
}

export function normalizeListing(data: unknown): Listing {
    const compatible = toListingSchemaCompatible(unwrapListingPayload(data));
    const parsed = AdSchema.safeParse(compatible);
    const validated = parsed.success ? parsed.data : coerceListingFallback(compatible);
    const location = normalizeLocation(validated.location);
    const normalizedViews = typeof validated.views === 'number' ? validated.views : (validated.views && typeof validated.views === 'object' ? (validated.views as any).total : 0);

    let sellerName = 'Esparex Seller';
    if (typeof validated.seller === 'string') {
        sellerName = validated.seller;
    } else if (validated.seller && typeof validated.seller === 'object') {
        const s = validated.seller as any;
        sellerName = s.name || s.businessName || sellerName;
    }
    if (typeof validated.businessName === 'string') sellerName = validated.businessName;

    return {
        ...validated,
        status: normalizeAdStatus(validated.status),
        id: String(validated.id || ''),
        images: toSafeImageArray(Array.isArray(validated.images) ? validated.images.map((image) => normalizeImageUrl(String(image))) : validated.images),
        image: toSafeImageSrc(Array.isArray(validated.images) && validated.images.length > 0 ? normalizeImageUrl(String(validated.images[0])) : (typeof validated.image === 'string' ? normalizeImageUrl(validated.image) : validated.image)),
        time: typeof validated.createdAt === 'string' ? new Date(validated.createdAt).toLocaleDateString() : '',
        isBusiness: validated.sellerType === 'business' || (validated.seller && (validated.seller as any).role === 'business') || !!validated.businessId,
        verified: ((validated.seller as any)?.isVerified === true) || validated.verified === true,
        sellerName,
        sellerId: extractId(validated.sellerId) || '',
        views: normalizedViews,
        location: location as any
    } as Listing;
}

export function stripEmptyObjectIdFields<T extends Record<string, unknown>>(payload: T): T {
    const cleaned = stripSharedObjectIdFields(payload, { extractId }) as Record<string, unknown>;
    if (cleaned.location && typeof cleaned.location === "object" && !Array.isArray(cleaned.location)) {
        const location = { ...(cleaned.location as Record<string, unknown>) };
        const locationId = extractId(location.locationId);
        if (locationId && OBJECT_ID_PATTERN.test(locationId)) {
            location.locationId = locationId;
        } else {
            delete location.locationId;
        }
        cleaned.location = location;
    }
    return cleaned as T;
}

// --- Generic API Functions ---

export const getListingById = async (id: string | number, headers?: Record<string, string>): Promise<Listing | null> => {
    const normalizedIdentifier = normalizeListingIdentifier(id);
    if (!isValidListingIdentifier(normalizedIdentifier)) return null;
    try {
        const endpoint = API_ROUTES.USER.LISTING_DETAIL(normalizedIdentifier);
        if (typeof window === 'undefined') {
            const json = await fetchUserApiJson(endpoint, { cache: 'no-store', headers: { Accept: 'application/json', ...(headers || {}) } });
            const payload = unwrapApiPayload(json);
            return payload ? normalizeListing(payload) : null;
        }
        const { data: result, statusCode } = await toApiResult<Listing>(apiClient.get(endpoint, { headers, silent: true }));
        if (statusCode === 404 || !result) return null;
        return normalizeListing(result);
    } catch (e) {
        logger.error('Failed to load listing', e);
        return null;
    }
};

export const getListingAnalytics = async (id: string | number): Promise<any> => {
    try {
        const { data } = await toApiResult<any>(apiClient.get(API_ROUTES.USER.LISTING_ANALYTICS(id)));
        return data;
    } catch (e) {
        logger.error('Failed to load listing analytics', e);
        return null;
    }
};

export const incrementListingView = async (id: string | number): Promise<void> => {
    try {
        await apiClient.get(API_ROUTES.USER.LISTING_VIEW(id), { silent: true });
    } catch (e) {
        logger.error('Failed to increment listing view', e);
    }
};

/**
 * Fetch the current user's listings across all types.
 */
export const getMyListings = async (type?: string, status?: string, page = 1, limit = 20): Promise<ListingPageResult> => {
    try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        params.append('page', String(page));
        params.append('limit', String(limit));

        const endpoint = `${API_ROUTES.USER.MY_LISTINGS}?${params.toString()}`;
        const { data: result, error } = await toPaginatedApiResult<Listing>(
            apiClient.get(endpoint)
        );

        if (error) {
            throw error;
        }

        if (!result) {
            return { data: [], pagination: { total: 0, page, limit, hasMore: false } };
        }

        return {
            data: result.data.map(normalizeListing),
            pagination: result.pagination,
        };
    } catch (e) {
        throw e;
    }
};

/**
 * @deprecated Use getMyListings('ad', status).then(res => res.data)
 */
export const getMyAds = async (status?: string): Promise<Listing[]> => {
    try {
        const result = await getMyListings('ad', status);
        return result.data;
    } catch (e) {
        const statusCode = (e as any)?.context?.statusCode || (e as any)?.statusCode || 500;
        throw new Error(`MyAds API error: ${statusCode}`);
    }
};

export type ListingStatsResponse = Record<string, Record<string, number>>;

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

/**
 * Fetch aggregated listing status counts for all types in one pass.
 */
export const getMyListingsStats = async (): Promise<ListingStatsResponse> => {
    try {
        const { data: result } = await toApiResult<ListingStatsResponse>(
            apiClient.get(API_ROUTES.USER.MY_LISTINGS_STATS)
        );
        return result || {};
    } catch (e) {
        logger.error('Failed to load listing stats', e);
        return {};
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

export interface SimilarAdsPayload {
    ads: Listing[];
}

// --- Direct Listing Queries ---

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

        return {
            data: result.data.map(normalizeListing),
            pagination: result.pagination,
        };
    } catch {
        return createEmptyPageResult<Listing>(filters ?? {});
    }
};

export const getHomeAds = async (
    paramsInput?: HomeAdsRequestParams,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<HomeAdsPayload> => {
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
        let url: string = API_ROUTES.USER.HOME_FEED;
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
        
        const query = params.toString();
        url = query ? (url.includes('?') ? `${url}&${query}` : `${url}?${query}`) : url;

        const result = await (typeof window === 'undefined' 
            ? fetchUserApiJson(url, options?.fetchOptions).then(unwrapApiPayload) as Promise<any>
            : apiClient.get(url).then((res: any) => unwrapApiPayload(res.data) as any));

        if (!result) return { ads: [], nextCursor: fallbackCursor, hasMore: false };

        return {
            ads: (result.ads || []).map(normalizeListing),
            nextCursor: (result.nextCursor && typeof result.nextCursor === 'object' && typeof result.nextCursor.createdAt === 'string')
                ? { createdAt: result.nextCursor.createdAt, id: typeof result.nextCursor.id === 'string' ? result.nextCursor.id : '' }
                : (typeof result.nextCursor === 'string' ? { createdAt: result.nextCursor, id: '' } : fallbackCursor),
            hasMore: result.hasMore === true
        };
    } catch (e) {
        logger.error('Failed to fetch home ads', e);
        return { ads: [], nextCursor: fallbackCursor, hasMore: false };
    }
};

export const getTrendingAds = async (
    paramsInput?: TrendingAdsRequestParams,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<TrendingAdsPayload> => {
    try {
        const effectiveParams = paramsInput ?? {};
        let url: string = API_ROUTES.USER.ADS_TRENDING;
        const params = new URLSearchParams();

        if (effectiveParams.location) params.append('location', effectiveParams.location);
        if (effectiveParams.locationId) params.append('locationId', effectiveParams.locationId);
        if (effectiveParams.category) params.append('category', effectiveParams.category);
        if (effectiveParams.categoryId) params.append('categoryId', effectiveParams.categoryId);
        if (effectiveParams.limit) params.append('limit', String(effectiveParams.limit));
        
        const query = params.toString();
        url = query ? (url.includes('?') ? `${url}&${query}` : `${url}?${query}`) : url;

        const result = await (typeof window === 'undefined'
            ? fetchUserApiJson(url, options?.fetchOptions).then(unwrapApiPayload) as Promise<any>
            : apiClient.get(url).then((res: any) => unwrapApiPayload(res.data) as any));

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

export const getSimilarAds = async (
    adId: string | number,
    paramsInput?: { limit?: number }
): Promise<SimilarAdsPayload> => {
    const normalizedIdentifier = normalizeListingIdentifier(adId);
    if (!isValidListingIdentifier(normalizedIdentifier)) return { ads: [] };

    try {
        let url: string = API_ROUTES.USER.AD_SIMILAR(normalizedIdentifier);
        const params = new URLSearchParams();
        if (paramsInput?.limit) params.append('limit', String(paramsInput.limit));
        
        const query = params.toString();
        url = query ? (url.includes('?') ? `${url}&${query}` : `${url}?${query}`) : url;

        const result = await (typeof window === 'undefined'
            ? fetchUserApiJson(url).then(unwrapApiPayload) as Promise<any>
            : apiClient.get(url).then((res: any) => unwrapApiPayload(res.data) as any));

        return {
            ads: Array.isArray(result?.ads) ? result.ads.map(normalizeListing) : []
        };
    } catch (e) {
        logger.error('Failed to fetch similar ads', e);
        return { ads: [] };
    }
};

/**
 * Helper to execute mutation requests with unified error handling.
 */
const executeListingMutationRequest = async (
    requestPromise: Promise<any>,
    errorMessage: string
): Promise<Listing | null> => {
    try {
        const { data, error } = await toApiResult<Listing>(requestPromise);
        if (error) throw new Error(error.userMessage || error.technicalMessage || errorMessage);
        return data ? normalizeListing(data) : null;
    } catch (e) {
        logger.error(errorMessage, e);
        throw e;
    }
};

/**
 * Creates a new listing (Ad, Service, or Spare Part).
 */
export const createListing = async (
    listingData: Partial<Listing>,
    options?: { endpoint?: string; idempotencyKey?: string }
): Promise<Listing | null> => {
    const sanitizedPayload = stripEmptyObjectIdFields(listingData as Record<string, unknown>);
    const endpoint = options?.endpoint || API_ROUTES.USER.ADS;
    const headers = options?.idempotencyKey && options.idempotencyKey.trim().length > 0
        ? { 'Idempotency-Key': options.idempotencyKey.trim() }
        : undefined;

    return executeListingMutationRequest(
        apiClient.post<unknown>(endpoint, sanitizedPayload, {
            silent: true,
            ...(headers ? { headers } : {}),
        }),
        "Failed to create listing"
    );
};

/**
 * Updates an existing listing.
 */
export const updateListing = async (
    id: string | number,
    listingData: Partial<Listing>
): Promise<Listing | null> => {
    const sanitizedPayload = stripEmptyObjectIdFields(listingData as Record<string, unknown>);

    return executeListingMutationRequest(
        apiClient.put<unknown>(API_ROUTES.USER.LISTING_EDIT(id), sanitizedPayload, {
            silent: true,
        }),
        "Failed to update listing"
    );
};

/**
 * Deletes a listing (soft delete).
 */
export const deleteListing = async (
    id: string | number,
    listingType: ListingTypeValue = LISTING_TYPE.AD
): Promise<boolean> => {
    try {
        const api = await toApiResult<{ success?: boolean }>(
            apiClient.delete(getDeleteListingEndpoint(id, listingType), { silent: true })
        );
        if (api.error) throw api.error;
        return api.data?.success !== false;
    } catch (e) {
        logger.error('Failed to delete listing', e);
        throw e;
    }
};

/**
 * Marks a listing as sold.
 */
export const markListingAsSold = async (
    id: string | number,
    soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available'
): Promise<Listing | null> => {
    try {
        const { data: result, error } = await toApiResult<Listing>(
            apiClient.put(API_ROUTES.USER.LISTING_SOLD(id), soldReason ? { soldReason } : {}, { silent: true })
        );
        if (error) throw error;
        return result ? normalizeListing(result) : null;
    } catch (e) {
        logger.error('Failed to mark listing as sold', e);
        throw e;
    }
};

export const markAsSold = markListingAsSold;

/**
 * Deactivates a live listing.
 */
export const deactivateListing = async (id: string | number): Promise<boolean> => {
    try {
        const { data: result, error } = await toApiResult<unknown>(
            apiClient.patch(API_ROUTES.USER.LISTING_DEACTIVATE(id), undefined, { silent: true })
        );
        if (error) throw error;
        return !!result;
    } catch (e) {
        logger.error('Failed to deactivate listing', e);
        throw e;
    }
};

/**
 * Reveals the seller's phone number for a listing.
 */
export const getListingPhone = async (id: string | number): Promise<{ mobile: string } | null> => {
    try {
        const { data, error } = await toApiResult<{ mobile: string }>(
            apiClient.get(API_ROUTES.USER.LISTING_PHONE(id), { silent: true })
        );
        if (error) throw error;
        return data;
    } catch (e) {
        logger.error('Failed to get listing phone', e);
        throw e;
    }
};

/**
 * Reposts an expired listing.
 */
export const repostListing = async (
    id: string | number,
    listingType: ListingTypeValue = LISTING_TYPE.AD
): Promise<boolean> => {
    try {
        const { data: result, error } = await toApiResult<unknown>(
            apiClient.post(getRepostListingEndpoint(id, listingType), undefined, { silent: true })
        );
        if (error) throw error;
        return !!result;
    } catch (e) {
        logger.error('Failed to repost listing', e);
        throw e;
    }
};

// --- S3 Upload Helpers ---

export interface PresignedUploadResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
}

/**
 * Requests a pre-signed S3 URL for direct file upload.
 */
export const getListingImagePresignedUrl = async (
    contentType: string,
    folder: 'ads' | 'staging' | 'business' | 'avatars' | 'service' = 'ads',
    adId?: string
): Promise<PresignedUploadResult> => {
    const { data: result } = await toApiResult<PresignedUploadResult>(
        apiClient.post(API_ROUTES.USER.ADS_UPLOAD_PRESIGN, { contentType, folder, adId })
    );
    if (!result) throw new Error('Failed to get presigned upload URL');
    return result;
};

/**
 * Uploads a file directly to S3 using a pre-signed URL.
 */
export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
    }
};
