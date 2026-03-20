"use client";

import { useEffect, useMemo, useState } from "react";
import type { ModerationFilters, ModerationItem, ModerationPagination, ModerationSummary } from "@/components/moderation/moderationTypes";
import { fetchAdminModerationAds, fetchAdminModerationSummary } from "@/lib/api/moderation";
import { normalizeModerationAd } from "@/components/moderation/normalizeModerationAd";

// ...existing code...

type QueryState = {
    items: ModerationItem[];
    pagination: ModerationPagination;
    summary: ModerationSummary;
    isLoading: boolean;
    error: string;
};

const DEFAULT_PAGINATION: ModerationPagination = {
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
};

const DEFAULT_SUMMARY: ModerationSummary = {
    total: 0,
    pending: 0,
    live: 0,
    rejected: 0,
    expired: 0,
    sold: 0,
    deactivated: 0
};

export function useAdminAdsQuery(input: {
    filters: ModerationFilters;
    page: number;
    limit: number;
    refreshKey: number;
}) {
    const { filters, page, limit, refreshKey } = input;

    const [state, setState] = useState<QueryState>({
        items: [],
        pagination: DEFAULT_PAGINATION,
        summary: DEFAULT_SUMMARY,
        isLoading: true,
        error: ""
    });

    const queryKey = useMemo(
        () => JSON.stringify({ filters, page, limit, refreshKey }),
        [filters, page, limit, refreshKey]
    );

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setState((prev) => ({ ...prev, isLoading: true, error: "" }));
            try {
                const [listRes, summary] = await Promise.all([
                    fetchAdminModerationAds({ filters, page, limit }),
                    fetchAdminModerationSummary(filters.listingType)
                ]);

                if (cancelled) return;

                const items = listRes.items.map(normalizeModerationAd);

                setState({
                    items,
                    pagination: listRes.pagination,
                    summary,
                    isLoading: false,
                    error: ""
                });
            } catch (err) {
                if (cancelled) return;
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch ads"
                }));
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [queryKey]);

    return state;
}
