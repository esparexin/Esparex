"use client";

import { useMemo } from "react";
import { useAdminAdsQuery } from "@/hooks/useAdminAdsQuery";
import { 
    type ModerationFilters, 
} from "@/components/moderation/moderationTypes";
import { 
    adLifecycleTabs, 
    serviceLifecycleTabs, 
    partLifecycleTabs 
} from "@/components/layout/adminModuleTabSets";
import { 
    MODERATION_STATUSES, 
    MODERATION_STATUS_LABELS 
} from "@/components/moderation/moderationStatus";

interface UseAdTableDataProps {
    filters: ModerationFilters;
    page: number;
    pageSize: number;
    refreshKey: number;
}

export function useAdTableData({ filters, page, pageSize, refreshKey }: UseAdTableDataProps) {
    const { items, pagination, summary, isLoading, error } = useAdminAdsQuery({
        filters,
        page,
        limit: pageSize,
        refreshKey
    });

    const moduleTabs = useMemo(() => {
        let baseTabs = adLifecycleTabs;
        if (filters.listingType === "service") {
            baseTabs = serviceLifecycleTabs;
        } else if (filters.listingType === "spare_part") {
            baseTabs = partLifecycleTabs;
        }

        return baseTabs.map(tab => {
            const params = new URLSearchParams(tab.href.split('?')[1]);
            const status = params.get('status');
            const catalogPending = params.get('catalogPending') === 'true';
            
            let count: number | undefined;
            if (catalogPending) {
                count = summary.catalogPending;
            } else if (status === 'all') {
                count = summary.total;
            } else {
                count = summary[status as keyof typeof summary] as number;
            }

            return {
                ...tab,
                count: typeof count === 'number' ? count : undefined
            };
        });
    }, [filters.listingType, summary]);

    const activeStatusOptions = useMemo(() => {
        const allowedStatuses = new Set(moduleTabs.map(t => new URLSearchParams(t.href.split('?')[1]).get('status')).filter(Boolean));
        return [
            { value: "all", label: "All Statuses" },
            ...MODERATION_STATUSES.filter(s => allowedStatuses.has(s)).map((s) => ({ value: s, label: MODERATION_STATUS_LABELS[s] }))
        ];
    }, [moduleTabs]);

    return {
        items,
        pagination,
        summary,
        isLoading,
        error,
        moduleTabs,
        activeStatusOptions
    };
}
