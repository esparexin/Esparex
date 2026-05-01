import { API_ROUTES } from "@/lib/api/routes";
import type { Listing } from "./normalizer";
import { createListing, updateListing } from "./listingMutationAPI";

export const createAdListing = (
    payload: Partial<Listing>,
    options?: { idempotencyKey?: string }
) => createListing(payload, options);

export const updateAdListing = (
    id: string,
    payload: Partial<Listing>
) => updateListing(id, payload);

export const createServiceListing = (
    payload: Record<string, unknown>,
    options?: { idempotencyKey?: string }
) => createListing(payload as Partial<Listing>, {
    endpoint: API_ROUTES.USER.LISTINGS,
    idempotencyKey: options?.idempotencyKey,
    errorMessage: "Failed to create service",
});

export const updateServiceListing = (
    id: string,
    payload: Record<string, unknown>
) => updateListing(id, payload as Partial<Listing>, {
    endpoint: API_ROUTES.USER.LISTING_DETAIL(id),
});

export const createSparePartListing = (payload: Record<string, unknown>) =>
    createListing(payload as Partial<Listing>, {
        endpoint: API_ROUTES.USER.LISTINGS,
    });

export const updateSparePartListing = (
    id: string,
    payload: Record<string, unknown>
) => updateListing(id, payload as Partial<Listing>, {
    endpoint: API_ROUTES.USER.LISTING_DETAIL(id),
});
