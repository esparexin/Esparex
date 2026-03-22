import { apiClient } from '@/lib/api/client';
import { toApiResult } from '@/lib/api/result';
import { API_ROUTES } from '../routes';
import type { GeoJSONPoint } from '@/types/location';
import {
    normalizeBusinessStatus,
} from '@/lib/status/statusNormalization';

// --- Types ---

import type { Business as SharedBusiness } from '@shared/types/Business';
import type { Service as SharedService } from '@shared/types/Service';
import type { Ad } from '@/schemas/ad.schema';

// Re-export shared types for local use, adding any frontend-specific extensions if needed
export type ApiBusiness = SharedBusiness;
export type Business = SharedBusiness;
export type Service = SharedService;

export interface CreateBusinessDTO {
    name: string;
    description: string;
    businessTypes: string[];
    deviceCategories?: Array<{
        category: string;
        services: boolean;
        spareParts: boolean;
        isLocked?: boolean;
    }>;
    location: {
        city: string;
        state: string;
        pincode: string;
        street: string;
        shopNo: string;
        landmark?: string;
        coordinates?: GeoJSONPoint;
    };
    phone: string;
    email?: string;
    images: string[];
    documents: {
        idProof: string[];
        businessProof: string[];
        certificates: string[];
        idProofType?: string;
    };
}

// --- Helpers ---

import { normalizeLocation } from '@/lib/location/locationService';
import logger from "@/lib/logger";
import { toSafeImageArray } from '@/lib/image/imageUrl';

// ...

function normalizeBusiness(
    apiBusiness: ApiBusiness | null | undefined
): Business | null {
    if (!apiBusiness) return null;

    // Use shared normalization (handles coordinates & display logic)
    // We pass apiBusiness.location which has the raw structure
    const normalizedLoc = normalizeLocation(apiBusiness.location);

    const normalizedStatus = normalizeBusinessStatus(apiBusiness.status);

    return {
        ...apiBusiness,
        businessName: apiBusiness.name, // Keep for backward compatibility with UI components
        // Canonicalize mobile/phone/contactNumber — model stores as `mobile`, expose all aliases
        mobile: apiBusiness.mobile || (apiBusiness as any).phone || "",
        phone: apiBusiness.mobile || (apiBusiness as any).phone || "",
        contactNumber: apiBusiness.mobile || (apiBusiness as any).phone || (apiBusiness as any).contactNumber || "",
        isVerified: !!apiBusiness.isVerified || !!(apiBusiness as any).verified,
        verified: !!apiBusiness.isVerified || !!(apiBusiness as any).verified,
        status: normalizedStatus as ApiBusiness['status'],
        logo: apiBusiness.logo,
        coverImage: apiBusiness.coverImage,
        images: toSafeImageArray(apiBusiness.images),
        shopImages: toSafeImageArray(apiBusiness.shopImages),
        gallery: toSafeImageArray(apiBusiness.gallery),
        documents: Object.assign(
            Array.isArray(apiBusiness.documents) ? [...apiBusiness.documents] : [],
            {
                idProof: Array.isArray(apiBusiness.documents) 
                    ? apiBusiness.documents.filter(d => d.type === 'id_proof').map(d => d.url)
                    : (apiBusiness.documents as any)?.idProof || [],
                businessProof: Array.isArray(apiBusiness.documents)
                    ? apiBusiness.documents.filter(d => d.type === 'business_proof').map(d => d.url)
                    : (apiBusiness.documents as any)?.businessProof || [],
                certificates: Array.isArray(apiBusiness.documents)
                    ? apiBusiness.documents.filter(d => d.type === 'certificate').map(d => d.url)
                    : (apiBusiness.documents as any)?.certificates || []
            }
        ),
        location: {
            ...normalizedLoc,
            address: normalizedLoc?.formattedAddress || normalizedLoc?.display || 'Unknown Location',
            display: normalizedLoc?.display || 'Unknown Location'
        }
    } as Business;
}

// --- API Functions ---

export const getBusinesses = async (filters: { city?: string; category?: string; limit?: number } = {}): Promise<Business[]> => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.city) queryParams.append('city', filters.city);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.limit) queryParams.append('limit', String(filters.limit));

        const { data: apiData } = await toApiResult<ApiBusiness[]>(
            apiClient.get(`${API_ROUTES.USER.BUSINESSES_PUBLIC}?${queryParams.toString()}`)
        );
        if (!Array.isArray(apiData)) return [];
        return apiData
            .map(normalizeBusiness)
            .filter((b): b is Business => b !== null);
    } catch (e) {
        logger.error('Failed to load businesses', e);
        return [];
    }
};

export const registerBusiness = async (
    data: CreateBusinessDTO
): Promise<Business | null> => {
    try {
        // Use apiClient.post directly (throws on API error) rather than toApiResult
        // which swallows errors and returns null, preventing the catch block from
        // surfacing real error messages to the form.
        const response = await apiClient.post<{ data?: ApiBusiness; success?: boolean }>(
            API_ROUTES.USER.BUSINESSES_PUBLIC, data, { silent: true }
        );
        const apiData = (response as { data?: ApiBusiness }).data ?? (response as unknown as ApiBusiness);
        if (!apiData) return null;
        return normalizeBusiness(apiData);
    } catch (e) {
        logger.error('Failed to register business', e);
        throw e;
    }
};

