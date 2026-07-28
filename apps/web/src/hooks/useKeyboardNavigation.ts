"use client";

import { useState, useCallback } from "react";

interface UseKeyboardNavigationProps<T> {
    items: T[];
    isOpen: boolean;
    onSelect: (item: T) => void;
    onClose?: () => void;
}

export function useKeyboardNavigation<T>({
    items,
    isOpen,
    onSelect,
    onClose,
}: UseKeyboardNavigationProps<T>) {
    const [activeIndex, setActiveIndex] = useState(-1);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!isOpen || items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
            } else if (
                e.key === "Enter" &&
                activeIndex >= 0 &&
                activeIndex < items.length
            ) {
                e.preventDefault();
                const item = items[activeIndex];
                if (item) {
                    onSelect(item);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                setActiveIndex(-1);
                onClose?.();
            }
        },
        [items, isOpen, activeIndex, onSelect, onClose]
    );

    return {
        activeIndex,
        setActiveIndex,
        handleKeyDown,
    };
}
