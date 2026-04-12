import { Model, CreateModelDTO, UpdateModelDTO } from "@shared/schemas/catalog.schema";
import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export interface ModelFilters {
    search?: string;
    brandId?: string;
    categoryId?: string;
    status?: string;
    page?: string | number;
    limit?: string | number;
    [key: string]: string | number | undefined;
}

export async function getModels(filters?: ModelFilters) {
    const query = new URLSearchParams(filters as Record<string, string>).toString();
    return adminFetch<{ items: Model[], total: number } | Model[]>(`${ADMIN_ROUTES.MODELS}?${query}`);
}

export async function deleteModel(id: string) {
    return adminFetch<void>(`${ADMIN_ROUTES.MODELS}/${id}`, {
        method: "DELETE"
    });
}

export async function createModel(data: CreateModelDTO) {
    return adminFetch<Model>(ADMIN_ROUTES.MODELS, {
        method: "POST",
        body: data
    });
}

export async function updateModel(id: string, data: UpdateModelDTO) {
    return adminFetch<Model>(`${ADMIN_ROUTES.MODELS}/${id}`, {
        method: "PUT",
        body: data
    });
}

export async function toggleModelStatus(id: string) {
    return adminFetch<Model>(`${ADMIN_ROUTES.MODELS}/${id}/status`, {
        method: "PATCH"
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