"use client";

import { AlertTriangle } from "@esparex/ui";
import { Button } from "@esparex/ui";

import type { Ad } from "@/schemas/ad.schema";

import type { UserPage } from "@/lib/routeUtils";

import { AdTitlePriceCard } from "./AdTitlePriceCard";
import { AdSellerCard } from "./AdSellerCard";
import { AdBusinessCard } from "./AdBusinessCard";
import { AdSafetyTips } from "./AdSafetyTips";
import { AdOwnerActions } from "./AdOwnerActions";
import { AdPlacementSlot } from "@/components/common/AdPlacementSlot";

interface ListingDetailSidebarProps {
    ad: Ad;
    categoryLabel: string;
    viewCount?: number;
    navigateTo: (
        page: UserPage,
        adId?: string | number,
        category?: string,
        sellerIdOrBusinessId?: string,
        serviceId?: string,
        sellerId?: string,
        sellerType?: "business" | "individual"
    ) => void;
    sellerDisplayName: string;
    isOwner: boolean;
    adStatus: {
        isSold: boolean;
        isChatLocked: boolean;
    };
    onChat: () => void;
    onRevealPhone: () => void;
    isPhoneLoading: boolean;
    revealedPhone: string | null;
    phoneMessage: string | null;
    onEdit: () => void;
    onDelete: () => void;
    onMarkSold: () => void;
    onPromote: () => void;
    onReport: () => void;
}

export function ListingDetailSidebar({
    ad,
    categoryLabel,
    viewCount,
    navigateTo,
    sellerDisplayName,
    isOwner,
    adStatus,
    onChat,
    onRevealPhone,
    isPhoneLoading,
    revealedPhone,
    phoneMessage,
    onEdit,
    onDelete,
    onMarkSold,
    onPromote,
    onReport,
}: ListingDetailSidebarProps) {
    const isActiveSpotlight = Boolean(ad.isSpotlight);

    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            <div className="hidden lg:block">
                <AdTitlePriceCard
                    ad={ad}
                    categoryLabel={categoryLabel}
                    viewCount={viewCount}
                    variant="desktop"
                />
            </div>

            <AdSellerCard
                ad={ad}
                sellerDisplayName={sellerDisplayName}
                isOwner={isOwner}
                isChatLocked={adStatus.isChatLocked}
                onChat={onChat}
                onRevealPhone={onRevealPhone}
                isPhoneLoading={isPhoneLoading}
                revealedPhone={revealedPhone}
                phoneMessage={phoneMessage}
            />
            <AdBusinessCard
                ad={ad}
                navigateTo={navigateTo}
            />

            {!isOwner && (
                <AdSafetyTips
                    adId={ad.id}
                    listingType={ad.listingType === "service" ? "service" : ad.listingType === "spare_part" ? "spare_part" : "ad"}
                />
            )}

            {isOwner && (
                <AdOwnerActions
                    isSold={adStatus.isSold}
                    isSpotlight={isActiveSpotlight}
                    isChatLocked={adStatus.isChatLocked}
                    status={ad.status}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onMarkSold={onMarkSold}
                    onPromote={onPromote}
                />
            )}
            {!isOwner && (
                <div className="pt-1 flex justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onReport}
                        aria-label="Report this listing"
                        className="gap-1.5 text-caption font-semibold text-destructive hover:text-destructive/90 hover:bg-destructive/10 dark:hover:bg-red-950/30 h-auto px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        <span>Report this listing</span>
                    </Button>
                </div>
            )}

            <AdPlacementSlot placement="listing_details_sidebar" />
        </div>
    );
}
