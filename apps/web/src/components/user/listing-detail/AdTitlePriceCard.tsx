import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

    return (
        <Card className="bg-card text-card-foreground rounded-2xl border border-border shadow-xs overflow-hidden">
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        {/* Listing Type Badge */}
                        {isService ? (
                            <Badge className="flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg inline-flex items-center gap-1">
                                <Briefcase className="size-3 text-emerald-600" />
                                Service
                            </Badge>
                        ) : isSparePart ? (
                            <Badge className="flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg inline-flex items-center gap-1">
                                <CircuitBoard className="size-3 text-indigo-600" />
                                Spare Part
                            </Badge>
                        ) : null}

                        {/* Category Badge */}
                        {categoryLabel && categoryLabel !== "Category" && (
                            <Badge variant="outline" className="flex-shrink-0 text-xs font-medium border-border text-muted-foreground rounded-lg bg-muted/60 px-2.5 py-0.5 text-2xs">
                                {categoryLabel}
                            </Badge>
                        )}

                        {/* On-Site Service Badge */}
                        {isService && ad.onsiteService !== undefined && (
                            <Badge className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg inline-flex items-center gap-1">
                                <Wrench className="size-3 text-blue-600" />
                                {ad.onsiteService ? "Doorstep Service" : "In-Shop Repair"}
                            </Badge>
                        )}

                        {/* Device Power Condition Badge */}
                        {ad.deviceCondition && (
                            <Badge className={cn(
                                "flex-shrink-0 text-tiny h-5 px-2 border-0 rounded-full font-bold uppercase tracking-tight",
                                ad.deviceCondition === 'power_on' ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"
                            )}>
                                {ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}
                            </Badge>
                        )}

                        {(Boolean(ad.isSpotlight) || (ad.spotlightExpiresAt ? new Date(String(ad.spotlightExpiresAt)).getTime() > Date.now() : false)) && (
                            <Badge className="flex-shrink-0 text-xs md:text-2xs font-bold px-2.5 py-0.5 bg-amber-500 text-white rounded-lg md:rounded-full border-none shadow-sm flex items-center gap-1">
                                ✨ Spotlight
                            </Badge>
                        )}
                        {(Boolean(ad.isBoosted) || (ad.boostExpiresAt ? new Date(String(ad.boostExpiresAt)).getTime() > Date.now() : false)) && !ad.isSpotlight && (
                            <Badge className="flex-shrink-0 text-xs md:text-2xs font-bold px-2.5 py-0.5 bg-blue-600 text-white rounded-lg md:rounded-full border-none shadow-sm flex items-center gap-1">
                                ⚡ Top Ad
                            </Badge>
                        )}
                        {ad.isFeatured && !ad.isSpotlight && !ad.isBoosted && (
                            <Badge className="bg-yellow-500 flex-shrink-0 text-xs text-white rounded-lg border-none">
                                Featured
                            </Badge>
                        )}
                    </div>
                </div>

                {ad.isBusiness && ad.businessName && (
                    <div className="flex items-center gap-2 text-xs text-link-dark bg-blue-50 px-3 py-2.5 rounded-2xl border border-blue-100">
                        <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Shield className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <span className="font-bold block truncate">{ad.businessName}</span>
                            <span className="text-2xs text-blue-500 font-medium flex items-center gap-1">
                                <CheckCircle className="h-2.5 w-2.5" />
                                {isService ? "Verified Service Center" : isSparePart ? "Verified Parts Supplier" : "Verified Business"}
                            </span>
                        </div>
                    </div>
                )}

                <h1 className="text-base md:text-xl font-bold text-foreground leading-snug md:leading-tight">
                    {ad.title || "Ad Title"}
                </h1>

                <div className="flex items-baseline gap-1">
                    {ad.price === 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold uppercase tracking-wide">
                            {isService ? "Contact for Quote" : "Free"}
                        </span>
                    ) : (
                        <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                            {formatPrice(ad.price)}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-y-4 md:gap-x-2 text-xs text-foreground-subtle border-t border-border pt-3 md:pt-4">
                    <div className="flex flex-col md:gap-1">
                        <span className="hidden md:block text-2xs uppercase font-bold text-foreground-subtle tracking-wider">Location</span>
                        <div className="flex items-center gap-1.5 text-foreground-tertiary font-medium">
                            <MapPin className="h-3 w-3 text-foreground-subtle flex-shrink-0" />
                            <span className="truncate">{locationLabel}</span>
                        </div>
                    </div>
                    <div className="flex flex-col md:gap-1">
                        <span className="hidden md:block text-2xs uppercase font-bold text-foreground-subtle tracking-wider">Posted</span>
                        <div className="flex items-center gap-1.5 text-foreground-tertiary font-medium">
                            <Clock className="h-3 w-3 text-foreground-subtle flex-shrink-0" />
                            <span className="truncate">{ad.time}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
