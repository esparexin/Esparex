import { adminFetch } from "./adminClient";
import { ADMIN_ROUTES } from "./routes";

export async function getScreenSizes(filters?: Record<string, string | number>) {
    const query = new URLSearchParams(
        Object.entries(filters || {}).reduce<Record<string, string>>((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
        }, {})
    ).toString();
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
