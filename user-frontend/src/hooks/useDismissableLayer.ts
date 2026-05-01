"use client";

import { useEffect } from "react";

interface UseDismissableLayerParams<T extends HTMLElement> {
    isOpen: boolean;
    containerRef: React.RefObject<T | null>;
    onDismiss: () => void;
}

export function useDismissableLayer<T extends HTMLElement>({
    isOpen,
    containerRef,
    onDismiss,
}: UseDismissableLayerParams<T>) {
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                onDismiss();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onDismiss();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [containerRef, isOpen, onDismiss]);
}
