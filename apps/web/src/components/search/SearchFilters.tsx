"use client";

import { memo } from "react";
import {
    SearchFiltersShell,
    type SearchFiltersShellProps,
} from "@/components/search/SearchFiltersShell";

export type SearchFiltersProps = SearchFiltersShellProps;

export const SearchFilters = memo(function SearchFilters(props: SearchFiltersProps) {
    return <SearchFiltersShell {...props} />;
});

SearchFilters.displayName = "SearchFilters";
