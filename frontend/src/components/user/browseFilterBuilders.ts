import type { LocationData } from "@/context/LocationContext";
import { getSearchLocationLabel, sanitizeLocationLabel } from "@/lib/location/locationLabels";
import { getLatitude, getLongitude } from "@/lib/location/utils";

interface BaseBrowseFilterShape {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

interface ProximityFilterShape {
  locationId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

interface ServiceLocationFilterShape extends ProximityFilterShape {
  level?: string;
  location?: string;
}

interface RequestedLocationFilterShape extends ProximityFilterShape {
  location?: string;
}

interface BuildBaseBrowseFilterArgs {
  page: number;
  pageSize: number;
  query: string;
  selectedCategory: string;
}

export function buildBaseBrowseFilters<TFilter extends BaseBrowseFilterShape>({
  page,
  pageSize,
  query,
  selectedCategory,
}: BuildBaseBrowseFilterArgs): TFilter {
  const filters = {
    page,
    limit: pageSize,
  } as TFilter;

  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    filters.search = normalizedQuery;
  }
  if (selectedCategory) {
    filters.categoryId = selectedCategory;
  }

  return filters;
}

export function applyRequestedLocationFilters<TFilter extends RequestedLocationFilterShape>({
  filters,
  urlLocationId,
  urlLocationLabel,
  radiusKm,
}: {
  filters: TFilter;
  urlLocationId?: string;
  urlLocationLabel?: string;
  radiusKm?: number;
}) {
  const hasFiniteRadius = typeof radiusKm === "number" && Number.isFinite(radiusKm);

  if (urlLocationId) {
    filters.locationId = urlLocationId;
    if (hasFiniteRadius) {
      filters.radiusKm = radiusKm;
    }
    return true;
  }

  const sanitizedLocationLabel = sanitizeLocationLabel(urlLocationLabel);
  if (sanitizedLocationLabel) {
    filters.location = sanitizedLocationLabel;
    if (hasFiniteRadius) {
      filters.radiusKm = radiusKm;
    }
    return true;
  }

  return false;
}

export function applyProximityLocationFilters<TFilter extends ProximityFilterShape>({
  filters,
  location,
  radiusKm,
}: {
  filters: TFilter;
  location: LocationData;
  radiusKm: number;
}) {
  if (!location) return;

  const isRegionLevel = location.level === "state" || location.level === "country";
  if (location.locationId) {
    filters.locationId = location.locationId;
  }

  const latitude = getLatitude(location);
  const longitude = getLongitude(location);
  if (!isRegionLevel && latitude != null && longitude != null && !filters.locationId) {
    filters.lat = latitude;
    filters.lng = longitude;
    filters.radiusKm = radiusKm;
  }
}

export function applyServiceLocationFilters<TFilter extends ServiceLocationFilterShape>({
  filters,
  location,
  radiusKm,
}: {
  filters: TFilter;
  location: LocationData;
  radiusKm: number;
}) {
  if (!location) return;

  const isRegionLevel = location.level === "state" || location.level === "country";
  const regionLocationLabel = getSearchLocationLabel(location);

  if (location.locationId) {
    filters.locationId = location.locationId;
    if (location.level === "state" || location.level === "country" || location.level === "city") {
      filters.level = location.level;
    }
    if (regionLocationLabel) {
      filters.location = regionLocationLabel;
    }
  }

  const latitude = getLatitude(location);
  const longitude = getLongitude(location);
  if (!isRegionLevel && latitude != null && longitude != null && !filters.locationId) {
    filters.lat = latitude;
    filters.lng = longitude;
    filters.radiusKm = radiusKm;
  } else if (regionLocationLabel) {
    filters.location = regionLocationLabel;
  }
}
