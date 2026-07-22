"use client";

import {
    SearchFiltersShell,
    type SearchFiltersShellProps,
} from "@/components/search/SearchFiltersShell";

import { memo } from "react";

export type SearchFiltersProps = SearchFiltersShellProps;

export const SearchFilters = memo(function SearchFilters(props: SearchFiltersProps) {
    return <SearchFiltersShell {...props} />;
});

SearchFilters.displayName = "SearchFilters";
