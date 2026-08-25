"use client";

import { useMemo } from "react";
import type { LocationData } from "@/context/LocationContext";
import { getDisplayLocationLabel } from "@/lib/location/locationLabels";
import { isUserSelectedLocation } from "@/lib/location/queryMode";
import { resolveBrowseCategorySelection } from "@/lib/browse/browseFilterNormalization";
import { PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";
import type { Category } from "@/lib/api/user/categories";
import type { SortOption } from "@/components/search/SearchResultsHeader";

export interface FilterPipelineInput {
  query: string;
  selectedCategory: string;
  categories: Category[];
  location: LocationData;
  sort: SortOption;
  urlLocationId?: string;
  urlLocationLabel?: string;
  urlRadiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  deviceCondition?: string;
  brandId?: string;
}

export function computeActiveFilterBadges({
  query = "",
  resolvedCategoryLabel = null,
  activeLocationLabel = null,
  urlRadiusKm,
  minPrice,
  maxPrice,
  deviceCondition,
  brandId,
}: {
  query?: string;
  resolvedCategoryLabel?: string | null;
  activeLocationLabel?: string | null;
  urlRadiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  deviceCondition?: string;
  brandId?: string;
}): string[] {
  const badges: string[] = [];
  const trimmedQuery = query.trim();

  if (trimmedQuery) badges.push(`Search: "${trimmedQuery}"`);
  if (resolvedCategoryLabel) badges.push(`Category: ${resolvedCategoryLabel}`);
  if (activeLocationLabel) badges.push(`Location: ${activeLocationLabel}`);
  if (typeof urlRadiusKm === "number" && Number.isFinite(urlRadiusKm)) {
    badges.push(`Within ${urlRadiusKm} km`);
  }
  if (typeof minPrice === "number" && typeof maxPrice === "number") {
    badges.push(`Price: ₹${minPrice} - ₹${maxPrice}`);
  } else if (typeof minPrice === "number") {
    badges.push(`Min Price: ₹${minPrice}`);
  } else if (typeof maxPrice === "number") {
    badges.push(`Max Price: ₹${maxPrice}`);
  }
  if (deviceCondition === "power_on") {
    badges.push("Working (Powers On)");
  } else if (deviceCondition === "power_off") {
    badges.push("For Parts (Powers Off)");
  }
  if (brandId) {
    badges.push(`Brand: ${brandId}`);
  }

  return badges;
}

export function useBrowseFilterPipeline({
  query,
  selectedCategory,
  categories,
  location,
  sort,
  urlLocationId,
  urlLocationLabel,
  urlRadiusKm,
  minPrice,
  maxPrice,
  deviceCondition,
  brandId,
}: FilterPipelineInput) {
  const resolvedCategoryLabel = useMemo(() => {
    return resolveBrowseCategorySelection(selectedCategory, categories).label ?? null;
  }, [categories, selectedCategory]);

  const activeLocationLabel = useMemo(() => {
    if (urlLocationId && urlLocationLabel) return urlLocationLabel;
    if (!isUserSelectedLocation(location)) return null;
    return getDisplayLocationLabel(location) || null;
  }, [location, urlLocationId, urlLocationLabel]);

  const activeFilterBadges = useMemo(() => {
    return computeActiveFilterBadges({
      query,
      resolvedCategoryLabel,
      activeLocationLabel,
      urlRadiusKm,
      minPrice,
      maxPrice,
      deviceCondition,
      brandId,
    });
  }, [activeLocationLabel, brandId, deviceCondition, maxPrice, minPrice, query, resolvedCategoryLabel, urlRadiusKm]);

  const mappedSortValue = useMemo(() => {
    return PUBLIC_BROWSE_SORT_MAP[sort];
  }, [sort]);

  return {
    resolvedCategoryLabel,
    activeLocationLabel,
    activeFilterBadges,
    activeFilterCount: activeFilterBadges.length,
    mappedSortValue,
  };
}
