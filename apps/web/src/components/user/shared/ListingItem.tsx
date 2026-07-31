"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import {
    Clock, Edit2, Trash2, RefreshCw, CheckSquare,
    PowerOff, Power, MoreVertical, Share2,
} from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import { cn } from "@/components/ui/utils";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import { RelativeTimeText } from "@/components/common/RelativeTimeText";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MetaBadge {
    label: string;
    icon?: React.ReactNode;
    className?: string;
}

export interface Tag {
    label: string;
    className?: string;
}

interface ListingItemProps {
    title: string;
    status: string;
    listingType?: string;
    thumbnail?: string;
    priceLabel: string;
    priceClassName?: string;
    badgeColor?: "blue" | "violet" | "teal";
    rejectionReason?: string;
    createdAt?: string | Date;
    expiresAt?: string | Date;
    views?: number | { total: number; unique?: number; favorites?: number; lastViewedAt?: string };
    likes?: number;
    getStatusBadge: (status: string) => React.ReactNode;
    editHref: string;
    detailHref?: string;
    onDelete: () => void;
    onRenew?: () => void;
    onDeactivate?: () => void;
    onActivate?: () => void;
    onMarkSold?: () => void;
    metaBadges?: MetaBadge[];
    tags?: Tag[];
    priority?: boolean;
    className?: string;
}

type ListingViews = {
    total?: number;
    favorites?: number;
    unique?: number;
    lastViewedAt?: string;
};

