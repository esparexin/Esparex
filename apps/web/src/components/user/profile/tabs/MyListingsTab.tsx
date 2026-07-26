import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@esparex/ui";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Wrench, CircuitBoard, MapPin, Timer, Home, Wifi } from "lucide-react";
import type { Listing, ListingStatsResponse } from "@/lib/api/user/listings";
import type { User } from "@/types/User";
import { useProfileListings } from "./useProfileListings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { UserListingsTemplate } from "@/components/user/shared/UserListingsTemplate";
import { ListingItem } from "@/components/user/shared/ListingItem";
import { SoldReasonDialog, type SoldReason } from "@/components/user/shared/SoldReasonDialog";
import {
    ACCOUNT_LISTING_STATUS_TABS,
    buildAccountListingRoute,
    normalizeAccountListingStatus,
    type AccountListingSection,
} from "@/lib/accountListingRoutes";
import {
    resolveListingLocationLabel,
    resolveReadableListingReferenceLabel,
} from "@/lib/listings/listingPresentation";

import { formatPrice, formatStableNumber } from "@/lib/formatters";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

// ── Types & Constants ────────────────────────────────────────────────────────
type ListingSubTab = "ads" | "services" | "spare-parts";

const SUB_TABS: { value: ListingSubTab; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "ads", label: "Ads", icon: <Package className="h-4 w-4" />, color: "blue" },
    { value: "services", label: "Services", icon: <Wrench className="h-4 w-4" />, color: "violet" },
    { value: "spare-parts", label: "Spare Parts", icon: <CircuitBoard className="h-4 w-4" />, color: "teal" },
];

const buildLocationMetaBadge = (location: unknown) => {
    const locationLabel = resolveListingLocationLabel(location, "brief");
    return locationLabel
        ? { label: locationLabel, icon: <MapPin className="h-3 w-3" /> }
        : null;
};