export const uploadBusinessImage = async (
    file: File | string,
    folder: 'businesses' | 'documents' = 'businesses'
): Promise<string> => {
    if (typeof file === 'string') return file;

    const formData = new FormData();
    formData.append('file', file);
    // Pre-registration: no businessId exists yet, so use per-user staging paths
    formData.append('folder', folder === 'documents' ? 'documents' : 'business-staging');

    const response = await apiClient.post<{ data?: { url: string } }>(
        API_ROUTES.USER.BUSINESSES_UPLOAD,
        formData,
        { silent: true }
    );
    const url = (response as { data?: { url: string } }).data?.url;
    if (!url) throw new Error('Upload failed: no URL returned');
    return url;
};

export const getMyBusinesses = async (): Promise<Business[]> => {
    try {
        const { data: apiData } = await toApiResult<ApiBusiness[]>(
            apiClient.get(API_ROUTES.USER.BUSINESS_ME)
        );
        if (!Array.isArray(apiData)) {
            throw new Error('Invalid businesses response');
        }
        return apiData
            .map(normalizeBusiness)
            .filter((b): b is Business => b !== null);
    } catch (e) {
        logger.error('Failed to load businesses', e);
        throw e;
    }
};

export const getMyBusiness = async (): Promise<Business | null> => {
    const businesses = await getMyBusinesses();
    return businesses.length > 0 ? (businesses[0] ?? null) : null;
};

export const getBusinessById = async (
    id: string
): Promise<Business | null> => {
    if (!id || id === 'undefined' || id === 'null') {
        return null;
    }

    try {
        const { data: apiData } = await toApiResult<ApiBusiness>(
            apiClient.get(API_ROUTES.USER.BUSINESS_DETAIL(id))
        );
        if (!apiData) return null;
        return normalizeBusiness(apiData);
    } catch (e) {
        logger.error('Failed to load business', e);
        throw e;
    }
};

export const updateBusiness = async (
    id: string,
    updateData: Partial<ApiBusiness> | Partial<CreateBusinessDTO>
): Promise<Business | null> => {
    try {
        const { data: apiData } = await toApiResult<ApiBusiness>(
            apiClient.patch(API_ROUTES.USER.BUSINESS_DETAIL(id), updateData)
        );
        if (!apiData) return null;
        return normalizeBusiness(apiData);
    } catch (e) {
        logger.error('Failed to update business', e);
        throw e;
    }
};

export type BusinessStats = {
    totalServices: number;
    approvedServices: number;
    pendingServices: number;
    views: number;
    [key: string]: unknown;
};

export const getBusinessStats = async (id: string): Promise<BusinessStats> => {
    try {
        const { data: result } = await toApiResult<BusinessStats>(
            apiClient.get(API_ROUTES.USER.BUSINESS_STATS(id))
        );
        if (!result) {
            throw new Error('Failed to load business stats');
        }
        return result;
    } catch (e) {
        logger.error('Failed to load business stats', e);
        throw e;
    }
};

export const getMyBusinessStats = async (): Promise<BusinessStats> => {
    try {
        const { data: result } = await toApiResult<BusinessStats>(
            apiClient.get(API_ROUTES.USER.BUSINESS_ME_STATS)
        );
        return result || { totalServices: 0, approvedServices: 0, pendingServices: 0, views: 0 };
    } catch (e) {
        logger.error('Failed to load my business stats', e);
        return { totalServices: 0, approvedServices: 0, pendingServices: 0, views: 0 };
    }
};

export const getBusinessServices = async (
    id: string
): Promise<Service[]> => {
    try {
        const { data: result } = await toApiResult<Service[]>(
            apiClient.get(API_ROUTES.USER.BUSINESS_SERVICES(id))
        );
        if (!Array.isArray(result)) {
            throw new Error('Invalid services response');
        }
        return result;
    } catch (e) {
        logger.error('Failed to load business services', e);
        throw e;
    }
};

export const getBusinessAds = async (id: string): Promise<Ad[]> => {
    try {
        const { data: result } = await toApiResult<Ad[]>(
            apiClient.get(API_ROUTES.USER.BUSINESS_ADS(id))
        );
        return Array.isArray(result) ? result : [];
    } catch (e) {
        logger.error('Failed to load business ads', e);
        return [];
    }
};

export const getBusinessSpareParts = async (id: string): Promise<Ad[]> => {
    try {
        const { data: result } = await toApiResult<Ad[]>(
            apiClient.get(API_ROUTES.USER.BUSINESS_SPARE_PARTS(id))
        );
        return Array.isArray(result) ? result : [];
    } catch (e) {
        logger.error('Failed to load business spare parts', e);
        return [];
    }
};

/**
 * Withdraw/cancel a pending business application.
 * Only works when business status is 'pending'.
 */
export const withdrawBusiness = async (): Promise<boolean> => {
    try {
        await toApiResult<{ message: string }>(
            apiClient.delete(API_ROUTES.USER.BUSINESS_ME)
        );
        return true;
    } catch (e) {
        logger.error('Failed to withdraw business application', e);
        throw e;
    }
};
