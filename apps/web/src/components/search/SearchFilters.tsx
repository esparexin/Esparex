"use client";

import {
    SearchFiltersShell,
    type SearchFiltersShellProps,
} from "@/components/search/SearchFiltersShell";

export type SearchFiltersProps = SearchFiltersShellProps;

export function SearchFilters(props: SearchFiltersProps) {
    return <SearchFiltersShell {...props} />;
}
