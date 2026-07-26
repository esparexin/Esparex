import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatStableNumber } from "@/lib/formatters";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { type Ad } from "@/schemas/ad.schema";
import { Shield, CheckCircle, MapPin, Clock, Eye } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface AdTitlePriceCardProps {
    ad: Ad;
    categoryLabel: string;
    viewCount: number | undefined;
    variant?: "mobile" | "desktop";
}

export function AdTitlePriceCard({
    ad,
    categoryLabel,
    viewCount,
}: AdTitlePriceCardProps) {
    const locationLabel = resolveListingLocationLabel(ad.location, "full");

    return (
        <Card className="bg-white rounded-none md:rounded-[2rem] border-x-0 md:border border-t-0 md:border-t border-b border-slate-100/50 shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex items-start justify-between gap-2 md:gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <Badge variant="outline" className="flex-shrink-0 text-xs font-medium border-slate-200 text-muted-foreground rounded-lg md:bg-slate-100 md:border-none md:px-2.5 md:py-0.5 md:text-2xs">
                            {categoryLabel}
                        </Badge>
                        {ad.deviceCondition && (
                            <Badge className={cn(
                                "flex-shrink-0 text-[10px] h-5 px-2 border-0 rounded-full font-bold uppercase tracking-tight",
                                ad.deviceCondition === 'power_on' ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"
                            )}>
                                {ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}
                            </Badge>
                        )}
                        {ad.isSpotlight && (
                            <Badge className="flex-shrink-0 text-xs md:text-2xs font-bold px-2.5 py-0.5 bg-blue-600 text-white rounded-lg md:rounded-full border-none shadow-sm">
                                Spotlight
                            </Badge>
                        )}
                        {ad.isFeatured && !ad.isSpotlight && (
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
                                Verified Business
                            </span>
                        </div>
                    </div>
                )}

                <h1 className="text-lg md:text-2xl font-bold text-foreground leading-snug md:leading-tight">
                    {ad.title || "Ad Title"}
                </h1>

                <div className="flex items-baseline gap-1">
                    {ad.price === 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold uppercase tracking-wide">
                            Free
                        </span>
                    ) : (
                        <span className="text-3xl font-black text-foreground tracking-tight">
                            {formatPrice(ad.price)}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-y-4 md:gap-x-2 text-xs text-foreground-subtle border-t border-slate-100 pt-3 md:pt-5">
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
                    {viewCount !== undefined && viewCount > 0 && (
                        <div className="flex flex-col md:gap-1 text-xs">
                            <span className="hidden md:block text-2xs uppercase font-bold text-foreground-subtle tracking-wider">Views</span>
                            <div className="flex items-center gap-1.5 text-foreground-tertiary font-medium">
                                <Eye className="h-3 w-3 text-foreground-subtle flex-shrink-0" />
                                <span className="truncate">{formatStableNumber(viewCount)} views</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col md:gap-1">
                        <span className="hidden md:block text-2xs uppercase font-bold text-foreground-subtle tracking-wider">Ad ID</span>
                        <div className="flex items-center gap-1.5 text-foreground-tertiary font-medium">
                            <span className="truncate font-bold">#{ad.id}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
