"use client";

import { useState, useEffect, useCallback } from "react";
import { notify } from "@/lib/feedback";

import { listSavedSearches, removeSavedSearch } from "@/lib/api/user/savedSearches";
import {
    fetchSmartAlertsWithQuota,
    fetchSmartAlertQuota,
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
  type SmartAlertQuotaDTO,
} from "@esparex/contracts";
import type { SmartAlertFieldErrors, SmartAlertFormData, SmartAlertItem } from "@/components/user/profile/types";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";
import { toCanonicalGeoPoint, sanitizeMongoObjectId } from "@esparex/shared";
import type { Location as AppLocation } from "@/lib/api/user/locations";
import {
  type SmartAlert,
  mapAlertToListItem,
  deriveSmartAlertName,
  createInitialSmartAlertForm,
  emptySmartAlertFieldErrors,
} from "./smartAlertHelpers";

export type { SmartAlert };
export { deriveSmartAlertName };

type SmartAlertLocationSelection = Pick<
  AppLocation,
  "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

export function useSmartAlerts(enabled = true) {
    const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
    const [quota, setQuota] = useState<SmartAlertQuotaDTO | null>(null);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const loading = isInitialLoading;

    // Form states
    const [smartAlertForm, setSmartAlertForm] = useState<SmartAlertFormData>(createInitialSmartAlertForm);
    const [smartAlertErrors, setSmartAlertErrors] = useState<SmartAlertFieldErrors>(emptySmartAlertFieldErrors);
    const [smartAlertGlobalError, setSmartAlertGlobalError] = useState<string | null>(null);
    const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

    const refreshQuota = useCallback(async () => {
        const q = await fetchSmartAlertQuota();
        if (q) setQuota(q);
    }, []);

    // Fetch alerts, quota, and saved searches on mount
    useEffect(() => {
        if (!enabled) return undefined;
        
        const timeoutId = setTimeout(() => {
            setIsInitialLoading(true);
            Promise.all([
                fetchSmartAlertsWithQuota(),
                listSavedSearches()
            ]).then(([{ alerts, quota: fetchedQuota }, searches]) => {
                setSmartAlerts(alerts);
                setQuota(fetchedQuota);
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
            radiusKm: alert.radiusKm ?? 25,
            notificationChannels: (alert.notificationChannels as ("email" | "sms" | "push" | "whatsapp" | "in-app")[]) || ["push", "email"],
        });
        setSmartAlertErrors(emptySmartAlertFieldErrors());
        setSmartAlertGlobalError(null);
    }, []);

    const handleCreateAlert = async (selectedLocation: SmartAlertLocationSelection | null = null): Promise<{ success: boolean; error?: string }> => {
        setIsMutating(true);
        const parsedForm = smartAlertFormSchema.safeParse(smartAlertForm);
        if (!parsedForm.success) {
            const nextErrors = emptySmartAlertFieldErrors();
            let nextGlobalError: string | null = null;
            for (const issue of parsedForm.error.issues) {
                const field = issue.path[0] as keyof SmartAlertFieldErrors;
                if (field in nextErrors) nextErrors[field] = issue.message;
                else if (!nextGlobalError) nextGlobalError = issue.message;
            }
            setSmartAlertErrors(nextErrors);
            const globalErrMsg = nextGlobalError || "Please correct the highlighted fields.";
            setSmartAlertGlobalError(globalErrMsg);
            setIsMutating(false);
            return { success: false, error: globalErrMsg };
        }

        const { keywords, category, brand, model, location, locationId, radiusKm, notificationChannels } = parsedForm.data;
        const canonicalCoordinates = toCanonicalGeoPoint(selectedLocation?.coordinates);
        const canonicalLocationId = sanitizeMongoObjectId(selectedLocation?.locationId || selectedLocation?.id || locationId);
        const locationIdPayload = canonicalLocationId || undefined;
        const locationDisplay = selectedLocation?.display || selectedLocation?.name || selectedLocation?.city || location || "";

        setSmartAlertErrors(emptySmartAlertFieldErrors());
        setSmartAlertGlobalError(null);

        const computedName = deriveSmartAlertName({
            category,
            brand,
            model,
            keywords,
            location: locationDisplay,
            radiusKm,
        });

        const basePayload = {
            name: computedName,
            criteria: {
                keywords,
                category: category || undefined,
                brand: brand || undefined,
                model: model || undefined,
                location: locationDisplay || undefined,
                locationId: locationIdPayload || undefined,
            },
            ...(canonicalCoordinates ? { coordinates: canonicalCoordinates } : {}),
            radiusKm,
            frequency: "instant" as const,
            notificationChannels: Array.from(new Set(["push", ...(notificationChannels || [])])),
        };

        if (!editingAlertId && (!canonicalCoordinates || !locationDisplay)) {
            const locErrMsg = "Please select a valid location from the location search.";
            setSmartAlertErrors((prev) => ({ ...prev, location: locErrMsg }));
            setIsMutating(false);
            return { success: false, error: locErrMsg };
        }

        const parsedPayload = editingAlertId ? SmartAlertUpdateSchema.safeParse(basePayload) : SmartAlertCreateSchema.safeParse(basePayload);

        if (!parsedPayload.success) {
            const nextErrors = emptySmartAlertFieldErrors();
            let nextGlobalError: string | null = null;
            for (const issue of parsedPayload.error.issues) {
                const [root, nested] = issue.path;
                const field = (nested === "locationId" ? "location" : (nested || root)) as keyof SmartAlertFieldErrors;
                if (field in nextErrors) nextErrors[field] = issue.message;
                else if (!nextGlobalError) nextGlobalError = issue.message;
            }
            setSmartAlertErrors(nextErrors);
            const globalErrMsg = nextGlobalError || "Please check alert details and try again.";
            setSmartAlertGlobalError(globalErrMsg);
            setIsMutating(false);
            return { success: false, error: globalErrMsg };
        }

        const requestPayload = parsedPayload.data as SmartAlertCreatePayload;
        const result = editingAlertId
            ? await updateSmartAlertApiCall(editingAlertId, requestPayload)
            : await createSmartAlertApiCall(requestPayload);

        if (result.success) {
            resetAlertForm();
            void refreshQuota();
            notify.success(editingAlertId ? "Alert updated successfully." : "Alert created successfully.");
            setIsMutating(false);
            return { success: true };
        } else {
            const resultErrMsg = result.error || "Unable to save smart alert. Please refresh and try again.";
            setSmartAlertGlobalError(resultErrMsg);
            setIsMutating(false);
            return { success: false, error: resultErrMsg };
        }
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
        quota,
        refreshQuota,
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
