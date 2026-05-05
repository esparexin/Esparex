export interface ServiceTypeDTO {
    id: string;
    name: string;
    categoryId?: string;
    categoryIds?: string[];
    isActive?: boolean;
    description?: string;
    status?: string;
}
export interface ServiceTypeMutationPayload {
    name: string;
    categoryIds: string[];
    isActive: boolean;
}
import { adminFetch } from "./adminClient";
import { buildQueryString } from "./queryParams";
import { ADMIN_ROUTES } from "./routes";

export async function getServiceTypes(filters?: Record<string, string | number | boolean>) {
    const query = buildQueryString(filters);
    return adminFetch<ServiceTypeDTO[]>(`${ADMIN_ROUTES.SERVICE_TYPES}?${query}`);
}

export async function getServiceTypeById(id: string) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPE_BY_ID(id));
}

export async function createServiceType(data: ServiceTypeMutationPayload) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPES, {
        method: "POST",
        body: data,
    });
}

export async function updateServiceType(id: string, data: ServiceTypeMutationPayload) {
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
