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

// ─────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export function ListingItem({
    title, status, listingType = "ad", thumbnail, priceLabel, priceClassName,
    rejectionReason, createdAt, expiresAt, views, likes: _likes,
    getStatusBadge, editHref, detailHref,
    onDelete, onRenew, onDeactivate, onActivate, onMarkSold,
    metaBadges = [], tags = [], priority = false, className,
}: ListingItemProps) {
    const isAd = listingType.toLowerCase() === "ad";

    // ── Status flags ──────────────────────────────────────────────
    const isActive     = status === "live" || status === "active";
    const isDeactivated = status === "deactivated";
    const isPending    = status === "pending" || status === "held_for_review";
    const isExpired    = status === "expired" || status === "rejected";
    const isSold       = status === "sold";

    // ── Action visibility ─────────────────────────────────────────
    const showEdit      = isActive || isDeactivated || isPending;
    const showDeactivate = isActive && !!onDeactivate;
    const showActivate   = isDeactivated && !!onActivate;
    const showMarkSold   = isAd && (isActive || isExpired) && !!onMarkSold;
    const showRenew      = !isAd && (isExpired || isSold) && !!onRenew;
    // Delete is NEVER shown on live / active listings
    const showDelete     = !isActive;

    const hasOverflowItems =
        showMarkSold || showDeactivate || showActivate || showRenew || showDelete;

    // ── View count ────────────────────────────────────────────────
    const viewMetrics: ListingViews | null =
        views && typeof views === "object" ? (views as ListingViews) : null;
    const totalViews = typeof views === "number" ? views : (viewMetrics?.total ?? 0);

    // ── Meta segments (built once, rendered inline) ───────────────
    const showExpiry = isActive && !!expiresAt;
    const showCreated = !isActive && !!createdAt;

    return (
        /**
         * THREE-ZONE GRID
         * ┌─────────────────────────────────────────────────────────┐
         * │  [Image 62px]  [Content flex-1]  [Actions 76px fixed]  │
         * └─────────────────────────────────────────────────────────┘
         *
         * Actions column internal layout:
         *   Mobile  → [Badge][⋮] on one row, [Edit] below
         *   Desktop → Badge / ⋮ / Edit stacked vertically
         */
        <div
            className={cn(
                // Row shell — no items-start so each zone can use self-* independently
                "flex gap-2.5 py-2.5",
                "md:gap-3 md:py-3",
                "border-b border-slate-100 last:border-b-0 bg-transparent",
                className,
            )}
        >
            {/* ══════════════════════════════════════════════════════
                ZONE 1 — Thumbnail  (fixed 62 × 62 / 68 × 68)
            ══════════════════════════════════════════════════════ */}
            <div
                className={cn(
                    "shrink-0 self-center",
                    "relative w-[62px] h-[62px]",
                    "md:w-[68px] md:h-[68px]",
                    "rounded-lg overflow-hidden bg-slate-100 border border-slate-100/80",
                )}
            >
                <SafeImage
                    src={toSafeImageSrc(thumbnail, DEFAULT_IMAGE_PLACEHOLDER)}
                    alt={title}
                    fill
                    priority={priority}
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 62px, 68px"
                />
            </div>

            {/* ══════════════════════════════════════════════════════
                ZONE 2 — Content  (flex-1, owns: title / price / meta)
                NOTHING action-related lives here.
            ══════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 self-center flex flex-col gap-[3px]">

                {/* Title */}
                {detailHref ? (
                    <Link href={detailHref} className="min-w-0 hover:text-blue-600 transition-colors">
                        <h3 className="text-[14px] md:text-[15px] font-semibold text-slate-900 leading-snug line-clamp-1">
                            {title}
                        </h3>
                    </Link>
                ) : (
                    <h3 className="text-[14px] md:text-[15px] font-semibold text-slate-900 leading-snug line-clamp-1">
                        {title}
                    </h3>
                )}

                {/* Price */}
                <p className={cn(
                    "text-[17px] md:text-[18px] font-bold leading-tight",
                    priceClassName || "text-emerald-600",
                )}>
                    {priceLabel}
                </p>

                {/* Rejection reason (replaces meta on rejected state) */}
                {status === "rejected" && rejectionReason ? (
                    <p className="text-[11px] text-red-500 line-clamp-1 leading-none">
                        {rejectionReason}
                    </p>
                ) : (
                    /* ── Single-line meta ── */
                    <div className="flex items-center flex-nowrap gap-1 text-[11px] text-slate-500 leading-none min-w-0 overflow-hidden">
                        <span className="shrink-0">👁 {totalViews}</span>

                        {showExpiry && (
                            <>
                                <span className="opacity-30 shrink-0">•</span>
                                <span className="text-amber-700 font-medium shrink-0 flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">
                                        <RelativeTimeText value={expiresAt!} /> left
                                    </span>
                                </span>
                            </>
                        )}

                        {showCreated && (
                            <>
                                <span className="opacity-30 shrink-0">•</span>
                                <span className="truncate">
                                    <RelativeTimeText value={createdAt!} />
                                </span>
                            </>
                        )}

                        {metaBadges.map((badge, i) =>
                            badge ? (
                                <span key={i} className="shrink-0 flex items-center gap-0.5">
                                    <span className="opacity-30">•</span>
                                    <span className={cn("flex items-center gap-0.5", badge.className)}>
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                </span>
                            ) : null,
                        )}
                    </div>
                )}

                {/* Tags (optional) */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {tags.map((tag, i) =>
                            tag ? (
                                <span
                                    key={i}
                                    className={cn(
                                        "px-1.5 py-px rounded text-[10px] font-medium border",
                                        tag.className || "bg-slate-50 text-slate-400 border-slate-100",
                                    )}
                                >
                                    {tag.label}
                                </span>
                            ) : null,
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════
                ZONE 3 — Fixed Action Column
                Width: 72px (all breakpoints — fixed, never grows)
                Internal layout:
                  Mobile:  [Badge + ⋮] in one row  →  [Edit] below
                  Desktop: Badge / ⋮ / Edit stacked vertically

                Every row renders this column at the same width,
                so badges, menus, and edit buttons ALWAYS align.
            ══════════════════════════════════════════════════════ */}
            <div className="shrink-0 w-[72px] self-center flex flex-col items-center gap-1.5">

                {/* ── Row A: Badge (left) + Overflow (right) ── */}
                {/* On mobile: they share the row.
                    No CSS difference needed — both fit in 72px side by side. */}
                <div className="w-full flex items-center justify-between gap-1">
                    {/* Status badge — compact, fixed-size text */}
                    <div className="[&>*]:!text-[10px] [&>*]:!font-semibold [&>*]:!px-1.5 [&>*]:!py-[3px] [&>*]:!rounded [&>*]:!leading-none shrink-0">
                        {getStatusBadge(status)}
                    </div>

                    {/* ⋮ Overflow menu — always right of badge */}
                    {hasOverflowItems ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    aria-label="More actions"
                                    className={cn(
                                        "h-6 w-6 flex items-center justify-center",
                                        "rounded text-slate-400",
                                        "hover:text-slate-700 hover:bg-slate-100",
                                        "transition-colors",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
                                    )}
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={4} className="min-w-[170px] text-[13px]">
                                {showMarkSold && (
                                    <DropdownMenuItem
                                        onClick={onMarkSold}
                                        className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                                    >
                                        <CheckSquare className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        Mark as Sold
                                    </DropdownMenuItem>
                                )}
                                {showDeactivate && (
                                    <DropdownMenuItem
                                        onClick={onDeactivate}
                                        className="text-amber-700 focus:text-amber-700 focus:bg-amber-50 cursor-pointer"
                                    >
                                        <PowerOff className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        Deactivate
                                    </DropdownMenuItem>
                                )}
                                {showActivate && (
                                    <DropdownMenuItem
                                        onClick={onActivate}
                                        className="text-blue-700 focus:text-blue-700 focus:bg-blue-50 cursor-pointer"
                                    >
                                        <Power className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        Activate
                                    </DropdownMenuItem>
                                )}
                                {showRenew && (
                                    <DropdownMenuItem
                                        onClick={onRenew}
                                        className="text-blue-700 focus:text-blue-700 focus:bg-blue-50 cursor-pointer"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        Renew
                                    </DropdownMenuItem>
                                )}
                                {(showMarkSold || showDeactivate || showActivate || showRenew) &&
                                    showDelete && <DropdownMenuSeparator />}
                                {detailHref && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (typeof window !== "undefined" && navigator.share) {
                                                void navigator.share({ title, url: detailHref });
                                            } else {
                                                void navigator.clipboard.writeText(
                                                    window.location.origin + detailHref,
                                                );
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Share2 className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        Share
                                    </DropdownMenuItem>
                                )}
                                {showDelete && (
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2 shrink-0" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        /* Spacer keeps badge left-aligned when there is no ⋮ */
                        <span className="h-6 w-6 shrink-0" aria-hidden="true" />
                    )}
                </div>

                {/* ── Row B: Edit button (full column width) ── */}
                {showEdit ? (
                    <Link href={editHref} className="w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-full h-7 px-0 gap-1",
                                "text-[12px] font-medium",
                                "border-slate-200 text-slate-700",
                                "hover:bg-slate-50 hover:border-slate-300",
                                "rounded-md",
                            )}
                        >
                            <Edit2 className="h-3 w-3 shrink-0" />
                            <span>Edit</span>
                        </Button>
                    </Link>
                ) : (
                    /* Invisible placeholder — preserves row height parity */
                    <div className="h-7 w-full" aria-hidden="true" />
                )}
            </div>
        </div>
    );
}
