import { useMemo } from "react";
import type { ListingFilters } from "@/lib/api/user/listings";
import type { BrowseBrandOption } from "@/lib/browse/browseFilterNormalization";
import {
  resolveBrowseBrandSelection,
  resolveBrowseCategorySelection,
} from "@/lib/browse/browseFilterNormalization";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import { PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";
import type { Category } from "@/lib/api/user/categories";
import type { AppLocation } from "@/types/location";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { DEFAULT_PRICE_RANGE } from "./useFilterState";

const PAGE_SIZE = 20;

export function useFilterToQuery(
  query: string,
  selectedCategory: string | null,
  categories: Category[],
  selectedBrands: string[],
  availableBrandOptions: BrowseBrandOption[],
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
      const { categoryId } = resolveBrowseCategorySelection(selectedCategory, categories);
      if (categoryId) nextFilters.categoryId = categoryId;
    }
    const resolvedBrandIds = resolveBrowseBrandSelection(selectedBrands, availableBrandOptions);
    if (resolvedBrandIds.length > 0) nextFilters.brandId = resolvedBrandIds.join(",");
    if (urlModelId) nextFilters.modelId = urlModelId;
    if (priceRange[0] > 0) nextFilters.minPrice = priceRange[0];
    if (priceRange[1] < DEFAULT_PRICE_RANGE[1]) nextFilters.maxPrice = priceRange[1];

    if (urlLocationId) {
      nextFilters.locationId = urlLocationId;
    } else if (location) {
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
      }
    }

    return nextFilters;
  }, [availableBrandOptions, categories, location, page, priceRange, query, radiusKm, selectedBrands, selectedCategory, shouldUseContextGeoRadius, sort, urlLocationId, urlLocationLabel, urlModelId]);
}
