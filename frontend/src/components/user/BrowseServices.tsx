"use client";

import dynamic from "next/dynamic";

import {
  BrowseListingsView,
  type BrowseBuildFiltersArgs,
} from "@/components/user/BrowseListingsView";
import { BrowseServicesCard } from "@/components/user/BrowseServicesCard";
import {
  applyRequestedLocationFilters,
  applyServiceLocationFilters,
  buildBaseBrowseFilters,
} from "@/components/user/browseFilterBuilders";
import { getAdsPage, type Listing as Service, type ListingFilters as ServiceFilters, type ListingPageResult as ServicePageResult } from "@/lib/api/user/listings";
import { API_ROUTES } from "@/lib/api/routes";
import type { Category } from "@/lib/api/user/categories";
import { PUBLIC_BROWSE_SORT_MAP } from "@/lib/publicBrowseSort";

const BrowseServicesVirtualizedList = dynamic(() => import("./BrowseServicesVirtualizedList"));

const DEFAULT_SERVICE_RADIUS_KM = 50;

interface BrowseServicesProps {
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: ServicePageResult;
  initialCategories?: Category[];
}

const buildServiceFilters = ({
  page,
  pageSize,
  query,
  selectedCategory,
  location,
  sort,
  urlLocationId,
  urlLocationLabel,
  radiusKm,
}: BrowseBuildFiltersArgs): ServiceFilters => {
  const filters = buildBaseBrowseFilters<ServiceFilters>({
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
    applyServiceLocationFilters({
      filters,
      location,
      radiusKm: DEFAULT_SERVICE_RADIUS_KM,
    });
  }
  return filters;
};

export function BrowseServices({
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
}: BrowseServicesProps) {
  return (
    <BrowseListingsView<Service, ServiceFilters>
      browseType="service"
      initialCategory={initialCategory}
      initialSearchQuery={initialSearchQuery}
      initialResults={initialResults}
      initialCategories={initialCategories}
      logScope="BrowseServices"
      loadErrorMessage="Failed to load services. Please try again."
      buildFilters={buildServiceFilters}
      fetchPage={(filters) => getAdsPage(filters, { endpoint: API_ROUTES.USER.SERVICES })}
      inputId="browse-services-search"
      searchAriaLabel="Search services"
      searchPlaceholder="Search repair services..."
      getCategoryValue={(category) => category.slug ?? category.id}
      respectMobileChromePolicy
      emptyTitle="No services found"
      getEmptyDescription={(searchQuery) =>
        searchQuery ? `No services matching "${searchQuery}".` : "No services available in this area yet."
      }
      renderCard={(service, view) => <BrowseServicesCard service={service} view={view} />}
      getItemKey={(service) => service.id}
      VirtualizedListComponent={BrowseServicesVirtualizedList}
      virtualizationThreshold={24}
    />
  );
}
