"use client";

import { useState, useCallback, useEffect } from "react";

interface UseListKeyboardNavigationProps<T> {
    items: T[];
    isOpen: boolean;
    onSelect: (item: T) => void;
    onClose?: () => void;
}

export function useListKeyboardNavigation<T>({
    items,
    isOpen,
    onSelect,
    onClose,
}: UseListKeyboardNavigationProps<T>) {
    const [activeIndex, setActiveIndex] = useState(-1);

    // F-K1: Radix Dialog registers Escape on `document` with capture:true.
    // Document-capture runs before any React bubble-phase onKeyDown, so the
    // parent dialog would close (losing form state) before the dropdown can
    // intercept. Attach at `window` capture phase — window runs before
    // document in the capture path — and stop propagation so the innermost
    // interactive layer (the open dropdown) gets first opportunity to close.
    useEffect(() => {
        if (!isOpen) return;
        const handleEscapeCapture = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.stopPropagation(); // preempt Radix document-capture dismissal
            e.preventDefault();
            setActiveIndex(-1);
            onClose?.();
        };
        window.addEventListener("keydown", handleEscapeCapture, { capture: true });
        return () => window.removeEventListener("keydown", handleEscapeCapture, { capture: true });
    }, [isOpen, onClose]);

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