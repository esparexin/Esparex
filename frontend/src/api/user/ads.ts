import { apiClient } from '../../lib/api/client';
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from '../routes';
import { type Ad, AdSchema } from '@shared/schemas/ad.schema';
import { toApiResult, toPaginatedApiResult, unwrapApiPayload, type PaginationEnvelope } from '@/lib/api/result';
import { normalizeAdStatus } from '@/lib/status/statusNormalization';
import { toSafeImageArray, toSafeImageSrc } from '@/lib/image/imageUrl';
import type { LocationLevel } from '@/types/location';
export type { Ad };

export interface AdFilters {
    category?: string;
    categoryId?: string;
    brandId?: string;
    /** @deprecated-ui modelId is preserved in the API contract but not exposed in the current UI.
     *  Reserved for a future "Filter by Device Model" feature. Do not remove. */
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
    // 📍 Geospatial
    lat?: number;
    lng?: number;
    radiusKm?: number;
    sortBy?: string;
}

// --- Helpers ---

import { normalizeToAppLocation as normalizeLocation } from '@/lib/location/locationService';
import logger from "@/lib/logger";

const USER_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const AD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_AD_IDENTIFIERS = new Set([
    '',
    'undefined',
    'null',
    'nan',
    'true',
    'false',
    'favicon.ico',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

type ServerFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

const buildUserApiUrl = (endpoint: string): string => {
    const base = USER_API_BASE_URL.endsWith('/') ? USER_API_BASE_URL : `${USER_API_BASE_URL}/`;
    return new URL(endpoint.replace(/^\//, ''), base).toString();
};

const fetchUserApiJson = async (
    endpoint: string,
    fetchOptions?: ServerFetchOptions
): Promise<unknown> => {
    const response = await fetch(buildUserApiUrl(endpoint), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...((fetchOptions?.headers as Record<string, string> | undefined) ?? {}),
        },
        ...fetchOptions,
    });

    if (!response.ok) {
        throw new Error(`Failed to load ${endpoint}: ${response.status}`);
    }

    return response.json().catch(() => null);
};

export function normalizeAdIdentifier(value: string | number): string {
    const raw = String(value).trim();
    if (!raw) return '';
    try {
        return decodeURIComponent(raw).trim();
    } catch {
        return raw;
    }
}

function extractId(value: unknown): string | undefined {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.id === 'string' || typeof record.id === 'number') {
            return String(record.id);
        }
        if (typeof record._id === 'string' || typeof record._id === 'number') {
            return String(record._id);
        }
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

        const hasExplicitFormat =
            parts.length >= 2 &&
            ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(parts[1]!.toLowerCase());
        if (hasExplicitFormat) return normalized;

        parsed.pathname = `/${parts[0]}/png`;
        return parsed.toString();
    } catch {
        return normalized;
    }
}

function toAdSchemaCompatible(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    const record = { ...(data as Record<string, unknown>) };
    const normalizedId = extractId(record.id) ?? extractId(record._id);
    if (normalizedId) {
        record.id = normalizedId;
    }
    if (record.createdAt instanceof Date) {
        record.createdAt = record.createdAt.toISOString();
    }
    if (record.updatedAt instanceof Date) {
        record.updatedAt = record.updatedAt.toISOString();
    }

    const toLegacyStringField = (value: unknown): string | undefined => {
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
        }
        if (value && typeof value === 'object') {
            const objectValue = value as Record<string, unknown>;
            if (typeof objectValue.name === 'string' && objectValue.name.trim().length > 0) {
                return objectValue.name.trim();
            }
            if (typeof objectValue.title === 'string' && objectValue.title.trim().length > 0) {
                return objectValue.title.trim();
            }
            return extractId(objectValue);
        }
        return undefined;
    };

    const normalizedSellerId = extractId(record.sellerId);
    const normalizedUserId = extractId(record.userId) ?? '';

    if (normalizedSellerId) record.sellerId = normalizedSellerId;
    record.userId = normalizedUserId;

    const normalizedCategory = toLegacyStringField(record.category);
    if (normalizedCategory) {
        record.category = normalizedCategory;
    } else if (record.category !== undefined) {
        delete record.category;
    }

    const normalizedBrand = toLegacyStringField(record.brand);
    if (normalizedBrand) {
        record.brand = normalizedBrand;
    } else if (record.brand !== undefined) {
        delete record.brand;
    }

    const normalizedModel = toLegacyStringField(record.model);
    if (normalizedModel) {
        record.model = normalizedModel;
    } else if (record.model !== undefined) {
        delete record.model;
    }

    return record;
}

