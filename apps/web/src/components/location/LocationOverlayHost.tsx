"use client";

import { RefObject, useState, useEffect, useRef, type CSSProperties } from "react";
import { useIsMobile } from "@/components/ui/useMobile";
import LocationSelector from "@/components/location/LocationSelector";
import { Sheet, SheetContent, SheetDescription, SheetTitle, Z_INDEX } from "@esparex/ui";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";

interface LocationOverlayHostProps {
    isOpen: boolean;
    onClose: () => void;
    containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * LocationOverlayHost
 * Single presentation owner for the Location Selector overlay.
 * Dynamically switches presentation based on viewport:
 * - Mobile (isMobile = true): Radix Sheet bottom drawer portalled to document.body
 * - Desktop (isMobile = false): position:fixed dropdown anchored to containerRef bounds
 *
 * IMPORTANT: This component must be rendered OUTSIDE any CSS display:none container
 * so that Radix UI's DismissableLayer event system works correctly on mobile.
 * It is rendered at the <header> root level in Header.tsx.
 */
export function LocationOverlayHost({
    isOpen,
    onClose,
    containerRef,
}: LocationOverlayHostProps) {
    const isMobile = useIsMobile();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Anchor position for the desktop dropdown — computed from the trigger ref.
    // Using position:fixed so the component can live outside the trigger's
    // relative ancestor (required because we moved it to the <header> root).
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
    useEffect(() => {
        if (!isOpen || isMobile) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 6,
                left: Math.max(12, rect.left),
                width: 336, // Expanded width for optimal typography & breathing room
            });
        }
    }, [isOpen, isMobile, containerRef]);

    // Restore focus to trigger element when overlay closes
    const prevOpenRef = useRef(isOpen);
    useEffect(() => {
        if (prevOpenRef.current && !isOpen) {
            const triggerEl = containerRef.current?.querySelector<HTMLElement>("button, input, [tabindex]") || containerRef.current;
            triggerEl?.focus();
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, containerRef]);

    useDismissableLayer({
        isOpen: isOpen && !isMobile,
        containerRef: [containerRef, dropdownRef],
        onDismiss: onClose,
    });

    if (!isOpen) return null;

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent
                    side="bottom"
                    className="h-[65dvh] max-h-[480px] overflow-hidden rounded-t-2xl border-t-0 p-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl mx-auto max-w-sm w-full sm:h-[70dvh] sm:max-h-[520px]"
                >
                    <SheetTitle className="sr-only">Select Location</SheetTitle>
                    <SheetDescription className="sr-only">Choose your city</SheetDescription>
                    <LocationSelector variant="panel" onClose={onClose} />
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div
            ref={dropdownRef}
            style={{ zIndex: Z_INDEX.userHeaderDropdown, ...dropdownStyle }}
            className="max-h-[min(500px,75vh)] bg-popover border border-border rounded-2xl shadow-xl overflow-hidden transition-all duration-200 flex flex-col opacity-100 visible translate-y-0 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <LocationSelector variant="panel" onClose={onClose} />
            </div>
        </div>
    );
}
