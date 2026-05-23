import type { LocationData } from "@/context/LocationContext";
import { resolveBrowseCategorySelection } from "@/lib/browse/browseFilterNormalization";
import { getLatitude, getLongitude } from "@esparex/shared";
import type { Category } from "@/lib/api/user/categories";

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
}

type RequestedLocationFilterShape = ProximityFilterShape;

interface BuildBaseBrowseFilterArgs {
  page: number;
  pageSize: number;
  query: string;
  selectedCategory: string;
  categories?: Category[];
}

export function buildBaseBrowseFilters<TFilter extends BaseBrowseFilterShape>({
  page,
  pageSize,
  query,
  selectedCategory,
  categories = [],
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
    const { categoryId } = resolveBrowseCategorySelection(selectedCategory, categories);
    if (categoryId) {
      filters.categoryId = categoryId;
    }
  }

  return filters;
}

export function applyRequestedLocationFilters<TFilter extends RequestedLocationFilterShape>({
  filters,
  urlLocationId,
  urlLocationLabel: _urlLocationLabel,
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
  if (!isRegionLevel && latitude != undefined && longitude != undefined && !filters.locationId) {
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

  if (location.locationId) {
    filters.locationId = location.locationId;
    if (location.level === "state" || location.level === "country" || location.level === "city") {
      filters.level = location.level;
    }
  }

  const latitude = getLatitude(location);
  const longitude = getLongitude(location);
  if (!isRegionLevel && latitude != undefined && longitude != undefined && !filters.locationId) {
    filters.lat = latitude;
    filters.lng = longitude;
    filters.radiusKm = radiusKm;
  }
}
