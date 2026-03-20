import { Card, CardContent } from "@/components/ui/card";
import { type Ad } from "@/schemas/ad.schema";
import { Wrench, Info } from "lucide-react";

interface ListingDescriptionCardProps {
    ad: Ad;
    variant: "mobile" | "desktop";
}

export function ListingDescriptionCard({ ad, variant }: ListingDescriptionCardProps) {
    const isMobile = variant === "mobile";

    // Service/Part specific data
    const hasAttributes = ad.listingType === 'service' || ad.listingType === 'spare_part';

    return (
        <Card className={isMobile
            ? "md:hidden rounded-none border-x-0 border-t-0 border-b"
            : "rounded-none md:rounded-lg hidden md:block"}
        >
            <CardContent className={isMobile ? "p-4 space-y-4" : "p-3 md:p-6 space-y-4 md:space-y-6"}>
                {hasAttributes && (
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                        {!!ad.warranty && (
                            <div className="flex items-start gap-2">
                                <Wrench className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Warranty</p>
                                    <p className="text-sm font-semibold">{String(ad.warranty)}</p>
                                </div>
                            </div>
                        )}
                        {ad.listingType === 'service' && ad.onsiteService !== undefined && (
                            <div className="flex items-start gap-2">
                                <Wrench className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">On-site</p>
                                    <p className="text-sm font-semibold">{ad.onsiteService ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!!ad.included && (
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-blue-500" />
                            What&apos;s Included
                        </h4>
                        <div className="text-sm text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                            {String(ad.included)}
                        </div>
                    </div>
                )}

                {!!ad.excluded && (
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                            What&apos;s Excluded
                        </h4>
                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {String(ad.excluded)}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className={`font-semibold mb-1.5 ${isMobile ? "text-sm" : "md:mb-2 text-sm md:text-base"}`}>
                        Description
                    </h3>
                    <div className={`text-slate-600 whitespace-pre-wrap leading-relaxed ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>
                        {String(ad.description)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
