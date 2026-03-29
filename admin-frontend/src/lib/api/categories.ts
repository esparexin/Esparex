import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";
import { buildQueryString } from "./queryParams";
import type { ListingTypeValue } from "@shared/enums/listingType";

export interface CategoryFilters {
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
    const query = buildQueryString(filters);
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
