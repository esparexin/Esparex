"use client";

import { AlertTriangle } from "lucide-react";

import type { Ad } from "@/schemas/ad.schema";

import type { UserPage } from "@/lib/routeUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdTitlePriceCard } from "./AdTitlePriceCard";
import { AdSellerCard } from "./AdSellerCard";
import { AdBusinessCard } from "./AdBusinessCard";
import { AdSafetyTips } from "./AdSafetyTips";
import { AdOwnerActions } from "./AdOwnerActions";

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

    return (
        <div className="space-y-3 md:space-y-4 p-4 md:p-0">
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

            <AdSafetyTips />

            {isOwner && (
                <AdOwnerActions
                    isSold={adStatus.isSold}
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
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-3 md:p-4">
                        <Button
                            variant="outline"
                            className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-100 text-sm h-11"
                            onClick={onReport}
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Report This Ad
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
