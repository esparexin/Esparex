import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import ACCOUNT_COPY from '@/config/copy/account';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageStateGuard, PageState } from "@/components/ui/PageStateGuard";
import { Package, PlusCircle, AlertTriangle, Eye, Heart, Clock, Edit2, Trash2, CheckSquare } from "lucide-react";
import type { Ad } from "@/api/user/ads";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import FeatureCard from '@/components/user/FeatureCard';
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import { formatPrice } from "@/utils/formatters";
import { LISTING_TYPE } from "@shared/enums/listingType";
import type { UserPage } from "@/lib/routeUtils";

type SoldReason = 'sold_on_platform' | 'sold_outside' | 'no_longer_available';
type MyAd = Ad;

interface MyAdsTabProps {
    ads: MyAd[];
    adCounts: Record<string, number>;
    loadingAds: boolean;
    myAdsTab: "live" | "pending" | "sold" | "expired" | "rejected" | "deactivated";
    setMyAdsTab: (tab: "live" | "pending" | "sold" | "expired" | "rejected" | "deactivated") => void;
    navigateTo: (
        page: UserPage,
        adId?: string | number,
        category?: string,
        businessId?: string,
        serviceId?: string | number
    ) => void;
    getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
    fetchMyAds: () => void;
    formatDate: (date: string | Date) => string;
    handleDeleteAd: (id: string | number) => Promise<void>;
    handleMarkAsSold: (id: string | number, soldReason?: SoldReason) => Promise<void>;
}

const EDITABLE_STATUSES = new Set(['live']);

const SOLD_REASON_OPTIONS: { value: SoldReason; label: string }[] = [
    { value: 'sold_on_platform', label: 'Sold on Esparex' },
    { value: 'sold_outside', label: 'Sold outside platform' },
    { value: 'no_longer_available', label: 'No longer available' },
];

