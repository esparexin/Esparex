import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Wrench, CircuitBoard } from "@/icons/IconRegistry";
import type { Listing, ListingStatsResponse } from "@/lib/api/user/listings";
import type { User } from "@/types/User";
import { useProfileListings } from "./useProfileListings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { UserListingsTemplate } from "@/components/user/shared/UserListingsTemplate";
import { type SoldReason } from "@/components/user/shared/SoldReasonDialog";
import {
  ACCOUNT_LISTING_STATUS_TABS,
  buildAccountListingRoute,
  normalizeAccountListingStatus,
  type AccountListingSection,
} from "@/lib/accountListingRoutes";
import type { BusinessStatusValue } from "@esparex/contracts";
import {
  SUB_TABS,
  type ListingSubTab,
  renderAdItem,
  renderServiceItem,
  renderSpareItem,
} from "./MyListingsConfig";
import { MyListingsDialogs } from "./MyListingsDialogs";

// ── Props ─────────────────────────────────────────────────────────────────────

interface MyListingsTabProps {
  adCounts: ListingStatsResponse;
  user: User | null;
  navigateTo: (page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string) => void;
  getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
  formatDate: (date: string | Date) => string;
  /** Normalized business status — drives tab visibility and pending banner. */
  businessStatus: BusinessStatusValue | "none";
  /** Retained for compatibility — no longer used inside configMap. */
  onRegisterBusiness?: () => void;
  initialSubTab?: ListingSubTab;
}

