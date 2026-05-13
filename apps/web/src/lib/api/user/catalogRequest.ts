import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";
import { unwrapApiPayload } from "@/lib/api/result";
import logger from "@/lib/logger";

export interface CreateCatalogRequestPayload {
    requestType: 'brand' | 'model';
    categoryId: string;
    parentBrandId?: string;
    requestedName: string;
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
}): Promise<{ items: CatalogRequest[]; total: number }> {
    try {
        const response = await apiClient.get(API_ROUTES.USER.CATALOG_REQUESTS_MY, { params });
        const data = unwrapApiPayload<any>(response);
        return {
            items: data.items || [],
            total: data.total || 0
        };
    } catch (error) {
        logger.error("[CatalogRequest] getMyCatalogRequests failed:", error);
        throw error instanceof Error ? error : new Error("Failed to load requests");
    }
}
