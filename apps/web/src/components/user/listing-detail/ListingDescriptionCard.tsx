import { PageSection } from "@/components/layout";
import { type Ad } from "@/schemas/ad.schema";
import { cleanupListingDescription } from "@/lib/listings/descriptionCleanup";
import { Wrench, CheckCircle2, XCircle, ShieldCheck, CircuitBoard, Briefcase } from "@/icons/IconRegistry";

interface ListingDescriptionCardProps {
    ad: Ad;
    variant?: "mobile" | "desktop";
}

export function ListingDescriptionCard({ ad }: ListingDescriptionCardProps) {
    const description = cleanupListingDescription(String(ad.description || ""));
    const isService = ad.listingType === 'service';
    const isSparePart = ad.listingType === 'spare_part';
    const hasAttributes = isService || isSparePart || !!ad.warranty;

    const titleText = isService
        ? "Service Overview & Specifications"
        : isSparePart
        ? "Spare Part Specifications & Details"
        : "Description & Details";

    return (
        <PageSection
            variant="bordered"
            className="rounded-none md:rounded-2xl border-x-0 md:border border-slate-100 p-3.5 md:p-5"
            title={
                <span className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                    {isService ? (
                        <Briefcase className="size-4 text-emerald-600" />
                    ) : isSparePart ? (
                        <CircuitBoard className="size-4 text-indigo-600" />
                    ) : null}
                    {titleText}
                </span>
            }
        >
            <div className="space-y-4 pt-1">
                {/* Specifications & Highlights Grid */}
                {hasAttributes && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-4 border-b border-slate-100">
                        {!!ad.warranty && (
                            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Warranty</p>
                                    <p className="text-xs font-bold text-slate-800 mt-0.5">{String(ad.warranty)}</p>
                                </div>
                            </div>
                        )}

                        {isService && ad.onsiteService !== undefined && (
                            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                <Wrench className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Type</p>
                                    <p className="text-xs font-bold text-slate-800 mt-0.5">{ad.onsiteService ? 'Doorstep Service' : 'In-Shop Only'}</p>
                                </div>
                            </div>
                        )}

                        {isSparePart && ad.deviceCondition && (
                            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                <CircuitBoard className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Condition</p>
                                    <p className="text-xs font-bold text-slate-800 mt-0.5">{ad.deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}</p>
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
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 whitespace-pre-wrap">
                            {String(ad.included)}
                        </div>
                    </div>
                )}

                {/* What's Excluded Card for Services */}
                {!!ad.excluded && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold flex items-center gap-1.5 text-slate-500 uppercase tracking-wider">
                            <XCircle className="h-4 w-4 text-slate-400" />
                            What&apos;s Excluded
                        </h3>
                        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                            {String(ad.excluded)}
                        </div>
                    </div>
                )}

                {/* Main Description */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Details</h3>
                    {description ? (
                        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-normal">
                            {description}
                        </div>
                    ) : (
                        <p className="text-slate-400 italic text-xs sm:text-sm">
                            No description provided.
                        </p>
                    )}
                </div>
            </div>
        </PageSection>
    );
}
