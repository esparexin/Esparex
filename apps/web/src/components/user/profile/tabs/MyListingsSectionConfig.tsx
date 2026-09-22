import React from "react";
import { Package, Wrench, CircuitBoard } from "@esparex/ui";
import type { Listing, ListingStatsResponse } from "@/lib/api/user/listings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { ACCOUNT_LISTING_STATUS_TABS } from "@/lib/accountListingRoutes";
import {
  type ListingSubTab,
  type ListingActionHandlers,
  renderAdItem,
  renderServiceItem,
  renderSpareItem,
} from "./MyListingsConfig";

export interface MyListingsSectionConfig {
  title: string;
  icon: React.ReactNode;
  statusTabs: readonly ListingStatus[];
  selectedStatus: ListingStatus;
  onStatusChange: (status: ListingStatus) => void;
  getStatusCount: (status: ListingStatus) => number;
  items: Listing[];
  loading: boolean;
  error: unknown;
  onRetry?: () => void | Promise<unknown>;
  onPost?: () => void;
  postLabel: string;
  emptyTitle: string;
  emptyDesc: string;
  render: (item: Listing) => React.ReactNode;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export interface BuildMyListingsSectionConfigParams {
  subTab: ListingSubTab;
  adsStatus: ListingStatus;
  servicesStatus: ListingStatus;
  spareStatus: ListingStatus;
  handleStatusChange: (status: ListingStatus) => void;
  adCounts: ListingStatsResponse;
  myAds: Listing[];
  loadingAds: boolean;
  adsError: unknown;
  fetchMyAds: () => void | Promise<unknown>;
  myServices: Listing[];
  loadingServices: boolean;
  servicesError: unknown;
  fetchMyServices: () => void | Promise<unknown>;
  mySpare: Listing[];
  loadingSpare: boolean;
  spareError: unknown;
  fetchMySpare: () => void | Promise<unknown>;
  navigateTo: (page: string) => void;
  actionHandlers: ListingActionHandlers;
  adsPagination?: { page: number; limit: number; total: number };
  servicesPagination?: { page: number; limit: number; total: number };
  sparePagination?: { page: number; limit: number; total: number };
  currentPage: number;
  handlePageChange: (newPage: number) => void;
  listingsPerPage: number;
}

export function buildMyListingsSectionConfig({
  subTab,
  adsStatus,
  servicesStatus,
  spareStatus,
  handleStatusChange,
  adCounts,
  myAds,
  loadingAds,
  adsError,
  fetchMyAds,
  myServices,
  loadingServices,
  servicesError,
  fetchMyServices,
  mySpare,
  loadingSpare,
  spareError,
  fetchMySpare,
  navigateTo,
  actionHandlers,
  adsPagination,
  servicesPagination,
  sparePagination,
  currentPage,
  handlePageChange,
  listingsPerPage,
}: BuildMyListingsSectionConfigParams): MyListingsSectionConfig {
  const configMap: Record<ListingSubTab, MyListingsSectionConfig> = {
    ads: {
      title: "My Listings",
      icon: <Package className="h-5 w-5 text-link" />,
      statusTabs: ACCOUNT_LISTING_STATUS_TABS.ads,
      selectedStatus: adsStatus,
      onStatusChange: handleStatusChange,
      getStatusCount: (s: string) => {
        const typeStats = (adCounts?.ad as Record<string, number | undefined>) || {};
        return typeStats[s] ?? 0;
      },
      items: myAds,
      loading: loadingAds,
      error: adsError,
      onRetry: fetchMyAds,
      onPost: () => navigateTo("post-ad"),
      postLabel: "Post Ad",
      emptyTitle: `No ${adsStatus} ads`,
      emptyDesc: "Post your first ad to reach thousands of buyers.",
      render: (listing: Listing) => renderAdItem(listing, adsStatus, actionHandlers),
      pagination: {
        page: adsPagination?.page ?? currentPage,
        limit: adsPagination?.limit ?? listingsPerPage,
        total: (typeof adsPagination?.total === "number" && adsPagination.total > 0)
          ? adsPagination.total
          : (adsPagination?.total === 0 && myAds.length === 0
            ? 0
            : ((adCounts?.ad as Record<string, number | undefined>)?.[adsStatus] ?? myAds.length)),
        onPageChange: handlePageChange,
      },
    },
    services: {
      title: "My Professional Services",
      icon: <Wrench className="h-5 w-5 text-primary" />,
      statusTabs: ACCOUNT_LISTING_STATUS_TABS.services,
      selectedStatus: servicesStatus,
      onStatusChange: handleStatusChange,
      getStatusCount: (s: string) => {
        const typeStats = (adCounts?.service as Record<string, number | undefined>) || {};
        return typeStats[s] ?? 0;
      },
      items: myServices,
      loading: loadingServices,
      error: servicesError,
      onRetry: fetchMyServices,
      onPost: () => navigateTo("post-service"),
      postLabel: "Post Service",
      emptyTitle: `No ${servicesStatus} services`,
      emptyDesc: "List your repair or maintenance services to attract customers.",
      render: (service: Listing) => renderServiceItem(service, servicesStatus, actionHandlers),
      pagination: {
        page: servicesPagination?.page ?? currentPage,
        limit: servicesPagination?.limit ?? listingsPerPage,
        total: (typeof servicesPagination?.total === "number" && servicesPagination.total > 0)
          ? servicesPagination.total
          : (servicesPagination?.total === 0 && myServices.length === 0
            ? 0
            : ((adCounts?.service as Record<string, number | undefined>)?.[servicesStatus] ?? myServices.length)),
        onPageChange: handlePageChange,
      },
    },
    "spare-parts": {
      title: "My Spare Part Inventory",
      icon: <CircuitBoard className="h-5 w-5 text-primary" />,
      statusTabs: ACCOUNT_LISTING_STATUS_TABS["spare-parts"],
      selectedStatus: spareStatus,
      onStatusChange: handleStatusChange,
      getStatusCount: (s: string) => {
        const typeStats = (adCounts?.spare_part as Record<string, number | undefined>) || {};
        return typeStats[s] ?? 0;
      },
      items: mySpare,
      loading: loadingSpare,
      error: spareError,
      onRetry: fetchMySpare,
      onPost: () => navigateTo("post-spare-part-listing"),
      postLabel: "Post Spare Part",
      emptyTitle: `No ${spareStatus} listings`,
      emptyDesc: "List spare parts to sell to repair shops and customers.",
      render: (listing: Listing) => renderSpareItem(listing, spareStatus, actionHandlers),
      pagination: {
        page: sparePagination?.page ?? currentPage,
        limit: sparePagination?.limit ?? listingsPerPage,
        total: (typeof sparePagination?.total === "number" && sparePagination.total > 0)
          ? sparePagination.total
          : (sparePagination?.total === 0 && mySpare.length === 0
            ? 0
            : ((adCounts?.spare_part as Record<string, number | undefined>)?.[spareStatus] ?? mySpare.length)),
        onPageChange: handlePageChange,
      },
    },
  };

  return configMap[subTab] || configMap.ads;
}
