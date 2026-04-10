import { useMemo } from "react";
import type { Category } from "@/lib/api/user/categories";
import { getDisplayLocationLabel } from "@/lib/location/locationLabels";
import { PUBLIC_BROWSE_SORT_LABELS } from "@/lib/publicBrowseSort";
import type { AppLocation } from "@/types/location";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import type { Listing } from "@/lib/api/user/listings";
import { DEFAULT_PRICE_RANGE } from "./useFilterState";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const EMPTY_FILTER_SHELL_CLASS_NAME =
  "w-64 shrink-0 h-fit sticky top-[6.25rem] rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-none backdrop-blur-sm";

const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

export const buildPriceSummary = (priceRange: [number, number]) => {
  const [minPrice, maxPrice] = priceRange;
  if (minPrice <= DEFAULT_PRICE_RANGE[0] && maxPrice >= DEFAULT_PRICE_RANGE[1]) {
    return null;
  }
  if (minPrice > DEFAULT_PRICE_RANGE[0] && maxPrice < DEFAULT_PRICE_RANGE[1]) {
    return `${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}`;
  }
  if (minPrice > DEFAULT_PRICE_RANGE[0]) {
    return `From ${formatCurrency(minPrice)}`;
  }
  return `Up to ${formatCurrency(maxPrice)}`;
};

export function useBrowseEmptyState(
  selectedCategory: string | null,
  categories: Category[],
  urlLocationLabel: string,
  location: AppLocation,
  query: string,
  priceRange: [number, number],
  urlLocationId: string,
  globalLocationLabel: string | null | undefined,
  selectedBrands: string[],
  showRadiusFilter: boolean,
  radiusKm: number,
  sort: SortOption,
  isLoading: boolean,
  error: unknown,
  displayAds: Listing[]
) {
  const resolvedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return null;

    const normalizedCategory = selectedCategory.trim();
    const matchedCategory = categories.find(
      (category) => category.id === normalizedCategory || category.slug === normalizedCategory
    );

    if (matchedCategory?.name) return matchedCategory.name;
    if (matchedCategory?.slug) return matchedCategory.slug;
    return OBJECT_ID_PATTERN.test(normalizedCategory) ? null : normalizedCategory;
  }, [categories, selectedCategory]);

  const activeLocationLabel = useMemo(() => {
    if (urlLocationLabel) return urlLocationLabel;
    if (location.source === "default") return null;
    return getDisplayLocationLabel(location) || null;
  }, [location, urlLocationLabel]);

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    const trimmedQuery = query.trim();
    const priceSummary = buildPriceSummary(priceRange);
    const hasActiveLocation = Boolean(urlLocationId || urlLocationLabel || location.locationId || globalLocationLabel);

    if (trimmedQuery) badges.push(`Search: "${trimmedQuery}"`);
    if (resolvedCategoryLabel) badges.push(`Category: ${resolvedCategoryLabel}`);

    if (selectedBrands.length === 1) {
      badges.push(`Brand: ${selectedBrands[0]}`);
    } else if (selectedBrands.length > 1) {
      badges.push(`${selectedBrands.length} brands`);
    }

    if (priceSummary) badges.push(priceSummary);
    if (activeLocationLabel) badges.push(`Location: ${activeLocationLabel}`);
    if (showRadiusFilter && hasActiveLocation && radiusKm !== 50) badges.push(`Within ${radiusKm} km`);
    if (sort !== "newest") badges.push(`Sort: ${PUBLIC_BROWSE_SORT_LABELS[sort]}`);

    return badges;
  }, [activeLocationLabel, globalLocationLabel, location.locationId, priceRange, query, radiusKm, resolvedCategoryLabel, selectedBrands, showRadiusFilter, sort, urlLocationId, urlLocationLabel]);

  const activeFilterCount = activeFilterBadges.length;
  const isEmptyState = !isLoading && !error && displayAds.length === 0;
  const emptyStateTitle = activeFilterCount > 0 ? "No listings match these filters" : "No listings available right now";
  const emptyStateDescription = activeFilterCount > 0
    ? showRadiusFilter
      ? "Try widening the price, radius, or category filters below. You can also clear everything and start again."
      : "Try widening the price or category filters below. You can also clear everything and start again."
    : "There are no live ads in this view yet. Check back soon or widen your location once sellers publish new listings.";
  const desktopShellClassName = isEmptyState ? EMPTY_FILTER_SHELL_CLASS_NAME : undefined;

  return { activeFilterCount, activeFilterBadges, isEmptyState, emptyStateTitle, emptyStateDescription, desktopShellClassName };
}
