"use client";

import { useState, useRef, useCallback } from 'react';
import { useDismissableLayer } from '@/hooks/useDismissableLayer';

interface UseHeaderSearchProps {
    onSearch?: (query: string) => void;
    navigateTo?: (page: string) => void;
    initialQuery?: string;
}

export function useHeaderSearch(
    { onSearch, navigateTo, initialQuery = '' }: UseHeaderSearchProps = {}
) {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useDismissableLayer({
        isOpen: showSearchDropdown,
        containerRef: searchRef,
        onDismiss: () => setShowSearchDropdown(false),
    });

    /**
     * Execute search
     */
    const handleSearch = useCallback(
        (term?: string) => {
            const q = (term ?? searchQuery).trim();
            if (!q) return;

            onSearch?.(q);
            setShowSearchDropdown(false);

            // Navigate after search if provided
            navigateTo?.('browse');
        },
        [onSearch, navigateTo, searchQuery]
    );

    /**
     * Open dropdown on focus
     */
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
        handleSearchFocus
    };
}
