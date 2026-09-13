import { normalizeLocation, resolveCanonicalLocationId } from "./location.normalize";
import { formatLocation } from "./location.format";
import { validateLocation } from "./location.validate";

/**
 * LocationFacade
 * 
 * Single Source of Truth for all Location-related processing.
 * Consumers must use this facade exclusively and never manipulate
 * location caches or internals directly.
 */
export const LocationFacade = {
    normalize: normalizeLocation,
    format: formatLocation,
    validate: validateLocation,
    resolveId: resolveCanonicalLocationId,
};

export { normalizeLocation, resolveCanonicalLocationId } from "./location.normalize";
export { validateLocation } from "./location.validate";
export * from "./location.format";
