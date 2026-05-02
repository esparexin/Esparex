export interface ServiceTypeDTO {
    id: string;
    name: string;
    description?: string;
    status?: string;
}
import { adminFetch } from "./adminClient";
import { buildQueryString } from "./queryParams";
import { ADMIN_ROUTES } from "./routes";

export async function getServiceTypes(filters?: Record<string, string | number>) {
    const query = buildQueryString(filters);
    return adminFetch<ServiceTypeDTO[]>(`${ADMIN_ROUTES.SERVICE_TYPES}?${query}`);
}

export async function getServiceTypeById(id: string) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPE_BY_ID(id));
}

export async function createServiceType(data: Record<string, unknown>) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPES, {
        method: "POST",
        body: data,
    });
}

export async function updateServiceType(id: string, data: Record<string, unknown>) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPE_BY_ID(id), {
        method: "PUT",
        body: data,
    });
}

export async function toggleServiceTypeStatus(id: string) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPE_TOGGLE(id), {
        method: "PATCH",
        body: {},
    });
}

export async function deleteServiceType(id: string) {
    return adminFetch<void>(ADMIN_ROUTES.SERVICE_TYPE_BY_ID(id), {
        method: "DELETE",
    });
}
