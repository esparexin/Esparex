"use client";

import { useState, useRef, useCallback } from "react";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { useSearchHistory } from "@/hooks/useSearchHistory";

interface UseHeaderSearchProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

export function useHeaderSearch({ onSearch, initialQuery = "" }: UseHeaderSearchProps = {}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { items: searchItems, isRecent, saveSearch, clearHistory } = useSearchHistory();

  useDismissableLayer({
    isOpen: showSearchDropdown,
    containerRef: searchRef,
    onDismiss: () => setShowSearchDropdown(false),
  });

  const handleSearch = useCallback(
    (term?: string) => {
      const q = (term ?? searchQuery).trim();
      if (!q) return;

      saveSearch(q);
      onSearch?.(q);
      setShowSearchDropdown(false);
    },
    [onSearch, searchQuery, saveSearch]
  );

  const handleSearchFocus = useCallback(() => {
    setShowSearchDropdown(true);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    showSearchDropdown,
    setShowSearchDropdown,
    searchRef,
    handleSearch,
    handleSearchFocus,
    searchItems,
    isRecent,
    clearSearchHistory: clearHistory,
  };
}
