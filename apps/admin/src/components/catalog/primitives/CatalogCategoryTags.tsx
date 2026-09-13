"use client";

import { Badge } from "@esparex/ui";
import type { NamedEntityOption } from "./types";

export function CatalogCategoryTags({
    categoryIds, categories, maxVisible = 3, validateId,
}: {
    categoryIds: Array<string | { id?: string; _id?: string }>; categories: NamedEntityOption[]; maxVisible?: number; validateId?: (id: string) => boolean;
}) {
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return (
            <Badge variant="outline" className="text-tiny text-destructive font-medium italic border-destructive/20 bg-destructive/10">
                No Category
            </Badge>
        );
    }
    const visibleIds = categoryIds.slice(0, maxVisible);
    const hiddenCount = categoryIds.length - maxVisible;
    return (
        <div className="flex flex-wrap gap-1">
            {visibleIds.map((cid, idx) => {
                const idStr = typeof cid === "string" ? cid : cid?.id || cid?._id || String(cid || idx);
                const cat = categories.find((c) => c.id === idStr);
                const isValid = validateId ? validateId(idStr) : true;
                return (
                    <Badge
                        key={`${idStr}-${idx}`}
                        variant="outline"
                        className={`text-tiny whitespace-nowrap ${isValid ? "bg-muted text-foreground-secondary border-border" : "bg-destructive/10 text-destructive border-destructive/20 font-bold"}`}
                        title={!isValid ? "This category link is invalid or inactive for this entity type." : ""}
                    >
                        {cat?.name || "Archived"}{!isValid && " (!)"}
                    </Badge>
                );
            })}
            {hiddenCount > 0 && (
                <Badge variant="outline" className="text-tiny bg-muted/40 text-foreground-subtle border-border/60 whitespace-nowrap">
                    +{hiddenCount} more
                </Badge>
            )}
        </div>
    );
}
