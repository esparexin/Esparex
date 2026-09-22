import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ListingStatsResponse } from "@/lib/api/user/listings";
import type { User } from "@esparex/contracts";
import { useProfileListings } from "./useProfileListings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { UserListingsTemplate } from "@/components/user/shared/UserListingsTemplate";
import {
  buildAccountListingRoute,
  normalizeAccountListingStatus,
  type AccountListingSection,
} from "@/lib/accountListingRoutes";
import type { BusinessStatusValue } from "@esparex/contracts";
import { canPublishBusiness } from "@/guards/businessGuards";
import { SUB_TABS, type ListingSubTab } from "./MyListingsConfig";
import { MyListingsDialogs } from "./MyListingsDialogs";
import { useMyListingsModals } from "./useMyListingsModals";
import { buildMyListingsSectionConfig } from "./MyListingsSectionConfig";

interface MyListingsTabProps {
  adCounts: ListingStatsResponse;
  user: User | null;
  navigateTo: (page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string) => void;
  getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
  formatDate: (date: string | Date) => string;
  businessStatus: BusinessStatusValue | "none";
  onRegisterBusiness?: () => void;
  initialSubTab?: ListingSubTab;
}

const LISTINGS_PER_PAGE = 4;

export function MyListingsTab({
  adCounts,
  user,
  navigateTo,
  getStatusBadge,
  businessStatus,
  onRegisterBusiness: _onRegisterBusiness,
  initialSubTab = "ads",
}: MyListingsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab visibility: Services and Spare Parts are only accessible to approved (live/active) businesses.
  const isVerifiedBusiness = canPublishBusiness(businessStatus as BusinessStatusValue | undefined);
  const visibleSubTabs = isVerifiedBusiness ? SUB_TABS : SUB_TABS.filter(t => t.value === "ads");
  const showPendingBanner = businessStatus === "pending";

  const subTab: ListingSubTab = visibleSubTabs.some(t => t.value === initialSubTab)
    ? initialSubTab
    : "ads";

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const selectedStatus = normalizeAccountListingStatus(
    subTab as AccountListingSection,
    searchParams.get("status")
  ) as ListingStatus;
  const adsStatus: ListingStatus = subTab === "ads" ? selectedStatus : "live";
  const servicesStatus: ListingStatus = subTab === "services" ? selectedStatus : "live";
  const spareStatus: ListingStatus = subTab === "spare-parts" ? selectedStatus : "live";

  useEffect(() => {
    const currentParam = searchParams.get("status");
    if (currentParam !== selectedStatus) {
      void router.push(buildAccountListingRoute(subTab as AccountListingSection, selectedStatus, currentPage > 1 ? currentPage : undefined), { scroll: false });
    }
  }, [selectedStatus, searchParams, subTab, router, currentPage]);

  const handleStatusChange = (status: ListingStatus) => {
    void router.push(buildAccountListingRoute(subTab as AccountListingSection, status), { scroll: false });
  };

  const handleSubTabChange = (value: ListingSubTab) => {
    const nextStatus = normalizeAccountListingStatus(value as AccountListingSection, selectedStatus);
    void router.push(buildAccountListingRoute(value as AccountListingSection, nextStatus), { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    void router.push(buildAccountListingRoute(subTab as AccountListingSection, selectedStatus, newPage), { scroll: false });
  };

  // Dynamic Data Fetching
  const {
    listings: myAds,
    pagination: adsPagination,
    loading: loadingAds,
    error: adsError,
    handleDelete: handleDeleteAd,
    handleMarkSold: handleMarkAdSold,
    handleDeactivate: handleDeactivateAd,
    handleActivate: handleActivateAd,
    handleRepost: handleRepostAd,
    refetch: fetchMyAds
  } = useProfileListings({
    type: "ads",
    activeSubTab: subTab,
    user,
    statusFilter: adsStatus,
    page: currentPage,
    limit: LISTINGS_PER_PAGE,
  });

  const {
    listings: myServices,
    pagination: servicesPagination,
    loading: loadingServices,
    error: servicesError,
    handleDelete: handleDeleteService,
    handleDeactivate: handleDeactivateService,
    handleActivate: handleActivateService,
    handleRepost: handleRepostService,
    refetch: fetchMyServices
  } = useProfileListings({
    type: "services",
    activeSubTab: subTab,
    user,
    statusFilter: servicesStatus,
    page: currentPage,
    limit: LISTINGS_PER_PAGE,
  });

  const {
    listings: mySpare,
    pagination: sparePagination,
    loading: loadingSpare,
    error: spareError,
    handleDelete: handleDeleteSpare,
    handleMarkSold: handleMarkSpareSold,
    handleDeactivate: handleDeactivateSpare,
    handleActivate: handleActivateSpare,
    handleRepost: handleRepostSpare,
    refetch: fetchMySpare
  } = useProfileListings({
    type: "spare-parts",
    activeSubTab: subTab,
    user,
    statusFilter: spareStatus,
    page: currentPage,
    limit: LISTINGS_PER_PAGE,
  });

  // Modal State & Handlers
  const { actionHandlers, dialogProps } = useMyListingsModals({
    subTab,
    handleDeleteAd,
    handleDeleteService,
    handleDeleteSpare,
    handleDeactivateAd,
    handleDeactivateService,
    handleDeactivateSpare,
    handleActivateAd,
    handleActivateService,
    handleActivateSpare,
    handleMarkAdSold,
    handleMarkSpareSold,
    handleRepostAd,
    handleRepostService,
    handleRepostSpare,
    getStatusBadge,
    fetchMyAds,
  });

  // Section Configuration
  const currentConfig = buildMyListingsSectionConfig({
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
    navigateTo: (page) => navigateTo(page),
    actionHandlers,
    adsPagination,
    servicesPagination,
    sparePagination,
    currentPage,
    handlePageChange,
    listingsPerPage: LISTINGS_PER_PAGE,
  });

  return (
    <div className="space-y-4">
      <UserListingsTemplate
        title={currentConfig.title}
        icon={currentConfig.icon}
        subTabs={visibleSubTabs}
        activeSubTab={subTab}
        onSubTabChange={(v) => handleSubTabChange(v as ListingSubTab)}
        statusTabs={currentConfig.statusTabs}
        selectedStatus={currentConfig.selectedStatus}
        onStatusChange={currentConfig.onStatusChange}
        getStatusCount={currentConfig.getStatusCount}
        onPost={currentConfig.onPost}
        postLabel={currentConfig.postLabel}
        items={currentConfig.items}
        loading={currentConfig.loading}
        error={currentConfig.error}
        onRetry={currentConfig.onRetry}
        getItemKey={(item) => item.id}
        renderItem={(item) => currentConfig.render(item)}
        emptyState={{
          icon: currentConfig.icon,
          title: currentConfig.emptyTitle,
          description: currentConfig.emptyDesc,
        }}
        pagination={currentConfig.pagination}
      />

      {showPendingBanner && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-body"
        >
          <span className="mt-0.5 text-amber-500 shrink-0" aria-hidden="true">⏳</span>
          <div>
            <p className="font-semibold text-amber-800">Business verification is under review.</p>
            <p className="text-amber-700 mt-0.5">
              You&apos;ll be able to post Services and Spare Parts after your application is approved.
            </p>
          </div>
        </div>
      )}

      <MyListingsDialogs {...dialogProps} />
    </div>
  );
}
