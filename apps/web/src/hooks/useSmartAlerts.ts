"use client";

import { useState, useEffect, useCallback } from "react";
import { notify } from "@/lib/feedback";

import { listSavedSearches, removeSavedSearch } from "@/lib/api/user/savedSearches";
import {
    fetchSmartAlerts,
    createSmartAlert as createSmartAlertApi,
    deleteSmartAlert as deleteSmartAlertApi,
    toggleSmartAlertStatus,
    updateSmartAlert as updateSmartAlertApi,
} from "@/lib/api/user/smartAlerts";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import {
  SmartAlertCreateSchema,
  SmartAlertUpdateSchema,
  type SmartAlertCreatePayload,
  sanitizeMongoObjectId
} from "@shared";
import type { SmartAlertListItem, SmartAlertFieldErrors, SmartAlertFormData, SmartAlertItem } from "@/components/user/profile/types";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";
import { toCanonicalGeoPoint } from "@esparex/shared";
import type { Location as AppLocation } from "@/lib/api/user/locations";

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
    [key: string]: unknown; // Type safety hatch
}

const mapAlertToListItem = (alert: SmartAlert): SmartAlertListItem => {
    const record = alert as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "Smart Alert";
    const criteriaRaw = record.criteria;
    const criteria = typeof criteriaRaw === "object" && criteriaRaw !== undefined ? (criteriaRaw as Record<string, unknown>) : null;
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
        radiusKm: radius,
        lastMatch: typeof record.lastMatch === "string" ? record.lastMatch : undefined,
        totalMatches: typeof record.totalMatches === "number" ? record.totalMatches : undefined,
        active: typeof alert.isActive === "boolean" ? alert.isActive : (typeof alert.active === "boolean" ? alert.active : true),
        notificationChannels,
    };
};

const createInitialSmartAlertForm = (): SmartAlertFormData => ({
  name: "",
  keywords: "",
  category: "",
  location: "",
  locationId: null,
  radiusKm: 50,
  notificationChannels: ["email"],
});

const emptySmartAlertFieldErrors = (): SmartAlertFieldErrors => ({
  name: undefined,
  keywords: undefined,
  category: undefined,
  location: undefined,
  radiusKm: undefined,
  notificationChannels: undefined,
});

type SmartAlertLocationSelection = Pick<
  AppLocation,
  "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

