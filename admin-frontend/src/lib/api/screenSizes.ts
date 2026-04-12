import { adminFetch } from "./adminClient";
import { buildQueryString } from "./queryParams";
import { ADMIN_ROUTES } from "./routes";

export async function getScreenSizes(filters?: Record<string, string | number>) {
    const query = buildQueryString(filters);
    return adminFetch<any>(`${ADMIN_ROUTES.SCREEN_SIZES}?${query}`);
}

export async function createScreenSize(data: Record<string, unknown>) {
    return adminFetch<any>(ADMIN_ROUTES.SCREEN_SIZES, {
        method: "POST",
        body: data
    });
}

export async function updateScreenSize(id: string, data: Record<string, unknown>) {
    return adminFetch<any>(ADMIN_ROUTES.SCREEN_SIZE_BY_ID(id), {
        method: "PUT",
        body: data
    });
}

export async function deleteScreenSize(id: string) {
    return adminFetch<any>(ADMIN_ROUTES.SCREEN_SIZE_BY_ID(id), {
        method: "DELETE"
    });
}

export async function toggleScreenSizeStatus(id: string) {
    return adminFetch<any>(`${ADMIN_ROUTES.SCREEN_SIZES}/${id}/toggle-status`, {
        method: "PATCH"
    });
}
