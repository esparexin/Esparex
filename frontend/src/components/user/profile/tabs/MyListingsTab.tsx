"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Package, Wrench, CircuitBoard, PlusCircle, Lock,
    Eye, Heart, Clock, Edit2, Trash2, CheckSquare,
    AlertTriangle, MapPin, Timer, Home, Wifi,
} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { Ad } from "@/api/user/ads";
import type { Service } from "@/api/user/services";
import type { SparePartListing } from "@/api/user/sparePartListings";
import type { User } from "@/types/User";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import { formatPrice } from "@/utils/formatters";
import { markAsSold } from "@/api/user/ads";
import { useMyServices, type MyServicesStatus } from "./MyServicesTab.hook";
import { useMySpare, type MySparePartsStatus } from "./MySparePartsTab.hook";

// ── Types ────────────────────────────────────────────────────────────────────
type AdsStatus = "live" | "pending" | "sold" | "expired" | "rejected" | "deactivated";
type SoldReason = "sold_on_platform" | "sold_outside" | "no_longer_available";
type ListingSubTab = "ads" | "services" | "spare-parts";

const SOLD_REASON_OPTIONS: { value: SoldReason; label: string }[] = [
    { value: "sold_on_platform", label: "Sold on Esparex" },
    { value: "sold_outside", label: "Sold outside platform" },
    { value: "no_longer_available", label: "No longer available" },
];

