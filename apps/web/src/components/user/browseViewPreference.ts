"use client";

import { useCallback, useSyncExternalStore } from "react";

export type BrowseViewMode = "grid" | "list";

const BROWSE_VIEW_STORAGE_KEY = "esparex:browse-view";

function isBrowseViewMode(value: string | null): value is BrowseViewMode {
  return value === "grid" || value === "list";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function usePersistedBrowseView(defaultView: BrowseViewMode = "grid") {
  const getSnapshot = (): BrowseViewMode => {
    try {
      const storedValue = window.localStorage.getItem(BROWSE_VIEW_STORAGE_KEY);
      if (isBrowseViewMode(storedValue)) {
        return storedValue;
      }
    } catch {
      // Storage access can fail in restricted contexts. Ignore and keep defaults.
    }
    return defaultView;
  };

  const getServerSnapshot = (): BrowseViewMode => defaultView;

  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setView = useCallback((nextView: BrowseViewMode) => {
    try {
      window.localStorage.setItem(BROWSE_VIEW_STORAGE_KEY, nextView);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore storage errors.
    }
  }, []);

  return [view, setView] as const;
}
