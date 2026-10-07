import { adminFetch } from "./adminClient";
import { buildQueryString } from "./queryParams";
import { ADMIN_ROUTES } from "./routes";
import type { UpdateScreenSizeDTO } from "@esparex/contracts";

/**
 * Phase 3a (§5): local `ScreenSizeMutationPayload` shadow type deleted; the
 * mutation payload is derived from the canonical `UpdateScreenSizeDTO`
 * (`@esparex/contracts`) with the admin form's required fields restored.
 */
export type ScreenSizeMutationPayload = UpdateScreenSizeDTO & {
    size: string;
    name: string;
    value: number;
    categoryId: string;
    isActive: boolean;
};

export async function getScreenSizes(filters?: Record<string, string | number | boolean>) {
    const query = buildQueryString(filters);
    return adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.SCREEN_SIZES}?${query}`);
}

export async function createScreenSize(data: ScreenSizeMutationPayload) {
    return adminFetch<Record<string, unknown>>(ADMIN_ROUTES.SCREEN_SIZES, {
        method: "POST",
        body: data
    });
}

export async function updateScreenSize(id: string, data: ScreenSizeMutationPayload) {
    return adminFetch<Record<string, unknown>>(ADMIN_ROUTES.SCREEN_SIZE_BY_ID(id), {
        method: "PATCH",
        body: data
    });
}

export async function deleteScreenSize(id: string) {
    return adminFetch<Record<string, unknown>>(ADMIN_ROUTES.SCREEN_SIZE_BY_ID(id), {
        method: "DELETE"
    });
}

export async function toggleScreenSizeStatus(id: string) {
    return adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.SCREEN_SIZES}/${id}/toggle-status`, {
        method: "PATCH"
    });
}
