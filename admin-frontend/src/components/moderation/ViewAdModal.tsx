"use client";

import { Check, ExternalLink, MapPin, Pause, Phone, Play, User, X } from "lucide-react";
import Link from "next/link";
import type { ModerationItem } from "./moderationTypes";
import { MODERATION_STATUS_BADGES, MODERATION_STATUS_LABELS } from "./moderationStatus";
import { resolveLocationDisplay } from "@/lib/location/display";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type ViewAdModalProps = {
    open: boolean;
    ad: ModerationItem | null;
    loading?: boolean;
    error?: string;
    onClose: () => void;
    onApprove: (adId: string) => Promise<void> | void;
    onReject: (adId: string) => void;
    onDeactivate: (adId: string) => Promise<void> | void;
    onActivate: (adId: string) => Promise<void> | void;
    onBlockSeller: (sellerId: string) => Promise<void> | void;
};

const IMAGE_FALLBACK = "https://placehold.co/800x600/png?text=No+Image";

export function ViewAdModal({
    open,
    ad,
    loading,
    error,
    onClose,
    onApprove,
    onReject,
    onDeactivate,
    onActivate,
    onBlockSeller
}: ViewAdModalProps) {
    const locationDisplay = ad
        ? resolveLocationDisplay({
            locationLabel: ad.locationLabel,
            coordinates: ad.locationCoordinates,
            fallbackDisplay: "Location not provided",
            emptyText: "Location not provided",
        })
        : "Location not provided";

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent
                className="flex w-full md:w-[90vw] lg:w-[900px] h-[100vh] md:h-auto md:max-h-[90vh] lg:max-h-[85vh] flex-col bg-white overflow-y-auto rounded-none md:rounded-2xl border-none p-0"
                hideClose
            >
                <DialogHeader className="border-b border-slate-100 px-6 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Moderation Drawer</p>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Ad Details</DialogTitle>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                            aria-label="Close moderation drawer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <DialogDescription className="sr-only">Inspect and moderate ad details</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 relative">
                    {loading && !ad && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
                            <p className="text-sm">Fetching ad details...</p>
                        </div>
                    )}
                    {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

                    {!loading && !error && ad && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                                <div className="space-y-3 xl:col-span-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
                                        {(ad.images.length > 0 ? ad.images : [IMAGE_FALLBACK]).map((image, index) => (
                                            <div key={`${ad.id}:${index}`} className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                                                <img
                                                    src={image}
                                                    alt={`${ad.title} ${index + 1}`}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.currentTarget;
                                                        if (target.src !== IMAGE_FALLBACK) {
                                                            target.src = IMAGE_FALLBACK;
                                                        }
                                                    }}
                                                />
                                                {loading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 xl:col-span-2">
                                    {(() => {
                                        const badgeClass = MODERATION_STATUS_BADGES[ad.status];
                                        if (!badgeClass) {
                                            console.warn(`[Moderation] Unknown ad status encountered: ${ad.status} for ad ${ad.id}`);
                                        }
                                        return (
                                            <span
                                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass || "border-slate-200 bg-slate-100 text-slate-600"}`}
                                            >
                                                {MODERATION_STATUS_LABELS[ad.status] || ad.status}
                                            </span>
                                        );
                                    })()}
                                    <div className="text-2xl font-bold text-slate-900">
                                        {ad.currency} {ad.price.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-slate-600">{new Date(ad.createdAt).toLocaleString()}</div>
                                    <div className="text-[11px] text-slate-400 mt-1">
                                        Modified: {ad.updatedAt ? new Date(ad.updatedAt).toLocaleString() : "N/A"}
                                        {ad.isDeleted && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-red-500 font-bold bg-red-50 px-1 py-0.5 rounded border border-red-100 uppercase text-[9px]">
                                                Deleted
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-700">
                                        <div>
                                            <span className="font-semibold">Approved at:</span>{" "}
                                            {ad.approvedAt ? new Date(ad.approvedAt).toLocaleString() : "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Expires at:</span>{" "}
                                            {ad.expiresAt ? new Date(ad.expiresAt).toLocaleString() : "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Days remaining:</span>{" "}
                                            {typeof ad.daysRemaining === "number"
                                                ? ad.daysRemaining >= 0
                                                    ? ad.daysRemaining
                                                    : "Expired"
                                                : "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Category:</span> {ad.categoryName || "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Brand:</span> {ad.brandName || "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Model:</span> {ad.modelName || "-"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Condition:</span> {ad.devicePowerOn === false ? "Power Off" : "Working"}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Risk score:</span> {ad.riskScore ?? "Not scored"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-900">Ad Information</h3>
                                    <div className="truncate text-lg font-semibold text-slate-900" title={ad.title}>{ad.title}</div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ad.description || "No description"}</p>
                                    <div className="flex items-start gap-2 text-sm text-slate-600">
                                        <MapPin size={15} className="mt-0.5" />
                                        <span>{locationDisplay}</span>
                                    </div>
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-900">Seller Information</h3>
                                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                                        <User size={14} className="shrink-0" />
                                        <span className="truncate">{ad.sellerName || "Unknown seller"}</span>
                                        {ad.sellerId && <span className="text-xs text-slate-500">({ad.sellerId})</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Phone size={14} />
                                        <span>{ad.sellerPhone || "Not available"}</span>
                                    </div>
                                    {ad.sellerId && (
                                        <Link
                                            href={`/users/${encodeURIComponent(ad.sellerId)}`}
                                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                        >
                                            View Seller Profile <ExternalLink size={14} />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 [&>button]:min-w-0 [&>button]:shrink-0">
                                {ad.status === "pending" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onApprove(ad.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                        >
                                            <Check size={14} /> Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onReject(ad.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                    </>
                                )}
                                {ad.status === "live" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onDeactivate(ad.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                                        >
                                            <Pause size={14} /> Deactivate
                                        </button>
                                        {ad.sellerId && (
                                            <button
                                                type="button"
                                                onClick={() => void onBlockSeller(ad.sellerId!)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                                            >
                                                Block Seller
                                            </button>
                                        )}
                                    </>
                                )}
                                {ad.status === "deactivated" && (
                                    <button
                                        type="button"
                                        onClick={() => void onActivate(ad.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                                    >
                                        <Play size={14} /> Activate
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