function coerceAdFallback(data: unknown): Ad {
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const normalizeFallbackLocation = (value: unknown): Ad['location'] => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value as Ad['location'];
        }
        if (typeof value === 'string' && value.trim().length > 0) {
            return {
                city: value.trim(),
                display: value.trim(),
            } as Ad['location'];
        }
        return { city: "" } as Ad['location'];
    };

    const id = extractId(record.id) ?? extractId(record._id) ?? '';
    const title = typeof record.title === 'string' ? record.title : '';
    const description = typeof record.description === 'string' ? record.description : '';
    const rawPrice = record.price;
    const price =
        typeof rawPrice === 'number'
            ? rawPrice
            : typeof rawPrice === 'string' && rawPrice.trim() !== ''
                ? Number(rawPrice)
                : 0;
    const createdAtRaw = record.createdAt;
    const createdAt =
        typeof createdAtRaw === 'string'
            ? createdAtRaw
            : createdAtRaw instanceof Date
                ? createdAtRaw.toISOString()
                : new Date(0).toISOString();

    return {
        id,
        title,
        description,
        price: Number.isFinite(price) ? price : 0,
        images: Array.isArray(record.images)
            ? record.images
                .filter((img): img is string => typeof img === 'string')
                .map(normalizeImageUrl)
            : [],
        location: normalizeFallbackLocation(record.location),
        userId: extractId(record.userId) ?? extractId(record.sellerId) ?? '',
        status: normalizeAdStatus(
            typeof record.status === 'string' ? record.status : 'pending'
        ) as Ad['status'],
        sellerId: extractId(record.sellerId) || '',
        createdAt,
        updatedAt:
            typeof record.updatedAt === 'string'
                ? record.updatedAt
                : record.updatedAt instanceof Date
                    ? record.updatedAt.toISOString()
                    : undefined,
        views:
            typeof record.views === 'number'
                ? record.views
                : 0,
        spareParts: Array.isArray(record.spareParts) ? record.spareParts as string[] : undefined,
    } as Ad;
}

function unwrapAdPayload(data: unknown, depth = 0): unknown {
    if (depth > 3 || !data || typeof data !== 'object') return data;
    const record = data as Record<string, unknown>;
    if (record.ad && typeof record.ad === 'object') return record.ad;
    if (record.data && typeof record.data === 'object') {
        return unwrapAdPayload(record.data, depth + 1);
    }
    return data;
}

export function normalizeAd(data: unknown): Ad {
    const compatible = toAdSchemaCompatible(unwrapAdPayload(data));
    const parsed = AdSchema.safeParse(compatible);
    const validated = parsed.success ? parsed.data : coerceAdFallback(compatible);

    const location = normalizeLocation(validated.location);
    const normalizedViews =
        typeof validated.views === 'number'
            ? validated.views
            : (validated.views &&
                typeof validated.views === 'object' &&
                typeof (validated.views as { total?: unknown }).total === 'number'
                ? (validated.views as { total: number }).total
                : 0);

    let sellerName = 'Esparex Seller';

    // Canonical seller ownership field is sellerId.
    const sellerIdValue = validated.sellerId;
    let sellerId: string | undefined = typeof sellerIdValue === 'string' || typeof sellerIdValue === 'number'
        ? String(sellerIdValue)
        : undefined;

    if (typeof validated.seller === 'string') {
        sellerName = validated.seller;
    } else if (isRecord(validated.seller)) {
        sellerName =
            (typeof validated.seller.name === 'string' ? validated.seller.name : undefined) ||
            (typeof validated.seller.businessName === 'string' ? validated.seller.businessName : undefined) ||
            sellerName;
    }

    if (typeof validated.businessName === 'string') sellerName = validated.businessName;

    const ad: Ad = {
        ...validated,
        status: normalizeAdStatus(validated.status),
        id: String(validated.id || ''),
        images: toSafeImageArray(
            Array.isArray(validated.images)
                ? validated.images.map((image) => normalizeImageUrl(String(image)))
                : validated.images
        ),
        image: toSafeImageSrc(
            Array.isArray(validated.images) && validated.images.length > 0
                ? normalizeImageUrl(String(validated.images[0]))
                : typeof validated.image === 'string'
                    ? normalizeImageUrl(validated.image)
                    : validated.image
        ),
        time: typeof validated.createdAt === 'string'
            ? new Date(validated.createdAt).toLocaleDateString()
            : '',
        isBusiness:
            validated.sellerType === 'business' ||
            (isRecord(validated.seller) && validated.seller.role === 'business') ||
            !!validated.businessId,
        verified: (isRecord(validated.seller) && validated.seller.isVerified === true) || validated.verified === true,
        sellerName,
        sellerId: sellerId || '',
        views: normalizedViews,
        location: location as unknown as Ad['location'] // Explicit cast to satisfy Zod's passthrough index signature requirement
    };

    return ad;
}


