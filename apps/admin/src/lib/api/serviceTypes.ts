import type {
    ServiceType,
    CreateServiceTypeDTO,
    UpdateServiceTypeDTO,
} from "@esparex/contracts";

/**
 * P1-9: the local `ServiceTypeDTO` / `ServiceTypeMutationPayload` interfaces
 * that shadowed the canonical contract types are deleted. These aliases ARE
 * the canonical types — kept under their historic names so existing importers
 * keep working; they will be renamed to the canonical names in a follow-up.
 */
export type ServiceTypeDTO = ServiceType;
export type ServiceTypeMutationPayload = CreateServiceTypeDTO;
export type ServiceTypeUpdatePayload = UpdateServiceTypeDTO;

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

export async function updateServiceType(id: string, data: ServiceTypeUpdatePayload) {
    return adminFetch<ServiceTypeDTO>(ADMIN_ROUTES.SERVICE_TYPE_BY_ID(id), {
        method: "PATCH",
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
