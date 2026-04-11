import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";
import logger from "@/lib/logger";
import { unwrapApiPayload } from "@/lib/api/result";
import type { ListingTypeValue } from "@shared/enums/listingType";

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
    status?: string;
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

function unwrapArrayPayload<T>(response: unknown): T[] {
    const payload = unwrapApiPayload<unknown>(response);
    if (Array.isArray(payload)) {
        return payload as T[];
    }

    if (isRecord(payload)) {
        if (Array.isArray(payload.items)) {
            return payload.items as T[];
        }
        if (Array.isArray(payload.data)) {
            return payload.data as T[];
        }
    }

    return [];
}

/* -------------------------------------------------------------------------- */
/* API FUNCTIONS                                                              */
/* -------------------------------------------------------------------------- */

export async function getBrands(categoryId: string): Promise<Brand[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.BRANDS_BASE, {
            params: { categoryId },
        });
        return unwrapArrayPayload<Brand>(response).map((brand) => ({
            ...brand,
            id: normalizeEntityId(brand) ?? brand.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getBrands failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load brands"));
    }
}

export async function getModels(brandId: string, categoryId?: string, search?: string): Promise<DeviceModel[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.MODELS_BASE, {
            params: { 
                brandId, 
                ...(categoryId && { categoryId }),
                ...(search && { search })
            },
        });
        return unwrapArrayPayload<DeviceModel>(response).map((model) => ({
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
        return unwrapArrayPayload<ScreenSize>(response).map((screenSize) => ({
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
        return unwrapArrayPayload<ServiceType>(response).map((serviceType) => ({
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
    listingType?: ListingTypeValue
): Promise<SparePart[]> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.SPARE_PARTS_BASE, {
            params: {
                ...(categoryId && { categoryId }),
                ...(listingType && { listingType })
            },
        });
        return unwrapArrayPayload<SparePart>(response).map((part) => ({
            ...part,
            id: normalizeEntityId(part) ?? part.id,
        }));
    } catch (error) {
        logger.error("[MasterData] getSpareParts failed:", error);
        throw (error instanceof Error ? error : new Error("Failed to load spare parts"));
    }
}
