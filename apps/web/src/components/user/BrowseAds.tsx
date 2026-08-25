"use client";

import { useCallback } from "react";
import {
  BrowseListingsView,
  type BrowseBuildFiltersArgs,
} from "@/components/user/BrowseListingsView";
import {
  applyRequestedLocationFilters,
  applyProximityLocationFilters,
  buildBaseBrowseFilters,
} from "@/components/user/browseFilterBuilders";
import { AdCardGrid, AdCardList } from "@/components/user/ad-card";
import type { Category } from "@/lib/api/user/categories";
import {
  getAdsPage,
  type Listing,
  type ListingFilters,
  type ListingPageResult,
} from "@/lib/api/user/listings";
import { API_ROUTES } from "@/lib/api/routes";
import { PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

const DEFAULT_RADIUS_KM = 50;

interface BrowseAdsProps {
  browseType?: "ad" | "service" | "spare_part";
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: ListingPageResult;
  initialCategories?: Category[];
}

const buildAdFilters = ({
  page,
  pageSize,
  query,
  selectedCategory,
  categories,
  location,
  sort,
  urlLocationId,
  urlLocationLabel,
  radiusKm,
}: BrowseBuildFiltersArgs): ListingFilters => {
  const filters = buildBaseBrowseFilters<ListingFilters>({
    page,
    pageSize,
    query,
    selectedCategory,
    categories,
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
      radiusKm: radiusKm ?? DEFAULT_RADIUS_KM,
    });
  }

  return filters;
};

export function BrowseAds({
  browseType = "ad",
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
}: BrowseAdsProps) {
  const handleFetchPage = useCallback(
    (filters: ListingFilters) =>
      getAdsPage(
        { ...filters, type: browseType },
        { endpoint: API_ROUTES.USER.LISTINGS }
      ),
    [browseType]
  );

  const typeConfig = {
    ad: {
      plural: "ads",
      placeholder: "Search for mobiles, parts, services...",
      ariaLabel: "Search marketplace ads",
      emptyTitle: "No ads found",
      logScope: "BrowseAds",
    },
    service: {
      plural: "services",
      placeholder: "Search repair services...",
      ariaLabel: "Search services",
      emptyTitle: "No services found",
      logScope: "BrowseServices",
    },
    spare_part: {
      plural: "spare parts",
      placeholder: "Search spare parts...",
      ariaLabel: "Search spare parts",
      emptyTitle: "No spare parts found",
      logScope: "BrowseSpareParts",
    },
  }[browseType];

  const handleGetEmptyDescription = useCallback(
    (searchQuery: string) =>
      searchQuery
        ? `No ${typeConfig.plural} matching "${searchQuery}".`
        : `No ${typeConfig.plural} available in this area yet.`,
    [typeConfig.plural]
  );

  const handleRenderCard = useCallback(
    (listing: Listing, view: "grid" | "list", index: number) => {
      const href = buildPublicListingDetailRoute({
        id: listing.id,
        listingType: listing.listingType,
        seoSlug: listing.seoSlug,
        title: listing.title,
      });
      return view === "list" ? (
        <AdCardList key={listing.id} ad={listing} href={href} priority={index < 4} />
      ) : (
        <AdCardGrid key={listing.id} ad={listing} href={href} priority={index < 4} />
      );
    },
    []
  );

  const handleGetItemKey = useCallback((listing: Listing) => listing.id, []);

  return (
    <BrowseListingsView<Listing, ListingFilters>
      browseType={browseType}
      initialCategory={initialCategory}
      initialSearchQuery={initialSearchQuery}
      initialResults={initialResults}
      initialCategories={initialCategories}
      logScope={typeConfig.logScope}
      loadErrorMessage={`Failed to load ${typeConfig.plural}. Please try again.`}
      buildFilters={buildAdFilters}
      fetchPage={handleFetchPage}
      searchAriaLabel={typeConfig.ariaLabel}
      searchPlaceholder={typeConfig.placeholder}
      inputClassName="pl-9 h-11 rounded-xl"
      selectTriggerClassName="flex-1 sm:flex-none sm:w-[160px] h-11 rounded-xl"
      emptyTitle={typeConfig.emptyTitle}
      getEmptyDescription={handleGetEmptyDescription}
      renderCard={handleRenderCard}
      getItemKey={handleGetItemKey}
    />
  );
}
