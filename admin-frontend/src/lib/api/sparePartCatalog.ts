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

import type { SparePart, CreateSparePartDTO, UpdateSparePartDTO } from "@shared/schemas/catalog.schema";

export async function getSpareParts(filters?: SparePartFilters) {
    const query = buildQueryString(filters);
    return adminFetch<SparePart[]>(`${ADMIN_ROUTES.SPARE_PARTS}?${query}`);
}

export async function deleteSparePart(id: string) {
    return adminFetch<void>(`${ADMIN_ROUTES.SPARE_PARTS}/${id}`, {
        method: "DELETE"
    });
}

export async function createSparePart(data: CreateSparePartDTO) {
    return adminFetch<SparePart>(ADMIN_ROUTES.SPARE_PARTS, {
        method: "POST",
        body: data
    });
}

export async function updateSparePart(id: string, data: UpdateSparePartDTO) {
    return adminFetch<SparePart>(ADMIN_ROUTES.SPARE_PART_BY_ID(id), {
        method: "PUT",
        body: data
    });
}

export async function toggleSparePartStatus(id: string) {
    return adminFetch<{ active: boolean }>(`${ADMIN_ROUTES.SPARE_PART_BY_ID(id)}/toggle-status`, {
        method: "PATCH",
    });
}
