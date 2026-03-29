"use client";

import { useState, useEffect, useCallback } from "react";
import { listSavedSearches, removeSavedSearch } from "@/lib/api/user/savedSearches";
import {
    fetchSmartAlerts,
    createSmartAlert as createSmartAlertApi,
    deleteSmartAlert as deleteSmartAlertApi,
    toggleSmartAlertStatus,
    updateSmartAlert as updateSmartAlertApi,
} from "@/lib/api/user/smartAlerts";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";
import type { SmartAlertListItem } from "@/components/user/profile/types";
// SmartAlert type should be imported from API or defined here
export interface SmartAlert {
    id: string;
    isActive?: boolean;
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

const mapAlertToListItem = (alert: SmartAlert): SmartAlertListItem => {
    const record = alert as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "Smart Alert";
    const criteriaRaw = record.criteria;
    const criteria = typeof criteriaRaw === "object" && criteriaRaw !== null ? (criteriaRaw as Record<string, unknown>) : null;
    const keywords = typeof criteria?.keywords === "string" ? criteria.keywords : "";
    const category = typeof criteria?.category === "string" ? criteria.category : "";
    const locationId = typeof criteria?.locationId === "string" ? criteria.locationId : undefined;
    const location = typeof criteria?.location === "string" ? criteria.location : "";
    const radius =
        typeof record.radiusKm === "number"
            ? record.radiusKm
            : typeof criteria?.radiusKm === "number"
              ? criteria.radiusKm
              : undefined;
    const notificationChannels = Array.isArray(record.notificationChannels)
        ? record.notificationChannels.filter((value): value is string => typeof value === "string")
        : undefined;

    return {
        id: alert.id,
        name,
        keywords,
        category,
        location,
        locationId,
        radius,
        lastMatch: typeof record.lastMatch === "string" ? record.lastMatch : undefined,
        totalMatches: typeof record.totalMatches === "number" ? record.totalMatches : undefined,
        active: typeof alert.isActive === "boolean" ? alert.isActive : (typeof alert.active === "boolean" ? alert.active : true),
        notificationChannels,
    };
};

export function useSmartAlerts(enabled = true) {
    const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch alerts and saved searches on mount
    useEffect(() => {
        if (!enabled) return;
        setLoading(true);
        Promise.all([
            fetchSmartAlerts(),
            listSavedSearches()
        ]).then(([alerts, searches]) => {
            setSmartAlerts(alerts);
            setSavedSearches(searches);
        }).finally(() => setLoading(false));
    }, [enabled]);

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

    const updateSmartAlert = useCallback(async (
        id: string,
        payload: Partial<SmartAlertCreatePayload>
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const updated = await updateSmartAlertApi(id, payload);
            if (!updated) return { success: false, error: 'Failed to update alert' };
            setSmartAlerts(prev => prev.map((alert) => alert.id === id ? { ...alert, ...updated } : alert));
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update alert' };
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

    const deleteSmartAlert = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await deleteSmartAlertApi(id);
            setSmartAlerts(prev => prev.filter((alert) => alert.id !== id));
        } finally {
            setLoading(false);
        }
    }, []);

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
        smartAlertItems: smartAlerts.map(mapAlertToListItem),
        savedSearches,
        loading,
        createSmartAlert,
        updateSmartAlert,
        toggleSmartAlertStatus: handleToggleSmartAlertStatus,
        deleteSmartAlert,
        deleteSavedSearch,
    };
}
