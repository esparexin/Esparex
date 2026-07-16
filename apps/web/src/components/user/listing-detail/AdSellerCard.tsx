import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight } from "lucide-react";
import type { Ad } from "@/schemas/ad.schema";
import { SellerIdentityPanel } from "@/components/user/shared/SellerIdentityPanel";
import { ListingContactForm } from "./ListingContactForm";
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
    const renderAvatar = () => {
        if (ad.isBusiness) {
            return (
                <div className={`h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-100 ${isInteractive ? 'group-hover:scale-105 transition-transform' : ''}`}>
                    <Building2 className="h-6 w-6 text-white" />
                </div>
            );
        }
        return (
            <div className={`h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 ${isInteractive ? 'group-hover:scale-105 transition-transform' : ''}`}>
                <span className="font-bold text-foreground-tertiary text-base">
                    {ad.sellerName?.charAt(0) || sellerDisplayName.charAt(0) || 'E'}
                </span>
            </div>
        );
    };

    return (
        <Card className="border-none shadow-sm md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-none md:rounded-[2rem] border-b border-slate-100 md:border-slate-100/50">
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
                <SellerIdentityPanel
                    href={sellerProfileHref}
                    className={panelClassName}
                    avatar={renderAvatar()}
                    name={sellerDisplayName}
                    subtitle={
                        <p className="text-xs text-foreground-subtle font-medium">
                            {ad.isBusiness ? "Verified Business Account" : "Registered Member"}
                        </p>
                    }
                    badge={ad.isBusiness && ad.verified ? (
                        <Badge className="bg-blue-600 text-white text-2xs h-4 px-1.5 rounded-md border-none font-bold">PRO</Badge>
                    ) : undefined}
                    trailing={isInteractive ? <ChevronRight className="h-4 w-4 text-foreground-subtle group-hover:translate-x-1 transition-transform" /> : undefined}
                />

                <div className="hidden md:block">
                    <ListingContactForm
                        onChat={onChat}
                        onRevealPhone={onRevealPhone}
                        isPhoneLoading={isPhoneLoading}
                        revealedPhone={revealedPhone}
                        phoneMessage={phoneMessage}
                        isChatLocked={isChatLocked}
                        layout="grid"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
