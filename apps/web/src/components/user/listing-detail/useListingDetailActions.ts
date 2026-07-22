"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Listing as Ad } from "@/lib/api/user/listings";
import { deleteListing, markListingAsSold } from "@/lib/api/user/listings";
import { saveAd, unsaveAd } from "@/lib/api/user/users";
import { chatApi } from "@/lib/api/chatApi";
import { notify } from "@/lib/feedback";
import { queryKeys } from "@/hooks/queries/queryKeys";
import logger from "@/lib/logger";
import { ROUTES } from "@/lib/logic/routes";
import { buildOwnerMissingListingRoute, DEFAULT_LISTING_UNAVAILABLE_MESSAGE, isListingUnavailableError } from "@/lib/listings/listingUnavailable";
import { buildLoginUrl } from "@/lib/authHelpers";
import { buildChatConversationRoute } from "@/lib/chatUiRoutes";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { formatPrice } from "@/lib/formatters";
import type { UserPage } from "@/lib/routeUtils";

type UseListingDetailActionsProps = {
    ad: Ad | undefined;
    user: any;
    isAuthResolved: boolean;
    isOwner: boolean;
    isFavorited: boolean;
    adStatus: { isSold: boolean };
    categoryLabel: string;
    navigateTo: (page: UserPage, adId?: string | number, category?: string, sellerIdOrBusinessId?: string, serviceId?: string, sellerId?: string, sellerType?: "business" | "individual") => void;
    navigateBack?: () => void;
    refetch: () => void;
    setSoldOverride: (override: { adId: string; isSold: boolean; soldPlatform: string; soldAt: string }) => void;
    setShowReportDialog: (val: boolean) => void;
    setShowBoostDialog: (val: boolean) => void;
    setShowSoldDialog: (val: boolean) => void;
};

export function useListingDetailActions({
    ad,
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
}: UseListingDetailActionsProps) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [listingUnavailableMessage, setListingUnavailableMessage] = useState<string | null>(null);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const pendingChatIntentRef = useRef(false);

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
            const result = await markListingAsSold(ad.id, soldReason);
            if (result) {
                setSoldOverride({
                    adId: String(ad.id),
                    isSold: true,
                    soldPlatform: platform,
                    soldAt: new Date().toISOString(),
                });

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
            throw error;
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

    const startChatWithSeller = useCallback(async (returnTo: string) => {
        if (!ad?.id) {
            notify.error("Chat is unavailable for this listing right now");
            return;
        }

        setIsStartingChat(true);
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
        } finally {
            setIsStartingChat(false);
        }
    }, [ad, handleListingUnavailable, router]);

    useEffect(() => {
        if (!pendingChatIntentRef.current || !isAuthResolved) return;

        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        pendingChatIntentRef.current = false;

        if (!user) {
            void router.push(buildLoginUrl(returnTo));
            return;
        }

        void (async () => { await startChatWithSeller(returnTo); })();
    }, [isAuthResolved, router, startChatWithSeller, user]);

    const handleChatWithSeller = () => {
        if (isStartingChat) return;

        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        if (!user) {
            if (!isAuthResolved) {
                pendingChatIntentRef.current = true;
                return;
            }
            void router.push(buildLoginUrl(returnTo));
            return;
        }

        void startChatWithSeller(returnTo);
    };

    const handleFavorite = async () => {
        if (!ad) return;
        if (isOwner) return;
        if (!user) {
            if (!isAuthResolved) return;
            const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            void router.push(buildLoginUrl(returnTo));
            return;
        }

        try {
            if (isFavorited) {
                await unsaveAd(ad.id);
                queryClient.setQueryData<Ad[]>(queryKeys.ads.saved(), (current = []) =>
                    current.filter((savedAd) => String(savedAd.id) !== String(ad.id))
                );
                notify.success("Removed from favorites");
            } else {
                await saveAd(ad.id);
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
                        const waText = encodeURIComponent(`${shareText}\n${shareUrl}`);
                        window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener,noreferrer");
                    }
                }
            } else {
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
            void router.push(buildLoginUrl(returnTo));
            return;
        }

        setShowReportDialog(true);
    }, [isAuthResolved, router, user, setShowReportDialog]);

    return {
        showDeleteDialog,
        setShowDeleteDialog,
        isDeleting,
        listingUnavailableMessage,
        isStartingChat,
        handleListingUnavailable,
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
    };
}
