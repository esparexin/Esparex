import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";
import { buildQueryString } from "./queryParams";
import type { ListingTypeValue } from "@shared/enums/listingType";

export interface SparePartFilters {
    search?: string;
    categoryId?: string;
    isActive?: string;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export interface SparePartData {
    id?: string;
    name: string;
    categoryIds: string[];
    slug?: string;
    listingType?: ListingTypeValue[];
    brandId?: string;
    modelId?: string;
    sortOrder?: number;
    usageCount?: number;
    isActive?: boolean;
}

export async function getSpareParts(filters?: SparePartFilters) {
    const query = buildQueryString(filters);
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
    return adminFetch<SparePartData>(ADMIN_ROUTES.SPARE_PART_BY_ID(id), {
        method: "PUT",
        body: data
    });
}
