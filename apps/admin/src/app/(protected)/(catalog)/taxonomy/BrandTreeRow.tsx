import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ModelListItem } from "./ModelListItem";
import { StatusDot, CountBadge } from "./CategoryTreeRow";

export const BrandTreeRow = ({ brand, isExpanded, onToggle }: { brand: any, isExpanded: boolean, onToggle: () => void }) => {
    return (
        <li className="border-b border-slate-100 last:border-none">
            <button
                className="w-full flex items-center gap-3 pl-12 pr-4 py-2.5 hover:bg-white transition-colors text-left"
                onClick={onToggle}
            >
                <span className="text-slate-400 w-4 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <span className="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 text-[10px] font-bold">
                    {brand.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-slate-800 flex-1">
                    {brand.name}
                </span>
                <CountBadge count={brand.models.length} label="models" />
                <StatusDot isActive={brand.isActive} />
            </button>

            {isExpanded && (
                <ul className="bg-white border-t border-slate-100">
                    {brand.models.length === 0 ? (
                        <li className="pl-28 pr-4 py-2 text-xs text-slate-400 italic">
                            No models for this brand
                        </li>
                    ) : (
                        brand.models.map((model: any) => (
                            <ModelListItem key={model.id} model={model} />
                        ))
                    )}
                </ul>
            )}
        </li>
    );
};
