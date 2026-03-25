"use client";

import dynamic from "next/dynamic";

import {
  BrowseListingsView,
  type BrowseBuildFiltersArgs,
} from "@/components/user/BrowseListingsView";
import { BrowseServicesCard } from "@/components/user/BrowseServicesCard";
import {
  applyServiceLocationFilters,
  buildBaseBrowseFilters,
} from "@/components/user/browseFilterBuilders";
import { getServicesPage, type Service, type ServiceFilters, type ServicePageResult } from "@/lib/api/user/services";
import type { Category } from "@/lib/api/user/categories";

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
}: BrowseBuildFiltersArgs): ServiceFilters => {
  const filters = buildBaseBrowseFilters<ServiceFilters>({
    page,
    pageSize,
    query,
    selectedCategory,
  });
  applyServiceLocationFilters({
    filters,
    location,
    radiusKm: DEFAULT_SERVICE_RADIUS_KM,
  });
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
      routePath="/browse-services"
      initialCategory={initialCategory}
      initialSearchQuery={initialSearchQuery}
      initialResults={initialResults}
      initialCategories={initialCategories}
      logScope="BrowseServices"
      loadErrorMessage="Failed to load services. Please try again."
      buildFilters={buildServiceFilters}
      fetchPage={getServicesPage}
      inputId="browse-services-search"
      searchAriaLabel="Search services"
      searchPlaceholder="Search repair services..."
      getCategoryValue={(category) => category.slug ?? category.id}
      respectMobileChromePolicy
      emptyTitle="No services found"
      getEmptyDescription={(searchQuery) =>
        searchQuery ? `No services matching "${searchQuery}".` : "No services available in this area yet."
      }
      renderCard={(service) => <BrowseServicesCard service={service} />}
      getItemKey={(service) => service.id}
      VirtualizedListComponent={BrowseServicesVirtualizedList}
      virtualizationThreshold={24}
    />
  );
}