// --- API Functions ---

function stripEmptyObjectIdFields<T extends Record<string, unknown>>(payload: T): T {
    const cleaned = { ...payload } as Record<string, unknown>;
    const objectIdFields = ["categoryId", "brandId", "modelId", "locationId"];

    for (const field of objectIdFields) {
        const value = cleaned[field];
        if (typeof value === "string" && value.trim() === "") {
            delete cleaned[field];
            continue;
        }
        if (value && typeof value === "object") {
            const extractedId = extractId(value);
            if (typeof extractedId === "string" && extractedId.trim().length > 0) {
                cleaned[field] = extractedId;
            } else {
                delete cleaned[field];
            }
        }
    }

    if (
        cleaned.location &&
        typeof cleaned.location === "object" &&
        !Array.isArray(cleaned.location)
    ) {
        const location = {
            ...(cleaned.location as Record<string, unknown>),
        };
        const locationId = location.locationId;
        if (typeof locationId === "string" && locationId.trim() === "") {
            delete location.locationId;
        } else if (locationId && typeof locationId === "object") {
            const extractedId = extractId(locationId);
            if (extractedId && OBJECT_ID_PATTERN.test(extractedId)) {
                location.locationId = extractedId;
            } else {
                delete location.locationId;
            }
        }
        cleaned.location = location;
    }

    return cleaned as T;
}

export const isValidAdIdentifier = (value: string | number): boolean => {
    const identifier = normalizeAdIdentifier(value);
    if (!identifier || identifier.length > 200) return false;
    if (RESERVED_AD_IDENTIFIERS.has(identifier.toLowerCase())) return false;
    if (identifier.includes("/") || identifier.includes("\\")) return false;

    if (OBJECT_ID_PATTERN.test(identifier)) return true;
    if (identifier.length < 2) return false;
    return AD_SLUG_PATTERN.test(identifier.toLowerCase());
};

export interface AdPageResult {
    data: Ad[];
    pagination: PaginationEnvelope;
}

