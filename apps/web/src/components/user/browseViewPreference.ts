"use client";

import { useCallback, useEffect, useState } from "react";

export type BrowseViewMode = "grid" | "list";

const BROWSE_VIEW_STORAGE_KEY = "esparex:browse-view";

function isBrowseViewMode(value: string | null): value is BrowseViewMode {
  return value === "grid" || value === "list";
}

export function usePersistedBrowseView(defaultView: BrowseViewMode = "grid") {
  const [view, setViewState] = useState<BrowseViewMode>(defaultView);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(BROWSE_VIEW_STORAGE_KEY);
      if (isBrowseViewMode(storedValue)) {
        setViewState(storedValue);
      }
    } catch {
      // Storage access can fail in restricted contexts. Ignore and keep defaults.
    }
  }, []);

  const setView = useCallback((nextView: BrowseViewMode) => {
    setViewState(nextView);
    try {
      window.localStorage.setItem(BROWSE_VIEW_STORAGE_KEY, nextView);
    } catch {
      // Ignore storage errors and keep the in-memory state.
    }
  }, []);

  return [view, setView] as const;
}
