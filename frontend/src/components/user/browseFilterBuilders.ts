import type { LocationData } from "@/context/LocationContext";
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
  const regionLocationLabel =
    location.level === "state"
      ? location.state || location.city || undefined
      : location.level === "country"
        ? location.country || location.state || location.city || undefined
        : undefined;

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
