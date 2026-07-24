import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { Eye, Heart, Clock, Edit2, Trash2, RefreshCw, CheckSquare, PowerOff, Power } from "lucide-react";
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
    title, status, listingType = "ad", thumbnail, priceLabel, priceClassName, badgeColor = "blue",
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
    // Delete is allowed everywhere EXCEPT on LIVE Ads (must be deactivated first)
    const showDelete = !(isActive && isAd); 
    
    const showMarkSold = isAd && (isActive || isExpired);
    const showRenew = !isAd && (isExpired || isSold);

    const viewMetrics: ListingViews | null = views && typeof views === "object" ? views : null;
    const totalViews = typeof views === "number" ? views : viewMetrics?.total ?? 0;
    const totalLikes = viewMetrics?.favorites ?? likes ?? 0;

    const colorVariants = {
        blue: {
            bg: "bg-blue-50 text-blue-300",
            border: "hover:border-blue-200",
            price: "text-link-dark"
        },
        violet: {
            bg: "bg-violet-50 text-violet-300",
            border: "hover:border-violet-200",
            price: "text-violet-700"
        },
        teal: {
            bg: "bg-teal-50 text-teal-300",
            border: "hover:border-teal-200",
            price: "text-teal-700"
        }
    };

    const colors = colorVariants[badgeColor];

    return (
        <div 
            className={cn(
                "flex gap-3 p-3 rounded-xl border bg-white hover:shadow-sm transition-all group",
                colors.border,
                className
            )}
        >
            {/* Thumbnail */}
            <div className={cn("relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center", colors.bg)}>
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
                            <Link href={detailHref} className="hover:text-link transition-colors">
                                <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
                            </Link>
                        ) : (
                            <h3 className="font-medium text-sm line-clamp-1 text-foreground">{title}</h3>
                        )}
                        {getStatusBadge(status)}
                    </div>
                    
                    <p className={cn("text-xs font-bold mt-0.5", priceClassName || colors.price)}>{priceLabel}</p>

                    {status === "rejected" && rejectionReason && (
                        <p className="text-2xs text-red-500 mt-0.5 line-clamp-2">Reason: {rejectionReason}</p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-2xs text-muted-foreground">
                        {totalViews > 0 && (
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {totalViews}
                            </span>
                        )}
                        {totalLikes > 0 && (
                            <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {totalLikes}
                            </span>
                        )}
                        {isActive && expiresAt && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <Clock className="h-3 w-3" /> Expires <RelativeTimeText value={expiresAt} />
                            </span>
                        )}
                        {metaBadges.map((badge, idx) => {
                            if (!badge) return null;
                            return (
                                <span key={idx} className={cn("flex items-center gap-1", badge.className)}>
                                    {badge.icon} {badge.label}
                                </span>
                            );
                        })}
                        {!isActive && createdAt && (
                            <span className="flex items-center gap-1 text-foreground-subtle">
                                <Clock className="h-3 w-3" /> <RelativeTimeText value={createdAt} />
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {tags.map((tag, idx) => {
                                if (!tag) return null;
                                return (
                                    <span key={idx} className={cn("px-2 py-0.5 rounded-full text-2xs font-medium border", tag.className || "bg-slate-50 text-foreground-tertiary border-slate-100")}>
                                        {tag.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
                    {onMarkSold && showMarkSold && (
                        <Button 
                            size="sm" variant="outline"
                            className="h-11 text-xs text-green-700 border-green-200 hover:bg-green-50"
                            onClick={(e) => { e.stopPropagation(); onMarkSold(); }}
                        >
                            <CheckSquare className="h-3 w-3 mr-1" /> Mark Sold
                        </Button>
                    )}
                    {onDeactivate && showDeactivate && (
                        <Button
                            size="sm" variant="outline"
                            className="h-11 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={(e) => { e.stopPropagation(); onDeactivate(); }}
                        >
                            <PowerOff className="h-3 w-3 mr-1" /> Deactivate
                        </Button>
                    )}
                    {onActivate && showActivate && (
                        <Button
                            size="sm" variant="outline"
                            className="h-11 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); onActivate(); }}
                        >
                            <Power className="h-3 w-3 mr-1" /> Activate
                        </Button>
                    )}
                    {onRenew && showRenew && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-11 text-xs text-link border-blue-200 hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); onRenew(); }}
                        >
                            <RefreshCw className="h-3 w-3 mr-1" /> Renew
                        </Button>
                    )}
                    {showEdit && (
                        <Link href={editHref} onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="h-11 text-xs">
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                        </Link>
                    )}
                    {showDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 w-11 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
