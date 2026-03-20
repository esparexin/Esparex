import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, MessageSquareOff } from "lucide-react";
import { ROUTES } from "@/lib/logic/routes";
import type { UserPage } from "@/lib/routeUtils";
import type { Ad } from "@/schemas/ad.schema";
import { SellerIdentityPanel } from "../shared/SellerIdentityPanel";

interface AdSellerCardProps {
    ad: Ad;
    sellerDisplayName: string;
    isOwner: boolean;
    isChatLocked?: boolean;
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

export function AdSellerCard({
    ad,
    sellerDisplayName,
    isOwner,
    isChatLocked,
    navigateTo
}: AdSellerCardProps) {
    if (isOwner) return null;
    const sellerProfileId = String(ad.sellerId || "").trim();
    const sellerProfileHref = sellerProfileId
        ? `/seller/${encodeURIComponent(sellerProfileId)}`
        : null;


    return (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[2rem] border border-slate-100/50">
            <CardContent className="p-6 space-y-5">
                {ad.isBusiness ? (
                    <SellerIdentityPanel
                        onClick={() => {
                            if (ad.businessId) {
                                navigateTo(ROUTES.PUBLIC_PROFILE, undefined, undefined, ad.businessId);
                            }
                        }}
                        className="items-center p-2.5 rounded-[1.5rem] hover:bg-slate-50 group border border-transparent hover:border-slate-100"
                        avatar={(
                            <div className={`h-14 w-14 rounded-${ad.isBusiness ? '2xl' : 'full'} ${ad.isBusiness ? 'bg-slate-900' : 'bg-slate-100'} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                            <Building2 className="h-7 w-7 text-white" />
                            </div>
                        )}
                        name={sellerDisplayName}
                        badge={
                            ad.verified ? (
                                <Badge className="bg-blue-600 text-white text-[9px] h-4 px-1.5 rounded-md border-none font-bold">
                                    PRO
                                </Badge>
                            ) : undefined
                        }
                        subtitle={<p className="text-xs text-slate-400 font-medium">Verified Business Account</p>}
                        trailing={<ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />}
                    />
                ) : sellerProfileHref ? (
                    <SellerIdentityPanel
                        href={sellerProfileHref}
                        className="items-center p-2.5 rounded-[1.5rem] hover:bg-slate-50 group border border-transparent hover:border-slate-100"
                        avatar={(
                            <div className={`h-14 w-14 rounded-${ad.isBusiness ? '2xl' : 'full'} ${ad.isBusiness ? 'bg-slate-900' : 'bg-slate-100'} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                                <span className="font-bold text-slate-600 text-lg">
                                    {ad.sellerName?.charAt(0) || sellerDisplayName.charAt(0) || 'E'}
                                </span>
                            </div>
                        )}
                        name={sellerDisplayName}
                        subtitle={<p className="text-xs text-slate-400 font-medium">Registered Member</p>}
                        trailing={<ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />}
                    />
                ) : (
                    <SellerIdentityPanel
                        className="items-center p-2.5 rounded-[1.5rem] border border-transparent"
                        avatar={(
                            <div className={`h-14 w-14 rounded-${ad.isBusiness ? '2xl' : 'full'} ${ad.isBusiness ? 'bg-slate-900' : 'bg-slate-100'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <span className="font-bold text-slate-600 text-lg">
                                    {ad.sellerName?.charAt(0) || sellerDisplayName.charAt(0) || 'E'}
                                </span>
                            </div>
                        )}
                        name={sellerDisplayName}
                        subtitle={<p className="text-xs text-slate-400 font-medium">Registered Member</p>}
                    />
                )}

                {isChatLocked && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <MessageSquareOff className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Chat Locked</p>
                            <p className="text-[10px] text-slate-400">This listing is no longer accepting new messages.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
