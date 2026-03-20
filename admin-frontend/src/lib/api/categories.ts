import { z } from "zod";
export const CategoryDataSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.string().optional(),
    status: z.string().optional(),
    isActive: z.boolean().optional(),
    parentId: z.string().optional(),
    filters: z.array(z.unknown()).optional(),
    listingType: z.array(z.string()).optional(),
    hasScreenSizes: z.boolean().optional(),
});

import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export interface CategoryFilters {
    search?: string;
    type?: string;
    status?: string;
    [key: string]: string | undefined;
}

export interface CategoryData {
    id?: string;
    name: string;
    type?: string;
    status?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    listingType?: string[];
    hasScreenSizes?: boolean;
}

export async function getCategories(filters?: CategoryFilters) {
    const query = new URLSearchParams(filters as Record<string, string>).toString();
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
    return adminFetch<CategoryData>(`${ADMIN_ROUTES.CATEGORIES}/${id}`, {
        method: "PUT",
        body: data
    });
}

export async function deleteCategory(id: string) {
    return adminFetch<void>(`${ADMIN_ROUTES.CATEGORIES}/${id}`, {
        method: "DELETE"
    });
}