"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Wrench, CircuitBoard, MapPin, Timer, Home, Wifi } from "lucide-react";
import type { Listing, ListingStatsResponse } from "@/lib/api/user/listings";
import type { User } from "@/types/User";
import { useProfileListings } from "./useProfileListings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { UserListingsTemplate } from "../../shared/UserListingsTemplate";
import { ListingItem } from "../../shared/ListingItem";
import { SoldReasonDialog, type SoldReason } from "../../shared/SoldReasonDialog";
import {
    ACCOUNT_LISTING_STATUS_TABS,
    buildAccountListingRoute,
    normalizeAccountListingStatus,
    type AccountListingSection,
} from "@/lib/accountListingRoutes";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/formatters";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

// ── Types & Constants ────────────────────────────────────────────────────────
type ListingSubTab = "ads" | "services" | "spare-parts";

const SUB_TABS: { value: ListingSubTab; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "ads", label: "Ads", icon: <Package className="h-4 w-4" />, color: "blue" },
    { value: "services", label: "Services", icon: <Wrench className="h-4 w-4" />, color: "violet" },
    { value: "spare-parts", label: "Spare Parts", icon: <CircuitBoard className="h-4 w-4" />, color: "teal" },
];

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
            void router.replace(buildAccountListingRoute(subTab as AccountListingSection, selectedStatus), { scroll: false });
        }
    }, [selectedStatus, searchParams, subTab, router]);

    const handleStatusChange = (status: ListingStatus) => {
        void router.replace(buildAccountListingRoute(subTab as AccountListingSection, status), { scroll: false });
    };

    const handleSubTabChange = (value: ListingSubTab) => {
        const nextStatus = normalizeAccountListingStatus(value as AccountListingSection, selectedStatus);
        void router.push(buildAccountListingRoute(value as AccountListingSection, nextStatus), { scroll: false });
    };

    // Dynamic Data Fetching
    const {
        listings: myAds, loading: loadingAds, error: adsError,
        handleDelete: handleDeleteAd, handleMarkSold: handleMarkAdSold,
        handleDeactivate: handleDeactivateAd, handleRepost: handleRepostAd,
        refetch: fetchMyAds
    } = useProfileListings("ads", subTab, user, adsStatus);

    const { 
        listings: myServices, loading: loadingServices, error: servicesError, 
        handleDelete: handleDeleteService, handleRepost: handleRepostService, refetch: fetchMyServices 
    } = useProfileListings("services", subTab, user, servicesStatus);

    const { 
        listings: mySpare, loading: loadingSpare, error: spareError, 
        handleDelete: handleDeleteSpare, handleMarkSold: handleMarkSpareSold, handleRepost: handleRepostSpare, refetch: fetchMySpare 
    } = useProfileListings("spare-parts", subTab, user, spareStatus);

    // Modal States
    const [adToDelete, setAdToDelete] = useState<Listing | null>(null);
    const [isDeleteAdOpen, setIsDeleteAdOpen] = useState(false);
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
        await handleDeleteAd(adToDelete.id);
        setIsDeleteAdOpen(false);
        setAdToDelete(null);
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

    // Shared Configuration
    const currentConfig = {
        ads: {
            title: "My Classified Ads",
            icon: <Package className="h-5 w-5 text-link" />,
            statusTabs: ACCOUNT_LISTING_STATUS_TABS.ads,
            selectedStatus: adsStatus,
            onStatusChange: handleStatusChange as any,
            getStatusCount: (s: any) => {
                const typeStats = adCounts?.ad || {};
                if (s === 'live') {
                    return (typeStats.live || 0) + (typeStats.approved || 0) + (typeStats.active || 0);
                }
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
                    onMarkSold={listing.status === "live" ? () => { setAdToSell(listing); setSoldReason(null); setIsSoldOpen(true); } : undefined}
                    onDeactivate={() => handleDeactivateAd(listing.id)}
                    onRenew={() => handleRepostAd(listing.id)}
                />
            )
        },
        services: {
            title: "My Professional Services",
            icon: <Wrench className="h-5 w-5 text-violet-600" />,
            statusTabs: ACCOUNT_LISTING_STATUS_TABS.services,
            selectedStatus: servicesStatus,
            onStatusChange: handleStatusChange as any,
            getStatusCount: (s: any) => {
                const typeStats = adCounts?.service || {};
                if (s === 'live') {
                    return (typeStats.live || 0) + (typeStats.approved || 0) + (typeStats.active || 0);
                }
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
                    thumbnail={service.images?.[0]}
                    priceLabel={service.priceMin ? `From ₹${service.priceMin.toLocaleString()}` : "Price on request"}
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
                    onDelete={() => handleDeleteService(service.id)}
                    onRenew={() => handleRepostService(service.id)}
                    metaBadges={[
                        service.location?.city ? { label: service.location.city, icon: <MapPin className="h-3 w-3" /> } : null,
                        service.onsiteService !== undefined ? {
                            label: service.onsiteService ? "On-site" : "Remote",
                            icon: service.onsiteService ? <Home className="h-3 w-3" /> : <Wifi className="h-3 w-3" />,
                            className: service.onsiteService ? "text-green-600" : "text-muted-foreground"
                        } : null,
                        service.turnaroundTime ? { label: service.turnaroundTime, icon: <Timer className="h-3 w-3" /> } : null
                    ].filter(Boolean) as any}
                    tags={[
                        (() => {
                            const name = (service.category as any)?.name || service.category;
                            return name ? { 
                                label: name, 
                                className: "bg-violet-50 text-violet-700 border-violet-100" 
                            } : null;
                        })(),
                        (() => {
                            const name = (service.brand as any)?.name || service.brand;
                            return name ? { label: name } : null;
                        })()
                    ].filter(Boolean) as any}
                />
            )
        },
        "spare-parts": {
            title: "My Spare Part Inventory",
            icon: <CircuitBoard className="h-5 w-5 text-teal-600" />,
            statusTabs: ACCOUNT_LISTING_STATUS_TABS["spare-parts"],
            selectedStatus: spareStatus,
            onStatusChange: handleStatusChange as any,
            getStatusCount: (s: any) => {
                const typeStats = adCounts?.spare_part || {};
                if (s === 'live') {
                    return (typeStats.live || 0) + (typeStats.approved || 0) + (typeStats.active || 0);
                }
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
                    thumbnail={listing.images?.[0]}
                    priceLabel={`₹${listing.price.toLocaleString()}`}
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
                    onDelete={() => handleDeleteSpare(listing.id)}
                    onRenew={() => handleRepostSpare(listing.id)}
                    onMarkSold={listing.status === "live" ? () => { setSpareToSell(listing); setSparesSoldReason(null); setIsSparesSoldOpen(true); } : undefined}
                    metaBadges={[
                        listing.location?.city ? { label: listing.location.city, icon: <MapPin className="h-3 w-3" /> } : null
                    ].filter(Boolean) as any}
                />
            )
        }
    }[subTab];

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
                getItemKey={(item) => (item as any).id}
                renderItem={(item) => currentConfig.render(item as any)}
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
