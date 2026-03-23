import React, { useState } from "react";
import { Loader } from "./Loader";
import { ErrorBanner } from "./ErrorBanner";
import { formatDistanceToNow } from "date-fns";
import { useMySpare } from "./MySparePartsTab.hook";
import type { MySparePartsStatus } from "./MySparePartsTab.hook";
import type { SparePartListing } from "@/api/user/sparePartListings";
import type { User } from "@/types/User";
import { CircuitBoard, Trash2, Edit, CheckSquare, Lock, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

type SoldReason = "sold_on_platform" | "sold_outside" | "no_longer_available";

const SOLD_REASON_OPTIONS: { value: SoldReason; label: string }[] = [
    { value: "sold_on_platform", label: "Sold on Esparex" },
    { value: "sold_outside", label: "Sold outside platform" },
    { value: "no_longer_available", label: "No longer available" },
];

const STATUS_TABS: MySparePartsStatus[] = ["live", "pending", "sold", "expired", "rejected", "deactivated"];

export interface MySparePartsTabProps {
    user: User | null;
    activeTab: string;
    statusFilter?: MySparePartsStatus;
    getStatusBadge: (status: string) => React.ReactNode;
    formatDate: (date: string | Date) => string;
    isBusinessApproved?: boolean;
    onRegisterBusiness?: () => void;
}

export function MySparePartsTab({
    user,
    activeTab,
    statusFilter = "live",
    getStatusBadge,
    isBusinessApproved,
    onRegisterBusiness,
}: MySparePartsTabProps) {
    const [currentStatus, setCurrentStatus] = useState<MySparePartsStatus>(statusFilter);
    const { mySpare, loadingSpare, spareError, handleDeleteSpare, handleMarkSoldSpare, handleDeactivateSpare } = useMySpare(
        activeTab,
        user,
        currentStatus
    );

    const [spareToSell, setSpareToSell] = useState<SparePartListing | null>(null);
    const [isSoldOpen, setIsSoldOpen] = useState(false);
    const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
    const [isSelling, setIsSelling] = useState(false);

    const confirmSold = async () => {
        if (!spareToSell || !soldReason) return;
        setIsSelling(true);
        try {
            await handleMarkSoldSpare(spareToSell.id, soldReason);
        } finally {
            setIsSelling(false);
            setIsSoldOpen(false);
            setSpareToSell(null);
        }
    };

    return (
        <>
            {/* Header + Status Pills — always visible */}
            <div className="space-y-3 mb-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">My Spare Parts</h2>
                    {isBusinessApproved ? (
                        <Link href="/post-spare-part-listing">
                            <Button size="sm" variant="outline" className="rounded-full px-4 gap-2">
                                <CircuitBoard className="h-4 w-4" /> Post New
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full px-4 gap-2 text-slate-400 border-slate-200 cursor-not-allowed"
                            onClick={onRegisterBusiness}
                        >
                            <Lock className="h-3.5 w-3.5" /> Post New
                        </Button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setCurrentStatus(tab)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                currentStatus === tab
                                    ? "bg-slate-900 text-white shadow-lg"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loadingSpare ? (
                <Loader />
            ) : spareError ? (
                <ErrorBanner
                    message={
                        typeof spareError === "string"
                            ? spareError
                            : (spareError as any)?.message || "Failed to load spare part listings."
                    }
                />
            ) : mySpare.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                    <CircuitBoard className="w-12 h-12 opacity-30" />
                    {!isBusinessApproved ? (
                        <>
                            <p className="text-sm font-medium text-center">Register an approved business to post spare parts.</p>
                            <Button size="sm" className="rounded-full px-5" onClick={onRegisterBusiness}>
                                Register Business
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-medium">No {currentStatus} spare part listings.</p>
                            {currentStatus === "live" && (
                                <Link href="/post-spare-part-listing">
                                    <Button size="sm" className="rounded-full px-5">
                                        <CircuitBoard className="h-4 w-4 mr-2" /> Post Spare Part
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {mySpare.map((listing: SparePartListing) => (
                        <SparePartCard
                            key={listing.id}
                            listing={listing}
                            getStatusBadge={getStatusBadge}
                            onDelete={() => handleDeleteSpare(listing.id)}
                            onMarkSold={() => {
                                setSpareToSell(listing);
                                setSoldReason(null);
                                setIsSoldOpen(true);
                            }}
                            onDeactivate={() => handleDeactivateSpare(listing.id)}
                        />
                    ))}
                </div>
            )}

            <Dialog open={isSoldOpen} onOpenChange={setIsSoldOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mark as Sold</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 mb-3">How was this listing sold?</p>
                    <div className="space-y-2">
                        {SOLD_REASON_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    soldReason === opt.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="spareSoldReason"
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
                        <Button variant="outline" onClick={() => setIsSoldOpen(false)} disabled={isSelling}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmSold}
                            disabled={!soldReason || isSelling}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isSelling ? "Updating…" : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SparePartCard({
    listing,
    getStatusBadge,
    onDelete,
    onMarkSold,
    onDeactivate,
}: {
    listing: SparePartListing;
    getStatusBadge: (status: string) => React.ReactNode;
    onDelete: () => void;
    onMarkSold: () => void;
    onDeactivate?: () => void;
}) {
    const timeAgo = listing.createdAt
        ? formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })
        : "";

    const thumbnail = listing.images?.[0];
    const isLive = listing.status === "live";

    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-teal-50 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                    <CircuitBoard className="w-8 h-8 text-teal-300" />
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 truncate">{listing.title}</p>
                    {getStatusBadge(listing.status)}
                </div>
                <p className="text-sm font-bold text-teal-700 mt-1">₹{listing.price.toLocaleString()}</p>
                {listing.location?.city && (
                    <p className="text-xs text-slate-400 mt-0.5">{listing.location.city}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isLive && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={onMarkSold}
                        title="Mark as Sold"
                    >
                        <CheckSquare className="h-4 w-4" />
                    </Button>
                )}
                {isLive && onDeactivate && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        onClick={onDeactivate}
                        title="Deactivate"
                    >
                        <PowerOff className="h-4 w-4" />
                    </Button>
                )}
                <Link href={`/edit-spare-part/${listing.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
