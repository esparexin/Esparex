import { API_ROUTES } from "@/lib/api/routes";
import type { UserListing } from "./normalizer";
import { createListing, updateListing } from "./listingMutationAPI";

export const createAdListing = (
    payload: Partial<UserListing>,
    options?: { idempotencyKey?: string }
) => createListing(payload, options);

export const updateAdListing = (
    id: string,
    payload: Partial<UserListing>
) => updateListing(id, payload);

export const createServiceListing = (
    payload: Record<string, unknown>,
    options?: { idempotencyKey?: string }
) => createListing(payload as Partial<UserListing>, {
    endpoint: API_ROUTES.USER.LISTINGS,
    idempotencyKey: options?.idempotencyKey,
    errorMessage: "Failed to create service",
});

export const updateServiceListing = (
    id: string,
    payload: Record<string, unknown>
) => updateListing(id, payload as Partial<UserListing>, {
    endpoint: API_ROUTES.USER.LISTING_EDIT(id),
});

export const createSparePartListing = (
    payload: Record<string, unknown>,
    options?: { idempotencyKey?: string }
) =>
    createListing(payload as Partial<UserListing>, {
        endpoint: API_ROUTES.USER.LISTINGS,
        idempotencyKey: options?.idempotencyKey,
    });

export const updateSparePartListing = (
    id: string,
    payload: Record<string, unknown>
) => updateListing(id, payload as Partial<UserListing>, {
    endpoint: API_ROUTES.USER.LISTING_EDIT(id),
});
