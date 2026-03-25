"use client";

import {
  BrowseListingsView,
  type BrowseBuildFiltersArgs,
} from "@/components/user/BrowseListingsView";
import { BrowseSparePartsCard } from "@/components/user/BrowseSparePartsCard";
import {
  applyProximityLocationFilters,
  buildBaseBrowseFilters,
} from "@/components/user/browseFilterBuilders";
import type { Category } from "@/lib/api/user/categories";
import {
  getSparePartListingsPage,
  type SparePartListing,
  type SparePartListingFilters,
  type SparePartListingPageResult,
} from "@/lib/api/user/sparePartListings";

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
}: BrowseBuildFiltersArgs): SparePartListingFilters => {
  const filters = buildBaseBrowseFilters<SparePartListingFilters>({
    page,
    pageSize,
    query,
    selectedCategory,
  });
  applyProximityLocationFilters({
    filters,
    location,
    radiusKm: DEFAULT_RADIUS_KM,
  });
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
      routePath="/browse-spare-parts"
      initialCategory={initialCategory}
      initialSearchQuery={initialSearchQuery}
      initialResults={initialResults}
      initialCategories={initialCategories}
      logScope="BrowseSpareParts"
      loadErrorMessage="Failed to load spare parts. Please try again."
      buildFilters={buildSparePartFilters}
      fetchPage={getSparePartListingsPage}
      searchAriaLabel="Search spare parts"
      searchPlaceholder="Search spare parts..."
      inputClassName="pl-9 h-10 rounded-xl"
      selectTriggerClassName="w-[160px] h-10 rounded-xl"
      emptyTitle="No spare parts found"
      getEmptyDescription={(searchQuery) =>
        searchQuery ? `No spare parts matching "${searchQuery}".` : "No spare parts available in this area yet."
      }
      renderCard={(listing) => <BrowseSparePartsCard listing={listing} />}
      getItemKey={(listing) => listing.id}
    />
  );
}
