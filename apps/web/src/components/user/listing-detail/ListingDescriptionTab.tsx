"use client";

import { type Ad } from "@/schemas/ad.schema";
import { CheckCircle2, CircuitBoard, ShieldCheck, Wrench, XCircle } from "@/icons/IconRegistry";

interface ListingDescriptionTabProps {
    ad: Ad;
    description: string;
}

export function ListingDescriptionTab({ ad, description }: ListingDescriptionTabProps) {
    const isService = ad.listingType === 'service';
    const isSparePart = ad.listingType === 'spare_part';
    const hasAttributes = isService || isSparePart || !!ad.warranty;

    return (
        <div
            role="tabpanel"
            id="tabpanel-description"
            aria-labelledby="tab-description"
            tabIndex={0}
            className="space-y-4 focus-visible:outline-none"
        >
            {/* Specifications & Highlights Grid */}
            {hasAttributes && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-3 border-b border-border/60">
                    {!!ad.warranty && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Warranty</p>
                                <p className="text-xs font-bold text-foreground mt-0.5">{String(ad.warranty)}</p>
                            </div>
                        </div>
                    )}

                    {isService && ad.onsiteService !== undefined && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <Wrench className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Service Type</p>
                                <p className="text-xs font-bold text-foreground mt-0.5">{ad.onsiteService ? 'Doorstep Service' : 'In-Shop Only'}</p>
                            </div>
                        </div>
                    )}

                    {isSparePart && ad.deviceCondition && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <CircuitBoard className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Condition</p>
                                <p className="text-xs font-bold text-foreground mt-0.5">{ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* What's Included Card for Services */}
            {!!ad.included && (
                <div className="space-y-2">
                    <h3 className="text-xs font-bold flex items-center gap-1.5 text-emerald-700 uppercase tracking-wider">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        What&apos;s Included in Service
                    </h3>
                    <div className="text-xs sm:text-sm text-foreground-secondary leading-relaxed bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 whitespace-pre-wrap">
                        {String(ad.included)}
                    </div>
                </div>
            )}

            {/* What's Excluded Card for Services */}
            {!!ad.excluded && (
                <div className="space-y-2">
                    <h3 className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                        <XCircle className="h-4 w-4 text-muted-foreground/70" />
                        What&apos;s Excluded
                    </h3>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap">
                        {String(ad.excluded)}
                    </div>
                </div>
            )}

            {/* Main Description */}
            <div>
                <h3 className="text-xs font-bold text-foreground-subtle uppercase tracking-wider mb-2">Full Details</h3>
                {description ? (
                    <div className="text-foreground-secondary whitespace-pre-wrap leading-relaxed text-sm font-normal break-words">
                        {description}
                    </div>
                ) : (
                    <p className="text-muted-foreground italic text-xs sm:text-sm">
                        No description provided.
                    </p>
                )}
            </div>
        </div>
    );
}
