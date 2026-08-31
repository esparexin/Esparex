"use client";

import { Button } from "@esparex/ui";
import { Trash2 } from "@/icons/IconRegistry";
import type { SavedSearch } from "@/lib/api/user/savedSearches";

interface SavedSearchesListSectionProps {
    savedSearches: SavedSearch[];
    handleDeleteSavedSearch: (id: string) => void;
}

export function SavedSearchesListSection({
    savedSearches,
    handleDeleteSavedSearch,
}: SavedSearchesListSectionProps) {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between">
                <h4 className="text-body font-bold text-foreground">Saved Searches</h4>
                <span className="text-caption font-medium text-foreground-subtle">{savedSearches.length} saved</span>
            </div>
            {savedSearches.length === 0 ? (
                <p className="text-caption text-foreground-subtle">No saved searches yet.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedSearches.map((search) => (
                        <div key={search.id} className="border border-border rounded-xl p-2.5 flex items-center justify-between gap-2 bg-muted/30">
                            <div className="min-w-0 flex-1">
                                <p className="text-caption font-bold text-foreground truncate">
                                    {search.query?.trim() || "Saved search"}
                                </p>
                                <p className="text-tiny text-foreground-subtle truncate mt-0.5">
                                    {typeof search.priceMin === "number" || typeof search.priceMax === "number"
                                        ? `Price: ${typeof search.priceMin === "number" ? `₹${search.priceMin}` : "Any"} - ${typeof search.priceMax === "number" ? `₹${search.priceMax}` : "Any"}`
                                        : "Price: Any"}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10 rounded-lg text-caption" onClick={() => handleDeleteSavedSearch(search.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
