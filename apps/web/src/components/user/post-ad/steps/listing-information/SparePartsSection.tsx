"use client";

import { usePostAdCatalog, usePostAdAction } from "../../context";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

export function SparePartsSection() {
    const { availableSpareParts, isLoadingSpareParts, sparePartsError } = usePostAdCatalog();
    const { watch, toggleSparePart, loadSparePartsForCategory } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const spareParts = (watch("spareParts") || []) as string[];

    if (!categoryId) {
        return null;
    }

    return (
        <section className="space-y-1.5 w-full">
            <label className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider block ml-1">Working Spare Parts</label>
            {isLoadingSpareParts ? (
                <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-6 rounded-lg bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : sparePartsError ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-700 text-center mb-2">{sparePartsError}</p>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadSparePartsForCategory(categoryId)} 
                        className="w-full text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Try Again
                    </Button>
                </div>
            ) : availableSpareParts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {availableSpareParts.map((part) => {
                        const selected = spareParts.includes(part.id as string);
                        return (
                            <button 
                                key={part.id as string} 
                                type="button" 
                                onClick={() => toggleSparePart(part.id as string)}
                                className={cn(
                                    "h-6 px-2.5 rounded-full border text-[11px] font-bold transition-all", 
                                    selected ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300"
                                )}
                            >
                                {part.name}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </section>
    );
}