export function ListingItem({
    title, status, listingType = "ad", thumbnail, priceLabel, priceClassName,
    rejectionReason, createdAt, expiresAt, views, likes: _likes,
    getStatusBadge, editHref, detailHref,
    onDelete, onRenew, onDeactivate, onActivate, onMarkSold,
    metaBadges = [], tags = [], priority = false, className
}: ListingItemProps) {
    const isAd = listingType.toLowerCase() === "ad";

    // Status booleans
    const isActive   = status === "live" || status === "active";
    const isDeactivated = status === "deactivated";
    const isPending  = status === "pending" || status === "held_for_review";
    const isExpired  = status === "expired" || status === "rejected";
    const isSold     = status === "sold";

    // Visibility rules
    const showEdit      = isActive || isDeactivated || isPending;
    const showDeactivate = isActive && !!onDeactivate;
    const showActivate   = isDeactivated && !!onActivate;
    const showMarkSold   = isAd && (isActive || isExpired) && !!onMarkSold;
    const showRenew      = !isAd && (isExpired || isSold) && !!onRenew;
    // Delete: NEVER shown on LIVE listings
    const showDelete     = !isActive;

    const hasOverflowItems = showMarkSold || showDeactivate || showActivate || showRenew || showDelete;

    // View counts
    const viewMetrics: ListingViews | null = views && typeof views === "object" ? views : null;
    const totalViews = typeof views === "number" ? views : (viewMetrics?.total ?? 0);

    // Build compact single-line meta string
    const metaParts: React.ReactNode[] = [];
    metaParts.push(<span key="views">👁 {totalViews}</span>);

    if (isActive && expiresAt) {
        metaParts.push(<span key="sep1" className="opacity-40">•</span>);
        metaParts.push(
            <span key="expiry" className="text-amber-700 font-medium">
                <Clock className="h-2.5 w-2.5 inline mr-0.5 -mt-0.5" />
                <RelativeTimeText value={expiresAt} /> left
            </span>
        );
    } else if (!isActive && createdAt) {
        metaParts.push(<span key="sep2" className="opacity-40">•</span>);
        metaParts.push(
            <span key="created" className="text-slate-400">
                <RelativeTimeText value={createdAt} />
            </span>
        );
    }

    metaBadges.forEach((badge, idx) => {
        if (!badge) return;
        metaParts.push(<span key={`msep${idx}`} className="opacity-40">•</span>);
        metaParts.push(
            <span key={`mb${idx}`} className={cn("flex items-center gap-0.5", badge.className)}>
                {badge.icon}{badge.label}
            </span>
        );
    });

    return (
        /**
         * Layout: Image | Content | Actions
         * Mobile  → flex-row, compact spacing
         * Desktop → same row, content stretches (flex-1), actions column stays compact
         */
        <div
            className={cn(
                "flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0 bg-transparent group",
                "md:gap-4 md:py-3.5",
                className
            )}
        >
            {/* ── Thumbnail ── */}
            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 md:w-[72px] md:h-[72px]">
                <SafeImage
                    src={toSafeImageSrc(thumbnail, DEFAULT_IMAGE_PLACEHOLDER)}
                    alt={title}
                    fill
                    priority={priority}
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 64px, 72px"
                />
            </div>

            {/* ── Content (flex-1) ── */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                {/* Title row: title + status badge */}
                <div className="flex items-start justify-between gap-2">
                    {detailHref ? (
                        <Link
                            href={detailHref}
                            className="hover:text-blue-600 transition-colors min-w-0 flex-1"
                        >
                            <h3 className="font-semibold text-[15px] leading-5 text-slate-900 line-clamp-1">
                                {title}
                            </h3>
                        </Link>
                    ) : (
                        <h3 className="font-semibold text-[15px] leading-5 text-slate-900 line-clamp-1 min-w-0 flex-1">
                            {title}
                        </h3>
                    )}
                    {/* Status badge + overflow — top-right */}
                    <div className="flex items-center gap-1 shrink-0">
                        <div className="shrink-0 [&>*]:text-[11px] [&>*]:px-1.5 [&>*]:py-0.5 [&>*]:rounded">
                            {getStatusBadge(status)}
                        </div>
                        {hasOverflowItems && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        aria-label="More actions"
                                        className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[170px] text-[13px]">
                                    {showMarkSold && (
                                        <DropdownMenuItem
                                            onClick={onMarkSold}
                                            className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                                        >
                                            <CheckSquare className="h-3.5 w-3.5 mr-2" />
                                            Mark as Sold
                                        </DropdownMenuItem>
                                    )}
                                    {showDeactivate && (
                                        <DropdownMenuItem
                                            onClick={onDeactivate}
                                            className="text-amber-700 focus:text-amber-700 focus:bg-amber-50 cursor-pointer"
                                        >
                                            <PowerOff className="h-3.5 w-3.5 mr-2" />
                                            Deactivate
                                        </DropdownMenuItem>
                                    )}
                                    {showActivate && (
                                        <DropdownMenuItem
                                            onClick={onActivate}
                                            className="text-blue-700 focus:text-blue-700 focus:bg-blue-50 cursor-pointer"
                                        >
                                            <Power className="h-3.5 w-3.5 mr-2" />
                                            Activate
                                        </DropdownMenuItem>
                                    )}
                                    {showRenew && (
                                        <DropdownMenuItem
                                            onClick={onRenew}
                                            className="text-blue-700 focus:text-blue-700 focus:bg-blue-50 cursor-pointer"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                            Renew
                                        </DropdownMenuItem>
                                    )}
                                    {(showMarkSold || showDeactivate || showActivate || showRenew) && showDelete && (
                                        <DropdownMenuSeparator />
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (typeof window !== "undefined" && navigator.share) {
                                                void navigator.share({ title, url: detailHref ?? window.location.href });
                                            } else if (detailHref) {
                                                void navigator.clipboard.writeText(window.location.origin + detailHref);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Share2 className="h-3.5 w-3.5 mr-2" />
                                        Share Listing
                                    </DropdownMenuItem>
                                    {showDelete && (
                                        <DropdownMenuItem
                                            onClick={onDelete}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Price */}
                <p className={cn("text-[15px] font-bold text-emerald-600 leading-none", priceClassName)}>
                    {priceLabel}
                </p>

                {/* Rejection reason */}
                {status === "rejected" && rejectionReason && (
                    <p className="text-xs text-red-500 line-clamp-1 font-medium">
                        Reason: {rejectionReason}
                    </p>
                )}

                {/* Single-line meta */}
                <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                    {metaParts}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {tags.map((tag, idx) => tag ? (
                            <span
                                key={idx}
                                className={cn(
                                    "px-1.5 py-px rounded text-[11px] font-medium border",
                                    tag.className || "bg-slate-50 text-slate-500 border-slate-100"
                                )}
                            >
                                {tag.label}
                            </span>
                        ) : null)}
                    </div>
                )}
            </div>

            {/* ── Actions column — bottom-right, compact ── */}
            <div className="shrink-0 flex items-end self-stretch pb-0.5">
                {showEdit ? (
                    <Link href={editHref}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-[13px] font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-md gap-1"
                        >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                        </Button>
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
