import { apiClient } from '../../lib/api/client';
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from '../routes';
import { toApiResult, toPaginatedApiResult, type PaginationEnvelope, type ApiResult } from '@/lib/api/result';
import { normalizeServiceStatus } from '@/lib/status/statusNormalization';
import { toSafeImageArray } from '@/lib/image/imageUrl';
import type { GeoJSONPoint, LocationLevel } from '@/types/location';

type ServerFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

const USER_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

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

export interface Service {
    id: string;
    businessId: string;
    userId: string | { _id: string; name: string; businessName?: string;[key: string]: unknown };
    title: string;
    description: string;
    price: number;
    priceMin?: number;
    priceMax?: number;
    diagnosticFee?: number;
    serviceTypeIds?: string[];
    status: 'pending' | 'live' | 'rejected' | 'expired' | 'deactivated';
    serviceTypes: string[];
    images: string[];
    location: {
        address?: string;
        city: string;
        state: string;
        coordinates?: GeoJSONPoint;
    };
    category: { id: string; name: string; slug: string };
    brand?: { id: string; name: string };
    model?: { id: string; name: string };
    createdAt: string;
    expiresAt?: string;
    rejectionReason?: string;

    // UI Fields
    locationId?: string | {
        address?: string;
        city?: string;
        state?: string;
        coordinates?: GeoJSONPoint;
        display?: string;
    };
    onsiteService?: boolean;
    priceType?: string;
    warranty?: string;
    included?: string;
    excluded?: string;
    turnaroundTime?: string;
    deviceType?: string;
}

const normalizeService = (service: Service): Service => ({
    ...service,
    status: normalizeServiceStatus(service?.status),
    images: toSafeImageArray(service?.images),
});

type ServiceMutationPayload = Record<string, unknown>;

function extractId(value: unknown): string | undefined {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return String(record.id || record._id || '');
    }
    return undefined;
}

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
    return cleaned as T;
}

export const createService = async (data: ServiceMutationPayload, options?: any): Promise<ApiResult<Service>> => {
    const payload = stripEmptyObjectIdFields(data);
    return await toApiResult<Service>(apiClient.post(API_ROUTES.USER.SERVICES, payload, { silent: true, ...options }));
};

export const updateService = async (id: string, data: ServiceMutationPayload, options?: any): Promise<ApiResult<Service>> => {
    const payload = stripEmptyObjectIdFields(data);
    return await toApiResult<Service>(apiClient.put(`${API_ROUTES.USER.SERVICES}/${id}`, payload, { silent: true, ...options }));
};

export const getMyServices = async (): Promise<Service[]> => {
    const { data: res } = await toApiResult<Service[]>(apiClient.get(API_ROUTES.USER.MY_SERVICES));
    return Array.isArray(res) ? res.map(normalizeService) : [];
};

export interface ServiceFilters {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    brands?: string;
    locationId?: string;
    page?: number;
    limit?: number;
    cursor?: string;
    // 📍 Geospatial
    level?: LocationLevel;
    lat?: number;
    lng?: number;
    radiusKm?: number;
}

export interface ServicePageResult {
    data: Service[];
    pagination: PaginationEnvelope;
}

export const getServicesPage = async (
    filters: ServiceFilters = {},
    options?: { fetchOptions?: ServerFetchOptions }
): Promise<ServicePageResult> => {
    const params = new URLSearchParams();
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    if (filters.brands) params.append('brands', filters.brands);
    if (filters.locationId) params.append('locationId', filters.locationId);
    if (filters.level) params.append('level', filters.level);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.cursor) params.append('cursor', String(filters.cursor));
    if (filters.lat !== undefined) params.append('lat', String(filters.lat));
    if (filters.lng !== undefined) params.append('lng', String(filters.lng));
    if (filters.radiusKm !== undefined) params.append('radiusKm', String(filters.radiusKm));

    const query = params.toString();
    const endpoint = query
        ? `${API_ROUTES.USER.SERVICES}?${query}`
        : API_ROUTES.USER.SERVICES;

    const { data: result } =
        typeof window === 'undefined'
            ? await toPaginatedApiResult<Service>(
                Promise.resolve(fetchUserApiJson(endpoint, options?.fetchOptions))
            )
            : await toPaginatedApiResult<Service>(apiClient.get(endpoint));
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
        data: result.data.map(normalizeService),
        pagination: result.pagination,
    };
};

import { isValidAdIdentifier, normalizeAdIdentifier } from './ads';

export const getServices = async (filters: ServiceFilters = {}): Promise<Service[]> => {
    const result = await getServicesPage(filters);
    return result.data;
};

export const getServiceById = async (id: string): Promise<Service | null> => {
    const normalizedIdentifier = normalizeAdIdentifier(id);
    if (!isValidAdIdentifier(normalizedIdentifier)) {
        return null;
    }
    const endpoint = `${API_ROUTES.USER.SERVICES}/${id}`;
    const { data: service } = typeof window === 'undefined'
        ? await toApiResult<Service>(fetchUserApiJson(endpoint))
        : await toApiResult<Service>(apiClient.get(endpoint));
    return service ? normalizeService(service) : null;
};

export const trackServiceView = async (id: string): Promise<void> => {
    try {
        await apiClient.get(API_ROUTES.USER.SERVICE_VIEW(id));
    } catch {
        // Silent failure — tracking is non-critical
    }
};

export const deleteService = async (id: string): Promise<boolean> => {
    const { data: res } = await toApiResult<unknown>(apiClient.delete(`${API_ROUTES.USER.SERVICES}/${id}`));
    return !!res;
};

export const getServicePhone = async (id: string): Promise<{ mobile: string } | null> => {
    const { data } = await toApiResult<{ mobile: string }>(apiClient.get(API_ROUTES.USER.SERVICE_PHONE(id)));
    return data;
};
