"use client";
import { useLayoutEffect, useMemo, useReducer, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserPage } from "@/lib/routeUtils";
import type { User } from "@/types/User";
import { Breadcrumbs } from "./Breadcrumbs";
import { ListingDetailShell } from "./listing-detail/AdDetailShell";
import dynamic from "next/dynamic";

import { ListingBottomActions } from "./listing-detail/ListingBottomActions";
import { ListingDetailSidebar } from "./listing-detail/ListingDetailSidebar";
const ListingDetailDialogs = dynamic(
  () => import("./listing-detail/ListingDetailDialogs").then((mod) => mod.ListingDetailDialogs),
  { ssr: false }
);
const ListingRelatedBusinessesSection = dynamic(
  () => import("./listing-detail/ListingRelatedBusinessesSection").then((mod) => mod.ListingRelatedBusinessesSection),
  { ssr: false }
);
import type { Listing as Ad } from "@/lib/api/user/listings";
import { AdImageCarousel } from "./listing-detail/AdImageCarousel";
import { AdTitlePriceCard } from "./listing-detail/AdTitlePriceCard";
import { ListingDescriptionCard } from "./listing-detail/ListingDescriptionCard";
import { AdPendingStatusCard } from "./listing-detail/AdPendingStatusCard";

import { canUserPerformAction } from "../../lib/logic/ownership";
import { getActionBarVariant } from "../../lib/logic/bottomBarActions";
import { ROUTES } from "../../lib/logic/routes";
import { useListingDetailQuery, useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { useAuth } from "@/context/AuthContext";
import { useViewTracking } from "./hooks/useViewTracking";
import { useAdStatus } from "./hooks/useAdStatus";
import { usePhoneReveal } from "./hooks/usePhoneReveal";
import { useAnalyticsDialog } from "./hooks/useAnalyticsDialog";
import { adDetailUiReducer, initialAdDetailUiState } from "./listing-detail/adDetailUiState";
import { useRouter } from "next/navigation";
import {
  resolveListingCategoryBrowseValue,
  resolveListingCategoryLabel,
  resolveListingLocationLabel,
} from "@/lib/listings/listingPresentation";
import { useListingDetailActions } from "./listing-detail/useListingDetailActions";

interface ListingDetailProps {
  adId: string | number | null;
  initialAd?: Ad | null;
  navigateTo: (page: UserPage, adId?: string | number, category?: string, sellerIdOrBusinessId?: string, serviceId?: string, sellerId?: string, sellerType?: "business" | "individual") => void;
  navigateBack?: () => void;
  user?: User | null;
  navigationContext?: {
    returnPage?: string;
    returnBusinessId?: string;
    returnTab?: "about" | "ads" | "services" | "parts";
    returnScrollPosition?: number;
  };
}

export function ListingDetail({
  adId,
  initialAd,
  navigateTo,
  navigateBack,
  user: userProp,
}: ListingDetailProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user: authUser, isAuthResolved } = useAuth();
  const user = authUser ?? userProp;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: ad, isLoading: queryLoading, error: queryError, refetch } = useListingDetailQuery(
    adId ? String(adId) : "",
    { enabled: Boolean(adId) && !initialAd, initialData: initialAd ?? undefined }
  );

  const isLoading = !ad && queryLoading;
  const error = queryError instanceof Error ? queryError.message : null;

  const [uiState, dispatchUi] = useReducer(adDetailUiReducer, initialAdDetailUiState);
  const showReportDialog = uiState.showReportDialog;
  const showBoostDialog = uiState.showBoostDialog;
  const showSoldDialog = uiState.showSoldDialog;

  const setShowReportDialog = useCallback((value: boolean) =>
    dispatchUi({ type: "setShowReportDialog", payload: value }), []);
  const setShowBoostDialog = useCallback((value: boolean) =>
    dispatchUi({ type: "setShowBoostDialog", payload: value }), []);
  const setShowSoldDialog = useCallback((value: boolean) =>
    dispatchUi({ type: "setShowSoldDialog", payload: value }), []);

  const { data: savedAds = [] } = useSavedAdsQuery({
    enabled: !!user,
  });

  const categoryLabel = resolveListingCategoryLabel(ad, "Category");
  const categoryRoute = resolveListingCategoryBrowseValue(ad);
  const locationLabel = resolveListingLocationLabel(ad?.location, "full");

  let viewCount = 0;
  if (typeof ad?.views === "number") {
    viewCount = ad.views;
  } else if (ad?.views && typeof ad.views === "object") {
    viewCount = (ad.views as { total: number }).total || 0;
  }

  const { adStatus, setSoldOverride } = useAdStatus(ad);
  const { revealedPhone, phoneMessage, isPhoneLoading, handleRevealPhone } = usePhoneReveal(ad, user, router);
  const { showAnalyticsDialog, setShowAnalyticsDialog, isAnalyticsLoading, analyticsSummary, handleViewAnalytics } = useAnalyticsDialog(ad, viewCount);

  const isFavorited = useMemo(
    () =>
      !!user &&
      !!adId &&
      savedAds.some((saved) => String(saved.id) === String(adId)),
    [adId, savedAds, user]
  );

  const isOwner = canUserPerformAction(
    ad ? { sellerId: ad.sellerId } : null,
    user || null
  );

  useViewTracking(ad?.id, isOwner, queryClient);
  const isPendingOwner = Boolean(isOwner && ad?.status === "pending");

  const getSellerDisplayName = () => {
    if (!ad) return "Seller";
    if (ad.isBusiness && ad.businessName) return ad.businessName;
    return ad.sellerName || "Seller";
  };

  const sellerDisplayName = getSellerDisplayName();

  const {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    listingUnavailableMessage,
    handleEdit,
    handleMarkSoldClick,
    handleSoldConfirm,
    handlePromote,
    handleDeleteClick,
    handleDeleteConfirm,
    handleChatWithSeller,
    handleFavorite,
    handleShare,
    handleReport,
    handleListingUnavailable,
  } = useListingDetailActions({
    ad: ad ?? undefined,
    user,
    isAuthResolved,
    isOwner,
    isFavorited,
    adStatus,
    categoryLabel,
    navigateTo,
    navigateBack,
    refetch,
    setSoldOverride,
    setShowReportDialog,
    setShowBoostDialog,
    setShowSoldDialog,
  });

  const images = ad?.images || [];

  return (
    <ListingDetailShell
      isLoading={isLoading}
      error={error}
      notFound={!isLoading && (!ad || !!listingUnavailableMessage)}
      notFoundTitle={listingUnavailableMessage ? "Listing unavailable" : undefined}
      notFoundMessage={listingUnavailableMessage || undefined}
      onRetry={() => refetch()}
    >
      {ad && (
        <>
          <Breadcrumbs
            items={[
              { label: "Home", onClick: () => navigateTo(ROUTES.HOME) },
              { label: "Browse Ads", onClick: () => navigateTo(ROUTES.BROWSE) },
              {
                label: categoryLabel,
                onClick: () => categoryRoute
                  ? navigateTo(ROUTES.CATEGORY, undefined, categoryRoute)
                  : navigateTo(ROUTES.BROWSE)
              },
              { label: locationLabel },
              { label: ad.title },
            ]}
          />

          <div className="bg-gray-50 pb-6">
            <div className="w-full md:px-6 lg:px-8 md:py-6">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6">
                  <div className="lg:col-span-2 space-y-0 md:space-y-4">
                    <AdImageCarousel
                      images={images}
                      title={ad.title}
                      isFavorited={isFavorited}
                      onFavorite={handleFavorite}
                      onShare={handleShare}
                      showActionButtons={!isOwner}
                    />

                    {isPendingOwner && <AdPendingStatusCard />}

                    <ListingDescriptionCard ad={ad} />
                  </div>

                  <ListingDetailSidebar
                    ad={ad}
                    categoryLabel={categoryLabel}
                    viewCount={viewCount}
                    navigateTo={navigateTo}
                    sellerDisplayName={sellerDisplayName}
                    isOwner={isOwner}
                    adStatus={adStatus}
                    onChat={handleChatWithSeller}
                    onRevealPhone={handleRevealPhone}
                    isPhoneLoading={isPhoneLoading}
                    revealedPhone={revealedPhone}
                    phoneMessage={phoneMessage}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onMarkSold={handleMarkSoldClick}
                    onPromote={handlePromote}
                    onViewAnalytics={handleViewAnalytics}
                    onReport={handleReport}
                  />
                </div>

                <ListingRelatedBusinessesSection
                  ad={ad}
                  navigateTo={navigateTo}
                />
              </div>
            </div>

            <ListingBottomActions
              variant={getActionBarVariant(isOwner, adStatus.isSold, ad.status)}
              onEditClick={handleEdit}
              onDeleteClick={handleDeleteClick}
              onMarkSoldClick={() => handleMarkSoldClick()}
              onPromoteClick={handlePromote}
              onAnalyticsClick={handleViewAnalytics}
              onChatClick={handleChatWithSeller}
              onRevealPhone={handleRevealPhone}
              isPhoneLoading={isPhoneLoading}
              revealedPhone={revealedPhone}
              phoneMessage={phoneMessage}
              isChatLocked={adStatus.isChatLocked}
            />
          </div>

          <ListingDetailDialogs
            ad={ad}
            showReportDialog={showReportDialog}
            setShowReportDialog={setShowReportDialog}
            showBoostDialog={showBoostDialog}
            setShowBoostDialog={setShowBoostDialog}
            showSoldDialog={showSoldDialog}
            setShowSoldDialog={setShowSoldDialog}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            showAnalyticsDialog={showAnalyticsDialog}
            setShowAnalyticsDialog={setShowAnalyticsDialog}
            analyticsSummary={analyticsSummary}
            isAnalyticsLoading={isAnalyticsLoading}
            isDeleting={isDeleting}
            onDeleteConfirm={handleDeleteConfirm}
            onSoldConfirm={handleSoldConfirm}
            onListingUnavailable={handleListingUnavailable}
          />
        </>
      )}
    </ListingDetailShell>
  );
}
