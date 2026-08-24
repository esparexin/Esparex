"use client";

import { type Ad } from "@/schemas/ad.schema";
import { Check, CircuitBoard } from "@/icons/IconRegistry";

export interface NormalizedSparePartItem {
    id: string;
    name: string;
    brand?: string;
    type?: string;
}

export function extractSparePartItems(ad: Ad): NormalizedSparePartItem[] {
    const items: NormalizedSparePartItem[] = [];
    const seenNames = new Set<string>();

    if (Array.isArray(ad.sparePartsSnapshot) && ad.sparePartsSnapshot.length > 0) {
        for (const part of ad.sparePartsSnapshot) {
            const name = String(part.name || "").trim();
            if (name && !seenNames.has(name.toLowerCase())) {
                seenNames.add(name.toLowerCase());
                items.push({
                    id: String(part.id || part._id || name),
                    name,
                    brand: part.brand ? String(part.brand).trim() : undefined,
                });
            }
        }
    }

    if (Array.isArray(ad.spareParts) && ad.spareParts.length > 0) {
        for (const part of ad.spareParts) {
            if (typeof part === "string") {
                const name = part.trim();
                if (name && !/^[a-f\d]{24}$/i.test(name) && !seenNames.has(name.toLowerCase())) {
                    seenNames.add(name.toLowerCase());
                    items.push({
                        id: name,
                        name,
                    });
                }
            } else if (part && typeof part === "object") {
                const name = String(part.name || "").trim();
                if (name && !seenNames.has(name.toLowerCase())) {
                    seenNames.add(name.toLowerCase());
                    items.push({
                        id: String(part.id || part._id || name),
                        name,
                        type: part.type ? String(part.type).trim() : undefined,
                    });
                }
            }
        }
    }

    return items;
}

interface ListingWorkingSparePartsTabProps {
    ad: Ad;
    sparePartItems: NormalizedSparePartItem[];
}

export function ListingWorkingSparePartsTab({ ad, sparePartItems }: ListingWorkingSparePartsTabProps) {
    return (
        <div
            role="tabpanel"
            id="tabpanel-spare-parts"
            aria-labelledby="tab-spare-parts"
            tabIndex={0}
            className="space-y-3 focus-visible:outline-none"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm md:text-base font-bold text-foreground">Working Spare Parts</h3>
                    <p className="text-xs text-foreground-subtle">
                        Functional components and spare parts verified available from this listing.
                    </p>
                </div>
                {sparePartItems.length > 0 && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        {sparePartItems.length} {sparePartItems.length === 1 ? "Part" : "Parts"}
                    </span>
                )}
            </div>

            {sparePartItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {sparePartItems.map((part) => (
                        <div
                            key={part.id}
                            className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors"
                        >
                            <div className="flex items-start gap-2.5 min-w-0">
                                <div className="size-9 rounded-xl bg-indigo-50/80 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600">
                                    <CircuitBoard className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs sm:text-small font-bold text-foreground truncate">{part.name}</h4>
                                    <p className="text-2xs text-foreground-subtle mt-0.5 truncate">
                                        {part.brand ? `Brand: ${part.brand}` : (ad.brandName ? `Compatible with ${ad.brandName}` : "Component")}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                                <Check className="size-3" />
                                Working
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center space-y-2">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <CircuitBoard className="size-5" />
                    </div>
                    <h4 className="text-xs sm:text-small font-bold text-foreground">No individual spare parts tagged</h4>
                    <p className="text-2xs sm:text-xs text-foreground-subtle max-w-md mx-auto">
                        No specific working components have been tagged individually. Check the full description or contact the seller to verify available parts.
                    </p>
                </div>
            )}
        </div>
    );
}
