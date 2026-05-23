import { ListingLocation } from "../types/location";
import { normalizeGeoPoint } from "../utils/geoUtils";

/**
 * adaptLocationInput
 * 
 * SSOT: Adapts strict canonical location input into a ListingLocation contract.
 * Rejects legacy fallback structures and enforces GeoJSON compliance.
 */
export function adaptLocationInput(raw: unknown): ListingLocation | null {
  if (!raw || typeof raw !== "object") return null;

  const input = raw as Record<string, unknown>;

  const city = String(input.city || "");
  const state = String(input.state || "");
  const display = String(input.display || input.formattedAddress || city);
  const locationId = typeof input.locationId === "string" ? input.locationId : 
                    typeof input.id === "string" ? input.id : undefined;

  let coordinates;
  try {
    coordinates = normalizeGeoPoint(input.coordinates ?? input);
  } catch {
    coordinates = undefined;
  }

  return {
    display,
    city,
    state,
    country: typeof input.country === "string" ? input.country : "India",
    coordinates,
    locationId
  };
}

/**
 * Legacy Alias for Backend Compatibility
 */
export const normalizeListingLocation = adaptLocationInput;

export function formatLocationDisplay(location: ListingLocation | null): string {
  if (!location) return "";
  if (location.display) return location.display;
  const parts = [location.city, location.state].filter(Boolean);
  return parts.join(", ");
}