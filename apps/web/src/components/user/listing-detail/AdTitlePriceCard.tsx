import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/formatters";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { type Ad } from "@/schemas/ad.schema";
import { Shield, CheckCircle, MapPin, Clock, Briefcase, CircuitBoard, Wrench } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";

interface AdTitlePriceCardProps {
    ad: Ad;
    categoryLabel: string;
    viewCount?: number;
    variant?: "mobile" | "desktop";
}

export function AdTitlePriceCard({
    ad,
    categoryLabel,
    viewCount: _viewCount,
}: AdTitlePriceCardProps) {
    const locationLabel = resolveListingLocationLabel(ad.location, "full");
    const isService = ad.listingType === "service";
    const isSparePart = ad.listingType === "spare_part";
    const isActiveSpotlight = Boolean(ad.isSpotlight);

    return (
        <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                {/* Listing Type Badge */}
                {isService ? (
                    <Badge className="flex-shrink-0 text-caption font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg inline-flex items-center gap-1">
                        <Briefcase className="size-3 text-emerald-600" />
                        Service
                    </Badge>
                ) : isSparePart ? (
                    <Badge className="flex-shrink-0 text-caption font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg inline-flex items-center gap-1">
                        <CircuitBoard className="size-3 text-indigo-600" />
                        Spare Part
                    </Badge>
                ) : null}

                {/* Category Badge */}
                {categoryLabel && categoryLabel !== "Category" && (
                    <Badge variant="outline" className="flex-shrink-0 font-medium border-border text-foreground-subtle rounded-lg bg-muted px-2.5 py-0.5 text-tiny">
                        {categoryLabel}
                    </Badge>
                )}

                {/* On-Site Service Badge */}
                {isService && ad.onsiteService !== undefined && (
                    <Badge className="flex-shrink-0 text-caption font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg inline-flex items-center gap-1">
                        <Wrench className="size-3 text-blue-600" />
                        {ad.onsiteService ? "Doorstep Service" : "In-Shop Repair"}
                    </Badge>
                )}

                {/* Device Power Condition Badge */}
                {ad.deviceCondition && (
                    <Badge className={cn(
                        "flex-shrink-0 text-tiny h-5 px-2 border-0 rounded-full font-bold uppercase tracking-wider",
                        ad.deviceCondition === 'power_on' ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"
                    )}>
                        {ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}
                    </Badge>
                )}

                {isActiveSpotlight && (
                    <Badge className="flex-shrink-0 text-caption md:text-tiny font-bold px-2.5 py-0.5 bg-amber-500 text-white rounded-lg md:rounded-full border-none shadow-sm flex items-center gap-1">
                        Spotlight
                    </Badge>
                )}
                {ad.isFeatured && !ad.isSpotlight && !ad.isBoosted && (
                    <Badge className="bg-yellow-500 flex-shrink-0 text-caption text-white rounded-lg border-none">
                        Featured
                    </Badge>
                )}
            </div>

            {ad.isBusiness && ad.businessName && (
                <div className="flex items-center gap-2 text-caption text-link-dark bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                    <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Shield className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <span className="font-bold block truncate">{ad.businessName}</span>
                        <span className="text-tiny text-blue-500 font-medium flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" />
                            {isService ? "Verified Service Center" : isSparePart ? "Verified Parts Supplier" : "Verified Business"}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-body-lg sm:text-h4 md:text-h3 font-bold text-foreground leading-snug tracking-tight">
                    {ad.title || "Ad Title"}
                </h1>
                {ad.id ? (
                    <span className="text-tiny font-mono font-medium text-foreground-subtle shrink-0">
                        Ad ID: #{String(ad.id).slice(-8)}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                <div className="flex items-baseline gap-1">
                    {ad.price === 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-1 text-caption md:text-caption font-bold uppercase tracking-wide">
                            {isService ? "Contact for Quote" : "Free"}
                        </span>
                    ) : (
                        <span className="text-h3 md:text-h2 font-bold text-foreground tracking-tight">
                            {formatPrice(ad.price)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-caption text-foreground-subtle">
                    <div className="flex items-center gap-1 text-foreground-secondary font-medium">
                        <MapPin className="h-3.5 w-3.5 text-foreground-subtle flex-shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">{locationLabel}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-foreground-secondary font-medium">
                        <Clock className="h-3.5 w-3.5 text-foreground-subtle flex-shrink-0" />
                        <span className="truncate">{ad.time}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
