"use client";

import { Check, ExternalLink, MapPin, Pause, Phone, Play, RefreshCw, User, X } from "lucide-react";
import Link from "next/link";
import type { ModerationItem } from "./moderationTypes";
import { MODERATION_STATUS_BADGES, MODERATION_STATUS_LABELS } from "./moderationStatus";
import { resolveLocationDisplay } from "@/lib/location/display";
import { getListingAttribute, getListingPresentation, getListingPriceSummary } from "./listingPresentation";
import type { ListingTypeValue } from "@shared/enums/listingType";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

type ViewAdModalProps = {
    open: boolean;
    ad: ModerationItem | null;
    listingType?: ListingTypeValue;
    loading?: boolean;
    error?: string;
    onClose: () => void;
    onApprove: (adId: string) => Promise<void> | void;
    onReject: (adId: string) => void;
    onDeactivate: (adId: string) => Promise<void> | void;
    onActivate: (adId: string) => Promise<void> | void;
    onBlockSeller: (sellerId: string) => Promise<void> | void;
    onExtend?: (adId: string) => Promise<void> | void;
};

const IMAGE_FALLBACK = "https://placehold.co/800x600/png?text=No+Image";

export function ViewAdModal({
    open,
    ad,
    listingType,
    loading,
    error,
    onClose,
    onApprove,
    onReject,
    onDeactivate,
    onActivate,
    onBlockSeller,
    onExtend,
}: ViewAdModalProps) {
    const locationDisplay = ad
        ? resolveLocationDisplay({
            locationLabel: ad.locationLabel,
            coordinates: ad.locationCoordinates,
            fallbackDisplay: "Location not provided",
            emptyText: "Location not provided",
        })
        : "Location not provided";
    const effectiveListingType = listingType || ad?.listingType;
    const presentation = getListingPresentation(effectiveListingType);
    const attribute = ad ? getListingAttribute(ad, effectiveListingType) : null;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent
                className="max-w-4xl w-full flex max-h-[92dvh] flex-col bg-white overflow-hidden rounded-2xl border-none p-0"
                hideClose
            >
                <div className="flex items-center justify-between shrink-0 border-b border-slate-100 px-6 py-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Moderation</p>
                        <DialogTitle className="text-lg font-bold text-slate-900 mt-0.5">{presentation.modalTitle}</DialogTitle>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                    <DialogDescription className="sr-only">{presentation.modalDescription}</DialogDescription>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 relative min-h-0">
                    {loading && !ad && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
                            <p className="text-sm">Fetching listing details...</p>
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
                                            console.warn(`[Moderation] Unknown listing status encountered: ${ad.status} for listing ${ad.id}`);
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
                                        {getListingPriceSummary(ad)}
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
                                            <span className="font-semibold">{attribute?.label || presentation.attributeHeader}:</span>{" "}
                                            {attribute?.value || "Not specified"}
                                        </div>
                                        {effectiveListingType === "service" && (<>
                                            <div>
                                                <span className="font-semibold">Turnaround:</span> {ad.turnaroundTime || "-"}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Onsite:</span>{" "}
                                                {typeof ad.onsiteService === "boolean" ? (ad.onsiteService ? "Yes" : "No") : "-"}
                                            </div>
                                            {ad.warranty && (
                                                <div>
                                                    <span className="font-semibold">Warranty:</span> {ad.warranty}
                                                </div>
                                            )}
                                        </>)}
                                        {effectiveListingType === "spare_part" && (<>
                                            <div>
                                                <span className="font-semibold">Stock:</span> {typeof ad.stock === "number" ? ad.stock : "-"}
                                            </div>
                                            {ad.deviceType && (
                                                <div>
                                                    <span className="font-semibold">Device Type:</span> {ad.deviceType}
                                                </div>
                                            )}
                                        </>)}
                                        <div>
                                            <span className="font-semibold">Risk score:</span> {ad.riskScore ?? "Not scored"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2">
                                    <h3 className="text-sm font-semibold text-slate-900">{presentation.informationHeader}</h3>
                                    <div className="truncate text-lg font-semibold text-slate-900" title={ad.title}>{ad.title}</div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{ad.description || "No description"}</p>
                                    {effectiveListingType === "service" && (<>
                                        {typeof ad.diagnosticFee === "number" && (
                                            <div className="text-sm text-slate-600">
                                                <span className="font-semibold">Diagnostic Fee:</span> {ad.currency} {ad.diagnosticFee.toLocaleString()}
                                            </div>
                                        )}
                                        {ad.included && (
                                            <div className="text-sm text-slate-600">
                                                <span className="font-semibold">Included:</span> {ad.included}
                                            </div>
                                        )}
                                        {ad.excluded && (
                                            <div className="text-sm text-slate-600">
                                                <span className="font-semibold">Excluded:</span> {ad.excluded}
                                            </div>
                                        )}
                                    </>)}
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

                            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                                {ad.status === "pending" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onApprove(ad.id)}
                                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                                        >
                                            <Check size={15} /> Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onReject(ad.id)}
                                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                                        >
                                            <X size={15} /> Reject
                                        </button>
                                    </>
                                )}
                                {ad.status === "live" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onDeactivate(ad.id)}
                                            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
                                        >
                                            <Pause size={15} /> Deactivate
                                        </button>
                                        {ad.sellerId && (
                                            <button
                                                type="button"
                                                onClick={() => void onBlockSeller(ad.sellerId!)}
                                                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
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
                                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                                    >
                                        <Play size={15} /> Activate
                                    </button>
                                )}
                                {(ad.status === "live" || ad.status === "expired") && onExtend && (
                                    <button
                                        type="button"
                                        onClick={() => void onExtend(ad.id)}
                                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
                                    >
                                        <RefreshCw size={15} /> {ad.status === "expired" ? "Restore & Extend" : "Extend Expiry"}
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
