import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";
import logger from "@/lib/logger";

/**
 * Category Data API
 *
 * Centralized access layer for catalog / category data.
 * Backend base path: /api/v1/catalog/*
 *
 * RULES:
 * - No UI logic here
 * - Propagate API failures to callers (no silent fallback)
 * - Normalize backend responses safely
 */

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface Brand {
    id?: string;
    _id?: string;
    name: string;
    categoryIds?: string[];
}

export interface DeviceModel {
    id?: string;
    _id?: string;
    name: string;
    brandId?: string;
    categoryId?: string;
}

export interface ScreenSize {
    id?: string;
    _id?: string;
    size: string;
    name?: string;
    categoryId?: string;
}

export interface SparePart {
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
    categories?: string[];
}

export interface ServiceType {
    id?: string;
    _id?: string;
    name: string;
    categoryId?: string;
    isActive?: boolean;
}

/* -------------------------------------------------------------------------- */
/* INTERNAL HELPER                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes all backend response shapes:
 * - { data: [...] }
 * - { output: { data: [...] } }
 * - raw array
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const normalizeEntityId = (value: unknown): string | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const record = value as Record<string, unknown>;
    const idCandidate = record.id ?? record._id;
    if (typeof idCandidate === "string" || typeof idCandidate === "number") {
        const normalized = String(idCandidate).trim();
        return normalized.length > 0 ? normalized : undefined;
    }
    return undefined;
};

function normalizeArrayResponse<T>(response: unknown): T[] {
    const record = isRecord(response) ? response : {};
    const data =
        (isRecord(record.data) ? (record.data as Record<string, unknown>).items : undefined) ??
        (isRecord(record.data) ? (record.data as Record<string, unknown>).data : undefined) ??
        (isRecord(record.output) ? (record.output as Record<string, unknown>).items : undefined) ??
        (isRecord(record.output) ? (record.output as Record<string, unknown>).data : undefined) ??
        record.items ??
        record.data ??
        record.output ??
        response ??
        [];

    return Array.isArray(data) ? (data as T[]) : [];
}

/* -------------------------------------------------------------------------- */
/* API FUNCTIONS                                                              */
/* -------------------------------------------------------------------------- */

export async function getBrands(categoryId: string): Promise<Brand[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.BRANDS_BASE, {
            params: { categoryId },
        });
        return normalizeArrayResponse<Brand>(response).map((brand) => ({
            ...brand,
            id: normalizeEntityId(brand) ?? brand.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getBrands failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load brands"));
    }
}

export async function getModels(brandId: string, categoryId?: string): Promise<DeviceModel[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.MODELS_BASE, {
            params: { brandId, ...(categoryId && { categoryId }) },
        });
        return normalizeArrayResponse<DeviceModel>(response).map((model) => ({
            ...model,
            id: normalizeEntityId(model) ?? model.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getModels failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load models"));
    }
}

export async function getScreenSizes(categoryId?: string): Promise<ScreenSize[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.SCREEN_SIZES, {
            params: categoryId ? { categoryId } : undefined,
        });
        return normalizeArrayResponse<ScreenSize>(response).map((screenSize) => ({
            ...screenSize,
            id: normalizeEntityId(screenSize) ?? screenSize.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getScreenSizes failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load screen sizes"));
    }
}

export async function getServiceTypes(categoryId?: string): Promise<ServiceType[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.SERVICE_TYPES, {
            params: categoryId ? { categoryId } : undefined,
        });
        return normalizeArrayResponse<ServiceType>(response).map((serviceType) => ({
            ...serviceType,
            id: normalizeEntityId(serviceType) ?? serviceType.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getServiceTypes failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load service types"));
    }
}

export async function getSpareParts(
    categoryId?: string,
    placement?: 'postad' | 'postsparepart'
): Promise<SparePart[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.SPARE_PARTS_BASE, {
            params: {
                ...(categoryId && { categoryId }),
                ...(placement && { placement })
            },
        });
        return normalizeArrayResponse<SparePart>(response).map((part) => ({
            ...part,
            id: normalizeEntityId(part) ?? part.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getSpareParts failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load spare parts"));
    }
}

export async function suggestBrand(name: string, categoryId: string): Promise<Brand | null> {
    try {
        const response = await apiClient.post(API_ROUTES.USER.CATALOG_BRAND_SUGGEST, { name, categoryId });
        if (isRecord(response) && isRecord(response.data)) {
            const data = response.data as Record<string, unknown>;
            return {
                id: normalizeEntityId(data) ?? data.id as string,
                name: (data.name as string) || name,
                categoryId: (data.categoryId as string) || categoryId,
                status: (data.status as string) || 'pending'
            } as Brand & { status: string };
        }
        return null;
    } catch (error) {
        logger.warn("[MasterData] suggestBrand failed:", error);
        throw error;
    }
}

export async function suggestModel(name: string, brandId: string, categoryId: string): Promise<DeviceModel | null> {
    try {
        const response = await apiClient.post(API_ROUTES.USER.CATALOG_MODEL_SUGGEST, { name, brandId, categoryId });
        if (isRecord(response) && isRecord(response.data)) {
            const data = response.data as Record<string, unknown>;
            return {
                id: normalizeEntityId(data) ?? data.id as string,
                name: (data.name as string) || name,
                brandId,
                categoryId,
                status: (data.status as string) || 'pending'
            } as DeviceModel & { status: string };
        }
        return null;
    } catch (error) {
        logger.warn("[MasterData] suggestModel failed:", error);
        throw error;
    }
}

/* -------------------------------------------------------------------------- */
/* AGGREGATED EXPORT                                                          */
/* -------------------------------------------------------------------------- */

export const MasterDataAPI = {
    getModels,
    getScreenSizes,
    getSpareParts,
    getServiceTypes,
    suggestBrand,
    suggestModel,
};

export default MasterDataAPI;
