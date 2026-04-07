"use client";
import { useState, useLayoutEffect, useMemo, useReducer, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatLocation } from "@/lib/location/locationService";
import type { UserPage } from "@/lib/routeUtils";
import type { User } from "@/types/User";
import { notify } from "@/lib/notify";
import { Breadcrumbs } from "./Breadcrumbs";
import { ListingDetailShell } from "./listing-detail/AdDetailShell";
import { formatPrice } from "@/lib/formatters";
import dynamic from "next/dynamic";
import { BackButton } from "@/components/common/BackButton";

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
import {
  deleteListing,
  getListingAnalytics,
  getListingPhone,
  incrementListingView,
  markAsSold,
  type ListingAnalytics,
} from "@/lib/api/user/listings";
import { chatApi } from "@/lib/api/chatApi";
import type { Listing as Ad } from "@/lib/api/user/listings";
import { saveAd, unsaveAd } from "@/lib/api/user/users";

import { AdImageCarousel } from "./listing-detail/AdImageCarousel";
import { AdTitlePriceCard } from "./listing-detail/AdTitlePriceCard";
import { ListingDescriptionCard } from "./listing-detail/ListingDescriptionCard";
import { AdPendingStatusCard } from "./listing-detail/AdPendingStatusCard";

import { isAdSold, getSoldDetails } from "../../lib/logic/soldStatus";
import { canUserPerformAction } from "../../lib/logic/ownership";
import { getActionBarVariant } from "../../lib/logic/bottomBarActions";
import { ROUTES } from "../../lib/logic/routes";
import { useListingDetailQuery, useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuth } from "@/context/AuthContext";
import logger from "@/lib/logger";
import { adDetailUiReducer, initialAdDetailUiState } from "./listing-detail/adDetailUiState";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { useRouter } from "next/navigation";
import {
  buildOwnerMissingListingRoute,
  DEFAULT_LISTING_UNAVAILABLE_MESSAGE,
  isListingUnavailableError,
} from "@/lib/listings/listingUnavailable";
import { buildLoginUrl } from "@/lib/authHelpers";
import { buildChatConversationRoute } from "@/lib/chatUiRoutes";

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

