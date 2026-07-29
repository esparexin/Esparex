"use client";

import { useEffect } from "react";

interface UseDismissableLayerParams<T extends HTMLElement> {
    isOpen: boolean;
    containerRef: React.RefObject<T | null> | Array<React.RefObject<HTMLElement | null>>;
    onDismiss: () => void;
}

export function useDismissableLayer<T extends HTMLElement>({
    isOpen,
    containerRef,
    onDismiss,
}: UseDismissableLayerParams<T>) {
    useEffect(() => {
        if (!isOpen) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const refs = Array.isArray(containerRef) ? containerRef : [containerRef];
            const isInsideAny = refs.some(
                (ref) => ref.current && ref.current.contains(target)
            );
            if (!isInsideAny) {
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
