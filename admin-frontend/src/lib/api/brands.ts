import { z } from "zod";
export const BrandDataSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    categoryId: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    status: z.string().optional(),
    isActive: z.boolean().optional(),
    slug: z.string().optional(),
});

import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export interface BrandFilters {
    search?: string;
    categoryId?: string;
    status?: string;
    [key: string]: string | undefined;
}

export interface BrandData {
    id?: string;
    name: string;
    categoryId?: string;
    categoryIds?: string[];
    status?: string;
    isActive?: boolean;
}

export async function getBrands(filters?: BrandFilters) {
    const query = new URLSearchParams(filters as Record<string, string>).toString();
    return adminFetch<BrandData[]>(`${ADMIN_ROUTES.BRANDS}?${query}`);
}

export async function createBrand(data: BrandData) {
    return adminFetch<BrandData>(ADMIN_ROUTES.BRANDS, {
        method: "POST",
        body: data
    });
}

export async function updateBrand(id: string, data: BrandData) {
    return adminFetch<BrandData>(`${ADMIN_ROUTES.BRANDS}/${id}`, {
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
    return adminFetch<any>(`${ADMIN_ROUTES.BRANDS}/${id}/status`, {
        method: "PATCH"
    });
}