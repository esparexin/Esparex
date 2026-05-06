import { ListingLocation } from "../types/location";
import { toGeoPoint } from "../utils/geoUtils";

interface GoogleAddressComponent {
  types: string[];
  long_name: string;
}

interface GooglePlacesLocation {
  lat: number | (() => number);
  lng: number | (() => number);
}

interface GoogleGeometry {
  location?: GooglePlacesLocation;
}

/**
 * adaptLocationInput
 * 
 * SSOT: Adapts raw location inputs (Google Places, current location, strings, or records)
 * into a canonical ListingLocation contract.
 */
export function adaptLocationInput(raw: unknown): ListingLocation | null {
  if (!raw) return null;

  // Case: Simple String
  if (typeof raw === "string") {
    const value = raw.trim();
    if (!value) return null;
    const [cityRaw, stateRaw] = value.split(",");
    return {
      display: value,
      city: cityRaw?.trim() || value,
      state: stateRaw?.trim() || cityRaw?.trim() || value,
      country: "India",
    };
  }

  if (typeof raw !== "object" || raw === null) return null;

  const input = raw as Record<string, unknown>;

  let city = "";
  let state = "";
  let display = "";

  // 1. Handle Google Places API Response
  if (input.address_components && Array.isArray(input.address_components)) {
    const components = input.address_components as GoogleAddressComponent[];

    const getComponent = (type: string): string =>
      components.find((c) => c.types.includes(type))?.long_name || "";

    city = getComponent("locality") || getComponent("administrative_area_level_2") || "";
    state = getComponent("administrative_area_level_1") || "";
    display = (input.formatted_address as string) || city;
  }

  // 2. Fallback to direct properties
  if (!city && input.city) city = String(input.city);
  if (!city && input.name) city = String(input.name);

  if (!state && input.state) state = String(input.state);
  if (!state) state = city;

  if (!display) {
    display = (input.display as string) ||
      (input.formattedAddress as string) ||
      (input.address as string) ||
      city;
  }

  // 3. Coordinate Normalization
  let coordinates;
  try {
    const geoInput = input.geometry?.location
      ? {
        lat: typeof (input.geometry.location as GooglePlacesLocation).lat === 'function'
          ? (input.geometry.location as GooglePlacesLocation).lat()
          : (input.geometry.location as GooglePlacesLocation).lat,
        lng: typeof (input.geometry.location as GooglePlacesLocation).lng === 'function'
          ? (input.geometry.location as GooglePlacesLocation).lng()
          : (input.geometry.location as GooglePlacesLocation).lng,
      }
      : input.coordinates ?? input;

    coordinates = toGeoPoint(geoInput);
  } catch {
    coordinates = undefined;
  }

  return {
    display: String(display),
    city: String(city),
    state: String(state),
    country: typeof input.country === "string" ? input.country : "India",
    coordinates,
    locationId: input.locationId || input.id || undefined
  } as ListingLocation;
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