import { Card, CardContent } from "@/components/ui/card";
import { type Ad } from "@/schemas/ad.schema";
import { cleanupListingDescription } from "@/lib/listings/descriptionCleanup";
import { Wrench, Info } from "lucide-react";

interface ListingDescriptionCardProps {
    ad: Ad;
    variant?: "mobile" | "desktop";
}

export function ListingDescriptionCard({ ad }: ListingDescriptionCardProps) {
    const description = cleanupListingDescription(String(ad.description || ""));

    // Service/Part specific data
    const hasAttributes = ad.listingType === 'service' || ad.listingType === 'spare_part';

    return (
        <Card className="rounded-none md:rounded-2xl border-x-0 md:border border-slate-100">
            <CardContent className="p-3.5 md:p-5 space-y-3.5 md:space-y-5">
                {hasAttributes && (
                    <div className="grid grid-cols-2 gap-2 pb-3.5 border-b border-slate-100/60">
                        {!!ad.warranty && (
                            <div className="flex items-start gap-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/50">
                                <Wrench className="h-3.5 w-3.5 text-foreground-subtle mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] uppercase font-black text-foreground-subtle tracking-tight leading-none">Warranty</p>
                                    <p className="text-xs font-bold text-foreground-secondary mt-1">{String(ad.warranty)}</p>
                                </div>
                            </div>
                        )}
                        {ad.listingType === 'service' && ad.onsiteService !== undefined && (
                            <div className="flex items-start gap-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/50">
                                <Wrench className="h-3.5 w-3.5 text-foreground-subtle mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] uppercase font-black text-foreground-subtle tracking-tight leading-none">On-site</p>
                                    <p className="text-xs font-bold text-foreground-secondary mt-1">{ad.onsiteService ? 'Yes' : 'No'}</p>
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
                    <h2 className="font-bold text-foreground-secondary text-sm md:text-base">
                        Description
                    </h2>
                    {description ? (
                        <div className="text-muted-foreground whitespace-pre-wrap leading-7 text-sm md:text-base">
                            {description}
                        </div>
                    ) : (
                        <p className="text-foreground-subtle italic text-sm md:text-base">
                            No description provided.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
