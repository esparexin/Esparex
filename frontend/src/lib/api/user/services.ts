import { apiClient } from "@/lib/api/client";
import {
    API_ROUTES,
} from '../routes';
import { toApiResult, toPaginatedApiResult, type PaginationEnvelope } from '@/lib/api/result';
import { normalizeServiceStatus } from '@/lib/status/statusNormalization';
import { toSafeImageArray } from '@/lib/image/imageUrl';
import type { GeoJSONPoint, LocationLevel } from '@/types/location';
import { createEmptyPageResult, stripEmptyObjectIdFields } from './listingsShared';
import { fetchUserApiJson, type ServerFetchOptions } from './server';

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
    seoSlug?: string;
    /** @deprecated Prefer serviceTypeIds. */
    serviceTypes?: string[];
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
    categoryId?: string | { id?: string; _id?: string; name?: string; slug?: string };
    brandId?: string | { id?: string; _id?: string; name?: string };
    modelId?: string | { id?: string; _id?: string; name?: string };
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
    category:
        service.category ||
        (service.categoryId && typeof service.categoryId === "object"
            ? {
                id: extractId(service.categoryId) || "",
                name: String((service.categoryId as Record<string, unknown>).name || ""),
                slug: String((service.categoryId as Record<string, unknown>).slug || ""),
            }
            : undefined),
    brand:
        service.brand ||
        (service.brandId && typeof service.brandId === "object"
            ? {
                id: extractId(service.brandId) || "",
                name: String((service.brandId as Record<string, unknown>).name || ""),
            }
            : undefined),
    model:
        service.model ||
        (service.modelId && typeof service.modelId === "object"
            ? {
                id: extractId(service.modelId) || "",
                name: String((service.modelId as Record<string, unknown>).name || ""),
            }
            : undefined),
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

export const createService = async (data: ServiceMutationPayload, options?: any): Promise<Service | null> => {
    const payload = stripEmptyObjectIdFields(data, { extractId });
    const { data: service, error } = await toApiResult<Service>(
        apiClient.post(API_ROUTES.USER.SERVICES, payload, { silent: true, ...options })
    );
    if (error) {
        throw new Error(error.userMessage || error.technicalMessage || "Failed to create service");
    }
    return service ? normalizeService(service) : null;
};

export const updateService = async (id: string, data: ServiceMutationPayload, options?: any): Promise<Service | null> => {
    const payload = stripEmptyObjectIdFields(data, { extractId });
    const { data: service, error } = await toApiResult<Service>(
        apiClient.put(`${API_ROUTES.USER.SERVICES}/${id}`, payload, { silent: true, ...options })
    );
    if (error) {
        throw new Error(error.userMessage || error.technicalMessage || "Failed to update service");
    }
    return service ? normalizeService(service) : null;
};

export const getMyServices = async (): Promise<Service[]> => {
    const { data: res } = await toApiResult<Service[]>(apiClient.get(API_ROUTES.USER.MY_SERVICES));
    return Array.isArray(res) ? res.map(normalizeService) : [];
};

export interface ServiceFilters {
    categoryId?: string;
    search?: string;
    location?: string;
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
    if (filters.location) params.append('location', filters.location);
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
        return createEmptyPageResult<Service>(filters);
    }

    return {
        data: result.data.map(normalizeService),
        pagination: result.pagination,
    };
};


export const getServices = async (filters: ServiceFilters = {}): Promise<Service[]> => {
    const result = await getServicesPage(filters);
    return result.data;
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

export const markServiceAsSold = async (
    id: string,
    soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available'
): Promise<boolean> => {
    const { data } = await toApiResult<unknown>(apiClient.patch(`${API_ROUTES.USER.SERVICES}/${id}/sold`, soldReason ? { soldReason } : {}));
    return !!data;
};

export const deactivateService = async (id: string): Promise<boolean> => {
    const { data } = await toApiResult<unknown>(apiClient.patch(`${API_ROUTES.USER.SERVICES}/${id}/deactivate`));
    return !!data;
};

export const repostService = async (id: string): Promise<boolean> => {
    const { data } = await toApiResult<unknown>(apiClient.post(`${API_ROUTES.USER.SERVICES}/${id}/repost`));
    return !!data;
};
