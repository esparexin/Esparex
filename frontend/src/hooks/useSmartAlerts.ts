"use client";

import { useState, useEffect, useCallback } from "react";
import { notify } from "@/lib/notify";
import {
  fetchSmartAlerts,
  createSmartAlert as apiCreateSmartAlert,
  deleteSmartAlert as apiDeleteSmartAlert,
  toggleSmartAlertStatus,
} from "@/api/user/smartAlerts";
import {
  listSavedSearches,
  createSavedSearch as apiCreateSavedSearch,
  removeSavedSearch,
} from "@/api/user/savedSearches";
import type { SavedSearch } from "@/api/user/savedSearches";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";
import type { SavedSearchCreatePayload } from "@shared/schemas/savedSearch.schema";

export interface SmartAlert {
  id: string;
  active?: boolean;
  isActive?: boolean;
  radiusKm?: number;
  notificationChannels?: string[];
  name?: string;
  criteria?: {
    keywords?: string;
    category?: string;
    location?: string;
    locationId?: string;
    radiusKm?: number;
    minPrice?: number;
    maxPrice?: number;
  };
  lastMatch?: string;
  totalMatches?: number;
  [key: string]: unknown;
}

export function useSmartAlerts() {
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Initial fetch ─────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([fetchSmartAlerts(), listSavedSearches()])
      .then(([alerts, searches]) => {
        setSmartAlerts(alerts);
        setSavedSearches(searches);
      })
      .catch(() => notify.error("Failed to load alerts"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Smart Alert mutations ─────────────────────────────────────────────────

  const createSmartAlert = useCallback(
    async (payload: SmartAlertCreatePayload) => {
      setLoading(true);
      try {
        const created = await apiCreateSmartAlert(payload);
        if (created) {
          setSmartAlerts((prev) => [created, ...prev]);
          notify.success("Smart alert created");
        }
        return created;
      } catch {
        notify.error("Failed to create smart alert");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleToggleSmartAlertStatus = useCallback(
    async (smartAlertId: string) => {
      // Optimistic update
      setSmartAlerts((prev) =>
        prev.map((a) =>
          a.id === smartAlertId
            ? { ...a, active: !a.active, isActive: !a.isActive }
            : a
        )
      );
      try {
        const updated = await toggleSmartAlertStatus(smartAlertId);
        if (updated) {
          setSmartAlerts((prev) =>
            prev.map((a) => (a.id === smartAlertId ? { ...a, ...updated } : a))
          );
        }
      } catch {
        // Revert on error
        setSmartAlerts((prev) =>
          prev.map((a) =>
            a.id === smartAlertId
              ? { ...a, active: !a.active, isActive: !a.isActive }
              : a
          )
        );
        notify.error("Failed to update alert");
      }
    },
    []
  );

  const deleteSmartAlert = useCallback(async (id: string) => {
    const prev = [...smartAlerts]; // capture for rollback
    setSmartAlerts((alerts) => alerts.filter((a) => a.id !== id));
    try {
      await apiDeleteSmartAlert(id);
      notify.success("Smart alert deleted");
    } catch {
      setSmartAlerts(prev);
      notify.error("Failed to delete smart alert");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartAlerts]);

  // ── Saved Search mutations ────────────────────────────────────────────────

  const createSavedSearch = useCallback(
    async (payload: SavedSearchCreatePayload) => {
      setLoading(true);
      try {
        const created = await apiCreateSavedSearch(payload);
        if (created) {
          setSavedSearches((prev) => [created, ...prev]);
          notify.success("Search saved");
        }
        return created;
      } catch {
        notify.error("Failed to save search");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSavedSearch = useCallback(async (id: string) => {
    const prev = [...savedSearches];
    setSavedSearches((searches) => searches.filter((s) => s.id !== id));
    try {
      await removeSavedSearch(id);
      notify.success("Saved search removed");
    } catch {
      setSavedSearches(prev);
      notify.error("Failed to remove saved search");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSearches]);

  return {
    smartAlerts,
    savedSearches,
    loading,
    refresh,
    createSmartAlert,
    createSavedSearch,
    toggleSmartAlertStatus: handleToggleSmartAlertStatus,
    deleteSmartAlert,
    deleteSavedSearch,
  };
}
