"use client";
import { useState, useLayoutEffect, useMemo, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatLocation } from "@/lib/location/locationService";
import type { UserPage } from "@/lib/routeUtils";
import type { User } from "@/types/User";
import { notify } from "@/lib/notify";
import { Breadcrumbs } from "./Breadcrumbs";
import { ListingDetailShell } from "./listing-detail/AdDetailShell";
import { formatPrice } from "@/utils/formatters";
import dynamic from "next/dynamic";

const ListingBottomActions = dynamic(
  () => import("./listing-detail/ListingBottomActions").then((mod) => mod.ListingBottomActions),
  { ssr: false, loading: () => null }
);
const ListingDetailDialogs = dynamic(
  () => import("./listing-detail/ListingDetailDialogs").then((mod) => mod.ListingDetailDialogs),
  { ssr: false }
);
const ListingDetailSidebar = dynamic(
  () => import("./listing-detail/ListingDetailSidebar").then((mod) => mod.ListingDetailSidebar),
  {
    ssr: false,
    loading: () => <div className="space-y-3 md:space-y-4 p-4 md:p-0 lg:min-h-[480px]" />,
  }
);
const ListingRelatedBusinessesSection = dynamic(
  () => import("./listing-detail/ListingRelatedBusinessesSection").then((mod) => mod.ListingRelatedBusinessesSection),
  { ssr: false }
);
import { BackButton } from "@/components/common/BackButton";
import { deleteAd, markListingAsSold } from "@/api/user/ads";
import { chatApi } from "@/api/chatApi";
import { type Ad } from "@/schemas/ad.schema";
import { saveAd, unsaveAd } from "@/api/user/users";

import { AdImageCarousel } from "./listing-detail/AdImageCarousel";
import { AdTitlePriceCard } from "./listing-detail/AdTitlePriceCard";
import { ListingDescriptionCard } from "./listing-detail/ListingDescriptionCard";
import { AdPendingStatusCard } from "./listing-detail/AdPendingStatusCard";
const SimilarAds = dynamic(
  () => import("./listing-detail/SimilarAds").then((mod) => mod.SimilarAds),
  { ssr: false }
);

import { isAdSold, getSoldDetails } from "../../lib/logic/soldStatus";
import { canUserPerformAction } from "../../lib/logic/ownership";
import { getActionBarVariant } from "../../lib/logic/bottomBarActions";
import { ROUTES } from "../../lib/logic/routes";
import { useListingDetailQuery, useSavedAdsQuery } from "@/queries";
import { queryKeys } from "@/queries/queryKeys";
import logger from "@/lib/logger";
import { adDetailUiReducer, initialAdDetailUiState } from "./listing-detail/adDetailUiState";

interface ListingDetailProps {
  adId: string | number | null;
  initialAd?: Ad | null;
  navigateTo: (page: UserPage, adId?: string | number, category?: string, sellerIdOrBusinessId?: string, serviceId?: string, sellerId?: string, sellerType?: "business" | "individual") => void;
  navigateBack?: () => void;
  showBackButton?: boolean;
  user?: User | null;
  navigationContext?: {
    returnPage?: string;
    returnBusinessId?: string;
    returnTab?: "about" | "ads" | "services" | "parts";
    returnScrollPosition?: number;
  };
}

