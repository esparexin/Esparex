import { ListingLocationSchema } from "@esparex/contracts";
import type { ListingLocation } from "@esparex/contracts";
import { normalizeLocation } from "./location.normalize";

/**
 * Validates a location object against the ListingLocationSchema.
 * If strictly required, it throws on invalid data.
 * Otherwise, it normalizes and returns true if valid.
 */
export function validateLocation(location: unknown): location is ListingLocation {
    const normalized = normalizeLocation(location);
    if (!normalized) return false;

    const result = ListingLocationSchema.safeParse(normalized);
    return result.success;
}
