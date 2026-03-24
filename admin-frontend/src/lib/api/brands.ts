import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export interface BrandFilters {
    search?: string;
    categoryId?: string;
    status?: string;
    [key: string]: string | number | boolean | undefined;
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
    const query = new URLSearchParams(
        Object.entries(filters ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
            if (value === undefined || value === null) {
                return acc;
            }
            if (typeof value === "string" && value.length === 0) {
                return acc;
            }
            if (typeof value === "boolean") {
                acc[key] = value ? "true" : "false";
            } else {
                acc[key] = String(value);
            }
            return acc;
        }, {})
    ).toString();
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