export function MyAdsTab({
    ads,
    adCounts,
    loadingAds,
    myAdsTab,
    setMyAdsTab,
    navigateTo,
    getStatusBadge,
    fetchMyAds,
    formatDate,
    handleDeleteAd,
    handleMarkAsSold,
}: MyAdsTabProps) {
    const [adToDelete, setAdToDelete] = useState<MyAd | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // Mark as Sold modal state
    const [adToSell, setAdToSell] = useState<MyAd | null>(null);
    const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
    const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
    const [isSelling, setIsSelling] = useState(false);

    const currentAds = ads;
    const tabState: PageState = loadingAds ? "loading" : currentAds.length === 0 ? "empty" : "ready";

    /* ── Delete handlers ── */
    const handleDeleteClick = (ad: MyAd) => {
        setAdToDelete(ad);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (adToDelete) {
            await handleDeleteAd(adToDelete.id);
            setIsDeleteDialogOpen(false);
            setAdToDelete(null);
        }
    };

    /* ── Mark as Sold handlers ── */
    const handleSoldClick = (ad: MyAd) => {
        setAdToSell(ad);
        setSoldReason(null);
        setIsSoldModalOpen(true);
    };

    const confirmSold = async () => {
        if (!adToSell || !soldReason) return;
        setIsSelling(true);
        try {
            await handleMarkAsSold(adToSell.id, soldReason);
        } finally {
            setIsSelling(false);
            setIsSoldModalOpen(false);
            setAdToSell(null);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="border-0 shadow-sm md:border md:shadow-sm">
                <FeatureCard
                    title={(<><Package className="h-5 w-5 text-blue-600" /> My Ads</>)}
                    description={ACCOUNT_COPY.myAdsDescription}
                    Icon={Package}
                    rightAction={
                        <Button onClick={() => navigateTo("post-ad")} className="bg-blue-600 hover:bg-blue-700 h-9 text-xs md:text-sm text-white">
                            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                            Post New Ad
                        </Button>
                    }
                />

                {/* Tabs for Ad Status */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-6">
                    {(["live", "pending", "sold", "expired", "rejected", "deactivated"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setMyAdsTab(tab)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${myAdsTab === tab
                                ? "bg-slate-900 text-white shadow-lg"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            <span className="ml-1.5 opacity-60 text-[10px]">
                                {adCounts[tab] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
                    <PageStateGuard
                        state={tabState}
                        loading={
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100">
                                        <Skeleton className="h-20 w-20 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                        empty={
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                <h3 className="text-sm font-medium text-slate-900">No {myAdsTab} ads</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                                    Ads marked as {myAdsTab} will appear here.
                                </p>
                                {myAdsTab === 'live' && (
                                    <>
                                        <p className="text-[10px] text-slate-400 mt-2">Live ads are visible on the Home Page until they expire.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => navigateTo("post-ad")}
                                        >
                                            Post an Ad
                                        </Button>
                                    </>
                                )}
                                {myAdsTab === 'pending' && <p className="text-[10px] text-amber-600 mt-2">Pending ads are being reviewed and are NOT visible on Home Page yet.</p>}
                                {myAdsTab === 'rejected' && <p className="text-[10px] text-red-500 mt-2">Rejected ads are hidden from public view. Review the rejection reason in the listing.</p>}
                                {myAdsTab === 'expired' && <p className="text-[10px] text-slate-400 mt-2">Expired ads are no longer visible on the Home Page. You can delete them and repost a fresh listing.</p>}
                                {myAdsTab === 'deactivated' && <p className="text-[10px] text-slate-400 mt-2">Deactivated ads are hidden due to moderation or policy action.</p>}
                            </div>
                        }
                        error={
                            <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
                                <AlertTriangle className="h-10 w-10 mb-2 opacity-50" />
                                <p className="text-sm font-medium">Failed to load {myAdsTab} ads.</p>
                                <Button
                                    onClick={() => fetchMyAds()}
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                >
                                    Retry
                                </Button>
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 gap-3">
                            {currentAds.map((ad) => {
                                const canEdit = EDITABLE_STATUSES.has(ad.status || '');
                                const isRejected = ad.status === 'rejected';
                                const isActive = ad.status === 'live';
                                const listingType = String((ad as { listingType?: string }).listingType || LISTING_TYPE.AD);
                                const openDetail = () => {
                                    if (listingType === LISTING_TYPE.SERVICE) {
                                        navigateTo("service-detail", undefined, undefined, undefined, ad.id);
                                        return;
                                    }
                                    if (listingType === LISTING_TYPE.SPARE_PART) {
                                        navigateTo("spare-part-listing", ad.id);
                                        return;
                                    }
                                    navigateTo("ad-detail", ad.id);
                                };
                                const openEdit = () => {
                                    if (listingType === LISTING_TYPE.SERVICE) {
                                        navigateTo("edit-service", undefined, undefined, undefined, ad.id);
                                        return;
                                    }
                                    if (listingType === LISTING_TYPE.SPARE_PART) {
                                        navigateTo("edit-spare-part", ad.id);
                                        return;
                                    }
                                    navigateTo("edit-ad", ad.id);
                                };

                                return (
                                    <div
                                        key={ad.id}
                                        className="flex gap-3 p-3 rounded-xl border bg-white hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer"
                                        onClick={openDetail}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                openDetail();
                                            }
                                        }}
                                    >
                                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                            <Image
                                                src={toSafeImageSrc(ad.images?.[0] || ad.image, DEFAULT_IMAGE_PLACEHOLDER)}
                                                alt={ad.title}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                                sizes="80px"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-medium text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{ad.title}</h3>
                                                    {getStatusBadge(ad.status || "pending", ad.id)}
                                                </div>
                                                <p className="text-xs font-semibold text-slate-900 mt-0.5">{formatPrice(ad.price)}</p>

                                                {/* Rejection reason */}
                                                {isRejected && (ad as any).rejectionReason && (
                                                    <p className="text-[10px] text-red-500 mt-0.5 line-clamp-2">
                                                        Reason: {(ad as any).rejectionReason}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />{" "}
                                                        {typeof ad.views === "number"
                                                            ? ad.views
                                                            : (ad.views &&
                                                                typeof ad.views === "object" &&
                                                                "total" in ad.views &&
                                                                typeof ad.views.total === "number"
                                                                ? ad.views.total
                                                                : 0)}{" "}
                                                        views
                                                    </span>
                                                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {ad.likes || 0} likes</span>
                                                    {ad.status === 'live' && ad.expiresAt && (
                                                        <span className="flex items-center gap-1 text-amber-600 font-medium whitespace-nowrap">
                                                            <Clock className="h-3 w-3" /> Expires {formatDate(ad.expiresAt || new Date())}
                                                        </span>
                                                    )}
                                                    {ad.status !== 'live' && (
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(ad.createdAt || new Date())}</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-end gap-2 mt-2 flex-wrap">
                                                    {isActive && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSoldClick(ad);
                                                            }}
                                                        >
                                                            <CheckSquare className="h-3 w-3 mr-1" /> Mark Sold
                                                        </Button>
                                                    )}

                                                    {/* Edit — only for editable statuses */}
                                                    {canEdit && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEdit();
                                                            }}
                                                        >
                                                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                                                        </Button>
                                                    )}

                                                    {/* Delete always visible */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(ad);
                                                        }}
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
                    </PageStateGuard>
                </CardContent>
            </Card>

            {/* ── Delete Confirmation Dialog ── */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive &ldquo;<strong>{adToDelete?.title}</strong>&rdquo;. It will no longer be visible to buyers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Ad
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Mark as Sold Modal ── */}
            <Dialog open={isSoldModalOpen} onOpenChange={setIsSoldModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mark as Sold</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 mb-3">How was this ad sold?</p>
                    <div className="space-y-2">
                        {SOLD_REASON_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${soldReason === opt.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <input
                                    id={`sold-reason-${opt.value}`}
                                    type="radio"
                                    name="soldReason"
                                    value={opt.value}
                                    checked={soldReason === opt.value}
                                    onChange={() => setSoldReason(opt.value)}
                                    className="accent-blue-600"
                                />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsSoldModalOpen(false)} disabled={isSelling}>Cancel</Button>
                        <Button
                            onClick={confirmSold}
                            disabled={!soldReason || isSelling}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isSelling ? 'Updating…' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
