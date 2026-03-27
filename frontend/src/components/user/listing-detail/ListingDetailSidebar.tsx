"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { Ad } from "@/schemas/ad.schema";
import { getBusinessById, type Business } from "@/lib/api/user/businesses";

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
    onEdit,
    onDelete,
    onMarkSold,
    onPromote,
    onReport,
}: ListingDetailSidebarProps) {
    const [businessDetails, setBusinessDetails] = useState<Business | null>(null);

    useEffect(() => {
        let isMounted = true;

        if (!ad.isBusiness || !ad.verified || !ad.businessId) {
            setBusinessDetails(null);
            return () => {
                isMounted = false;
            };
        }

        void getBusinessById(ad.businessId)
            .then((business) => {
                if (!isMounted) return;
                setBusinessDetails(business);
            })
            .catch(() => {
                if (!isMounted) return;
                setBusinessDetails(null);
            });

        return () => {
            isMounted = false;
        };
    }, [ad.businessId, ad.isBusiness, ad.verified]);

    return (
        <div className="space-y-3 md:space-y-4 p-4 md:p-0">
            <AdTitlePriceCard
                ad={ad}
                categoryLabel={categoryLabel}
                viewCount={viewCount}
                navigateTo={navigateTo}
                variant="desktop"
            />

            <AdSellerCard
                ad={ad}
                sellerDisplayName={sellerDisplayName}
                isOwner={isOwner}
                isChatLocked={adStatus.isChatLocked}
                onChat={onChat}
                navigateTo={navigateTo}
            />
            <AdBusinessCard
                businessDetails={businessDetails}
                ad={ad}
                navigateTo={navigateTo}
            />

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
                />
            )}
            {!isOwner && (
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-3 md:p-4">
                        <Button
                            variant="outline"
                            className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-100 text-sm h-10"
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
