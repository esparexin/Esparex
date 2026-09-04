"use client";

import { CatalogSearchInput } from "./CatalogSearchInput";
import { CatalogCategoryFilter } from "./CatalogCategoryFilter";
import type { NamedEntityOption } from "./types";

export function CatalogSearchAndCategoryFilters({
    searchValue, onSearchChange, searchPlaceholder, categories, categoryValue, onCategoryChange, withCategoryFilterIcon = false,
}: {
    searchValue: string; onSearchChange: (value: string) => void; searchPlaceholder: string; categories: NamedEntityOption[];
    categoryValue: string; onCategoryChange: (value: string) => void; withCategoryFilterIcon?: boolean;
}) {
    return (
        <>
            <CatalogSearchInput value={searchValue} placeholder={searchPlaceholder} onChange={onSearchChange} />
            <CatalogCategoryFilter withFilterIcon={withCategoryFilterIcon} categories={categories} value={categoryValue} onChange={onCategoryChange} />
        </>
    );
}
