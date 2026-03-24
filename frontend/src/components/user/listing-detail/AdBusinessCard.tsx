import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Store, MapPin, Calendar, ExternalLink } from "lucide-react";
import { notify } from "@/lib/notify";
import { ROUTES } from "@/lib/logic/routes";
import type { UserPage } from "@/lib/routeUtils";
import type { Ad } from "@/schemas/ad.schema";
import { formatStableDate } from "@/lib/formatters";

type BusinessCardDetails = {
    businessName?: string;
    businessType?: string;
    businessCategory?: string;
    city?: string;
    state?: string;
    expiresAt?: string | Date;
};

interface AdBusinessCardProps {
    businessDetails: BusinessCardDetails | null;
    ad: Ad;
    navigateTo: (
        page: UserPage,
        adId?: string | number,
        category?: string,
        sellerIdOrBusinessId?: string,
        serviceId?: string,
        sellerId?: string,
        sellerType?: "business" | "individual"
    ) => void;
}

export function AdBusinessCard({ businessDetails, ad, navigateTo }: AdBusinessCardProps) {
    if (!businessDetails || !ad.isBusiness || !ad.verified) return null;

    return (
        <Card className="bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden border border-slate-100/50">
            <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-100">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-slate-900 truncate">{businessDetails.businessName}</h3>
                            <Badge className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border-none">
                                VERIFIED
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                            {businessDetails.businessType}
                        </p>
                    </div>
                </div>

                {/* Business Details Grid */}
                <div className="grid grid-cols-1 gap-4 text-[11px]">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                        <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Store className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">Category</p>
                            <p className="font-bold text-slate-700">{businessDetails.businessCategory}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                        <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">Location</p>
                            <p className="font-bold text-slate-700">
                                {businessDetails.city}, {businessDetails.state}
                            </p>
                        </div>
                    </div>

                    {businessDetails.expiresAt && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">Membership</p>
                                <p className="font-bold text-slate-700">
                                    Valid until {formatStableDate(businessDetails.expiresAt)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* View All Products Button */}
                <Button
                    variant="outline"
                    className="w-full gap-2 bg-slate-900 hover:bg-slate-800 border-none text-white text-sm h-12 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-slate-200"
                    onClick={() => {
                        if (ad.businessId) {
                            navigateTo(ROUTES.PUBLIC_PROFILE, undefined, undefined, ad.businessId);
                        } else {
                            notify.info("Viewing all products from this business...");
                        }
                    }}
                >
                    <ExternalLink className="h-4 w-4" />
                    Visit Business Store
                </Button>

                {/* Trust Indicators */}
                <div className="flex items-center justify-between px-2 pt-2">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Partner</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-900">100%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
