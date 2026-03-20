import { z } from "zod";
export const ModelDataSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    brandId: z.string(),
    categoryId: z.string(),
    status: z.string().optional(),
    modelId: z.string().optional(),
});

import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export interface ModelFilters {
    search?: string;
    brandId?: string;
    categoryId?: string;
    status?: string;
    [key: string]: string | undefined;
}

export interface ModelData {
    id?: string;
    name: string;
    brandId: string;
    categoryId: string;
    status?: string;
}

export async function getModels(filters?: ModelFilters) {
    const query = new URLSearchParams(filters as Record<string, string>).toString();
    return adminFetch<ModelData[]>(`${ADMIN_ROUTES.MODELS}?${query}`);
}

export async function deleteModel(id: string) {
    return adminFetch<void>(`${ADMIN_ROUTES.MODELS}/${id}`, {
        method: "DELETE"
    });
}

export async function createModel(data: ModelData) {
    return adminFetch<ModelData>(ADMIN_ROUTES.MODELS, {
        method: "POST",
        body: data
    });
}

export async function updateModel(id: string, data: ModelData) {
    return adminFetch<ModelData>(`${ADMIN_ROUTES.MODELS}/${id}`, {
        method: "PUT",
        body: data
    });
}

export async function approveModel(id: string) {
    return adminFetch<void>(ADMIN_ROUTES.APPROVE_MODEL(id), {
        method: "PATCH"
    });
}

export async function rejectModel(id: string, reason: string) {
    return adminFetch<void>(ADMIN_ROUTES.REJECT_MODEL(id), {
        method: "PATCH",
        body: { reason }
    });
}