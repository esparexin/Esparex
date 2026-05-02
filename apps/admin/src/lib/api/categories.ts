import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";
import { buildQueryString } from "./queryParams";
import type { ListingTypeValue } from "@shared/enums/listingType";

export interface CategoryFilters {
    q?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
    [key: string]: string | number | boolean | undefined;
}

export interface CategoryData {
    id?: string;
    name: string;
    slug?: string;
    type?: string;
    status?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    listingType?: ListingTypeValue[];
    hasScreenSizes?: boolean;
    parentId?: string;
    filters?: unknown[];
}

export async function getCategories(filters?: CategoryFilters) {
    const { search, q, ...rest } = filters ?? {};
    const normalizedQuery = typeof q === "string" && q.trim().length > 0
        ? q.trim()
        : typeof search === "string" && search.trim().length > 0
            ? search.trim()
            : undefined;
    const query = buildQueryString({
        ...rest,
        ...(normalizedQuery ? { q: normalizedQuery } : {}),
    });
    return adminFetch<CategoryData[]>(`${ADMIN_ROUTES.CATEGORIES}?${query}`);
}

export async function toggleCategoryStatus(id: string) {
    return adminFetch<void>(ADMIN_ROUTES.CATEGORY_STATUS(id), {
        method: "PATCH"
    });
}

export async function createCategory(data: CategoryData) {
    return adminFetch<CategoryData>(ADMIN_ROUTES.CATEGORIES, {
        method: "POST",
        body: data
    });
}

export async function updateCategory(id: string, data: CategoryData) {
    return adminFetch<CategoryData>(ADMIN_ROUTES.CATEGORY_BY_ID(id), {
        method: "PUT",
        body: data
    });
}

export async function deleteCategory(id: string) {
    return adminFetch<void>(ADMIN_ROUTES.CATEGORY_BY_ID(id), {
        method: "DELETE"
    });
}
