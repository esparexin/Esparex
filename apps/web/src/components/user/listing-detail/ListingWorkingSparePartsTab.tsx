"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Ad } from "@/schemas/ad.schema";
import { Check, CircuitBoard } from "@esparex/ui";
import { getSpareParts } from "@/lib/api/user/masterData";
import { resolveListingSpareParts, type ResolvedSparePart } from "@/lib/listings/listingPresentation";

export type NormalizedSparePartItem = ResolvedSparePart;

export function extractSparePartItems(ad: Ad): NormalizedSparePartItem[] {
    return resolveListingSpareParts(ad);
}

interface ListingWorkingSparePartsTabProps {
    ad: Ad;
    sparePartItems: NormalizedSparePartItem[];
}

export function ListingWorkingSparePartsTab({ ad, sparePartItems }: ListingWorkingSparePartsTabProps) {
    const categoryId = String(ad.categoryId || (ad as { category?: unknown }).category || "");
    const { data: catalogSpareParts = [], isLoading: isCatalogLoading } = useQuery({
        queryKey: ["spare-parts-catalog", categoryId],
        queryFn: () => getSpareParts(categoryId),
        enabled: Boolean(categoryId),
        staleTime: 10 * 60 * 1000,
    });

    const catalogMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const p of catalogSpareParts) {
            const id = String(p.id || p._id || "");
            if (id) map.set(id, p.name);
            if (p.slug) map.set(p.slug, p.name);
        }
        return map;
    }, [catalogSpareParts]);

    const resolvedSpareParts = useMemo(() => {
        const resolved: NormalizedSparePartItem[] = [...sparePartItems];
        const seenNames = new Set(resolved.map(r => r.name.toLowerCase()));

        const rawList = [
            ...(Array.isArray(ad.spareParts) ? ad.spareParts : []),
            ...(Array.isArray(ad.sparePartIds) ? ad.sparePartIds : [])
        ];

        for (const item of rawList) {
            if (item && typeof item === "object") {
                const record = item as Record<string, unknown>;
                const name = String(record.name || record.displayName || record.title || record.canonicalName || "").trim();
                const idStr = String(record.id || record._id || "");
                const brand = typeof record.brand === "string" && record.brand.trim() ? record.brand.trim() : undefined;
                if (name && !seenNames.has(name.toLowerCase())) {
                    seenNames.add(name.toLowerCase());
                    resolved.push({ id: idStr || name, name, brand });
                }
            } else if (typeof item === "string") {
                const idStr = item.trim();
                if (idStr && catalogMap.has(idStr)) {
                    const catalogName = catalogMap.get(idStr)!;
                    if (!seenNames.has(catalogName.toLowerCase())) {
                        seenNames.add(catalogName.toLowerCase());
                        resolved.push({
                            id: idStr,
                            name: catalogName,
                        });
                    }
                }
            }
        }
        return resolved;
    }, [sparePartItems, ad.spareParts, ad.sparePartIds, catalogMap]);

    const hasRawParts = (Array.isArray(ad.sparePartIds) && ad.sparePartIds.length > 0) ||
        (Array.isArray(ad.spareParts) && ad.spareParts.length > 0);

    return (
        <div
            role="tabpanel"
            id="tabpanel-spare-parts"
            aria-labelledby="tab-spare-parts"
            tabIndex={0}
            className="space-y-4 pt-3.5 sm:pt-4 focus-visible:outline-none"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-body sm:text-body-lg font-bold text-foreground">Working Spare Parts</h3>
                </div>
                {resolvedSpareParts.length > 0 && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        {resolvedSpareParts.length} {resolvedSpareParts.length === 1 ? "Part" : "Parts"}
                    </span>
                )}
            </div>

            {resolvedSpareParts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {resolvedSpareParts.map((part) => (
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
                                    <p className="text-tiny text-foreground-subtle mt-0.5 truncate">
                                        {part.brand ? `Brand: ${part.brand}` : (ad.brandName ? `Compatible with ${ad.brandName}` : "Component")}
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                                <Check className="size-3" />
                                Available
                            </span>
                        </div>
                    ))}
                </div>
            ) : (isCatalogLoading && hasRawParts) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[1, 2].map((n) => (
                        <div key={n} className="p-3.5 rounded-2xl border border-border bg-card animate-pulse flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-muted" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center space-y-2">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <CircuitBoard className="size-5" />
                    </div>
                    <h4 className="text-xs sm:text-small font-bold text-foreground">No individual spare parts tagged</h4>
                    <p className="text-tiny sm:text-caption text-foreground-subtle max-w-md mx-auto">
                        No specific working components have been tagged individually. Check the full description or contact the seller to verify available parts.
                    </p>
                </div>
            )}
        </div>
    );
}