export function useSmartAlerts(enabled = true) {
    const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const loading = isInitialLoading;

    // Form states
    const [smartAlertForm, setSmartAlertForm] = useState<SmartAlertFormData>(createInitialSmartAlertForm);
    const [smartAlertErrors, setSmartAlertErrors] = useState<SmartAlertFieldErrors>(emptySmartAlertFieldErrors);
    const [smartAlertGlobalError, setSmartAlertGlobalError] = useState<string | null>(null);
    const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

    // Fetch alerts and saved searches on mount
    useEffect(() => {
        if (!enabled) return undefined;
        
        const timeoutId = setTimeout(() => {
            setIsInitialLoading(true);
            Promise.all([
                fetchSmartAlerts(),
                listSavedSearches()
            ]).then(([alerts, searches]) => {
                setSmartAlerts(alerts);
                setSavedSearches(searches);
            }).finally(() => setIsInitialLoading(false));
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [enabled]);

    const resetAlertForm = useCallback(() => {
        setSmartAlertForm(createInitialSmartAlertForm());
        setSmartAlertErrors(emptySmartAlertFieldErrors());
        setSmartAlertGlobalError(null);
        setEditingAlertId(null);
    }, []);

    const updateSmartAlertForm = useCallback((updates: Partial<SmartAlertFormData>) => {
        setSmartAlertForm((prev) => ({ ...prev, ...updates }));
        const clearedErrors: Partial<SmartAlertFieldErrors> = {};
        for (const key of Object.keys(updates)) {
            if (key in emptySmartAlertFieldErrors()) {
                (clearedErrors as Record<string, string | undefined>)[key] = undefined;
            }
        }
        setSmartAlertErrors((prev) => ({ ...prev, ...clearedErrors }));
        setSmartAlertGlobalError(null);
    }, []);

    const clearSmartAlertError = useCallback((field: keyof SmartAlertFieldErrors) => {
        setSmartAlertErrors((prev) => ({ ...prev, [field]: undefined }));
        setSmartAlertGlobalError(null);
    }, []);

    // API calls inside
    const createSmartAlertApiCall = useCallback(async (payload: SmartAlertCreatePayload): Promise<{ success: boolean; error?: string }> => {
        try {
            const created = await createSmartAlertApi(payload);
            if (!created) return { success: false, error: 'Failed to create alert' };
            setSmartAlerts(prev => [...prev, created]);
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to create alert' };
        }
    }, []);

    const updateSmartAlertApiCall = useCallback(async (
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

    const handleEditAlert = useCallback((alert: SmartAlertItem) => {
        setEditingAlertId(alert.id);
        setSmartAlertForm({
            name: alert.name,
            keywords: alert.keywords,
            category: alert.category,
            location: alert.location,
            locationId: alert.locationId || null,
            radiusKm: alert.radiusKm ?? 50,
            notificationChannels: (alert.notificationChannels as ("email" | "sms" | "push")[]) || ["email"],
        });
        setSmartAlertErrors(emptySmartAlertFieldErrors());
        setSmartAlertGlobalError(null);
    }, []);

    const handleCreateAlert = async (selectedLocation: SmartAlertLocationSelection | null = null): Promise<void> => {
        setIsMutating(true);
        const parsedForm = smartAlertFormSchema.safeParse(smartAlertForm);
        if (!parsedForm.success) {
            const nextErrors = emptySmartAlertFieldErrors();
            let nextGlobalError: string | null = null;
            for (const issue of parsedForm.error.issues) {
                const field = issue.path[0];
                if (field === "name") nextErrors.name = issue.message;
                else if (field === "keywords") nextErrors.keywords = issue.message;
                else if (field === "category") nextErrors.category = issue.message;
                else if (field === "location") nextErrors.location = issue.message;
                else if (field === "radiusKm") nextErrors.radiusKm = issue.message;
                else if (field === "notificationChannels") nextErrors.notificationChannels = issue.message;
                else if (!nextGlobalError) nextGlobalError = issue.message;
            }
            setSmartAlertErrors(nextErrors);
            setSmartAlertGlobalError(nextGlobalError || "Please correct the highlighted fields.");
            setIsMutating(false);
            return;
        }

        const { name, keywords, category, location, locationId, radiusKm, notificationChannels } = parsedForm.data;
        const canonicalCoordinates = toCanonicalGeoPoint(selectedLocation?.coordinates);
        const canonicalLocationId = sanitizeMongoObjectId(selectedLocation?.locationId || selectedLocation?.id || locationId);
        const locationDisplay = selectedLocation?.display || selectedLocation?.name || selectedLocation?.city || location || "";

        setSmartAlertErrors(emptySmartAlertFieldErrors());
        setSmartAlertGlobalError(null);

        const basePayload = {
            name,
            criteria: {
                keywords,
                category: category || undefined,
                location: locationDisplay || undefined,
                locationId: canonicalLocationId || undefined,
            },
            ...(canonicalCoordinates ? { coordinates: canonicalCoordinates } : {}),
            radiusKm,
            frequency: "instant" as const,
            notificationChannels,
        };

        if (!editingAlertId && (!canonicalCoordinates || !canonicalLocationId || !locationDisplay)) {
            setSmartAlertErrors((prev) => ({ ...prev, location: "Please select a valid location from the location search." }));
            setIsMutating(false);
            return;
        }

        const parsedPayload = editingAlertId ? SmartAlertUpdateSchema.safeParse(basePayload) : SmartAlertCreateSchema.safeParse(basePayload);

        if (!parsedPayload.success) {
            const nextErrors = emptySmartAlertFieldErrors();
            let nextGlobalError: string | null = null;
            for (const issue of parsedPayload.error.issues) {
                const [root, nested] = issue.path;
                if (root === "name") nextErrors.name = issue.message;
                else if (root === "criteria" && nested === "keywords") nextErrors.keywords = issue.message;
                else if (root === "criteria" && nested === "category") nextErrors.category = issue.message;
                else if (root === "criteria" && (nested === "location" || nested === "locationId")) nextErrors.location = issue.message;
                else if (root === "radiusKm") nextErrors.radiusKm = issue.message;
                else if (root === "notificationChannels") nextErrors.notificationChannels = issue.message;
                else if (!nextGlobalError) nextGlobalError = issue.message;
            }
            setSmartAlertErrors(nextErrors);
            setSmartAlertGlobalError(nextGlobalError || "Please check alert details and try again.");
            setIsMutating(false);
            return;
        }

        const requestPayload = parsedPayload.data as SmartAlertCreatePayload;
        const result = editingAlertId
            ? await updateSmartAlertApiCall(editingAlertId, requestPayload)
            : await createSmartAlertApiCall(requestPayload);

        if (result.success) {
            resetAlertForm();
            notify.success(editingAlertId ? "Alert updated successfully." : "Alert created successfully.");
        } else {
            setSmartAlertGlobalError(result.error || "Something went wrong. Please try again.");
        }
        setIsMutating(false);
    };

    const handleToggleSmartAlertStatus = useCallback(async (smartAlertId: string) => {
        setIsMutating(true);
        const prevAlerts = [...smartAlerts];
        const idx = smartAlerts.findIndex(a => a.id === smartAlertId);
        if (idx === -1) { setIsMutating(false); return; }
        if (smartAlerts[idx]) {
            const prevStatus = typeof smartAlerts[idx].active === "boolean" ? smartAlerts[idx].active : true;
            const updatedAlerts = [...smartAlerts];
            updatedAlerts[idx] = { ...updatedAlerts[idx], active: !prevStatus, id: smartAlerts[idx].id ?? "" };
            setSmartAlerts(updatedAlerts);
        }
        try {
            const updated = await toggleSmartAlertStatus(smartAlertId);
            if (updated) { setSmartAlerts(alerts => alerts.map(a => a.id === smartAlertId ? { ...a, ...updated } : a)); }
            else { setSmartAlerts(prevAlerts); }
        } catch {
            setSmartAlerts(prevAlerts);
        } finally {
            setIsMutating(false);
        }
    }, [smartAlerts]);

    const deleteSmartAlert = useCallback(async (id: string) => {
        setIsMutating(true);
        try {
            await deleteSmartAlertApi(id);
            setSmartAlerts(prev => prev.filter((alert) => alert.id !== id));
        } catch (err) {
            notify.error(err, "Failed to delete alert. Please try again.");
        } finally {
            setIsMutating(false);
        }
    }, []);

    const deleteSavedSearch = useCallback(async (id: string) => {
        setIsMutating(true);
        try {
            await removeSavedSearch(id);
            setSavedSearches(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            notify.error(err, "Failed to remove saved search. Please try again.");
        } finally {
            setIsMutating(false);
        }
    }, []);

    return {
        // List/Data states
        smartAlerts,
        smartAlertItems: smartAlerts.map(mapAlertToListItem),
        savedSearches,
        loading,
        isMutating,
        
        // Form states
        smartAlertForm, setSmartAlertForm, updateSmartAlertForm,
        smartAlertErrors, setSmartAlertErrors,
        smartAlertGlobalError, setSmartAlertGlobalError,
        editingAlertId, setEditingAlertId,
        resetAlertForm,
        clearSmartAlertError,

        // Actions
        handleEditAlert,
        handleCreateAlert,
        createSmartAlert: createSmartAlertApiCall,
        updateSmartAlert: updateSmartAlertApiCall,
        toggleSmartAlertStatus: handleToggleSmartAlertStatus,
        deleteSmartAlert,
        deleteSavedSearch,
    };
}
