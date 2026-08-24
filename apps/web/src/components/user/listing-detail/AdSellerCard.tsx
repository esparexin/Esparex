import { Badge } from "@/components/ui/badge";
import { Building2, MessageCircle, MessageSquareOff, Phone } from "@/icons/IconRegistry";
import type { Ad } from "@/schemas/ad.schema";
import { SellerIdentityPanel } from "@/components/user/shared/SellerIdentityPanel";
import { Button } from "@esparex/ui";
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
    const panelClassName = `items-center p-2 rounded-xl border border-transparent ${
        isInteractive ? "hover:bg-muted/50 group hover:border-border" : ""
    }`;
    const showInlineChat = !isChatLocked && Boolean(onChat);
    const showInlinePhone = Boolean(onRevealPhone);
    const showDesktopActions = showInlineChat || showInlinePhone;
    const phoneButtonLabel = isPhoneLoading
        ? "Loading..."
        : (revealedPhone || "Show number");

    const renderAvatar = () => {
        if (ad.isBusiness) {
            return (
                <div className={`h-10 w-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-xs ${isInteractive ? 'group-hover:scale-105 transition-transform' : ''}`}>
                    <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
            );
        }
        return (
            <div className={`h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 ${isInteractive ? 'group-hover:scale-105 transition-transform' : ''}`}>
                <span className="font-bold text-primary text-sm">
                    {ad.sellerName?.charAt(0) || sellerDisplayName.charAt(0) || 'E'}
                </span>
            </div>
        );
    };

    return (
        <div className="space-y-3 pb-4 border-b border-border">
            <SellerIdentityPanel
                href={sellerProfileHref}
                className={panelClassName}
                avatar={renderAvatar()}
                name={sellerDisplayName}
                subtitle={
                    <p className="text-xs text-foreground-subtle font-medium">
                        {ad.isBusiness ? "Verified Business Account" : (ad.time ? `Member since ${ad.time}` : "Registered Member")}
                    </p>
                }
                badge={ad.isBusiness && ad.verified ? (
                    <Badge className="bg-primary text-primary-foreground text-tiny h-4 px-1.5 rounded-md border-none font-bold">PRO</Badge>
                ) : undefined}
                trailing={undefined}
            />

            {showDesktopActions && (
                <div className="hidden md:block space-y-2">
                    <div className={`grid gap-2 ${showInlineChat && showInlinePhone ? "grid-cols-2" : "grid-cols-1"}`}>
                        {showInlinePhone && (
                            <Button
                                onClick={onRevealPhone}
                                variant="outline"
                                disabled={isPhoneLoading}
                                aria-label={revealedPhone ? `Call ${revealedPhone}` : "Reveal seller phone number"}
                                className="w-full h-10 rounded-xl text-xs sm:text-sm font-semibold gap-2 border-border text-foreground-secondary hover:bg-muted cursor-pointer"
                            >
                                <Phone className="h-4 w-4" />
                                <span className="min-w-0 truncate">{phoneButtonLabel}</span>
                            </Button>
                        )}
                        {showInlineChat && (
                            <Button
                                onClick={onChat}
                                aria-label="Chat with seller"
                                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                            >
                                <MessageCircle className="h-4 w-4" />
                                <span>Chat</span>
                            </Button>
                        )}
                    </div>
                    {phoneMessage && (
                        <p className="text-caption text-foreground-subtle text-center">
                            {phoneMessage}
                        </p>
                    )}
                </div>
            )}

            {isChatLocked && !isOwner && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 text-muted-foreground text-caption">
                    <MessageSquareOff className="h-4 w-4 flex-shrink-0" />
                    <span>Chat is disabled for this listing.</span>
                </div>
            )}
        </div>
    );
}
