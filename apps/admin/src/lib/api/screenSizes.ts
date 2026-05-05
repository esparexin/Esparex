import { adminFetch } from "./adminClient";
import { buildQueryString } from "./queryParams";
import { ADMIN_ROUTES } from "./routes";

export type ScreenSizeMutationPayload = {
    size: string;
    name: string;
    value: number;
    categoryId: string;
    isActive: boolean;
};

export async function getScreenSizes(filters?: Record<string, string | number>) {
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
        method: "PUT",
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
