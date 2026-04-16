"use client";

import {
  BrowseListingsView,
  type BrowseBuildFiltersArgs,
} from "@/components/user/BrowseListingsView";
import { BrowseSparePartsCard } from "@/components/user/BrowseSparePartsCard";
import {
  applyRequestedLocationFilters,
  applyProximityLocationFilters,
  buildBaseBrowseFilters,
} from "@/components/user/browseFilterBuilders";
import type { Category } from "@/lib/api/user/categories";
import { getAdsPage, type Listing as SparePartListing, type ListingFilters as SparePartListingFilters, type ListingPageResult as SparePartListingPageResult } from "@/lib/api/user/listings";
import { API_ROUTES } from "@/lib/api/routes";
import { PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";

const DEFAULT_RADIUS_KM = 50;

interface BrowseSparePartsProps {
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: SparePartListingPageResult;
  initialCategories?: Category[];
}

const buildSparePartFilters = ({
  page,
  pageSize,
  query,
  selectedCategory,
  location,
  sort,
  urlLocationId,
  urlLocationLabel,
  radiusKm,
}: BrowseBuildFiltersArgs): SparePartListingFilters => {
  const filters = buildBaseBrowseFilters<SparePartListingFilters>({
    page,
    pageSize,
    query,
    selectedCategory,
  });
  filters.sortBy = PUBLIC_BROWSE_SORT_MAP[sort];
  if (
    !applyRequestedLocationFilters({
      filters,
      urlLocationId,
      urlLocationLabel,
      radiusKm,
    })
  ) {
    applyProximityLocationFilters({
      filters,
      location,
      radiusKm: DEFAULT_RADIUS_KM,
    });
  }
  return filters;
};

export function BrowseSpareParts({
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
}: BrowseSparePartsProps) {
  return (
    <BrowseListingsView<SparePartListing, SparePartListingFilters>
      browseType="spare_part"
      initialCategory={initialCategory}
      initialSearchQuery={initialSearchQuery}
      initialResults={initialResults}
      initialCategories={initialCategories}
      logScope="BrowseSpareParts"
      loadErrorMessage="Failed to load spare parts. Please try again."
      buildFilters={buildSparePartFilters}
      fetchPage={(filters) => getAdsPage(filters, { endpoint: API_ROUTES.USER.SPARE_PART_LISTINGS })}
      searchAriaLabel="Search spare parts"
      searchPlaceholder="Search spare parts..."
      inputClassName="pl-9 h-11 rounded-xl"
      selectTriggerClassName="flex-1 sm:flex-none sm:w-[160px] h-11 rounded-xl"
      emptyTitle="No spare parts found"
      getEmptyDescription={(searchQuery) =>
        searchQuery ? `No spare parts matching "${searchQuery}".` : "No spare parts available in this area yet."
      }
      renderCard={(listing, view, index) => (
        <BrowseSparePartsCard listing={listing} view={view} priority={index < 4} />
      )}
      getItemKey={(listing) => listing.id}
    />
  );
}
