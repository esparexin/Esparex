import { Badge } from "@/components/ui/badge";
import { Button } from "@esparex/ui";
import { Building2, Store, MapPin, Calendar, ExternalLink } from "@/icons/IconRegistry";
import { notify } from "@/lib/feedback";
import { ROUTES } from "@/lib/logic/routes";
import type { AdDetailNavigateFn } from "@/lib/routeUtils";
import type { Ad } from "@/schemas/ad.schema";
import { formatStableDate } from "@/lib/formatters";
import { resolveBusinessLocationLabel } from "@/lib/listings/listingPresentation";

interface AdBusinessCardProps {
    ad: Ad;
    navigateTo: AdDetailNavigateFn;
}

export function AdBusinessCard({ ad, navigateTo }: AdBusinessCardProps) {
    if (!ad.isBusiness || !ad.verified || !ad.businessId) return null;

    const businessName = ad.businessName || "Verified Business Seller";
    const businessType = ad.businessType || "Professional seller";
    const businessCategory = ad.businessCategory;
    const businessExpiresAt = ad.businessExpiresAt;
    const locationLabel = resolveBusinessLocationLabel(ad);

    return (
        <div className="space-y-4 pb-4 border-b border-slate-200/80">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-100">
                    <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-foreground truncate text-sm">{businessName}</h3>
                        <Badge className="bg-blue-600 text-white text-2xs font-bold px-1.5 py-0.5 rounded-md border-none flex-shrink-0">
                            VERIFIED
                        </Badge>
                    </div>
                    <p className="text-xs text-foreground-subtle font-medium">{businessType}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                    businessCategory ? { icon: Store, label: "Category", value: businessCategory } : null,
                    locationLabel ? { icon: MapPin, label: "Location", value: locationLabel } : null,
                    businessExpiresAt ? { icon: Calendar, label: "Membership", value: `Valid until ${formatStableDate(businessExpiresAt)}` } : null,
                ].filter(Boolean).map((detail, idx) => {
                    if (!detail) return null;
                    const Icon = detail.icon;
                    return (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                                <Icon className="h-3.5 w-3.5 text-link" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xs uppercase font-bold text-foreground-subtle tracking-wider">{detail.label}</p>
                                <p className="font-bold text-foreground-secondary truncate">{detail.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visit Button */}
            <Button
                variant="outline"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 border-none text-white text-sm h-11 rounded-xl font-semibold transition-all active:scale-95 shadow-md shadow-blue-100"
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
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-2xs font-bold text-foreground-subtle uppercase tracking-widest">Active Partner</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-2xs font-black text-foreground-secondary">100%</span>
                    <span className="text-2xs font-bold text-foreground-subtle uppercase tracking-widest">Verified</span>
                </div>
            </div>
        </div>
    );
}