export function ListingDetail({
  adId,
  initialAd,
  navigateTo,
  navigateBack,
  showBackButton = true,
  user: userProp,
}: ListingDetailProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user: authUser, isAuthResolved } = useAuth();
  // Prefer the auth context (always up-to-date) over the prop (can be stale or missing)
  const user = authUser ?? userProp;
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
  const [listingUnavailableMessage, setListingUnavailableMessage] = useState<string | null>(null);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isPhoneMasked, setIsPhoneMasked] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const trackedViewRef = useRef<string | null>(null);
  const { data: savedAds = [] } = useSavedAdsQuery({
    enabled: !!user,
  });
  const [soldOverride, setSoldOverride] = useState<{
    adId: string;
    isSold: boolean;
    soldPlatform?: string;
    soldAt?: string;
  } | null>(null);

  const OBJECTID_RE = /^[0-9a-f]{24}$/i;
  const categoryLabel = ad
    ? (typeof ad.category === "string" && !OBJECTID_RE.test(ad.category) ? ad.category : "Category")
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

  // Canonical ownership policy (sellerId -> current user id)
  const isOwner = canUserPerformAction(
    ad
      ? {
        sellerId: ad.sellerId,
      }
      : null,
    user || null
  );

  const analyticsSummary = useMemo(() => {
    const analyticsViews = analytics?.views;
    if (typeof analyticsViews === "number") {
      return {
        total: analyticsViews,
        unique: analyticsViews,
        lastViewedAt: null,
      };
    }

    if (analyticsViews && typeof analyticsViews === "object") {
      return {
        total: typeof analyticsViews.total === "number" ? analyticsViews.total : viewCount,
        unique: typeof analyticsViews.unique === "number" ? analyticsViews.unique : viewCount,
        lastViewedAt: typeof analyticsViews.lastViewedAt === "string" ? analyticsViews.lastViewedAt : null,
      };
    }

    const currentViews = ad?.views && typeof ad.views === "object"
      ? ad.views as { unique?: number; lastViewedAt?: string }
      : null;

    return {
      total: viewCount,
      unique: typeof currentViews?.unique === "number" ? currentViews.unique : viewCount,
      lastViewedAt: typeof currentViews?.lastViewedAt === "string" ? currentViews.lastViewedAt : null,
    };
  }, [ad?.views, analytics, viewCount]);

  useEffect(() => {
    setAnalytics(null);
    setShowAnalyticsDialog(false);
    setRevealedPhone(null);
    setIsPhoneMasked(false);
    setPhoneMessage(null);
    trackedViewRef.current = null;
  }, [ad?.id]);

  useEffect(() => {
    if (!ad?.id || isOwner) {
      return;
    }

    const trackingKey = String(ad.id);
    if (trackedViewRef.current === trackingKey) {
      return;
    }

    trackedViewRef.current = trackingKey;
    let cancelled = false;

    void incrementListingView(ad.id)
      .then(() => {
        if (!cancelled) {
          queryClient.setQueryData<Ad | undefined>(queryKeys.ads.detail(String(ad.id)), (current) => {
            if (!current) return current;

            if (typeof current.views === "number") {
              return {
                ...current,
                views: current.views + 1,
              };
            }

            const currentViews = current.views && typeof current.views === "object"
              ? current.views as { total?: number; unique?: number; lastViewedAt?: string }
              : {};

            return {
              ...current,
              views: {
                ...currentViews,
                total: (typeof currentViews.total === "number" ? currentViews.total : 0) + 1,
                unique: typeof currentViews.unique === "number" ? currentViews.unique : 0,
              },
            };
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          trackedViewRef.current = null;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ad?.id, isOwner]);
  const isPendingOwner = Boolean(isOwner && ad?.status === "pending");

  const handleListingUnavailable = useCallback((message = DEFAULT_LISTING_UNAVAILABLE_MESSAGE) => {
    setShowDeleteDialog(false);
    setShowReportDialog(false);
    setShowBoostDialog(false);
    setShowSoldDialog(false);

    if (ad && isOwner) {
      void router.replace(buildOwnerMissingListingRoute(ad));
      return;
    }

    setListingUnavailableMessage(message);
  }, [ad, isOwner, router, setShowBoostDialog, setShowReportDialog, setShowSoldDialog]);

  // Get the correct display name for the seller/business
  const getSellerDisplayName = () => {
    if (!ad) return "Seller";
    if (ad.isBusiness) {
      if (ad.businessName) return ad.businessName;
    }
    return ad.sellerName || "Seller";
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

  const handleSoldConfirm = async (platform: string): Promise<boolean> => {
    if (!ad) return false;

    try {
      const soldReason = platform === "on_platform"
        ? "sold_on_platform"
        : platform === "outside"
        ? "sold_outside"
        : "no_longer_available";
      const result = await markAsSold(ad.id, soldReason);
      if (result) {
        setSoldOverride({
          adId: String(ad.id),
          isSold: true,
          soldPlatform: platform,
          soldAt: new Date().toISOString(),
        });

        // Trigger refetch to pull the latest ad status
        refetch();
        return true;
      } else {
        throw new Error("Failed to mark as sold");
      }
    } catch (error) {
      if (isListingUnavailableError(error)) {
        handleListingUnavailable();
        return false;
      }
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
      await deleteListing(ad.id);
      notify.success("Ad deleted successfully");
      setShowDeleteDialog(false);
      if (navigateBack) {
        navigateBack();
      } else {
        navigateTo("my-ads");
      }
    } catch (deleteError) {
      if (isListingUnavailableError(deleteError)) {
        handleListingUnavailable();
        return;
      }
      notify.error(deleteError instanceof Error ? deleteError.message : "Failed to delete ad");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewAnalytics = async () => {
    if (!ad?.id) return;

    setShowAnalyticsDialog(true);
    setIsAnalyticsLoading(true);
    try {
      const result = await getListingAnalytics(ad.id);
      if (result) {
        setAnalytics(result);
      } else {
        notify.info("No analytics available yet for this listing.");
      }
    } catch {
      notify.error("Failed to load listing analytics");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleRevealPhone = async () => {
    if (!ad?.id || isPhoneLoading) return;

    if (revealedPhone && !isPhoneMasked) {
      window.location.href = `tel:${revealedPhone}`;
      return;
    }

    if (revealedPhone && isPhoneMasked && !user) {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      void router.push(buildLoginUrl(returnTo));
      return;
    }

    setIsPhoneLoading(true);
    setPhoneMessage(null);

    try {
      const result = await getListingPhone(ad.id);
      if (result?.mobile || result?.phone) {
        const phone = result.mobile || result.phone || null;
        setRevealedPhone(phone);
        setIsPhoneMasked(false);
        setPhoneMessage(null);
        return;
      }

      if (result?.masked) {
        setRevealedPhone(result.masked);
        setIsPhoneMasked(true);
        setPhoneMessage("Login to reveal the full phone number.");
        return;
      }

      setPhoneMessage("Phone number is unavailable for this listing.");
    } catch (phoneError) {
      const backendCode = String(
        (phoneError as { context?: { backendErrorCode?: unknown } })?.context?.backendErrorCode || ""
      );
      if (backendCode === "PHONE_REQUEST_REQUIRED") {
        const message = "Seller shares phone numbers on request only. Use chat first.";
        setPhoneMessage(message);
        notify.info(message);
      } else if (backendCode === "PHONE_HIDDEN") {
        const message = "Seller chose not to share a phone number for this listing.";
        setPhoneMessage(message);
        notify.info(message);
      } else {
        notify.error(phoneError instanceof Error ? phoneError.message : "Failed to reveal phone number");
      }
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleChatWithSeller = async () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (!user) {
      if (!isAuthResolved) return;
      notify.info("Please login to chat with the seller");
      void router.push(buildLoginUrl(returnTo));
      return;
    }

    if (!ad?.id) {
      notify.error("Chat is unavailable for this listing right now");
      return;
    }

    try {
      const result = await chatApi.start(String(ad.id), { silent: true });
      const chatUrl = buildChatConversationRoute(String(result.conversationId), { returnTo });
      void router.push(chatUrl);
    } catch (chatError) {
      if (isListingUnavailableError(chatError)) {
        handleListingUnavailable();
        return;
      }
      notify.error(chatError instanceof Error ? chatError.message : "Failed to start chat");
    }
  };

  // Mock multiple images (in real app, this would come from ad data)
  const images = ad?.images || [];

  const handleFavorite = async () => {
    if (!ad) return;
    // Owners cannot save their own listing
    if (isOwner) return;
    if (!user) {
      // Auth still hydrating — don't navigate yet; resolved state will update
      if (!isAuthResolved) return;
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      notify.info("Please login to save favorites");
      void router.push(buildLoginUrl(returnTo));
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
    } catch (favoriteError) {
      if (isListingUnavailableError(favoriteError)) {
        handleListingUnavailable();
        return;
      }
      notify.error("Failed to update favorite status");
    }
  };

  const handleShare = async () => {
    if (!ad) return;
    try {
      const shareUrl = `${window.location.origin}${buildPublicListingDetailRoute({
        id: ad.id,
        listingType: ad.listingType,
        seoSlug: ad.seoSlug,
        title: ad.title,
      })}`;
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
            // Share cancelled or failed — open WhatsApp as a rich fallback on mobile
            const waText = encodeURIComponent(`${shareText}\n${shareUrl}`);
            window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener,noreferrer");
          }
        }
      } else {
        // Desktop fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        notify.success("Link copied to clipboard!");
      }
    } catch {
      notify.error("Failed to share. Please try again.");
    }
  };

  const handleReport = useCallback(() => {
    if (!user) {
      if (!isAuthResolved) return;

      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      notify.info("Please login to report this listing");
      void router.push(buildLoginUrl(returnTo));
      return;
    }

    setShowReportDialog(true);
  }, [isAuthResolved, router, user]);

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
          {showBackButton && navigateBack ? (
            <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6 lg:px-8">
              <BackButton
                onClick={navigateBack}
                variant="outline"
                className="rounded-full border-slate-200 bg-white text-foreground-secondary hover:bg-slate-50"
              />
            </div>
          ) : null}

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

          <div className="bg-gray-50 pb-24 md:pb-6">
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
                      showActionButtons={!isOwner}
                    />

                    {isPendingOwner && <AdPendingStatusCard />}

                    {/* Title and Price Card - Mobile Only (Below Image) */}
                    <AdTitlePriceCard
                      ad={ad}
                      categoryLabel={categoryLabel}
                      viewCount={viewCount}
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
