import React from "react";
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { getListingTypeIcon } from "@/components/catalog/CatalogUiPrimitives";
import { BrandTreeRow } from "./BrandTreeRow";

export const StatusDot = ({ isActive }: { isActive: boolean }) =>
    isActive ? (
        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
    ) : (
        <XCircle size={12} className="text-slate-400 shrink-0" />
    );

export const CountBadge = ({ count, label }: { count: number; label: string }) => (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
        {count} {label}
    </span>
);

export const CategoryTreeRow = ({
    category,
    isExpanded,
    expandedBrands,
    onToggleCategory,
    onToggleBrand
}: {
    category: any,
    isExpanded: boolean,
    expandedBrands: Record<string, boolean>,
    onToggleCategory: () => void,
    onToggleBrand: (id: string) => void
}) => {
    return (
        <li>
            <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                onClick={onToggleCategory}
            >
                <span className="text-slate-400 w-4 shrink-0">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    {getListingTypeIcon(category.listingType?.[0] || "", 16)}
                </span>
                <span className="font-bold text-slate-900 flex-1 text-sm">
                    {category.name}
                    <span className="ml-2 text-slate-400 font-normal text-xs">{category.slug}</span>
                </span>
                {category.hasScreenSizes && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-100">
                        Screen Sizes
                    </span>
                )}
                <CountBadge count={category.brands.length} label="brands" />
                <StatusDot isActive={category.isActive} />
            </button>

            {isExpanded && (
                <ul className="border-t border-slate-100 bg-slate-50/40">
                    {category.brands.length === 0 ? (
                        <li className="pl-16 pr-4 py-2 text-xs text-slate-400 italic">
                            No brands in this category
                        </li>
                    ) : (
                        category.brands.map((brand: any) => (
                            <BrandTreeRow
                                key={brand.id}
                                brand={brand}
                                isExpanded={Boolean(expandedBrands[brand.id])}
                                onToggle={() => onToggleBrand(brand.id)}
                            />
                        ))
                    )}
                </ul>
            )}
        </li>
    );
};
