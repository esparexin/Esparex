import { Brand, CreateBrandDTO, UpdateBrandDTO } from "@shared/schemas/catalog.schema";
import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";
import { buildQueryString } from "./queryParams";

export interface BrandFilters {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: string | number;
    limit?: string | number;
    [key: string]: string | number | boolean | undefined;
}

export async function getBrands(filters?: BrandFilters) {
    const query = buildQueryString(filters);
    return adminFetch<{ items: Brand[], total: number } | Brand[]>(`${ADMIN_ROUTES.BRANDS}?${query}`);
}

export async function createBrand(data: CreateBrandDTO) {
    return adminFetch<Brand>(ADMIN_ROUTES.BRANDS, {
        method: "POST",
        body: data
    });
}

export async function updateBrand(id: string, data: UpdateBrandDTO) {
    return adminFetch<Brand>(`${ADMIN_ROUTES.BRANDS}/${id}`, {
        method: "PUT",
        body: data
    });
}

export async function deleteBrand(id: string) {
    return adminFetch<void>(`${ADMIN_ROUTES.BRANDS}/${id}`, {
        method: "DELETE"
    });
}

export async function approveBrand(id: string) {
    return adminFetch<void>(ADMIN_ROUTES.APPROVE_BRAND(id), {
        method: "PATCH"
    });
}

export async function rejectBrand(id: string, reason: string) {
    return adminFetch<void>(ADMIN_ROUTES.REJECT_BRAND(id), {
        method: "PATCH",
        body: { reason }
    });
}

export async function toggleBrandStatus(id: string) {
    return adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.BRANDS}/${id}/status`, {
        method: "PATCH"
    });
}
