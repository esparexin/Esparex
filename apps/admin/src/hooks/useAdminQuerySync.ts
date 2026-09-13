"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    updateSearchParams,
    type SearchParamValue,
} from "@/lib/urlSearchParams";

export interface UseAdminQuerySyncOptions {
    /** Optional search input to debounce */
    searchInput?: string;
    /** Current search param from URL */
    initialSearch?: string;
    /** Current loading status for page clamping */
    loading?: boolean;
    /** Current active page */
    initialPage?: number;
    /** Total pages from server response */
    totalPages?: number;
    /** Debounce milliseconds for searchInput */
    debounceMs?: number;
}

export function useAdminQuerySync(options?: UseAdminQuerySyncOptions) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        searchInput,
        initialSearch,
        loading = false,
        initialPage = 1,
        totalPages = 1,
        debounceMs = 300,
    } = options ?? {};

    const replaceQueryState = useCallback(
        (updates: Record<string, SearchParamValue>) => {
            const nextUrl = buildUrlWithSearchParams(
                pathname,
                updateSearchParams(searchParams, { search: null, ...updates })
            );
            const currentUrl = buildUrlWithSearchParams(
                pathname,
                new URLSearchParams(searchParams.toString())
            );

            if (nextUrl !== currentUrl) {
                router.replace(nextUrl, { scroll: false });
            }
        },
        [pathname, router, searchParams]
    );

    // Clamps page to totalPages if current page exceeds response bounds
    useEffect(() => {
        if (!loading && initialPage > totalPages && totalPages > 0) {
            replaceQueryState({ page: totalPages > 1 ? totalPages : null });
        }
    }, [initialPage, loading, replaceQueryState, totalPages]);

    // Normalizes alternate ?search= to ?q=
    useEffect(() => {
        if (initialSearch === undefined) return;
        const hasAltSearch = searchParams.has("search");
        const currentQ = normalizeSearchParamValue(searchParams.get("q"));
        if (!hasAltSearch && currentQ === initialSearch) {
            return;
        }

        replaceQueryState({
            q: initialSearch || null,
            search: null,
            page: initialPage > 1 ? initialPage : null,
        });
    }, [initialPage, initialSearch, replaceQueryState, searchParams]);

    // Debounces active searchInput changes
    useEffect(() => {
        if (searchInput === undefined || initialSearch === undefined) return;
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
