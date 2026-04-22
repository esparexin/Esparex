"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    updateSearchParams,
} from "@/lib/urlSearchParams";

type QueryStateValue = string | number | null | undefined;

interface UseCatalogQueryStateSyncOptions {
    searchInput: string;
    initialSearch: string;
    loading: boolean;
    initialPage: number;
    totalPages: number;
    debounceMs?: number;
}

export function useCatalogQueryStateSync({
    searchInput,
    initialSearch,
    loading,
    initialPage,
    totalPages,
    debounceMs = 300,
}: UseCatalogQueryStateSyncOptions) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const replaceQueryState = useCallback((updates: Record<string, QueryStateValue>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));

        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    useEffect(() => {
        if (!loading && initialPage > totalPages && totalPages > 0) {
            replaceQueryState({ page: totalPages > 1 ? totalPages : null });
        }
    }, [initialPage, loading, replaceQueryState, totalPages]);

    useEffect(() => {
        const hasLegacySearch = searchParams.has("search");
        const currentQ = normalizeSearchParamValue(searchParams.get("q"));
        if (!hasLegacySearch && currentQ === initialSearch) {
            return;
        }

        replaceQueryState({
            q: initialSearch || null,
            search: null,
            page: initialPage > 1 ? initialPage : null,
        });
    }, [initialPage, initialSearch, replaceQueryState, searchParams]);

    useEffect(() => {
        const normalizedSearch = normalizeSearchParamValue(searchInput);
        if (normalizedSearch === initialSearch) {
            return;
        }

        const timer = window.setTimeout(() => {
            replaceQueryState({
                q: normalizedSearch || null,
                search: null,
                page: null,
            });
        }, debounceMs);

        return () => window.clearTimeout(timer);
    }, [debounceMs, initialSearch, replaceQueryState, searchInput]);

    return { replaceQueryState };
}
