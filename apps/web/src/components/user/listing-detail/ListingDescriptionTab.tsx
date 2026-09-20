"use client";

import { type Ad } from "@/schemas/ad.schema";
import { CheckCircle2, CircuitBoard, ShieldCheck, Wrench, XCircle, Briefcase, Clock } from "@esparex/ui";
import { resolveListingSpareParts, resolveListingSparePartsCount } from "@/lib/listings/listingPresentation";
import type { Listing } from "@/lib/api/user/listings";

interface ListingDescriptionTabProps {
    ad: Ad | Listing;
    description: string;
    id?: string;
    ariaLabelledBy?: string;
}

export function ListingDescriptionTab({
    ad,
    description,
    id = "tabpanel-description",
    ariaLabelledBy = "tab-description",
}: ListingDescriptionTabProps) {
    const isService = ad.listingType === 'service';
    const isSparePart = ad.listingType === 'spare_part';
    const serviceListing = ad as Listing;
    const hasAttributes = isService || isSparePart || !!ad.warranty || Boolean(serviceListing.turnaroundTime);
    const resolvedSpareParts = resolveListingSpareParts(ad);
    const sparePartsCount = resolveListingSparePartsCount(ad);
    // Resolved service types from backend aggregation (serviceTypeIds → name)
    const serviceTypes = serviceListing.serviceTypes?.filter((st) => !!st?.name) ?? [];

    return (
        <div
            role="tabpanel"
            id={id}
            aria-labelledby={ariaLabelledBy}
            tabIndex={0}
            className="space-y-5 pt-3.5 sm:pt-4 focus-visible:outline-none"
        >
            {/* Specifications & Highlights Grid */}
            {hasAttributes && (
                <div className="grid grid-cols-2 gap-2.5 pb-3 border-b border-border/60">
                    {/* Service Types: rendered as chips (service listings only) */}
                    {isService && serviceTypes.length > 0 && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <Briefcase className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-tiny uppercase font-bold text-muted-foreground tracking-wider mb-1">Service Types</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {serviceTypes.map((st, idx) => (
                                        <span
                                            key={st._id ?? idx}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-background text-foreground border border-border shadow-2xs"
                                        >
                                            {st.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {isService && ad.onsiteService !== undefined && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <Wrench className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-tiny uppercase font-bold text-muted-foreground tracking-wider">Service Mode</p>
                                <p className="text-caption font-bold text-foreground mt-0.5">{ad.onsiteService ? 'Doorstep Service' : 'In-Shop Only'}</p>
                            </div>
                        </div>
                    )}

                    {isService && Boolean(serviceListing.turnaroundTime) && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-tiny uppercase font-bold text-muted-foreground tracking-wider">Turnaround Time</p>
                                <p className="text-caption font-bold text-foreground mt-0.5">{serviceListing.turnaroundTime}</p>
                            </div>
                        </div>
                    )}

                    {!!ad.warranty && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-tiny uppercase font-bold text-muted-foreground tracking-wider">Warranty</p>
                                <p className="text-caption font-bold text-foreground mt-0.5">{String(ad.warranty)}</p>
                            </div>
                        </div>
                    )}

                    {isSparePart && ad.deviceCondition && (
                        <div className="flex items-start gap-2 bg-muted/50 rounded-xl p-2.5 border border-border/60">
                            <CircuitBoard className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-tiny uppercase font-bold text-muted-foreground tracking-wider">Condition</p>
                                <p className="text-caption font-bold text-foreground mt-0.5">{ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Working Spare Parts Highlights (for Classified Ads) */}
            {!isService && !isSparePart && sparePartsCount > 0 && (
                <div className="space-y-2.5 pb-3 border-b border-border/60">
                    <div className="flex items-center justify-between">
                        <h3 className="text-caption sm:text-small font-bold flex items-center gap-1.5 text-foreground uppercase tracking-wider">
                            <CircuitBoard className="h-4 w-4 text-primary" />
                            Working Spare Parts Included
                        </h3>
                        <span className="text-tiny font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {sparePartsCount} Verified
                        </span>
                    </div>
                    {resolvedSpareParts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {resolvedSpareParts.map((part) => (
                                <span
                                    key={part.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-caption font-semibold text-foreground shadow-2xs"
                                >
                                    <span className="size-2 rounded-full bg-primary" />
                                    {part.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-caption text-muted-foreground">
                            {sparePartsCount} working component{sparePartsCount === 1 ? "" : "s"} cataloged with this device. View the Working Spare Parts tab for full details.
                        </p>
                    )}
                </div>
            )}

            {/* What's Included Card for Services */}
            {!!ad.included && (
                <div className="space-y-2">
                    <h3 className="text-caption font-bold flex items-center gap-1.5 text-primary uppercase tracking-wider">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        What&apos;s Included in Service
                    </h3>
                    <div className="text-caption sm:text-body text-foreground leading-relaxed bg-primary/5 dark:bg-primary/10 p-3.5 rounded-xl border border-primary/20 whitespace-pre-wrap">
                        {String(ad.included)}
                    </div>
                </div>
            )}

            {/* What's Excluded Card for Services */}
            {!!ad.excluded && (
                <div className="space-y-2">
                    <h3 className="text-caption font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                        <XCircle className="h-4 w-4 text-muted-foreground/70" />
                        What&apos;s Excluded
                    </h3>
                    <div className="text-caption sm:text-body text-muted-foreground leading-relaxed bg-muted/50 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap">
                        {String(ad.excluded)}
                    </div>
                </div>
            )}

            {/* Main Description */}
            <div>
                <h3 className="text-caption font-bold text-foreground-subtle uppercase tracking-wider mb-2">Full Details</h3>
                {description ? (
                    <div className="text-foreground-secondary whitespace-pre-wrap leading-relaxed text-body font-normal break-words">
                        {description}
                    </div>
                ) : (
                    <p className="text-muted-foreground italic text-caption sm:text-body">
                        No description provided.
                    </p>
                )}
            </div>
        </div>
    );
}
