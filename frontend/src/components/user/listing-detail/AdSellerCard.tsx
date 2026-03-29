import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, MessageCircle, MessageSquareOff, Phone } from "lucide-react";
import type { Ad } from "@/schemas/ad.schema";
import { SellerIdentityPanel } from "../shared/SellerIdentityPanel";
import { Button } from "@/components/ui/button";
import { generateAdSlug } from "@/lib/slug";
import { getPageRoute } from "@/lib/routeUtils";

interface AdSellerCardProps {
    ad: Ad;
    sellerDisplayName: string;
    isOwner: boolean;
    isChatLocked?: boolean;
    onChat?: () => void;
    onRevealPhone?: () => void;
    isPhoneLoading?: boolean;
    revealedPhone?: string | null;
    isPhoneMasked?: boolean;
    phoneMessage?: string | null;
}

export function AdSellerCard({
    ad,
    sellerDisplayName,
    isOwner,
    isChatLocked,
    onChat,
    onRevealPhone,
    isPhoneLoading,
    revealedPhone,
    isPhoneMasked,
    phoneMessage,
}: AdSellerCardProps) {
    if (isOwner) return null;
    const sellerProfileId = String(ad.sellerId || "").trim();
    const sellerSlug = generateAdSlug(sellerDisplayName || ad.sellerName || "seller");
    const sellerProfileHref = sellerProfileId
        ? getPageRoute("public-profile", {
            sellerId: sellerProfileId,
            sellerSlug,
            sellerType: "individual",
        })
        : null;

    const isInteractive = !ad.isBusiness && !!sellerProfileHref;
    const panelClassName = `items-center p-2.5 rounded-[1.5rem] border border-transparent ${
        isInteractive ? "hover:bg-slate-50 group hover:border-slate-100" : ""
    }`;
    const showInlineChat = !isChatLocked && Boolean(onChat);
    const showInlinePhone = Boolean(onRevealPhone);
    const showContactPanel =
        showInlineChat || showInlinePhone || Boolean(revealedPhone) || Boolean(phoneMessage);

    const renderAvatar = () => {
        if (ad.isBusiness) {
            return (
                <div className={`h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm ${isInteractive ? 'group-hover:scale-105 transition-transform' : ''}`}>
                    <Building2 className="h-7 w-7 text-white" />
                </div>
            );
        }
        return (
            <div className={`h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm ${isInteractive ? 'group-hover:scale-105 transition-transform' : ''}`}>
                <span className="font-bold text-slate-600 text-lg">
                    {ad.sellerName?.charAt(0) || sellerDisplayName.charAt(0) || 'E'}
                </span>
            </div>
        );
    };

    return (
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[2rem] border border-slate-100/50">
            <CardContent className="p-6 space-y-5">
                <SellerIdentityPanel
                    href={sellerProfileHref}
                    className={panelClassName}
                    avatar={renderAvatar()}
                    name={sellerDisplayName}
                    subtitle={
                        <p className="text-xs text-slate-400 font-medium">
                            {ad.isBusiness ? "Verified Business Account" : "Registered Member"}
                        </p>
                    }
                    badge={ad.isBusiness && ad.verified ? (
                        <Badge className="bg-blue-600 text-white text-[9px] h-4 px-1.5 rounded-md border-none font-bold">PRO</Badge>
                    ) : undefined}
                    trailing={isInteractive ? <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" /> : undefined}
                />

                {showContactPanel && (
                    <div className="grid gap-3">
                        {showInlineChat && (
                            <Button
                                onClick={onChat}
                                className="hidden md:flex w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold gap-2 shadow-lg shadow-green-200"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Chat with Seller
                            </Button>
                        )}
                        {showInlinePhone && (
                            <Button
                                onClick={onRevealPhone}
                                variant="outline"
                                disabled={isPhoneLoading}
                                className="w-full h-12 rounded-xl font-semibold gap-2"
                            >
                                <Phone className="h-4 w-4" />
                                {revealedPhone
                                    ? (isPhoneMasked ? "Phone preview" : "Call seller")
                                    : (isPhoneLoading ? "Loading phone..." : "Show phone")}
                            </Button>
                        )}
                        {(revealedPhone || phoneMessage) && (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                {revealedPhone && (
                                    <p className="text-sm font-semibold text-slate-900">
                                        {revealedPhone}
                                    </p>
                                )}
                                {phoneMessage && (
                                    <p className="text-xs text-slate-500 mt-1">{phoneMessage}</p>
                                )}
                            </div>
                        )}
                    </div>
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
