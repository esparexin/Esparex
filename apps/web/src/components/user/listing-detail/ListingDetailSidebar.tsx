"use client";

import { AlertTriangle } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";

import type { Ad } from "@/schemas/ad.schema";

import type { UserPage } from "@/lib/routeUtils";

import { AdTitlePriceCard } from "./AdTitlePriceCard";
import { AdSellerCard } from "./AdSellerCard";
import { AdBusinessCard } from "./AdBusinessCard";
import { AdSafetyTips } from "./AdSafetyTips";
import { AdOwnerActions } from "./AdOwnerActions";
import { ListingRelatedBusinessesSection } from "./ListingRelatedBusinessesSection";

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
    onViewAnalytics: () => void;
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
    onViewAnalytics,
    onReport,
}: ListingDetailSidebarProps) {
    const ctaPolicy = {
        businessProfileSurface: "business-card",
        visitorChatSurface: "sticky-mobile-inline-desktop",
    } as const;
    const isActiveSpotlight = Boolean(ad.isSpotlight);

    return (
        <div className="space-y-4">
            <AdTitlePriceCard
                ad={ad}
                categoryLabel={categoryLabel}
                viewCount={viewCount}
                variant="desktop"
            />

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
            {ctaPolicy.businessProfileSurface === "business-card" ? (
                <AdBusinessCard
                    ad={ad}
                    navigateTo={navigateTo}
                />
            ) : null}

            {!isOwner && (
                <ListingRelatedBusinessesSection
                    ad={ad}
                    navigateTo={navigateTo}
                    variant="sidebar"
                />
            )}

            {!isOwner && <AdSafetyTips adId={ad.id} />}

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
                    onViewAnalytics={onViewAnalytics}
                />
            )}
            {!isOwner && (
                <div className="pt-2 flex justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onReport}
                        aria-label="Report this listing"
                        className="gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-transparent h-auto px-2 py-1"
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Report this listing</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
