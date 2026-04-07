import { Card, CardContent } from "@/components/ui/card";
import { type Ad } from "@/schemas/ad.schema";
import { cleanupListingDescription } from "@/lib/listings/descriptionCleanup";
import { Wrench, Info } from "lucide-react";

interface ListingDescriptionCardProps {
    ad: Ad;
    variant: "mobile" | "desktop";
}

export function ListingDescriptionCard({ ad, variant }: ListingDescriptionCardProps) {
    const isMobile = variant === "mobile";
    const description = cleanupListingDescription(String(ad.description || ""));

    // Service/Part specific data
    const hasAttributes = ad.listingType === 'service' || ad.listingType === 'spare_part';

    return (
        <Card className={isMobile
            ? "md:hidden rounded-none border-x-0 border-t-0 border-b border-slate-100"
            : "rounded-none md:rounded-2xl hidden md:block border-slate-100"}
        >
            <CardContent className={isMobile ? "p-4 space-y-4" : "p-4 md:p-6 space-y-4 md:space-y-6"}>
                {hasAttributes && (
                    <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
                        {!!ad.warranty && (
                            <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3">
                                <Wrench className="h-4 w-4 text-foreground-subtle mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-2xs uppercase font-bold text-foreground-subtle tracking-wider">Warranty</p>
                                    <p className="text-sm font-semibold text-foreground-secondary mt-0.5">{String(ad.warranty)}</p>
                                </div>
                            </div>
                        )}
                        {ad.listingType === 'service' && ad.onsiteService !== undefined && (
                            <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3">
                                <Wrench className="h-4 w-4 text-foreground-subtle mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-2xs uppercase font-bold text-foreground-subtle tracking-wider">On-site</p>
                                    <p className="text-sm font-semibold text-foreground-secondary mt-0.5">{ad.onsiteService ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!!ad.included && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                            <Info className="h-3.5 w-3.5 text-blue-500" />
                            What&apos;s Included
                        </h3>
                        <div className="text-sm text-foreground-tertiary leading-relaxed bg-blue-50 p-3.5 rounded-xl border border-blue-100">
                            {String(ad.included)}
                        </div>
                    </div>
                )}

                {!!ad.excluded && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
                            <Info className="h-3.5 w-3.5 text-foreground-subtle" />
                            What&apos;s Excluded
                        </h3>
                        <div className="text-sm text-foreground-tertiary leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            {String(ad.excluded)}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <h2 className={`font-bold text-foreground-secondary ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>
                        Description
                    </h2>
                    {description ? (
                        <div className={`text-muted-foreground whitespace-pre-wrap leading-7 ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>
                            {description}
                        </div>
                    ) : (
                        <p className={`text-foreground-subtle italic ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>
                            No description provided.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
