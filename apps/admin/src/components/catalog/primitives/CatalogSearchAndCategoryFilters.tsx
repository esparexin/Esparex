"use client";

import { CatalogSearchInput } from "./CatalogSearchInput";
import { CatalogCategoryFilter } from "./CatalogCategoryFilter";
import type { Dispatch, SetStateAction } from "react";
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

export function CatalogBoundSearchCategoryFilters<TFilters extends { search: string; categoryId: string }>({
    filters, setFilters, searchPlaceholder, categories, withCategoryFilterIcon = false,
}: {
    filters: TFilters; setFilters: Dispatch<SetStateAction<TFilters>>; searchPlaceholder: string; categories: NamedEntityOption[]; withCategoryFilterIcon?: boolean;
}) {
    return (
        <CatalogSearchAndCategoryFilters
            searchValue={filters.search} onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
            searchPlaceholder={searchPlaceholder} withCategoryFilterIcon={withCategoryFilterIcon}
            categories={categories} categoryValue={filters.categoryId} onCategoryChange={(categoryId) => setFilters((prev) => ({ ...prev, categoryId }))}
        />
    );
}
