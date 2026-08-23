"use client";

import { useSyncExternalStore, useCallback } from "react";

export const SEARCH_STORAGE_KEY = "esparex_recent_searches";
export const POPULAR_SEARCHES = ["iPhone 15", "Display Screen", "Battery Replacement", "Motherboard"] as const;

let memoryCache: string[] = [];
let memoryRaw: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SEARCH_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function parseSearchHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 5);
    }
  } catch {
    // Ignore invalid JSON payloads
  }
  return [];
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_STORAGE_KEY);
    if (raw !== memoryRaw) {
      memoryRaw = raw;
      memoryCache = parseSearchHistory(raw);
    }
    return memoryCache;
  } catch {
    return memoryCache;
  }
}

const SERVER_SNAPSHOT: string[] = [];
function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

export function addSearchQueryToHistory(history: string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return history;
  return [trimmed, ...history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
}

export function useSearchHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const current = getSnapshot();
      const next = addSearchQueryToHistory(current, trimmed);
      localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(next));
      memoryRaw = JSON.stringify(next);
      memoryCache = next;
      notify();
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_STORAGE_KEY);
      memoryRaw = null;
      memoryCache = [];
      notify();
    } catch {
      // Ignore storage write errors
    }
  }, []);

  return {
    items: history.length > 0 ? history : [...POPULAR_SEARCHES],
    isRecent: history.length > 0,
    saveSearch,
    clearHistory,
  };
}
