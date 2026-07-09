"use client";

import type { NamedEntityOption } from "./types";

export function CatalogCategoryTags({
    categoryIds, categories, maxVisible = 3, validateId,
}: {
    categoryIds: string[]; categories: NamedEntityOption[]; maxVisible?: number; validateId?: (id: string) => boolean;
}) {
    if (!categoryIds || categoryIds.length === 0) return <span className="text-[10px] text-red-500 font-medium italic">No Category</span>;
    const visibleIds = categoryIds.slice(0, maxVisible);
    const hiddenCount = categoryIds.length - maxVisible;
    return (
        <div className="flex flex-wrap gap-1">
            {visibleIds.map((cid) => {
                const cat = categories.find((c) => c.id === cid);
                const isValid = validateId ? validateId(cid) : true;
                return (
                    <span key={cid} className={`px-2 py-0.5 rounded text-[10px] border whitespace-nowrap ${isValid ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-red-50 text-red-600 border-red-100 font-bold"}`}
                        title={!isValid ? "This category link is invalid or inactive for this entity type." : ""}>
                        {cat?.name || "Archived"}{!isValid && " (!)"}
                    </span>
                );
            })}
            {hiddenCount > 0 && <span className="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-400 border border-slate-100 whitespace-nowrap">+{hiddenCount} more</span>}
        </div>
    );
}