export function ListingDetail({ adId, initialAd, navigateTo, navigateBack, showBackButton = true, user }: ListingDetailProps) {
  const queryClient = useQueryClient();
  // Scroll once on mount (kept out of render body to satisfy React rules).
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

  const setShowReportDialog = (value: boolean) =>
    dispatchUi({ type: "setShowReportDialog", payload: value });
  const setShowBoostDialog = (value: boolean) =>
    dispatchUi({ type: "setShowBoostDialog", payload: value });
  const setShowSoldDialog = (value: boolean) =>
    dispatchUi({ type: "setShowSoldDialog", payload: value });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: savedAds = [] } = useSavedAdsQuery({
    enabled: !!user,
  });
  const [soldOverride, setSoldOverride] = useState<{
    adId: string;
    isSold: boolean;
    soldPlatform?: string;
    soldAt?: string;
  } | null>(null);

  const categoryLabel = ad
    ? (typeof ad.category === "string" ? ad.category : typeof ad.categoryId === "string" ? ad.categoryId : "Category")
    : "Category";
  const hasCanonicalCategoryId = typeof ad?.categoryId === "string" && ad.categoryId.trim().length > 0;
  const hasFallbackCategoryLabel = typeof ad?.category === "string" && ad.category.trim().length > 0 && ad.category !== "Category";
  const categoryFilter = hasCanonicalCategoryId
    ? ad?.categoryId
    : hasFallbackCategoryLabel
      ? ad?.category
      : undefined;
  const categoryRoute = categoryFilter;
  const viewCount = typeof ad?.views === "number" ? ad.views : (ad?.views as any)?.total || 0;

  const isFavorited = useMemo(
    () =>
      !!user &&
      !!adId &&
      savedAds.some((saved) => String(saved.id) === String(adId)),
    [adId, savedAds, user]
  );

  const computedAdStatus = useMemo(() => {
    if (ad && isAdSold({ ad })) {
      const details = getSoldDetails(ad);
      return {
        isSold: true,
        soldPlatform: details?.soldPlatform,
        soldAt: details?.soldAt,
        isChatLocked: Boolean(ad.isChatLocked)
      };
    }

    return {
      isSold: false as const,
      isChatLocked: Boolean(ad?.isChatLocked)
    };
  }, [ad]);

  const adStatus = useMemo(() => {
    if (!ad) return computedAdStatus;
    if (soldOverride && soldOverride.adId === String(ad.id)) {
      return {
        isSold: soldOverride.isSold,
        soldPlatform: soldOverride.soldPlatform,
        soldAt: soldOverride.soldAt,
        isChatLocked: true,
      };
    }

    return computedAdStatus;
  }, [ad, computedAdStatus, soldOverride]);






  // Early return if ad not found - MUST be before any code that uses ad

  // Now it's safe to use ad - it's guaranteed to exist after the check above

  // Canonical ownership policy (sellerId -> current user id)
  const isOwner = canUserPerformAction(
    ad
      ? {
        sellerId: ad.sellerId,
      }
      : null,
    user || null
  );
  const isPendingOwner = Boolean(isOwner && ad?.status === "pending");
  // Get the correct display name for the seller/business
  const getSellerDisplayName = () => {
    if (!ad) return "Esparex Seller";
    if (ad.isBusiness) {
      if (ad.businessName) return ad.businessName;
    }
    return ad.sellerName || "Esparex Seller";
  };

  const sellerDisplayName = getSellerDisplayName();

  // Owner control handlers
  const handleEdit = () => {
    if (!ad) return;
    if (adStatus.isSold) {
      notify.error("Cannot edit a sold ad");
      return;
    }
    const editRoute =
      ad.listingType === "service" ? ROUTES.EDIT_SERVICE :
      ad.listingType === "spare_part" ? ROUTES.EDIT_SPARE_PART :
      ROUTES.EDIT_AD;
    navigateTo(editRoute, String(ad.id));
  };

  const handleMarkSoldClick = () => {
    if (!ad) return;
    if (!adStatus.isSold) {
      // Open dialog to mark as sold
      setShowSoldDialog(true);
    }
  };

  const handleSoldConfirm = async (platform: string) => {
    if (!ad) return;

    try {
      const result = await markListingAsSold(ad.id);
      if (result) {
        setSoldOverride({
          adId: String(ad.id),
          isSold: true,
          soldPlatform: platform,
          soldAt: new Date().toISOString(),
        });

        // Trigger refetch to pull the latest ad status
        refetch();
      } else {
        throw new Error("Failed to mark as sold");
      }
    } catch (error) {
      logger.error("Error marking ad as sold:", error);
      throw error; // Re-throw to be caught by SoldOutDialog
    }
  };

  const handlePromote = () => {
    setShowBoostDialog(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ad) return;
    setIsDeleting(true);
    try {
      await deleteAd(ad.id);
      notify.success("Ad deleted successfully");
      setShowDeleteDialog(false);
      if (navigateBack) {
        navigateBack();
      } else {
        navigateTo(ROUTES.MY_ADS);
      }
    } catch (deleteError) {
      notify.error(deleteError instanceof Error ? deleteError.message : "Failed to delete ad");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAnalytics = () => {
    notify.info("Viewing detailed analytics...");
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      notify.info("Please login to chat with the seller");
      navigateTo(ROUTES.LOGIN);
      return;
    }

    if (!ad?.id) {
      notify.error("Chat is unavailable for this listing right now");
      return;
    }

    try {
      const result = await chatApi.start(String(ad.id));
      window.location.assign(`/chat/${encodeURIComponent(result.conversationId)}`);
    } catch (chatError) {
      notify.error(chatError instanceof Error ? chatError.message : "Failed to start chat");
    }
  };

  // Mock multiple images (in real app, this would come from ad data)
  const images = ad?.images || [];

  const handleFavorite = async () => {
    if (!ad) return;
    if (!user) {
      notify.info("Please login to save favorites");
      navigateTo(ROUTES.LOGIN);
      return;
    }

    try {
      if (isFavorited) {
        await unsaveAd(ad!.id);
        queryClient.setQueryData<Ad[]>(queryKeys.ads.saved(), (current = []) =>
          current.filter((savedAd) => String(savedAd.id) !== String(ad.id))
        );
        notify.success("Removed from favorites");
      } else {
        await saveAd(ad!.id);
        queryClient.setQueryData<Ad[]>(queryKeys.ads.saved(), (current = []) => {
          const exists = current.some((savedAd) => String(savedAd.id) === String(ad.id));
          if (exists) return current;
          return [ad, ...current];
        });
        notify.success("Added to favorites");
      }
    } catch {
      notify.error("Failed to update favorite status");
    }
  };

  const handleShare = async () => {
    if (!ad) return;
    try {
      // Create a shareable link
      const shareUrl = `${window.location.origin}${window.location.pathname}?ad=${ad.id}`;
      const shareText = `Check out this ${categoryLabel}: ${ad.title} - ${formatPrice(ad.price)}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: ad.title,
            text: shareText,
            url: shareUrl,
          });
          notify.success("Shared successfully!");
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            // If share fails, fall back to clipboard
            await navigator.clipboard.writeText(shareUrl);
            notify.success("Link copied to clipboard!");
          }
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        notify.success("Link copied to clipboard!");
      }
    } catch {
      notify.error("Failed to share. Please try again.");
    }
  };

  return (
    <ListingDetailShell
      isLoading={isLoading}
      error={error}
      notFound={!isLoading && !ad}
      onRetry={() => refetch()}
    >
      {ad && (
        <>
          {/* Back Button - Sticky Header */}
          {showBackButton && navigateBack && (
            <div className="sticky top-0 z-50 bg-white border-b shadow-sm transition-all duration-200">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center">
                <BackButton
                  onClick={() => navigateBack()}
                  className="gap-1"
                />
              </div>
            </div>
          )}

          {/* Breadcrumbs with Location */}
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
              { label: formatLocation(ad.location) },
              { label: ad.title },
            ]}
          />

          <div className="bg-gray-50 pb-20 md:pb-6">
            <div className="w-full md:px-6 lg:px-8 md:py-6">
              <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-0 md:space-y-4">
                    {/* Image Slider - Premium Component */}
                    <AdImageCarousel
                      images={images}
                      title={ad.title}
                      isFavorited={isFavorited}
                      onFavorite={handleFavorite}
                      onShare={handleShare}
                      showActionButtons={!isPendingOwner}
                    />

                    {isPendingOwner && <AdPendingStatusCard />}

                    {/* Title and Price Card - Mobile Only (Below Image) */}
                    <AdTitlePriceCard
                      ad={ad}
                      categoryLabel={categoryLabel}
                      viewCount={viewCount}
                      navigateTo={navigateTo}
                      variant="mobile"
                    />

                    {/* Description Cards (mobile + desktop) */}
                    <ListingDescriptionCard ad={ad} variant="mobile" />
                    <ListingDescriptionCard ad={ad} variant="desktop" />


                  </div>

                  {/* Sidebar */}
                  <ListingDetailSidebar
                    ad={ad}
                    categoryLabel={categoryLabel}
                    viewCount={viewCount}
                    navigateTo={navigateTo}
                    sellerDisplayName={sellerDisplayName}
                    isOwner={isOwner}
                    adStatus={adStatus}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onMarkSold={handleMarkSoldClick}
                    onPromote={handlePromote}
                    onReport={() => setShowReportDialog(true)}
                  />
                </div>

                {/* Similar Listings Section */}
                <SimilarAds
                  currentAdId={ad.id}
                  category={categoryLabel}
                />

                {/* Near Service Centers Section - Real Businesses */}
                <ListingRelatedBusinessesSection
                  ad={ad}
                  navigateTo={navigateTo}
                />
              </div>
            </div>

            {/* Bottom Action Bar - Mobile Only */}
            <ListingBottomActions
              variant={getActionBarVariant(isOwner, adStatus.isSold, ad.status)}
              // Owner props
              onEditClick={handleEdit}
              onDeleteClick={handleDeleteClick}
              onMarkSoldClick={() => handleMarkSoldClick()}
              onPromoteClick={handlePromote}
              onAnalyticsClick={handleViewAnalytics}
              // Visitor props
              onChatClick={handleChatWithSeller}
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
            isDeleting={isDeleting}
            onDeleteConfirm={handleDeleteConfirm}
            onSoldConfirm={handleSoldConfirm}
          />

        </>
      )}
    </ListingDetailShell>
  );
}
