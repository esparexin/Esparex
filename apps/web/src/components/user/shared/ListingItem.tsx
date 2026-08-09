"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import {
    Clock, Edit2, Trash2, RefreshCw, CheckSquare,
    PowerOff, Power, MoreVertical, Share2, Sparkles, Zap,
} from "@/icons/IconRegistry";
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
    onBoost?: () => void;
    isSpotlight?: boolean;
    isBoosted?: boolean;
    metaBadges?: MetaBadge[];
    tags?: Tag[];
    priority?: boolean;
    /** When false the status badge is hidden (use on tabs where every item shares the same status). */
    showStatusBadge?: boolean;
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
    onDelete, onRenew, onDeactivate, onActivate, onMarkSold, onBoost,
    isSpotlight = false, isBoosted: _isBoosted = false,
    metaBadges = [], tags = [], priority = false, showStatusBadge = true, className,
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
    const showBoost      = !isSpotlight && isActive && !!onBoost;
    // Delete is NEVER shown on live / active listings
    const showDelete     = !isActive;

    const hasOverflowItems =
        showMarkSold || showDeactivate || showActivate || showRenew || showBoost || showDelete;

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
                // Row shell
                "flex gap-3 py-3.5",
                "md:gap-4 md:py-4",
                "border-b border-slate-100 last:border-b-0 bg-transparent",
                className,
            )}
        >
            {/* ══════════════════════════════════════════════════════
                ZONE 1 — Thumbnail  (fixed 62 × 62 / 68 × 68)
            ══════════════════════════════════════════════════════ */}
            {detailHref ? (
                <Link href={detailHref} className="shrink-0 self-center group">
                    <div
                        className={cn(
                            "relative w-[62px] h-[62px]",
                            "md:w-[68px] md:h-[68px]",
                            "rounded-lg overflow-hidden bg-slate-100 border border-slate-100/80 group-hover:opacity-90 transition-opacity",
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
                </Link>
            ) : (
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
            )}

            {/* ══════════════════════════════════════════════════════
                ZONE 2 — Content  (flex-1, owns: title / price / meta)
                NOTHING action-related lives here.
            ══════════════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 self-center flex flex-col gap-1.5">

                {/* Title */}
                {detailHref ? (
                    <Link href={detailHref} className="min-w-0 hover:text-blue-600 transition-colors">
                        <h3 className="text-caption md:text-small font-normal md:font-semibold text-slate-800 leading-normal line-clamp-1">
                            {title}
                        </h3>
                    </Link>
                ) : (
                    <h3 className="text-caption md:text-small font-normal md:font-semibold text-slate-800 leading-normal line-clamp-1">
                        {title}
                    </h3>
                )}

                {/* Price */}
                <p className={cn(
                    "text-small font-semibold md:text-h4 md:font-bold leading-normal",
                    priceClassName || "text-emerald-600",
                )}>
                    {priceLabel}
                </p>

                {/* Rejection reason (replaces meta on rejected state) */}
                {status === "rejected" && rejectionReason ? (
                    <p className="text-tiny text-red-500 line-clamp-1 leading-normal">
                        {rejectionReason}
                    </p>
                ) : (
                    /* ── Single-line meta ── */
                    <div className="flex items-center flex-nowrap gap-1 text-tiny text-slate-500 leading-normal min-w-0 overflow-hidden">
                        <span className="shrink-0">👁 {totalViews}</span>

                        {showExpiry && (() => {
                            const past = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
                            return (
                                <>
                                    <span className="opacity-30 shrink-0">•</span>
                                    <span className={cn("font-medium shrink-0 flex items-center gap-0.5", past ? "text-red-600" : "text-amber-700")}>
                                        <Clock className="h-2.5 w-2.5 shrink-0" />
                                        <span className="truncate">{past ? <>Expired <RelativeTimeText value={expiresAt!} addSuffix={false} /> ago</> : <><RelativeTimeText value={expiresAt!} addSuffix={false} /> left</>}</span>
                                    </span>
                                </>
                            );
                        })()}


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
                                        "px-1.5 py-px rounded text-2xs font-medium border",
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
            ══════════════════════════════════════════════════════ */}
            <div className="shrink-0 min-w-[80px] self-center flex flex-col items-end gap-1.5">

                {/*
                 * ── Row A: Badge + ⋮ ──
                 */}
                <div className={cn(
                    "w-full flex items-center gap-1",
                    showStatusBadge ? "justify-between" : "justify-end",
                )}>
                    {/* Status badge — hidden when caller says showStatusBadge=false */}
                    {showStatusBadge && (
                        <div className="[&>*]:!text-2xs [&>*]:!font-semibold [&>*]:!px-1.5 [&>*]:!py-[3px] [&>*]:!rounded [&>*]:!leading-none shrink-0">
                            {getStatusBadge(status)}
                        </div>
                    )}

                    {/* ⋮ Overflow menu */}
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
                            <DropdownMenuContent align="end" sideOffset={4} className="min-w-[140px] p-1 shadow-md border border-slate-200 bg-white">
                                {showMarkSold && (
                                    <DropdownMenuItem
                                        onClick={onMarkSold}
                                        className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                                    >
                                        <CheckSquare className="h-3 w-3 mr-1.5 shrink-0" />
                                        Mark as Sold
                                    </DropdownMenuItem>
                                )}
                                {showDeactivate && (
                                    <DropdownMenuItem
                                        onClick={onDeactivate}
                                        className="text-amber-700 focus:text-amber-700 focus:bg-amber-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                                    >
                                        <PowerOff className="h-3 w-3 mr-1.5 shrink-0" />
                                        Deactivate
                                    </DropdownMenuItem>
                                )}
                                {showActivate && (
                                    <DropdownMenuItem
                                        onClick={onActivate}
                                        className="text-blue-700 focus:text-blue-700 focus:bg-blue-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                                    >
                                        <Power className="h-3 w-3 mr-1.5 shrink-0" />
                                        Activate
                                    </DropdownMenuItem>
                                )}
                                {onBoost && (status === "live" || status === "active") && (
                                    <DropdownMenuItem
                                        onClick={onBoost}
                                        className="text-amber-700 focus:text-amber-700 focus:bg-amber-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                                    >
                                        <Sparkles className="h-3 w-3 mr-1.5 shrink-0 text-amber-500" />
                                        Apply Boost / Spotlight
                                    </DropdownMenuItem>
                                )}
                                {showRenew && (
                                    <DropdownMenuItem
                                        onClick={onRenew}
                                        className="text-blue-700 focus:text-blue-700 focus:bg-blue-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1.5 shrink-0" />
                                        Renew
                                    </DropdownMenuItem>
                                )}
                                {(showMarkSold || showDeactivate || showActivate || showRenew) &&
                                    showDelete && <DropdownMenuSeparator className="my-1" />}
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
                                        className="cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center text-slate-700"
                                    >
                                        <Share2 className="h-3 w-3 mr-1.5 shrink-0" />
                                        Share
                                    </DropdownMenuItem>
                                )}
                                {showDelete && (
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1.5 shrink-0" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        /* Spacer — only needed when badge is visible and ⋮ is absent */
                        showStatusBadge
                            ? <span className="h-6 w-6 shrink-0" aria-hidden="true" />
                            : null
                    )}
                </div>

                {/* ── Row B: Direct Action Shortcut (✨ Spotlight / ⚡ Boost + ✏️ Edit) ── */}
                <div className="flex items-center gap-1.5 justify-end w-full">
                    {isSpotlight ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-300/80 text-2xs font-bold px-2 py-1 rounded-md shadow-2xs shrink-0">
                            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-400" />
                            Spotlight
                        </span>
                    ) : onBoost && (status === "live" || status === "active") && (
                        <button
                            type="button"
                            onClick={onBoost}
                            aria-label="Promote listing"
                            title="Promote / Boost Ad"
                            className={cn("h-7 w-7 flex items-center justify-center shrink-0 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1")}
                        >
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        </button>
                    )}

                    {showEdit ? (
                        <Link
                            href={editHref}
                            aria-label="Edit listing"
                            className={cn(
                                "h-7 w-7 flex items-center justify-center shrink-0",
                                "rounded-md border border-slate-200 text-slate-500",
                                "hover:text-slate-800 hover:bg-slate-100 hover:border-slate-300",
                                "transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
                            )}
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
