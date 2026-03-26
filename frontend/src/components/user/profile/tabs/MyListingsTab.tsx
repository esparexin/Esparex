"use client";
import { useState } from "react";
import { Package, Wrench, CircuitBoard, MapPin, Timer, Home, Wifi } from "lucide-react";
import type { Ad } from "@/lib/api/user/ads";
import type { Service } from "@/lib/api/user/services";
import type { SparePartListing } from "@/lib/api/user/sparePartListings";
import type { User } from "@/types/User";
import { markAsSold as markAdAsSold } from "@/lib/api/user/ads";
import { useProfileListings } from "./useProfileListings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { UserListingsTemplate } from "../../shared/UserListingsTemplate";
import { ListingItem } from "../../shared/ListingItem";
import { SoldReasonDialog, type SoldReason } from "../../shared/SoldReasonDialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/formatters";

// ── Types & Constants ────────────────────────────────────────────────────────
type AdsStatus = "live" | "pending" | "sold" | "expired" | "rejected" | "deactivated";
type ListingSubTab = "ads" | "services" | "spare-parts";

const STATUS_PILL_TABS_ADS = ["live", "pending", "sold", "expired", "rejected", "deactivated"] as const;
const STATUS_PILL_TABS_SERVICES = ["live", "pending", "expired", "rejected", "deactivated"] as const;
const STATUS_PILL_TABS_SPARE = ["live", "pending", "sold", "expired", "rejected", "deactivated"] as const;

const SUB_TABS: { value: ListingSubTab; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "ads", label: "Ads", icon: <Package className="h-4 w-4" />, color: "blue" },
    { value: "services", label: "Services", icon: <Wrench className="h-4 w-4" />, color: "violet" },
    { value: "spare-parts", label: "Spare Parts", icon: <CircuitBoard className="h-4 w-4" />, color: "teal" },
];