export const getAdsPage = async (
    filters?: AdFilters,
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<AdPageResult> => {
    try {
        const params = new URLSearchParams();
        const normalizedCategoryId = typeof filters?.categoryId === 'string' ? filters.categoryId.trim() : '';
        const normalizedCategory = typeof filters?.category === 'string' ? filters.category.trim() : '';
        const resolvedCategoryId = normalizedCategoryId && OBJECT_ID_PATTERN.test(normalizedCategoryId)
            ? normalizedCategoryId
            : (normalizedCategory && OBJECT_ID_PATTERN.test(normalizedCategory) ? normalizedCategory : '');

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    // Backend contract uses `q` for full-text search.
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

        const endpoint = `${API_ROUTES.USER.ADS}?${params.toString()}`;
        const { data: result } =
            typeof window === 'undefined'
                ? await toPaginatedApiResult<Ad>(
                    Promise.resolve(fetchUserApiJson(endpoint, options?.fetchOptions))
                )
                : await toPaginatedApiResult<Ad>(
                    apiClient.get(endpoint, {
                        // Browse filters can generate frequent requests; avoid noisy console groups.
                        silent: true,
                    })
                );

        if (!result) {
            return {
                data: [],
                pagination: {
                    page: Number(filters?.page || 1),
                    limit: Number(filters?.limit || 20),
                    hasMore: false,
                },
            };
        }

        return {
            data: result.data.map(normalizeAd),
            pagination: result.pagination,
        };
    } catch {
        return {
            data: [],
            pagination: {
                page: Number(filters?.page || 1),
                limit: Number(filters?.limit || 20),
                hasMore: false,
            },
        };
    }
};

export const getAds = async (filters?: AdFilters): Promise<Ad[]> => {
    const result = await getAdsPage(filters);
    return result.data;
};

export const getNearbyAdsPage = async (filters: Pick<AdFilters, "lat" | "lng" | "radiusKm" | "categoryId" | "page" | "limit">): Promise<AdPageResult> => {
    if (typeof filters.lat !== "number" || typeof filters.lng !== "number") {
        return {
            data: [],
            pagination: {
                page: Number(filters.page || 1),
                limit: Number(filters.limit || 20),
                hasMore: false,
            },
        };
    }

    const params = new URLSearchParams();
    params.append("lat", String(filters.lat));
    params.append("lng", String(filters.lng));
    if (typeof filters.radiusKm === "number") params.append("radiusKm", String(filters.radiusKm));
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const { data: result } = await toPaginatedApiResult<Ad>(
        apiClient.get(`${API_ROUTES.USER.ADS_NEARBY}?${params.toString()}`, {
            silent: true,
        })
    );

    if (!result) {
        return {
            data: [],
            pagination: {
                page: Number(filters.page || 1),
                limit: Number(filters.limit || 20),
                hasMore: false,
            },
        };
    }

    return {
        data: result.data.map(normalizeAd),
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

export const getAdById = async (
    id: string | number,
    headers?: Record<string, string>
): Promise<Ad | null> => {
    const normalizedIdentifier = normalizeAdIdentifier(id);
    if (!isValidAdIdentifier(normalizedIdentifier)) {
        return null;
    }

    try {
        if (typeof window === 'undefined') {
            const base = USER_API_BASE_URL.endsWith('/') ? USER_API_BASE_URL : `${USER_API_BASE_URL}/`;
            const endpoint = API_ROUTES.USER.AD_DETAIL(normalizedIdentifier).replace(/^\//, '');
            const requestUrl = new URL(endpoint, base).toString();
            const response = await fetch(requestUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    Accept: 'application/json',
                    ...(headers || {})
                }
            });

            if (response.status === 400 || response.status === 404) {
                return null;
            }
            if (!response.ok) {
                throw new Error(`Failed to load ad: ${response.status}`);
            }

            const json = (await response.json().catch(() => null)) as unknown;
            const payload = unwrapApiPayload(json);
            if (!payload) return null;
            return normalizeAd(payload);
        }

        const config = {
            ...(headers ? { headers } : {}),
            // Invalid/missing slugs are handled by route 404 UI, not console error spam.
            silent: true,
        };
        const { data: result, statusCode } = await toApiResult<Ad>(
            apiClient.get(API_ROUTES.USER.AD_DETAIL(normalizedIdentifier), config)
        );
        if (statusCode === 400 || statusCode === 404) return null;
        if (!result) return null;
        return normalizeAd(result);
    } catch (e) {
        const status =
            (e as { context?: { statusCode?: number } })?.context?.statusCode ??
            (e as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 404) {
            return null;
        }
        logger.error('Failed to load ad', e);
        throw e;
    }
};

export const getListingById = async (
    id: string | number,
    headers?: Record<string, string>
): Promise<Ad | null> => {
    const normalizedIdentifier = normalizeAdIdentifier(id);
    if (!isValidAdIdentifier(normalizedIdentifier)) return null;

    try {
        const endpoint = API_ROUTES.USER.LISTING_DETAIL(normalizedIdentifier);
        if (typeof window === 'undefined') {
            const json = await fetchUserApiJson(endpoint, {
                cache: 'no-store',
                headers: {
                    Accept: 'application/json',
                    ...(headers || {})
                }
            });
            const payload = unwrapApiPayload(json);
            if (!payload) return null;
            return normalizeAd(payload);
        }

        const { data: result, statusCode } = await toApiResult<Ad>(
            apiClient.get(endpoint, { headers, silent: true })
        );
        if (statusCode === 404) return null;
        if (!result) return null;
        return normalizeAd(result);
    } catch (e) {
        const status =
            (e as { context?: { statusCode?: number } })?.context?.statusCode ??
            (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
            return null;
        }
        logger.error('Failed to load listing', e);
        return null;
    }
};

export const markListingAsSold = async (id: string | number): Promise<Ad | null> => {
    try {
        const endpoint = API_ROUTES.USER.LISTING_SOLD(id);
        const { data: result } = await toApiResult<Ad>(
            apiClient.put(endpoint, {})
        );
        if (!result) return null;
        return normalizeAd(result);
    } catch (e) {
        logger.error('Failed to mark listing as sold', e);
        throw e;
    }
};

export const getListingAnalytics = async (id: string | number): Promise<any> => {
    try {
        const endpoint = API_ROUTES.USER.LISTING_ANALYTICS(id);
        const { data: result } = await toApiResult<any>(
            apiClient.get(endpoint)
        );
        return result;
    } catch (e) {
        logger.error('Failed to load listing analytics', e);
        return null;
    }
};

export const incrementListingView = async (id: string | number): Promise<void> => {
    try {
        const endpoint = API_ROUTES.USER.LISTING_VIEW(id);
        await apiClient.get(endpoint, { silent: true });
    } catch (e) {
        logger.error('Failed to increment listing view', e);
    }
};

export const getMyAds = async (status?: string): Promise<Ad[]> => {
    try {
        const params = new URLSearchParams({ listingType: 'ad' });
        if (status) params.set('status', status);
        const url = `${API_ROUTES.USER.MY_ADS}?${params.toString()}`;
        const api = await toApiResult<unknown>(
            apiClient.get(url)
        );

        if (api.error) {
            throw new Error(`MyAds API error: ${api.statusCode ?? "unknown"}`);
        }

        const payload = unwrapApiPayload(api.data);

        const ads = Array.isArray(payload)
            ? payload
            : (payload as Record<string, unknown>)?.data;

        if (!Array.isArray(ads)) {
            throw new Error("Invalid ads payload");
        }

        return ads.map(normalizeAd);
    } catch (e) {
        logger.error('Failed to load my ads', e);
        throw e;
    }
};

export const getMyAdsStats = async (): Promise<Record<string, number>> => {
    try {
        const { data: result } = await toApiResult<Record<string, number>>(
            apiClient.get(`${API_ROUTES.USER.MY_ADS_STATS}?listingType=ad`)
        );
        return result || {};
    } catch (e) {
        logger.error('Failed to load ad stats', e);
        return {};
    }
};

export const createAd = async (
    adData: Partial<Ad>,
    options?: { idempotencyKey?: string }
): Promise<Ad | null> => {
    try {
        const sanitizedPayload = stripEmptyObjectIdFields(adData as Record<string, unknown>);
        const headers =
            options?.idempotencyKey && options.idempotencyKey.trim().length > 0
                ? { 'Idempotency-Key': options.idempotencyKey.trim() }
                : undefined;
        const response = await apiClient.post<unknown>(API_ROUTES.USER.ADS, sanitizedPayload, {
            silent: true,
            ...(headers ? { headers } : {}),
        });

        const record = response as Record<string, unknown>;
        if (record && (record.error || record.status === "error" || (typeof record.statusCode === "number" && record.statusCode >= 400))) {
            throw new Error(typeof record.message === "string" ? record.message : "Failed to create ad");
        }

        const payload = unwrapAdPayload(response);

        if (!payload) {
            throw new Error('Failed to create ad');
        }

        return normalizeAd(payload);
    } catch (e) {
        throw e;
    }
};

export const updateAd = async (
    id: string | number,
    adData: Partial<Ad>
): Promise<Ad | null> => {
    try {
        const sanitizedPayload = stripEmptyObjectIdFields(adData as Record<string, unknown>);
        const response = await apiClient.put<unknown>(API_ROUTES.USER.LISTING_EDIT(id), sanitizedPayload, {
            silent: true,
        });

        const record = response as Record<string, unknown>;
        if (record && (record.error || record.status === "error" || (typeof record.statusCode === "number" && record.statusCode >= 400))) {
            throw new Error(typeof record.message === "string" ? record.message : "Failed to update ad");
        }

        const payload = unwrapAdPayload(response);

        if (!payload) {
            throw new Error('Failed to update ad');
        }

        return normalizeAd(payload);
    } catch (e) {
        throw e;
    }
};

export const deleteAd = async (
    id: string | number
): Promise<boolean> => {
    try {
        const api = await toApiResult<{ success?: boolean }>(
            apiClient.delete(API_ROUTES.USER.AD_DETAIL(id))
        );

        if (api.error) {
            throw new Error(`DeleteAd API error: ${api.statusCode}`);
        }

        if (api.data?.success === false) {
            return false;
        }

        return true;
    } catch (e) {
        logger.error('Failed to delete ad', e);
        throw e;
    }
};

export const markAsSold = async (
    id: string | number,
    soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available'
): Promise<Ad | null> => {
    try {
        const { data: result } = await toApiResult<Ad>(
            apiClient.patch(API_ROUTES.USER.AD_SOLD(id), soldReason ? { soldReason } : {})
        );
        if (!result) return null;
        return normalizeAd(result);
    } catch (e) {
        logger.error('Failed to mark ad as sold', e);
        throw e;
    }
};

// --- Home Ads ---

export interface HomeAdsPayload {
    ads: Ad[];
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
    ads: Ad[];
}

export interface TrendingAdsRequestParams {
    location?: string;
    locationId?: string;
    category?: string;
    categoryId?: string;
    limit?: number;
}

export interface SimilarAdsPayload {
    ads: Ad[];
}

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
        let url = API_ROUTES.USER.HOME_FEED;
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
        if (typeof effectiveParams.lat === 'number' && Number.isFinite(effectiveParams.lat)) {
            params.append('lat', String(effectiveParams.lat));
        }
        if (typeof effectiveParams.lng === 'number' && Number.isFinite(effectiveParams.lng)) {
            params.append('lng', String(effectiveParams.lng));
        }
        if (typeof effectiveParams.radiusKm === 'number' && Number.isFinite(effectiveParams.radiusKm)) {
            params.append('radiusKm', String(effectiveParams.radiusKm));
        }
        if (typeof effectiveParams.limit === 'number' && Number.isFinite(effectiveParams.limit) && effectiveParams.limit > 0) {
            params.append('limit', String(Math.floor(effectiveParams.limit)));
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        const { data: result } =
            typeof window === 'undefined'
                ? await toApiResult<{ ads: unknown[]; nextCursor?: { createdAt?: string; id?: string } | string | null; hasMore?: boolean }>(
                    Promise.resolve(fetchUserApiJson(url, options?.fetchOptions))
                )
                : await toApiResult<{ ads: unknown[]; nextCursor?: { createdAt?: string; id?: string } | string | null; hasMore?: boolean }>(
                    apiClient.get(url)
                );

        if (!result) {
            return { ads: [], nextCursor: fallbackCursor, hasMore: false };
        }

        return {
            ads: (result.ads || []).map(normalizeAd),
            nextCursor: (
                result.nextCursor &&
                typeof result.nextCursor === 'object' &&
                typeof result.nextCursor.createdAt === 'string'
            )
                ? {
                    createdAt: result.nextCursor.createdAt,
                    id: typeof result.nextCursor.id === 'string' ? result.nextCursor.id : ''
                }
                : (typeof result.nextCursor === 'string'
                    ? { createdAt: result.nextCursor, id: '' }
                    : fallbackCursor),
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
        let url = API_ROUTES.USER.ADS_TRENDING;
        const params = new URLSearchParams();

        if (effectiveParams.location) params.append('location', effectiveParams.location);
        if (effectiveParams.locationId) params.append('locationId', effectiveParams.locationId);
        if (effectiveParams.category) params.append('category', effectiveParams.category);
        if (effectiveParams.categoryId) params.append('categoryId', effectiveParams.categoryId);
        if (typeof effectiveParams.limit === 'number' && Number.isFinite(effectiveParams.limit) && effectiveParams.limit > 0) {
            params.append('limit', String(Math.floor(effectiveParams.limit)));
        }

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        const { data: result } =
            typeof window === 'undefined'
                ? await toApiResult<{ ads: unknown[] }>(
                    Promise.resolve(fetchUserApiJson(url, options?.fetchOptions))
                )
                : await toApiResult<{ ads: unknown[] }>(
                    apiClient.get(url)
                );

        if (!result) return { ads: [] };

        return {
            ads: (result.ads || []).map(normalizeAd),
        };
    } catch (e) {
        logger.error('Failed to fetch trending ads', e);
        return { ads: [] };
    }
};

export const getSimilarAds = async (
    adId: string | number,
    paramsInput?: { limit?: number }
): Promise<SimilarAdsPayload> => {
    const normalizedIdentifier = normalizeAdIdentifier(adId);
    if (!isValidAdIdentifier(normalizedIdentifier)) {
        return { ads: [] };
    }

    try {
        let url = API_ROUTES.USER.AD_SIMILAR(normalizedIdentifier);
        const params = new URLSearchParams();
        if (typeof paramsInput?.limit === 'number' && Number.isFinite(paramsInput.limit) && paramsInput.limit > 0) {
            params.append('limit', String(Math.floor(paramsInput.limit)));
        }
        const query = params.toString();
        if (query) {
            url += `?${query}`;
        }

        const { data: result } = await toApiResult<{ ads: unknown[] }>(
            apiClient.get(url, { silent: true })
        );

        return {
            ads: Array.isArray(result?.ads) ? result.ads.map(normalizeAd) : []
        };
    } catch (e) {
        logger.error('Failed to fetch similar ads', e);
        return { ads: [] };
    }
};
