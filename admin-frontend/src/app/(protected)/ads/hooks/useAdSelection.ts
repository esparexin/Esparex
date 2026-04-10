"use client";

import { useState, useEffect } from "react";
import type { ModerationItem } from "@/components/moderation/moderationTypes";

export function useAdSelection(items: ModerationItem[]) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const selectedCount = selectedIds.length;

    // Cleanup: Remove selected IDs that are no longer in the current item list
    // This typically happens on pagination or status changes
    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id)));
    }, [items]);

    const toggleSelect = (adId: string, checked: boolean) => {
        setSelectedIds((prev) => {
            if (checked) return Array.from(new Set([...prev, adId]));
            return prev.filter((id) => id !== adId);
        });
    };

    const toggleSelectAll = (checked: boolean) => {
        const currentIds = items.map((item) => item.id);
        setSelectedIds((prev) => {
            if (checked) return Array.from(new Set([...prev, ...currentIds]));
            return prev.filter((id) => !currentIds.includes(id));
        });
    };

    return {
        selectedIds,
        selectedCount,
        toggleSelect,
        toggleSelectAll,
        setSelectedIds
    };
}
