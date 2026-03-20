import { z } from "zod";
export const SparePartDataSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    categoryIds: z.array(z.string()),
    status: z.string().optional(),
    brandId: z.string().optional(),
    modelId: z.string().optional(),
    type: z.enum(['PRIMARY', 'SECONDARY']).optional(),
    sortOrder: z.number().optional(),
    usageCount: z.number().optional(),
});

import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export interface SparePartFilters {
    search?: string;
    categoryId?: string;
    status?: string;
    [key: string]: string | undefined;
}

export interface SparePartData {
    id?: string;
    name: string;
    categoryIds: string[];
    status?: string;
}

export async function getSpareParts(filters?: SparePartFilters) {
    const query = new URLSearchParams(filters as Record<string, string>).toString();
    return adminFetch<SparePartData[]>(`${ADMIN_ROUTES.SPARE_PARTS}?${query}`);
}

export async function deleteSparePart(id: string) {
    return adminFetch<void>(`${ADMIN_ROUTES.SPARE_PARTS}/${id}`, {
        method: "DELETE"
    });
}

export async function createSparePart(data: SparePartData) {
    return adminFetch<SparePartData>(ADMIN_ROUTES.SPARE_PARTS, {
        method: "POST",
        body: data
    });
}

export async function updateSparePart(id: string, data: SparePartData) {
    return adminFetch<SparePartData>(`${ADMIN_ROUTES.SPARE_PARTS}/${id}`, {
        method: "PUT",
        body: data
    });
}