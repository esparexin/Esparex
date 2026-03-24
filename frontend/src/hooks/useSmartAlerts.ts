"use client";

import { useState, useEffect, useCallback } from "react";
import { listSavedSearches, removeSavedSearch } from "@/lib/api/user/savedSearches";
import { fetchSmartAlerts, createSmartAlert as createSmartAlertApi, toggleSmartAlertStatus } from "@/lib/api/user/smartAlerts";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";
// SmartAlert type should be imported from API or defined here
export interface SmartAlert {
    id: string;
    active?: boolean;
    radiusKm?: number;
    notificationChannels?: string[];
    name?: string;
    criteria?: {
        keywords?: string;
        category?: string;
        location?: string;
        locationId?: string;
        radiusKm?: number;
    };
    lastMatch?: string;
    totalMatches?: number;
    [key: string]: unknown;
}

export function useSmartAlerts() {
    const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch alerts and saved searches on mount
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchSmartAlerts(),
            listSavedSearches()
        ]).then(([alerts, searches]) => {
            setSmartAlerts(alerts);
            setSavedSearches(searches);
        }).finally(() => setLoading(false));
    }, []);

    // Create smart alert
    const createSmartAlert = useCallback(async (payload: SmartAlertCreatePayload): Promise<{ success: boolean; error?: string }> => {
        try {
            const created = await createSmartAlertApi(payload);
            if (!created) return { success: false, error: 'Failed to create alert' };
            setSmartAlerts(prev => [...prev, created]);
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to create alert' };
        }
    }, []);

    // Toggle smart alert status
    const handleToggleSmartAlertStatus = useCallback(async (smartAlertId: string) => {
        setLoading(true);
        const prevAlerts = [...smartAlerts];
        const idx = smartAlerts.findIndex(a => a.id === smartAlertId);
        if (idx === -1) {
            setLoading(false);
            return;
        }
        // Optimistically toggle
        if (smartAlerts[idx]) {
            const prevStatus = typeof smartAlerts[idx].active === "boolean" ? smartAlerts[idx].active : true;
            const updatedAlerts = [...smartAlerts];
            updatedAlerts[idx] = {
                ...updatedAlerts[idx],
                active: !prevStatus,
                id: smartAlerts[idx].id ?? "",
            };
            setSmartAlerts(updatedAlerts);
        }
        try {
            const updated = await toggleSmartAlertStatus(smartAlertId);
            if (updated) {
                setSmartAlerts(alerts => alerts.map(a => a.id === smartAlertId ? { ...a, ...updated } : a));
            } else {
                setSmartAlerts(prevAlerts);
            }
        } catch {
            setSmartAlerts(prevAlerts);
        } finally {
            setLoading(false);
        }
    }, [smartAlerts]);

    // Delete saved search
    const deleteSavedSearch = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await removeSavedSearch(id);
            setSavedSearches(prev => prev.filter(s => s.id !== id));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        smartAlerts,
        savedSearches,
        loading,
        createSmartAlert,
        toggleSmartAlertStatus: handleToggleSmartAlertStatus,
        deleteSavedSearch,
    };
}