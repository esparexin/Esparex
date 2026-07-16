"use client";

import { Wrench, Shield, Check } from "lucide-react";
import { type Ad } from "@/schemas/ad.schema";

interface ListingAttributesProps {
    ad: Ad;
    className?: string;
}

export function ListingAttributes({ ad, className }: ListingAttributesProps) {
    const hasWarranty = !!ad.warranty;
    const isServiceOnSite = ad.listingType === 'service' && ad.onsiteService !== undefined;
    const hasCondition = !!ad.deviceCondition;

    const hasAny = hasWarranty || isServiceOnSite || hasCondition;
    if (!hasAny) return null;

    return (
        <div className={`grid grid-cols-2 gap-2 pb-3.5 border-b border-slate-100/60 ${className || ""}`}>
            {hasWarranty && (
                <div className="flex items-start gap-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/50">
                    <Wrench className="h-3.5 w-3.5 text-foreground-subtle mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] uppercase font-black text-foreground-subtle tracking-tight leading-none">Warranty</p>
                        <p className="text-xs font-bold text-foreground-secondary mt-1">{String(ad.warranty)}</p>
                    </div>
                </div>
            )}
            
            {isServiceOnSite && (
                <div className="flex items-start gap-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/50">
                    <Check className="h-3.5 w-3.5 text-foreground-subtle mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] uppercase font-black text-foreground-subtle tracking-tight leading-none">On-site</p>
                        <p className="text-xs font-bold text-foreground-secondary mt-1">{ad.onsiteService ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            )}

            {hasCondition && (
                <div className="flex items-start gap-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/50">
                    <Shield className="h-3.5 w-3.5 text-foreground-subtle mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] uppercase font-black text-foreground-subtle tracking-tight leading-none">Condition</p>
                        <p className="text-xs font-bold text-foreground-secondary mt-1">{String(ad.deviceCondition)}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
