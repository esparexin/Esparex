"use client";

import { RefObject } from "react";
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
 * - Desktop (isMobile = false): Absolute dropdown panel with click-outside dismissal
 */
export function LocationOverlayHost({
    isOpen,
    onClose,
    containerRef,
}: LocationOverlayHostProps) {
    const isMobile = useIsMobile();

    useDismissableLayer({
        isOpen: isOpen && !isMobile,
        containerRef,
        onDismiss: onClose,
    });

    if (!isOpen) return null;

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent
                    side="bottom"
                    className="h-[60vh] max-h-[440px] overflow-hidden rounded-t-2xl border-t-0 p-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl mx-auto max-w-sm w-full sm:h-[70vh] sm:max-h-[520px]"
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
            style={{ zIndex: Z_INDEX.userHeaderDropdown }}
            className="absolute top-full left-0 mt-1 w-72 max-h-[52vh] bg-popover border rounded-xl shadow-lg overflow-hidden transition-all duration-200 flex flex-col opacity-100 visible translate-y-0"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex-1 overflow-hidden">
                <LocationSelector variant="panel" onClose={onClose} />
            </div>
        </div>
    );
}
