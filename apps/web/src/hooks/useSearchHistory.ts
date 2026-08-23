"use client";

import { useState, useEffect, useCallback } from "react";

export const SEARCH_STORAGE_KEY = "esparex_recent_searches";
export const POPULAR_SEARCHES = ["iPhone 15", "Display Screen", "Battery Replacement", "Motherboard"] as const;

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

export function addSearchQueryToHistory(history: string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return history;
  return [trimmed, ...history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_STORAGE_KEY);
      setHistory(parseSearchHistory(raw));
    } catch {
      // Ignore storage read errors in SSR/sandboxes
    }
  }, []);

  const saveSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = addSearchQueryToHistory(prev, trimmed);
      try {
        localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_STORAGE_KEY);
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
