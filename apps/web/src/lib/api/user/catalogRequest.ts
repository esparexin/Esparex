import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";
import { unwrapApiPayload } from "@/lib/api/result";
import logger from "@/lib/logger";

export interface CreateCatalogRequestPayload {
    requestType: 'brand' | 'model';
    categoryId: string;
    parentBrandId?: string;
    requestedName: string;
    /** Optional soft reference to the related listing (edit-ad flow only). */
    listingId?: string;
}

export interface CatalogRequest {
    id: string;
    requestType: 'brand' | 'model';
    categoryId: string;
    parentBrandId?: string;
    requestedName: string;
    status: 'pending' | 'approved' | 'rejected' | 'duplicate';
    createdAt: string;
}

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

/**
 * Submit a request for a missing brand or model.
 * This will be reviewed by an admin and, if approved, added to the catalog.
 */
export async function createCatalogRequest(payload: CreateCatalogRequestPayload): Promise<CatalogRequest> {
    try {
        const response = await apiClient.post(API_ROUTES.USER.CATALOG_REQUESTS, payload);
        return unwrapApiPayload<CatalogRequest>(response) as CatalogRequest;
    } catch (error) {
        logger.error("[CatalogRequest] createCatalogRequest failed:", error);
        throw error instanceof Error ? error : new Error("Failed to submit request");
    }
}

/**
 * Get the current user's submitted catalog requests.
 */
export async function getMyCatalogRequests(params?: {
    status?: string;
    requestType?: string;
    page?: number;
    limit?: number;
}): Promise<{ items: CatalogRequest[]; total: number; pagination: PaginationMeta }> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.CATALOG_REQUESTS_MY, { params });
        const envelope = (response as { data?: unknown })?.data ?? response;
        const data = unwrapApiPayload<unknown>(response);
        const meta: Partial<PaginationMeta> = (
            envelope &&
            typeof envelope === 'object' &&
            !Array.isArray(envelope) &&
            (envelope as { meta?: { pagination?: Partial<PaginationMeta> } }).meta?.pagination
        ) || {};
        const items = (
            data &&
            typeof data === 'object' &&
            !Array.isArray(data) &&
            Array.isArray((data as { items?: CatalogRequest[] }).items)
        )
            ? ((data as { items: CatalogRequest[] }).items)
            : (Array.isArray(data) ? (data as CatalogRequest[]) : []);
        const page = Number(meta.page ?? params?.page ?? 1);
        const limit = Number(meta.limit ?? params?.limit ?? 20);
        const total = Number(meta.total ?? items.length);
        const pages = Number(meta.pages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));

        return {
            items,
            total,
            pagination: {
                page,
                limit,
                total,
                pages,
            },
        };
    } catch (error) {
        logger.error("[CatalogRequest] getMyCatalogRequests failed:", error);
        throw error instanceof Error ? error : new Error("Failed to load requests");
    }
}