// ── Main Component ────────────────────────────────────────────────────────────
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

  // Tab visibility: Services and Spare Parts are only accessible to approved (live) businesses.
  const visibleSubTabs = businessStatus === "live" ? SUB_TABS : SUB_TABS.filter(t => t.value === "ads");
  const showPendingBanner = businessStatus === "pending";

  const subTab: ListingSubTab = visibleSubTabs.some(t => t.value === initialSubTab)
    ? initialSubTab
    : "ads";

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
      void router.push(buildAccountListingRoute(subTab as AccountListingSection, selectedStatus), { scroll: false });
    }
  }, [selectedStatus, searchParams, subTab, router]);

  const handleStatusChange = (status: ListingStatus) => {
    void router.push(buildAccountListingRoute(subTab as AccountListingSection, status), { scroll: false });
  };

  const handleSubTabChange = (value: ListingSubTab) => {
    const nextStatus = normalizeAccountListingStatus(value as AccountListingSection, selectedStatus);
    void router.push(buildAccountListingRoute(value as AccountListingSection, nextStatus), { scroll: false });
  };

  // Dynamic Data Fetching
  const {
    listings: myAds,
    loading: loadingAds,
    error: adsError,
    handleDelete: handleDeleteAd,
    handleMarkSold: handleMarkAdSold,
    handleDeactivate: handleDeactivateAd,
    handleActivate: handleActivateAd,
    handleRepost: handleRepostAd,
    refetch: fetchMyAds
  } = useProfileListings("ads", subTab, user, adsStatus);

  const {
    listings: myServices,
    loading: loadingServices,
    error: servicesError,
    handleDelete: handleDeleteService,
    handleDeactivate: handleDeactivateService,
    handleActivate: handleActivateService,
    handleRepost: handleRepostService,
    refetch: fetchMyServices
  } = useProfileListings("services", subTab, user, servicesStatus);

  const {
    listings: mySpare,
    loading: loadingSpare,
    error: spareError,
    handleDelete: handleDeleteSpare,
    handleMarkSold: handleMarkSpareSold,
    handleDeactivate: handleDeactivateSpare,
    handleActivate: handleActivateSpare,
    handleRepost: handleRepostSpare,
    refetch: fetchMySpare
  } = useProfileListings("spare-parts", subTab, user, spareStatus);

  // Modal States
  const [adToDelete, setAdToDelete] = useState<Listing | null>(null);
  const [isDeleteAdOpen, setIsDeleteAdOpen] = useState(false);
  const [adToDeactivate, setAdToDeactivate] = useState<Listing | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [adToActivate, setAdToActivate] = useState<Listing | null>(null);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  const [adToSell, setAdToSell] = useState<Listing | null>(null);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
  const [isSelling, setIsSelling] = useState(false);

  const [spareToSell, setSpareToSell] = useState<Listing | null>(null);
  const [isSparesSoldOpen, setIsSparesSoldOpen] = useState(false);
  const [sparesSoldReason, setSparesSoldReason] = useState<SoldReason | null>(null);
  const [isSpareSelling, setIsSpareSelling] = useState(false);

  const [boostAd, setBoostAd] = useState<Listing | null>(null);
  const [isBoostOpen, setIsBoostOpen] = useState(false);

  // Handlers
  const confirmDeleteAd = async () => {
    if (!adToDelete) return;
    const type = subTab === "ads" ? "ad" : subTab === "services" ? "service" : "spare_part";
    if (type === "ad") await handleDeleteAd(adToDelete.id);
    else if (type === "service") await handleDeleteService(adToDelete.id);
    else await handleDeleteSpare(adToDelete.id);
    setIsDeleteAdOpen(false);
    setAdToDelete(null);
  };

  const confirmDeactivate = async () => {
    if (!adToDeactivate) return;
    const type = subTab === "ads" ? "ad" : subTab === "services" ? "service" : "spare_part";
    if (type === "ad") await handleDeactivateAd(adToDeactivate.id);
    else if (type === "service") await handleDeactivateService(adToDeactivate.id);
    else await handleDeactivateSpare(adToDeactivate.id);
    setIsDeactivateOpen(false);
    setAdToDeactivate(null);
  };

  const confirmActivate = async () => {
    if (!adToActivate) return;
    const type = subTab === "ads" ? "ad" : subTab === "services" ? "service" : "spare_part";
    if (type === "ad") await handleActivateAd(adToActivate.id);
    else if (type === "service") await handleActivateService(adToActivate.id);
    else await handleActivateSpare(adToActivate.id);
    setIsActivateOpen(false);
    setAdToActivate(null);
  };

  const confirmSold = async () => {
    if (!adToSell || !soldReason) return;
    setIsSelling(true);
    try { await handleMarkAdSold(adToSell.id, soldReason); }
    finally {
      setIsSelling(false);
      setAdToSell(null);
      setIsSoldOpen(false);
    }
  };

  const confirmSoldSpare = async () => {
    if (!spareToSell || !sparesSoldReason) return;
    setIsSpareSelling(true);
    try { await handleMarkSpareSold(spareToSell.id, sparesSoldReason); }
    finally {
      setIsSpareSelling(false);
      setSpareToSell(null);
      setIsSparesSoldOpen(false);
    }
  };

  const actionHandlers = {
    onDelete: (listing: Listing) => { setAdToDelete(listing); setIsDeleteAdOpen(true); },
    onDeactivate: (listing: Listing) => { setAdToDeactivate(listing); setIsDeactivateOpen(true); },
    onActivate: (listing: Listing) => { setAdToActivate(listing); setIsActivateOpen(true); },
    onMarkSoldAd: (listing: Listing) => { setAdToSell(listing); setSoldReason(null); setIsSoldOpen(true); },
    onMarkSoldSpare: (listing: Listing) => { setSpareToSell(listing); setSparesSoldReason(null); setIsSparesSoldOpen(true); },
    onRepostAd: (id: string) => handleRepostAd(id),
    onRepostService: (id: string) => handleRepostService(id),
    onRepostSpare: (id: string) => handleRepostSpare(id),
    onBoost: (listing: Listing) => { setBoostAd(listing); setIsBoostOpen(true); },
    getStatusBadge,
  };

  interface SectionConfig {
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
  }

  const configMap: Record<ListingSubTab, SectionConfig> = {
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
    },
    services: {
      title: "My Professional Services",
      icon: <Wrench className="h-5 w-5 text-violet-600" />,
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
    },
    "spare-parts": {
      title: "My Spare Part Inventory",
      icon: <CircuitBoard className="h-5 w-5 text-teal-600" />,
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
    },
  };

  const currentConfig = (configMap[subTab] || configMap.ads) as SectionConfig;

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
        getItemKey={(item: Listing) => item.id}
        renderItem={(item: Listing) => currentConfig.render(item)}
        emptyState={{
          icon: currentConfig.icon,
          title: currentConfig.emptyTitle,
          description: currentConfig.emptyDesc,
        }}
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

      <MyListingsDialogs
        adToDelete={adToDelete}
        isDeleteAdOpen={isDeleteAdOpen}
        setIsDeleteAdOpen={setIsDeleteAdOpen}
        confirmDeleteAd={confirmDeleteAd}
        adToDeactivate={adToDeactivate}
        isDeactivateOpen={isDeactivateOpen}
        setIsDeactivateOpen={setIsDeactivateOpen}
        confirmDeactivate={confirmDeactivate}
        adToActivate={adToActivate}
        isActivateOpen={isActivateOpen}
        setIsActivateOpen={setIsActivateOpen}
        confirmActivate={confirmActivate}
        isSoldOpen={isSoldOpen}
        setIsSoldOpen={setIsSoldOpen}
        soldReason={soldReason}
        setSoldReason={setSoldReason}
        isSelling={isSelling}
        confirmSold={confirmSold}
        isSparesSoldOpen={isSparesSoldOpen}
        setIsSparesSoldOpen={setIsSparesSoldOpen}
        sparesSoldReason={sparesSoldReason}
        setSparesSoldReason={setSparesSoldReason}
        isSpareSelling={isSpareSelling}
        confirmSoldSpare={confirmSoldSpare}
        boostAd={boostAd}
        isBoostOpen={isBoostOpen}
        setIsBoostOpen={setIsBoostOpen}
        onBoostPlanPurchased={() => {
          void fetchMyAds();
        }}
      />
    </div>
  );
}