const buildTag = (label: string | null, className?: string) => (
    label ? { label, className } : null
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface MyListingsTabProps {
    adCounts: ListingStatsResponse;
    user: User | null;
    navigateTo: (page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string) => void;
    getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
    formatDate: (date: string | Date) => string;
    isBusinessApproved?: boolean;
    onRegisterBusiness?: () => void;
    initialSubTab?: ListingSubTab;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MyListingsTab({
    adCounts,
    user, navigateTo, getStatusBadge,
    isBusinessApproved, onRegisterBusiness,
    initialSubTab = "ads",
}: MyListingsTabProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const subTab = initialSubTab;
    const selectedStatus = normalizeAccountListingStatus(
        subTab as AccountListingSection,
        searchParams.get("status")
    ) as ListingStatus;
    const adsStatus: ListingStatus = subTab === "ads" ? selectedStatus : "live";
    const servicesStatus: ListingStatus = subTab === "services" ? selectedStatus : "live";
    const spareStatus: ListingStatus = subTab === "spare-parts" ? selectedStatus : "live";

    // Sync state back to URL if normalized state differs from current params
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
        listings: myAds, loading: loadingAds, error: adsError,
        handleDelete: handleDeleteAd, handleMarkSold: handleMarkAdSold,
        handleDeactivate: handleDeactivateAd, handleActivate: handleActivateAd, handleRepost: handleRepostAd,
        refetch: fetchMyAds
    } = useProfileListings("ads", subTab, user, adsStatus);

    const { 
        listings: myServices, loading: loadingServices, error: servicesError, 
        handleDelete: handleDeleteService, handleDeactivate: handleDeactivateService, handleActivate: handleActivateService, handleRepost: handleRepostService, refetch: fetchMyServices 
    } = useProfileListings("services", subTab, user, servicesStatus);

    const { 
        listings: mySpare, loading: loadingSpare, error: spareError, 
        handleDelete: handleDeleteSpare, handleMarkSold: handleMarkSpareSold, handleDeactivate: handleDeactivateSpare, handleActivate: handleActivateSpare, handleRepost: handleRepostSpare, refetch: fetchMySpare 
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

    // ── Configuration Interface ───────────────────────────────────────────
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

    // Shared Configuration
    const configMap: Record<ListingSubTab, SectionConfig> = {
        ads: {
            title: "My Classified Ads",
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
            render: (listing: Listing) => (
                <ListingItem
                    title={listing.title}
                    status={listing.status}
                    listingType="ad"
                    thumbnail={listing.images?.[0] ?? listing.image}
                    priceLabel={formatPrice(listing.price)}
                    badgeColor="blue"
                    createdAt={listing.createdAt}
                    expiresAt={listing.expiresAt}
                    views={listing.views}
                    likes={listing.likes}
                    getStatusBadge={getStatusBadge}
                    editHref={`/edit-ad/${listing.id}`}
                    detailHref={buildPublicListingDetailRoute({
                        id: listing.id,
                        listingType: "ad",
                        seoSlug: listing.seoSlug,
                        title: listing.title,
                    })}
                    onDelete={() => { setAdToDelete(listing); setIsDeleteAdOpen(true); }}
                    onMarkSold={() => { setAdToSell(listing); setSoldReason(null); setIsSoldOpen(true); }}
                    onDeactivate={() => { setAdToDeactivate(listing); setIsDeactivateOpen(true); }}
                    onActivate={() => { setAdToActivate(listing); setIsActivateOpen(true); }}
                    onRenew={() => handleRepostAd(listing.id)}
                />
            )
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
            onPost: isBusinessApproved ? () => navigateTo("post-service") : onRegisterBusiness,
            postLabel: isBusinessApproved ? "Post Service" : "Register Business",
            emptyTitle: `No ${servicesStatus} services`,
            emptyDesc: "List your repair or maintenance services to attract customers.",
            render: (service: Listing) => (
                <ListingItem
                    title={service.title}
                    status={service.status}
                    listingType="service"
                    thumbnail={service.images?.[0]}
                    priceLabel={service.priceMin ? `From ₹${formatStableNumber(service.priceMin)}` : "Price on request"}
                    badgeColor="violet"
                    createdAt={service.createdAt}
                    getStatusBadge={getStatusBadge}
                    editHref={`/edit-service/${service.id}`}
                    detailHref={buildPublicListingDetailRoute({
                        id: service.id,
                        listingType: "service",
                        seoSlug: service.seoSlug,
                        title: service.title,
                    })}
                    onDelete={() => { setAdToDelete(service); setIsDeleteAdOpen(true); }}
                    onRenew={() => handleRepostService(service.id)}
                    onDeactivate={() => { setAdToDeactivate(service); setIsDeactivateOpen(true); }}
                    onActivate={() => { setAdToActivate(service); setIsActivateOpen(true); }}
                    metaBadges={([
                        buildLocationMetaBadge(service.location),
                        service.onsiteService !== undefined ? {
                            label: service.onsiteService ? "On-site" : "Remote",
                            icon: service.onsiteService ? <Home className="h-3 w-3" /> : <Wifi className="h-3 w-3" />,
                            className: service.onsiteService ? "text-green-600" : "text-muted-foreground"
                        } : null,
                        service.turnaroundTime ? { label: service.turnaroundTime, icon: <Timer className="h-3 w-3" /> } : null
                    ].filter((v): v is NonNullable<typeof v> => v != null))}
                    tags={([
                        buildTag(
                            resolveReadableListingReferenceLabel(service.category),
                            "bg-violet-50 text-violet-700 border-violet-100"
                        ),
                        buildTag(resolveReadableListingReferenceLabel(service.brand))
                    ].filter((v): v is NonNullable<typeof v> => v != null))}
                />
            )
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
            onPost: isBusinessApproved ? () => navigateTo("post-spare-part-listing") : onRegisterBusiness,
            postLabel: isBusinessApproved ? "Post Spare Part" : "Register Business",
            emptyTitle: `No ${spareStatus} listings`,
            emptyDesc: "List spare parts to sell to repair shops and customers.",
            render: (listing: Listing) => (
                <ListingItem
                    title={listing.title}
                    status={listing.status}
                    listingType="spare_part"
                    thumbnail={listing.images?.[0]}
                    priceLabel={`₹${formatStableNumber(listing.price)}`}
                    badgeColor="teal"
                    createdAt={listing.createdAt}
                    getStatusBadge={getStatusBadge}
                    editHref={`/edit-spare-part/${listing.id}`}
                    detailHref={buildPublicListingDetailRoute({
                        id: listing.id,
                        listingType: "spare_part",
                        seoSlug: listing.seoSlug,
                        title: listing.title,
                    })}
                    onDelete={() => { setAdToDelete(listing); setIsDeleteAdOpen(true); }}
                    onRenew={() => handleRepostSpare(listing.id)}
                    onDeactivate={() => { setAdToDeactivate(listing); setIsDeactivateOpen(true); }}
                    onActivate={() => { setAdToActivate(listing); setIsActivateOpen(true); }}
                    onMarkSold={() => { setSpareToSell(listing); setSparesSoldReason(null); setIsSparesSoldOpen(true); }}
                    metaBadges={([
                        buildLocationMetaBadge(listing.location)
                    ].filter((v): v is NonNullable<typeof v> => v != null))}
                />
            )
        }
    } as const;

    // Safety fallback to 'ads' if subTab search param is invalid
    const currentConfig = (configMap[subTab as ListingSubTab] || configMap.ads) as SectionConfig;

    return (
        <div className="space-y-4">
            <UserListingsTemplate
                title={currentConfig.title}
                icon={currentConfig.icon}
                subTabs={SUB_TABS}
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

            {/* Modals */}
            <AlertDialog open={isDeleteAdOpen} onOpenChange={setIsDeleteAdOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive &ldquo;<strong>{adToDelete?.title}</strong>&rdquo;. It will no longer be visible to buyers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAd} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &ldquo;<strong>{adToDeactivate?.title}</strong>&rdquo; will be hidden from the public. You can reactivate it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeactivate} className="bg-orange-600 hover:bg-orange-700 text-white">
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reactivate listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &ldquo;<strong>{adToActivate?.title}</strong>&rdquo; will be sent back to moderation for review before becoming live.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmActivate} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Reactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SoldReasonDialog
                open={isSoldOpen}
                onOpenChange={setIsSoldOpen}
                description="How was this ad sold?"
                inputName="soldReason"
                selectedReason={soldReason}
                onReasonChange={setSoldReason}
                isSubmitting={isSelling}
                onConfirm={confirmSold}
            />

            <SoldReasonDialog
                open={isSparesSoldOpen}
                onOpenChange={setIsSparesSoldOpen}
                description="How was this spare part sold?"
                inputName="sparesSoldReason"
                selectedReason={sparesSoldReason}
                onReasonChange={setSparesSoldReason}
                isSubmitting={isSpareSelling}
                onConfirm={confirmSoldSpare}
            />
        </div>
    );
}
