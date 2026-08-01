"use client";

import { useMemo } from "react";
import type { LocationData } from "@/context/LocationContext";
import { getDisplayLocationLabel } from "@/lib/location/locationLabels";
import { isUserSelectedLocation } from "@/lib/location/queryMode";
import { resolveBrowseCategorySelection } from "@/lib/browse/browseFilterNormalization";
import { PUBLIC_BROWSE_SORT_LABELS, PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";
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
    const badges: string[] = [];
    const trimmedQuery = query.trim();

    if (trimmedQuery) badges.push(`Search: "${trimmedQuery}"`);
    if (resolvedCategoryLabel) badges.push(`Category: ${resolvedCategoryLabel}`);
    if (activeLocationLabel) badges.push(`Location: ${activeLocationLabel}`);
    if (typeof urlRadiusKm === "number" && Number.isFinite(urlRadiusKm)) {
      badges.push(`Within ${urlRadiusKm} km`);
    }
    if (sort !== "newest") badges.push(`Sort: ${PUBLIC_BROWSE_SORT_LABELS[sort]}`);

    return badges;
  }, [activeLocationLabel, query, resolvedCategoryLabel, sort, urlRadiusKm]);

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
