"use client";

import { CatalogSearchInput } from "./CatalogSearchInput";
import { CatalogCategoryFilter } from "./CatalogCategoryFilter";
import { CatalogActiveStatusFilter } from "./CatalogActiveStatusFilter";
import type { NamedEntityOption } from "./types";

export function CatalogSearchAndCategoryFilters({
    searchValue, onSearchChange, searchPlaceholder, categories, categoryValue, onCategoryChange, withCategoryFilterIcon = false, statusValue, onStatusChange,
}: {
    searchValue: string; onSearchChange: (value: string) => void; searchPlaceholder: string; categories: NamedEntityOption[];
    categoryValue: string; onCategoryChange: (value: string) => void; withCategoryFilterIcon?: boolean; statusValue?: string; onStatusChange?: (value: string) => void;
}) {
    return (
        <>
            <CatalogSearchInput value={searchValue} placeholder={searchPlaceholder} onChange={onSearchChange} />
            <CatalogCategoryFilter withFilterIcon={withCategoryFilterIcon} categories={categories} value={categoryValue} onChange={onCategoryChange} />
            {statusValue !== undefined && onStatusChange && <CatalogActiveStatusFilter value={statusValue} onChange={onStatusChange} />}
        </>
    );
}
