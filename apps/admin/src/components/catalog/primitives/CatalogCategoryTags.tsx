"use client";

import type { NamedEntityOption } from "./types";

export function CatalogCategoryTags({
    categoryIds, categories, maxVisible = 3, validateId,
}: {
    categoryIds: string[]; categories: NamedEntityOption[]; maxVisible?: number; validateId?: (id: string) => boolean;
}) {
    if (!categoryIds || categoryIds.length === 0) return <span className="text-tiny text-red-500 font-medium italic">No Category</span>;
    const visibleIds = categoryIds.slice(0, maxVisible);
    const hiddenCount = categoryIds.length - maxVisible;
    return (
        <div className="flex flex-wrap gap-1">
            {visibleIds.map((cid) => {
                const cat = categories.find((c) => c.id === cid);
                const isValid = validateId ? validateId(cid) : true;
                return (
                    <span key={cid} className={`px-2 py-0.5 rounded text-tiny border whitespace-nowrap ${isValid ? "bg-muted text-foreground-secondary border-border" : "bg-destructive/10 text-destructive border-destructive/20 font-bold"}`}
                        title={!isValid ? "This category link is invalid or inactive for this entity type." : ""}>
                        {cat?.name || "Archived"}{!isValid && " (!)"}
                    </span>
                );
            })}
            {hiddenCount > 0 && <span className="px-2 py-0.5 rounded text-tiny bg-muted/40 text-foreground-subtle border border-border/60 whitespace-nowrap">+{hiddenCount} more</span>}
        </div>
    );
}