const STATUS_PILL_TABS_ADS = ["live", "pending", "sold", "expired", "rejected", "deactivated"] as const;
const STATUS_PILL_TABS_SERVICES = ["live", "pending", "expired", "rejected", "deactivated"] as const;
const STATUS_PILL_TABS_SPARE = ["live", "pending", "sold", "expired", "rejected", "deactivated"] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
export interface MyListingsTabProps {
    // Ads data — fetched in parent (useMyAds)
    ads: Ad[];
    adCounts: Record<string, number>;
    loadingAds: boolean;
    myAdsStatusTab: AdsStatus;
    setMyAdsStatusTab: (tab: AdsStatus) => void;
    handleDeleteAd: (id: string | number) => Promise<void>;
    handleMarkAsSold: (id: string | number, soldReason?: SoldReason) => Promise<void>;
    // Common
    user: User | null;
    navigateTo: (page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string) => void;
    getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
    formatDate: (date: string | Date) => string;
    isBusinessApproved?: boolean;
    onRegisterBusiness?: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MyListingsTab({
    ads, adCounts, loadingAds, myAdsStatusTab, setMyAdsStatusTab,
    handleDeleteAd, handleMarkAsSold,
    user, navigateTo, getStatusBadge, formatDate,
    isBusinessApproved, onRegisterBusiness,
}: MyListingsTabProps) {
    const [subTab, setSubTab] = useState<ListingSubTab>("ads");
    const [servicesStatus, setServicesStatus] = useState<MyServicesStatus>("live");
    const [spareStatus, setSpareStatus] = useState<MySparePartsStatus>("live");

    // Services — only enabled when that sub-tab is active
    const { myServices, loadingServices, servicesError, handleDeleteService, fetchMyServices } =
        useMyServices(subTab === "services" ? "services" : "", user, servicesStatus);

    // Spare parts — only enabled when that sub-tab is active
    const { mySpare, loadingSpare, spareError, handleDeleteSpare, fetchMySpare } =
        useMySpare(subTab === "spare-parts" ? "spare-parts" : "", user, spareStatus);

    // Ad delete state
    const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
    const [isDeleteAdOpen, setIsDeleteAdOpen] = useState(false);
    // Mark as sold state (ads)
    const [adToSell, setAdToSell] = useState<Ad | null>(null);
    const [isSoldOpen, setIsSoldOpen] = useState(false);
    const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
    const [isSelling, setIsSelling] = useState(false);
    // Mark as sold state (spare parts)
    const [spareToSell, setSpareToSell] = useState<SparePartListing | null>(null);
    const [isSparesSoldOpen, setIsSparesSoldOpen] = useState(false);
    const [sparesSoldReason, setSparesSoldReason] = useState<SoldReason | null>(null);
    const [isSpareSelling, setIsSpareSelling] = useState(false);

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
            setIsSoldOpen(false);
            setAdToSell(null);
        }
    };

    const confirmSoldSpare = async () => {
        if (!spareToSell || !sparesSoldReason) return;
        setIsSpareSelling(true);
        try { await markAsSold(spareToSell.id, sparesSoldReason); }
        finally {
            setIsSpareSelling(false);
            setIsSparesSoldOpen(false);
            setSpareToSell(null);
        }
    };

    const SUB_TABS: { value: ListingSubTab; label: string; icon: React.ReactNode; color: string }[] = [
        { value: "ads", label: "Ads", icon: <Package className="h-4 w-4" />, color: "blue" },
        { value: "services", label: "Services", icon: <Wrench className="h-4 w-4" />, color: "violet" },
        { value: "spare-parts", label: "Spare Parts", icon: <CircuitBoard className="h-4 w-4" />, color: "teal" },
    ];

    const tabColor = SUB_TABS.find(t => t.value === subTab)?.color ?? "blue";
    const activeTabClass = {
        blue: "border-blue-600 text-blue-700",
        violet: "border-violet-600 text-violet-700",
        teal: "border-teal-600 text-teal-700",
    }[tabColor];
    const postBtnClass = {
        blue: "bg-blue-600 hover:bg-blue-700",
        violet: "bg-violet-600 hover:bg-violet-700",
        teal: "bg-teal-600 hover:bg-teal-700",
    }[tabColor];

    return (
        <div className="space-y-4">
            <Card className="border-0 shadow-sm md:border md:shadow-sm overflow-hidden">
                {/* ── Header ── */}
                <div className="px-4 md:px-6 pt-5 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            My Listings
                        </h2>
                        {(subTab === "ads" || isBusinessApproved) ? (
                            <Button
                                onClick={() => {
                                    if (subTab === "ads") navigateTo("post-ad");
                                    else if (subTab === "services") navigateTo("post-service");
                                    else navigateTo("post-spare-part-listing");
                                }}
                                size="sm"
                                className={`${postBtnClass} text-white text-xs h-8 px-3`}
                            >
                                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                                {subTab === "ads" ? "Post Ad" : subTab === "services" ? "Post Service" : "Post Spare Part"}
                            </Button>
                        ) : (
                            <Button
                                onClick={onRegisterBusiness}
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-3 text-slate-400 border-slate-200"
                            >
                                <Lock className="h-3 w-3 mr-1.5" />
                                {subTab === "services" ? "Post Service" : "Post Spare Part"}
                            </Button>
                        )}
                    </div>

                    {/* ── Sub-tab Pills ── */}
                    <div className="flex gap-0 border-b border-slate-100">
                        {SUB_TABS.map(t => (
                            <button
                                key={t.value}
                                onClick={() => setSubTab(t.value)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap
                                    ${subTab === t.value
                                        ? activeTabClass
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <CardContent className="px-3 md:px-6 pt-3 pb-5">

                    {/* ════════════════════ ADS ════════════════════ */}
                    {subTab === "ads" && (
                        <>
                            {/* Status filter pills */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                                {STATUS_PILL_TABS_ADS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setMyAdsStatusTab(s)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${myAdsStatusTab === s
                                            ? "bg-slate-900 text-white shadow"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                        <span className="ml-1.5 opacity-60 text-[10px]">{adCounts[s] ?? 0}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            {loadingAds ? (
                                <LoadingSkeleton />
                            ) : ads.length === 0 ? (
                                <EmptyState
                                    icon={<Package className="h-12 w-12 text-slate-300" />}
                                    title={`No ${myAdsStatusTab} ads`}
                                    description={
                                        myAdsStatusTab === "live" ? "Post your first ad to reach thousands of buyers."
                                            : myAdsStatusTab === "pending" ? "Pending ads are being reviewed."
                                                : myAdsStatusTab === "rejected" ? "Rejected ads appear here. Review the reason and repost."
                                                    : `${myAdsStatusTab.charAt(0).toUpperCase() + myAdsStatusTab.slice(1)} ads will appear here.`
                                    }
                                    cta={myAdsStatusTab === "live" ? (
                                        <Button variant="outline" size="sm" onClick={() => navigateTo("post-ad")}>
                                            <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Post an Ad
                                        </Button>
                                    ) : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {ads.map(ad => {
                                        const canEdit = ["live", "pending", "rejected"].includes(ad.status);
                                        const isActive = ad.status === "live";
                                        return (
                                            <div
                                                key={ad.id}
                                                role="button" tabIndex={0}
                                                className="flex gap-3 p-3 rounded-xl border bg-white hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer"
                                                onClick={() => navigateTo("ad-detail", ad.id)}
                                                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigateTo("ad-detail", ad.id); } }}
                                            >
                                                <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                                                    <Image
                                                        src={toSafeImageSrc(ad.images?.[0] ?? ad.image, DEFAULT_IMAGE_PLACEHOLDER)}
                                                        alt={ad.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="80px"
                                                    />
                                                </div>
                                                <div className="flex flex-1 flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className="font-medium text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{ad.title}</h3>
                                                            {getStatusBadge(ad.status ?? "pending", ad.id)}
                                                        </div>
                                                        <p className="text-xs font-semibold text-slate-900 mt-0.5">{formatPrice(ad.price)}</p>
                                                        {ad.status === "rejected" && (ad as any).rejectionReason && (
                                                            <p className="text-[10px] text-red-500 mt-0.5 line-clamp-2">Reason: {(ad as any).rejectionReason}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {typeof ad.views === "number" ? ad.views : (ad.views as any)?.total ?? 0} views
                                                            </span>
                                                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {(ad.views as any)?.favorites ?? ad.likes ?? 0}</span>
                                                            {ad.status === "live" && ad.expiresAt && (
                                                                <span className="flex items-center gap-1 text-amber-600 font-medium">
                                                                    <Clock className="h-3 w-3" /> Expires {formatDate(ad.expiresAt)}
                                                                </span>
                                                            )}
                                                            {ad.status !== "live" && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" /> {formatDate(ad.createdAt ?? new Date())}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-end gap-2 mt-2 flex-wrap">
                                                            {isActive && (
                                                                <Button size="sm" variant="outline"
                                                                    className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                                                                    onClick={e => { e.stopPropagation(); setAdToSell(ad); setSoldReason(null); setIsSoldOpen(true); }}
                                                                >
                                                                    <CheckSquare className="h-3 w-3 mr-1" /> Mark Sold
                                                                </Button>
                                                            )}
                                                            {canEdit && (
                                                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                                                    onClick={e => { e.stopPropagation(); navigateTo("edit-ad", ad.id); }}
                                                                >
                                                                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="ghost"
                                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={e => { e.stopPropagation(); setAdToDelete(ad); setIsDeleteAdOpen(true); }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ════════════════════ SERVICES ════════════════════ */}
                    {subTab === "services" && (
                        <>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                                {STATUS_PILL_TABS_SERVICES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setServicesStatus(s as MyServicesStatus)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${servicesStatus === s
                                            ? "bg-slate-900 text-white shadow"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {loadingServices ? (
                                <LoadingSkeleton />
                            ) : servicesError ? (
                                <ErrorState message="Failed to load services." onRetry={fetchMyServices} />
                            ) : myServices.length === 0 ? (
                                <EmptyState
                                    icon={<Wrench className="h-12 w-12 text-slate-300" />}
                                    title={`No ${servicesStatus} services`}
                                    description={
                                        servicesStatus === "live"
                                            ? "List your repair or maintenance services to attract customers."
                                            : `${servicesStatus.charAt(0).toUpperCase() + servicesStatus.slice(1)} services will appear here.`
                                    }
                                    cta={servicesStatus === "live" ? (
                                        isBusinessApproved ? (
                                            <Button variant="outline" size="sm" onClick={() => navigateTo("post-service")}>
                                                <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Post a Service
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={onRegisterBusiness}>
                                                Register Business to Post Services
                                            </Button>
                                        )
                                    ) : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {myServices.map((service: Service) => (
                                        <ServiceCard
                                            key={service.id}
                                            service={service}
                                            getStatusBadge={getStatusBadge}
                                            onDelete={() => handleDeleteService(service.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ════════════════════ SPARE PARTS ════════════════════ */}
                    {subTab === "spare-parts" && (
                        <>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                                {STATUS_PILL_TABS_SPARE.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSpareStatus(s as MySparePartsStatus)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${spareStatus === s
                                            ? "bg-slate-900 text-white shadow"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {loadingSpare ? (
                                <LoadingSkeleton />
                            ) : spareError ? (
                                <ErrorState message="Failed to load spare parts." onRetry={fetchMySpare} />
                            ) : mySpare.length === 0 ? (
                                <EmptyState
                                    icon={<CircuitBoard className="h-12 w-12 text-slate-300" />}
                                    title={`No ${spareStatus} spare part listings`}
                                    description={
                                        spareStatus === "live"
                                            ? "List spare parts to sell to repair shops and customers."
                                            : `${spareStatus.charAt(0).toUpperCase() + spareStatus.slice(1)} listings will appear here.`
                                    }
                                    cta={spareStatus === "live" ? (
                                        isBusinessApproved ? (
                                            <Button variant="outline" size="sm" onClick={() => navigateTo("post-spare-part-listing")}>
                                                <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Post Spare Part
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={onRegisterBusiness}>
                                                Register Business to Post Spare Parts
                                            </Button>
                                        )
                                    ) : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {mySpare.map((listing: SparePartListing) => (
                                        <SparePartCard
                                            key={listing.id}
                                            listing={listing}
                                            getStatusBadge={getStatusBadge}
                                            onDelete={() => handleDeleteSpare(listing.id)}
                                            onMarkSold={() => {
                                                setSpareToSell(listing);
                                                setSparesSoldReason(null);
                                                setIsSparesSoldOpen(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Delete Ad Dialog ── */}
            <AlertDialog open={isDeleteAdOpen} onOpenChange={setIsDeleteAdOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive &ldquo;<strong>{adToDelete?.title}</strong>&rdquo;. It will no longer be visible to buyers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAd} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Ad
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Mark as Sold Modal (Ads) ── */}
            <Dialog open={isSoldOpen} onOpenChange={setIsSoldOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Mark as Sold</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500 mb-3">How was this ad sold?</p>
                    <div className="space-y-2">
                        {SOLD_REASON_OPTIONS.map(opt => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${soldReason === opt.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                            >
                                <input type="radio" name="soldReason" value={opt.value}
                                    checked={soldReason === opt.value} onChange={() => setSoldReason(opt.value)}
                                    className="accent-blue-600"
                                />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsSoldOpen(false)} disabled={isSelling}>Cancel</Button>
                        <Button onClick={confirmSold} disabled={!soldReason || isSelling} className="bg-green-600 hover:bg-green-700 text-white">
                            {isSelling ? "Updating…" : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Mark as Sold Modal (Spare Parts) ── */}
            <Dialog open={isSparesSoldOpen} onOpenChange={setIsSparesSoldOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Mark as Sold</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500 mb-3">How was this spare part sold?</p>
                    <div className="space-y-2">
                        {SOLD_REASON_OPTIONS.map(opt => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${sparesSoldReason === opt.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                            >
                                <input type="radio" name="sparesSoldReason" value={opt.value}
                                    checked={sparesSoldReason === opt.value} onChange={() => setSparesSoldReason(opt.value)}
                                    className="accent-blue-600"
                                />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsSparesSoldOpen(false)} disabled={isSpareSelling}>Cancel</Button>
                        <Button onClick={confirmSoldSpare} disabled={!sparesSoldReason || isSpareSelling} className="bg-green-600 hover:bg-green-700 text-white">
                            {isSpareSelling ? "Updating…" : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({
    service, getStatusBadge, onDelete,
}: {
    service: Service;
    getStatusBadge: (status: string) => React.ReactNode;
    onDelete: () => void;
}) {
    const thumbnail = service.images?.[0];
    const timeAgo = service.createdAt
        ? formatDistanceToNow(new Date(service.createdAt), { addSuffix: true })
        : "";

    const priceLabel = service.priceType === "range" && service.priceMin != null && service.priceMax != null
        ? `₹${service.priceMin.toLocaleString()} – ₹${service.priceMax.toLocaleString()}`
        : service.priceType === "starting_from" && service.priceMin != null
            ? `From ₹${service.priceMin.toLocaleString()}`
            : service.price != null
                ? `₹${service.price.toLocaleString()}`
                : "Price on request";

    return (
        <div className="flex gap-3 p-3 rounded-xl border bg-white hover:border-violet-200 hover:shadow-sm transition-all group">
            {/* Thumbnail */}
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-violet-50 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <Wrench className="w-8 h-8 text-violet-300" />
                )}
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm line-clamp-1 text-slate-900">{service.title}</h3>
                        {getStatusBadge(service.status)}
                    </div>
                    <p className="text-xs font-bold text-violet-700 mt-0.5">{priceLabel}</p>

                    {service.status === "rejected" && service.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-0.5 line-clamp-2">Reason: {service.rejectionReason}</p>
                    )}

                    {/* Meta badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {service.location?.city && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <MapPin className="h-3 w-3" /> {service.location.city}
                            </span>
                        )}
                        {service.onsiteService !== undefined && (
                            <span className={`flex items-center gap-1 text-[10px] font-medium ${service.onsiteService ? "text-green-600" : "text-slate-500"}`}>
                                {service.onsiteService ? <Home className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                                {service.onsiteService ? "On-site" : "Remote"}
                            </span>
                        )}
                        {service.turnaroundTime && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Timer className="h-3 w-3" /> {service.turnaroundTime}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" /> {timeAgo}
                        </span>
                    </div>

                    {/* Category / brand tags */}
                    {(service.category?.name || service.brand?.name) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {service.category?.name && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-medium border border-violet-100">
                                    {service.category.name}
                                </span>
                            )}
                            {service.brand?.name && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-100">
                                    {service.brand.name}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-2">
                    <Link href={`/edit-service/${service.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Spare Part Card ───────────────────────────────────────────────────────────
function SparePartCard({
    listing, getStatusBadge, onDelete, onMarkSold,
}: {
    listing: SparePartListing;
    getStatusBadge: (status: string) => React.ReactNode;
    onDelete: () => void;
    onMarkSold: () => void;
}) {
    const thumbnail = listing.images?.[0];
    const timeAgo = listing.createdAt
        ? formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })
        : "";

    const compatibleNames = (listing.compatibleModels ?? []).map((m) => {
        if (typeof m === "string") return m;
        return (m as any).name ?? String(m);
    });

    return (
        <div className="flex gap-3 p-3 rounded-xl border bg-white hover:border-teal-200 hover:shadow-sm transition-all group">
            {/* Thumbnail */}
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-teal-50 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <CircuitBoard className="w-8 h-8 text-teal-300" />
                )}
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm line-clamp-1 text-slate-900">{listing.title}</h3>
                        {getStatusBadge(listing.status)}
                    </div>
                    <p className="text-xs font-bold text-teal-700 mt-0.5">₹{listing.price.toLocaleString()}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {listing.location?.city && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <MapPin className="h-3 w-3" /> {listing.location.city}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" /> {timeAgo}
                        </span>
                    </div>

                    {/* Compatible models */}
                    {compatibleNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {compatibleNames.slice(0, 3).map((name, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-medium border border-teal-100">
                                    {name}
                                </span>
                            ))}
                            {compatibleNames.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-medium border border-slate-100">
                                    +{compatibleNames.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-2">
                    {listing.status === "live" && (
                        <Button size="sm" variant="outline"
                            className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                            onClick={onMarkSold}
                        >
                            <CheckSquare className="h-3 w-3 mr-1" /> Mark Sold
                        </Button>
                    )}
                    <Link href={`/edit-spare-part/${listing.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100">
                    <Skeleton className="h-20 w-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ icon, title, description, cta }: {
    icon: React.ReactNode; title: string; description: string; cta?: React.ReactNode;
}) {
    return (
        <div className="text-center py-14 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="flex justify-center mb-3">{icon}</div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">{description}</p>
            {cta && <div className="mt-4">{cta}</div>}
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
            <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">Retry</Button>
            )}
        </div>
    );
}
