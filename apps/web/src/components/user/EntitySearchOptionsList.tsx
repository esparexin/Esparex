"use client";

import { Loader2 } from "@esparex/ui";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EntitySearchOptionsListProps<T> {
    items: T[];
    loading: boolean;
    activeIndex: number;
    isMobileView: boolean;
    emptyMessage: string;
    sanitizedTitle: string;
    getLabel: (item: T) => string;
    getId: (item: T) => string;
    renderItem?: (item: T, isSelected: boolean) => ReactNode;
    onSelect: (item: T) => void;
}

/**
 * Presentational option list for EntitySearchCombobox.
 * Owns loading / empty / active-index rendering only; all state,
 * keyboard navigation, and overlay behavior stay in the parent.
 */
export function EntitySearchOptionsList<T>({
    items,
    loading,
    activeIndex,
    isMobileView,
    emptyMessage,
    sanitizedTitle,
    getLabel,
    getId,
    renderItem,
    onSelect,
}: EntitySearchOptionsListProps<T>) {
    if (loading) {
        return (
            <div className="p-4 text-center text-body text-foreground-subtle flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading...</span>
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="p-4 text-center text-body font-medium text-foreground-secondary">
                {emptyMessage}
            </div>
        );
    }
    return (
        <>
            {items.map((item, idx) => {
                const label = getLabel(item);
                const id = getId(item);
                const isSelected = activeIndex === idx;
                return (
                    <button
                        key={id || label}
                        id={`select-option-${sanitizedTitle}-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={isMobileView ? undefined : (e) => e.preventDefault()}
                        onClick={() => onSelect(item)}
                        className={cn(
                            "w-full px-3 py-2 text-left text-body font-normal rounded-lg transition-colors cursor-pointer select-none",
                            isMobileView ? "min-h-11 flex items-center rounded-xl" : "",
                            isSelected
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {renderItem ? renderItem(item, isSelected) : label}
                    </button>
                );
            })}
        </>
    );
}
