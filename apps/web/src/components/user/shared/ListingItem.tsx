import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Heart, Clock, Edit2, Trash2, RefreshCw, CheckSquare, PowerOff, Power } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import { cn } from "@/components/ui/utils";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import { RelativeTimeText } from "@/components/common/RelativeTimeText";

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
    title, status, listingType = "ad", thumbnail, priceLabel, priceClassName, badgeColor: _badgeColor = "blue",
    rejectionReason, createdAt, expiresAt, views, likes,
    getStatusBadge, editHref, detailHref,
    onDelete, onRenew, onDeactivate, onActivate, onMarkSold,
    metaBadges = [], tags = [], priority = false, className
}: ListingItemProps) {
    const isAd = listingType.toLowerCase() === "ad";
    
    // Rule mapping based on the Final Action Matrix
    const isActive = status === "live" || status === "active";
    const isDeactivated = status === "deactivated";
    const isPending = status === "pending" || status === "held_for_review";
    const isExpired = status === "expired" || status === "rejected"; // Assuming rejected falls here or pending
    const isSold = status === "sold";

    const showEdit = isActive || isDeactivated || isPending;
    const showDeactivate = isActive;
    const showActivate = isDeactivated;
    // Delete rule: STRICTLY HIDDEN on LIVE listings, allowed only on inactive/terminal states
    const showDelete = !isActive; 
    
    const showMarkSold = isAd && (isActive || isExpired);
    const showRenew = !isAd && (isExpired || isSold);

    const viewMetrics: ListingViews | null = views && typeof views === "object" ? views : null;
    const totalViews = typeof views === "number" ? views : viewMetrics?.total ?? 0;
    const totalLikes = viewMetrics?.favorites ?? likes ?? 0;

    return (
        <div 
            className={cn(
                "py-3.5 flex gap-3.5 items-start border-b border-slate-100 last:border-b-0 bg-transparent transition-all group",
                className
            )}
        >
            {/* Thumbnail */}
            <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                <SafeImage
                    src={toSafeImageSrc(thumbnail, DEFAULT_IMAGE_PLACEHOLDER)}
                    alt={title}
                    fill
                    priority={priority}
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="80px"
                />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        {detailHref ? (
                            <Link href={detailHref} className="hover:text-link transition-colors min-w-0 flex-1">
                                <h2 className="font-semibold text-base text-slate-900 line-clamp-1">{title}</h2>
                            </Link>
                        ) : (
                            <h2 className="font-semibold text-base text-slate-900 line-clamp-1 min-w-0 flex-1">{title}</h2>
                        )}
                        <div className="shrink-0">{getStatusBadge(status)}</div>
                    </div>
                    
                    <p className={cn("text-lg font-bold text-emerald-600 mt-0.5", priceClassName)}>{priceLabel}</p>

                    {status === "rejected" && rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5 line-clamp-2 font-medium">Reason: {rejectionReason}</p>
                    )}

                    {/* Single-Line Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-normal">
                        <span>👁 {totalViews}</span>
                        {totalLikes > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-rose-600 font-medium">
                                    <Heart className="h-3 w-3 fill-rose-500" /> {totalLikes}
                                </span>
                            </>
                        )}
                        {isActive && expiresAt && (
                            <>
                                <span>•</span>
                                <span className="text-amber-700 font-medium">
                                    <Clock className="h-3 w-3 inline mr-0.5" /> <RelativeTimeText value={expiresAt} /> left
                                </span>
                            </>
                        )}
                        {!isActive && createdAt && (
                            <>
                                <span>•</span>
                                <span className="text-slate-400">
                                    <RelativeTimeText value={createdAt} />
                                </span>
                            </>
                        )}
                        {metaBadges.map((badge, idx) => {
                            if (!badge) return null;
                            return (
                                <span key={idx} className={cn("flex items-center gap-1", badge.className)}>
                                    • {badge.icon} {badge.label}
                                </span>
                            );
                        })}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {tags.map((tag, idx) => {
                                if (!tag) return null;
                                return (
                                    <span key={idx} className={cn("px-2 py-0.5 rounded-full text-2xs font-medium border", tag.className || "bg-slate-50 text-slate-600 border-slate-100")}>
                                        {tag.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Compact Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 mt-2.5">
                    {showEdit && (
                        <Link href={editHref}>
                            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold border-slate-200 text-slate-800 hover:bg-slate-50 rounded-lg">
                                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                        </Link>
                    )}
                    {onMarkSold && showMarkSold && (
                        <Button 
                            size="sm" variant="outline"
                            className="h-9 px-3 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 rounded-lg"
                            onClick={onMarkSold}
                        >
                            <CheckSquare className="h-3.5 w-3.5 mr-1" /> Mark Sold
                        </Button>
                    )}
                    {onDeactivate && showDeactivate && (
                        <Button
                            size="sm" variant="outline"
                            className="h-9 px-3 text-xs font-semibold text-amber-700 border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 rounded-lg"
                            onClick={onDeactivate}
                        >
                            <PowerOff className="h-3.5 w-3.5 mr-1" /> Deactivate
                        </Button>
                    )}
                    {onActivate && showActivate && (
                        <Button
                            size="sm" variant="outline"
                            className="h-9 px-3 text-xs font-semibold text-blue-700 border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 rounded-lg"
                            onClick={onActivate}
                        >
                            <Power className="h-3.5 w-3.5 mr-1" /> Activate
                        </Button>
                    )}
                    {onRenew && showRenew && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg"
                            onClick={onRenew}
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renew
                        </Button>
                    )}
                    {showDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-xs font-semibold text-red-600 border-red-200 bg-red-50/40 hover:bg-red-50 rounded-lg"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
