"use client";

import { useState, useEffect, useCallback } from "react";
import { listSavedSearches } from "@/api/user/savedSearches";
import { toggleSmartAlertStatus } from "@/api/user/smartAlerts";
import type { SavedSearch } from "@/api/user/savedSearches";
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

import { fetchSmartAlerts } from "@/api/user/smartAlerts";

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

    // Create smart alert (stub)
    const createSmartAlert = useCallback(async () => {
        // TODO: Implement real create logic
        // Example: await api call, update state
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
    const deleteSavedSearch = useCallback(async () => {
        setLoading(true);
        // TODO: Implement real delete logic (API call)
        // Example: await api call, update state
        setLoading(false);
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