// ── Props ─────────────────────────────────────────────────────────────────────
export interface MyListingsTabProps {
    ads: Ad[];
    adCounts: Record<string, number>;
    loadingAds: boolean;
    myAdsStatusTab: AdsStatus;
    setMyAdsStatusTab: (tab: AdsStatus) => void;
    handleDeleteAd: (id: string | number) => Promise<void>;
    handleMarkAsSold: (id: string | number, soldReason?: SoldReason) => Promise<void>;
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
    ads, adCounts, loadingAds, myAdsStatusTab, setMyAdsStatusTab,
    handleDeleteAd, handleMarkAsSold,
    user, navigateTo, getStatusBadge,
    isBusinessApproved, onRegisterBusiness,
    initialSubTab = "ads",
}: MyListingsTabProps) {
    const [subTab, setSubTab] = useState<ListingSubTab>(initialSubTab);
    const [servicesStatus, setServicesStatus] = useState<ListingStatus>("live");
    const [spareStatus, setSpareStatus] = useState<ListingStatus>("live");

    // Dynamic Data Fetching (Services/Spare Parts)
    const { 
        listings: myServices, loading: loadingServices, error: servicesError, 
        handleDelete: handleDeleteService, handleRepost: handleRepostService, refetch: fetchMyServices 
    } = useProfileListings("services", subTab, user, servicesStatus);

    const { 
        listings: mySpare, loading: loadingSpare, error: spareError, 
        handleDelete: handleDeleteSpare, handleRepost: handleRepostSpare, refetch: fetchMySpare 
    } = useProfileListings("spare-parts", subTab, user, spareStatus);

    // Modal States
    const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
    const [isDeleteAdOpen, setIsDeleteAdOpen] = useState(false);
    const [adToSell, setAdToSell] = useState<Ad | null>(null);
    const [isSoldOpen, setIsSoldOpen] = useState(false);
    const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
    const [isSelling, setIsSelling] = useState(false);

    const [spareToSell, setSpareToSell] = useState<SparePartListing | null>(null);
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
        try { await handleMarkAsSold(adToSell.id, soldReason); }
        finally {
            setIsSelling(false);
            setAdToSell(null);
            setIsSoldOpen(false);
        }
    };

    const confirmSoldSpare = async () => {
        if (!spareToSell || !sparesSoldReason) return;
        setIsSpareSelling(true);
        try { await markAdAsSold(spareToSell.id, sparesSoldReason); }
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
            icon: <Package className="h-5 w-5 text-blue-600" />,
            statusTabs: STATUS_PILL_TABS_ADS,
            selectedStatus: myAdsStatusTab,
            onStatusChange: setMyAdsStatusTab as any,
            getStatusCount: (s: any) => adCounts[s] ?? 0,
            items: ads,
            loading: loadingAds,
            onPost: () => navigateTo("post-ad"),
            postLabel: "Post Ad",
            emptyTitle: `No ${myAdsStatusTab} ads`,
            emptyDesc: "Post your first ad to reach thousands of buyers.",
            render: (ad: Ad) => (
                <ListingItem
                    title={ad.title}
                    status={ad.status}
                    thumbnail={ad.images?.[0] ?? ad.image}
                    priceLabel={formatPrice(ad.price)}
                    badgeColor="blue"
                    createdAt={ad.createdAt}
                    expiresAt={ad.expiresAt}
                    views={ad.views}
                    likes={ad.likes}
                    getStatusBadge={getStatusBadge}
                    editHref={`/edit-ad/${ad.id}`}
                    detailHref={`/ad-detail/${ad.id}`}
                    onDelete={() => { setAdToDelete(ad); setIsDeleteAdOpen(true); }}
                    onMarkSold={() => { setAdToSell(ad); setSoldReason(null); setIsSoldOpen(true); }}
                />
            )
        },
        services: {
            title: "My Professional Services",
            icon: <Wrench className="h-5 w-5 text-violet-600" />,
            statusTabs: STATUS_PILL_TABS_SERVICES,
            selectedStatus: servicesStatus,
            onStatusChange: setServicesStatus as any,
            items: myServices,
            loading: loadingServices,
            error: servicesError,
            onRetry: fetchMyServices,
            onPost: isBusinessApproved ? () => navigateTo("post-service") : onRegisterBusiness,
            postLabel: isBusinessApproved ? "Post Service" : "Register Business",
            emptyTitle: `No ${servicesStatus} services`,
            emptyDesc: "List your repair or maintenance services to attract customers.",
            render: (service: Service) => (
                <ListingItem
                    title={service.title}
                    status={service.status}
                    thumbnail={service.images?.[0]}
                    priceLabel={service.priceMin ? `From ₹${service.priceMin.toLocaleString()}` : "Price on request"}
                    badgeColor="violet"
                    createdAt={service.createdAt}
                    getStatusBadge={getStatusBadge}
                    editHref={`/edit-service/${service.id}`}
                    onDelete={() => handleDeleteService(service.id)}
                    onRenew={() => handleRepostService(service.id)}
                    metaBadges={[
                        service.location?.city ? { label: service.location.city, icon: <MapPin className="h-3 w-3" /> } : null,
                        service.onsiteService !== undefined ? {
                            label: service.onsiteService ? "On-site" : "Remote",
                            icon: service.onsiteService ? <Home className="h-3 w-3" /> : <Wifi className="h-3 w-3" />,
                            className: service.onsiteService ? "text-green-600" : "text-slate-500"
                        } : null,
                        service.turnaroundTime ? { label: service.turnaroundTime, icon: <Timer className="h-3 w-3" /> } : null
                    ].filter(Boolean) as any}
                    tags={[
                        service.category?.name ? { label: service.category.name, className: "bg-violet-50 text-violet-700 border-violet-100" } : null,
                        service.brand?.name ? { label: service.brand.name } : null
                    ].filter(Boolean) as any}
                />
            )
        },
        "spare-parts": {
            title: "My Spare Part Inventory",
            icon: <CircuitBoard className="h-5 w-5 text-teal-600" />,
            statusTabs: STATUS_PILL_TABS_SPARE,
            selectedStatus: spareStatus,
            onStatusChange: setSpareStatus as any,
            items: mySpare,
            loading: loadingSpare,
            error: spareError,
            onRetry: fetchMySpare,
            onPost: isBusinessApproved ? () => navigateTo("post-spare-part-listing") : onRegisterBusiness,
            postLabel: isBusinessApproved ? "Post Spare Part" : "Register Business",
            emptyTitle: `No ${spareStatus} listings`,
            emptyDesc: "List spare parts to sell to repair shops and customers.",
            render: (listing: SparePartListing) => (
                <ListingItem
                    title={listing.title}
                    status={listing.status}
                    thumbnail={listing.images?.[0]}
                    priceLabel={`₹${listing.price.toLocaleString()}`}
                    badgeColor="teal"
                    createdAt={listing.createdAt}
                    getStatusBadge={getStatusBadge}
                    editHref={`/edit-spare-part/${listing.id}`}
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
                onSubTabChange={(v) => setSubTab(v as ListingSubTab)}
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
