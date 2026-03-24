import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/formatters";
import { formatLocation } from "@/lib/location/locationService";
import { type Ad } from "@/schemas/ad.schema";
import type { UserPage } from "@/lib/routeUtils";
import { ROUTES } from "@/lib/logic/routes";
import { Shield, CheckCircle, ChevronRight, MapPin, Clock, Eye } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface AdTitlePriceCardProps {
    ad: Ad;
    categoryLabel: string;
    viewCount: number | undefined;
    navigateTo: (
        page: UserPage,
        adId?: string | number,
        category?: string,
        sellerIdOrBusinessId?: string
    ) => void;
    variant: "mobile" | "desktop";
}

export function AdTitlePriceCard({
    ad,
    categoryLabel,
    viewCount,
    navigateTo,
    variant,
}: AdTitlePriceCardProps) {
    const handleBusinessClick = () => {
        if (ad.businessId) {
            navigateTo(ROUTES.PUBLIC_PROFILE, undefined, undefined, ad.businessId);
        }
    };

    if (variant === "mobile") {
        return (
            <Card className="md:hidden rounded-none bg-white border-x-0 border-t-0 border-b">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="flex-shrink-0 text-xs">
                                {categoryLabel}
                            </Badge>
                            {ad.deviceCondition && (
                                <Badge className={cn(
                                    "flex-shrink-0 text-xs border-0",
                                    ad.deviceCondition === 'power_on' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}
                                </Badge>
                            )}
                            {ad.isSpotlight && (
                                <Badge className="flex-shrink-0 text-xs bg-blue-600 text-white">
                                    Spotlight
                                </Badge>
                            )}
                        </div>
                        {ad.isFeatured && !ad.isSpotlight && (
                            <Badge className="bg-yellow-500 flex-shrink-0 text-xs text-white">
                                Featured
                            </Badge>
                        )}
                    </div>

                    {ad.isBusiness && ad.businessName && (
                        <button
                            onClick={handleBusinessClick}
                            className="flex items-center gap-2 mb-4 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all w-full cursor-pointer shadow-sm"
                        >
                            <Shield className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                            <span className="font-bold">{ad.businessName}</span>
                            <div className="ml-auto flex items-center gap-1 bg-blue-600 text-white px-1.5 py-0.5 rounded-md text-[10px]">
                                <CheckCircle className="h-2.5 w-2.5" />
                                Verified
                            </div>
                        </button>
                    )}

                    <h1 className="text-xl font-bold mb-2">{ad.title}</h1>
                    <div className="text-3xl font-extrabold text-blue-600 mb-3">
                        {formatPrice(ad.price)}
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatLocation(ad.location)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{ad.time}</span>
                        </div>
                        {viewCount !== undefined && viewCount > 0 && (
                            <div className="flex items-center gap-1 text-slate-500 font-medium">
                                <Eye className="h-3 w-3" />
                                <span>{viewCount.toLocaleString()} views</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-muted-foreground truncate">
                                Ad ID: #{ad.id}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Desktop sidebar variant
    return (
        <Card className="hidden md:block bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[2rem] border border-slate-100/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium px-2.5 py-0.5 text-[10px]">
                            {categoryLabel}
                        </Badge>
                        {ad.deviceCondition && (
                            <Badge className={cn(
                                "border-none font-bold px-2.5 py-0.5 text-[10px]",
                                ad.deviceCondition === 'power_on' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {ad.deviceCondition === 'power_on' ? 'POWER ON' : 'POWER OFF'}
                            </Badge>
                        )}
                        {ad.isSpotlight && (
                            <Badge className="flex-shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full border-none bg-blue-600 text-white shadow-sm">
                                Spotlight
                            </Badge>
                        )}
                    </div>
                </div>

                {ad.isBusiness && ad.businessName && (
                    <div className="mb-4">
                        <button
                            onClick={handleBusinessClick}
                            className="group flex items-center gap-2 text-xs text-blue-700 bg-blue-50/50 px-3 py-2.5 rounded-2xl border border-blue-100/50 hover:bg-blue-100/50 transition-all w-full cursor-pointer"
                        >
                            <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                <Shield className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold block truncate">{ad.businessName}</span>
                                <span className="text-[10px] text-blue-500 font-medium flex items-center gap-1">
                                    <CheckCircle className="h-2.5 w-2.5" />
                                    Verified Business
                                </span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                <h1 className="text-xl md:text-2xl font-bold mb-2 text-slate-900 leading-tight">
                    {ad.title || "Ad Title"}
                </h1>

                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {formatPrice(ad.price)}
                    </span>
                </div>

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[11px] text-slate-400 pt-5 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">Location</span>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="truncate">{formatLocation(ad.location)}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">Posted</span>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="truncate">{ad.time}</span>
                        </div>
                    </div>
                    {viewCount !== undefined && viewCount > 0 && (
                        <div className="flex flex-col gap-1 text-[11px]">
                            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Views</span>
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <Eye className="h-3 w-3 text-slate-400" />
                                <span className="truncate">{viewCount.toLocaleString()} views</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">Ad ID</span>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="truncate font-bold">#{ad.id}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
