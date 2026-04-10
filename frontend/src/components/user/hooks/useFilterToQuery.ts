import { useMemo } from "react";
import type { ListingFilters } from "@/lib/api/user/listings";
import { getSearchLocationLabel } from "@/lib/location/locationLabels";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import { PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";
import type { Category } from "@/lib/api/user/categories";
import type { AppLocation } from "@/types/location";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { DEFAULT_PRICE_RANGE } from "./useFilterState";

const PAGE_SIZE = 20;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function useFilterToQuery(
  query: string,
  selectedCategory: string | null,
  categories: Category[],
  selectedBrands: string[],
  urlModelId: string,
  priceRange: [number, number],
  urlLocationId: string,
  urlLocationLabel: string,
  location: AppLocation,
  shouldUseContextGeoRadius: boolean,
  radiusKm: number,
  sort: SortOption,
  page: number
) {
  return useMemo(() => {
    const nextFilters: ListingFilters = {
      status: "live",
      page,
      limit: PAGE_SIZE,
      sortBy: PUBLIC_BROWSE_SORT_MAP[sort],
    };

    if (query.trim()) nextFilters.search = query.trim();
    if (selectedCategory) {
      const normalizedCategory = selectedCategory.trim();
      const categoryById = categories.find((category) => category.id === normalizedCategory);
      const categoryBySlug = categories.find((category) => category.slug === normalizedCategory);
      const resolvedCategoryId = categoryById?.id || categoryBySlug?.id;

      if (resolvedCategoryId && OBJECT_ID_PATTERN.test(resolvedCategoryId)) {
        nextFilters.categoryId = resolvedCategoryId;
      } else if (OBJECT_ID_PATTERN.test(normalizedCategory)) {
        nextFilters.categoryId = normalizedCategory;
      } else {
        nextFilters.category = normalizedCategory;
      }
    }
    if (selectedBrands.length > 0) nextFilters.brandId = selectedBrands.join(",");
    if (urlModelId) nextFilters.modelId = urlModelId;
    if (priceRange[0] > 0) nextFilters.minPrice = priceRange[0];
    if (priceRange[1] < DEFAULT_PRICE_RANGE[1]) nextFilters.maxPrice = priceRange[1];

    if (urlLocationId) {
      nextFilters.locationId = urlLocationId;
    } else if (urlLocationLabel) {
      nextFilters.location = urlLocationLabel;
    } else if (location) {
      const regionLocationLabel = getSearchLocationLabel(location);

      if (location.locationId) {
        nextFilters.locationId = location.locationId;
      }
      if (location.level) {
        nextFilters.level = location.level;
      }
      const lat = getLatitude(location);
      const lng = getLongitude(location);
      if (shouldUseContextGeoRadius && lat != null && lng != null) {
        nextFilters.lat = lat;
        nextFilters.lng = lng;
        nextFilters.radiusKm = radiusKm;
      } else if (regionLocationLabel) {
        nextFilters.location = regionLocationLabel;
      }
    }

    return nextFilters;
  }, [categories, location, page, priceRange, query, radiusKm, selectedBrands, selectedCategory, shouldUseContextGeoRadius, sort, urlLocationId, urlLocationLabel, urlModelId]);
}
