"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties, type RefObject } from "react";
import { useIsMobile } from "@/hooks/useMobile";
import LocationSelector from "@/components/location/LocationSelector";
import { Sheet, SheetContent, SheetDescription, SheetTitle, Z_INDEX } from "@esparex/ui";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { LocationResultsList } from "@/components/location/components/LocationResultsList";
import { useLocationSearch } from "@/components/location/useLocationSearch";
import { useLocationDispatch, useLocationData } from "@/context/LocationContext";
import { useBottomSheetManager } from "@/context/BottomSheetManagerContext";
import type { Location } from "@/lib/api/user/locations";

interface LocationOverlayHostProps {
    isOpen: boolean;
    onClose: () => void;
    /** Only used for desktop dropdown positioning */
    containerRef: RefObject<HTMLDivElement | null>;
    locationQuery?: string;
    onLocationQueryChange?: (val: string) => void;
}

/**
 * LocationOverlayHost: Single presentation owner for Location Selector overlay.
 * Viewport Strategy: Mobile = Radix Sheet bottom drawer via BottomSheetManager; Desktop = Anchored dropdown.
 * Parity: both surfaces share useLocationSearch + LocationResultsList states
 * (options, loading skeleton, empty, error + retry, keyboard) — LocationSelector
 * panel internally consumes the same hook/list. JS viewport check routes only
 * the overlay container (dynamic behavior), layout itself stays single-instance CSS.
 */
export function LocationOverlayHost({
    isOpen,
    onClose,
    containerRef,
    locationQuery = "",
    onLocationQueryChange,
}: LocationOverlayHostProps) {
    // responsive-exception: dynamic sheet-vs-dropdown routing (layout itself is single-instance CSS).
    const isMobile = useIsMobile();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { setManualLocation } = useLocationDispatch();
    const { location } = useLocationData();
    const { activeSheetId, registerSheet, unregisterSheet, openSheet, closeSheet } = useBottomSheetManager();

    // Register the location sheet on mount
    useEffect(() => {
        registerSheet("location", { onClose: () => onClose() });
        return () => unregisterSheet("location");
    }, [registerSheet, unregisterSheet, onClose]);

    // Synchronize BottomSheetManager when isOpen changes on mobile
    useEffect(() => {
        if (!isMobile) return;
        if (isOpen) openSheet("location");
        else if (activeSheetId === "location") closeSheet("location");
    }, [isMobile, isOpen, activeSheetId, openSheet, closeSheet]);

    // Anchor position for the desktop dropdown — anchored flush 2px below input bounds with matched width.
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
    useEffect(() => {
        if (!isOpen || isMobile) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 2,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [isOpen, isMobile, containerRef]);

    // Handle selection from dropdown/sheet list
    const handleSelect = useCallback((loc: Location) => {
        setManualLocation(
            loc.city || loc.name,
            loc.state,
            loc.name || loc.city,
            loc.locationId || loc.id,
            loc.coordinates,
            { country: loc.country, level: loc.level, persistProfile: false, logSelectionAnalytics: true, source: "manual" }
        );
        if (onLocationQueryChange) onLocationQueryChange("");
        if (isMobile) closeSheet("location");
        onClose();
    }, [setManualLocation, onLocationQueryChange, isMobile, closeSheet, onClose]);

    // Desktop search hook instance
    const desktopSearchApi = useLocationSearch({
        isOpen: isOpen && !isMobile,
        isPanel: false,
        query: locationQuery,
        onApplySelection: handleSelect,
        onClose,
    });

    useDismissableLayer({
        isOpen: isOpen && !isMobile,
        containerRef: [containerRef, dropdownRef],
        onDismiss: onClose,
    });

    if (!isOpen) return null;

    const isMobileSheetActive = activeSheetId === "location";

    // Mobile View: Visual-viewport-aware bottom sheet drawer (controlled by BottomSheetManager)
    if (isMobile) {
        if (!isMobileSheetActive) return null;
        return (
            <Sheet open={true} onOpenChange={(open) => { if (!open) { closeSheet("location"); onClose(); } }}>
                <SheetContent
                    side="bottom"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                            (document.getElementById("location-selector-search-input") as HTMLInputElement | null)?.focus({ preventScroll: true });
                        }, 150);
                    }}
                    className="h-[min(480px,calc(var(--visual-viewport-height,100dvh)-1rem))] max-h-[var(--visual-viewport-height,100dvh)] overflow-hidden rounded-t-2xl border-t-0 p-0 shadow-2xl mx-auto max-w-sm w-full sm:h-[min(520px,calc(var(--visual-viewport-height,100dvh)-2rem))]"
                >
                    <SheetTitle className="sr-only">Select Location</SheetTitle>
                    <SheetDescription className="sr-only">Choose your city</SheetDescription>
                    <LocationSelector variant="panel" onClose={() => { closeSheet("location"); onClose(); }} />
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop View: Pure city suggestions list dropdown anchored flush below header input
    return (
        <div
            ref={dropdownRef}
            /* design-token-ignore: dynamic anchored dropdown positioning */
            style={{ zIndex: Z_INDEX.userHeaderDropdown, ...dropdownStyle }} /* design-token-ignore: dynamic anchored dropdown positioning */
            className="max-h-[min(380px,65vh)] bg-popover border border-border rounded-xl shadow-md overflow-hidden flex flex-col overscroll-contain"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1.5 focus:outline-none">
                <LocationResultsList
                    query={locationQuery}
                    showSkeleton={desktopSearchApi.showSkeleton}
                    searchError={desktopSearchApi.searchError}
                    retryCount={desktopSearchApi.retryCount}
                    locations={desktopSearchApi.locations}
                    isSearching={desktopSearchApi.isSearching}
                    selectedIndex={-1}
                    selectedCityName={location?.city || location?.name}
                    onRetry={desktopSearchApi.handleRetry}
                    onSelect={handleSelect}
                    getLocationPrimaryLabel={(loc) => loc.name || loc.city || loc.displayName || ""}
                    getLocationSecondaryLabel={(loc) => loc.state || ""}
                />
            </div>
        </div>
    );
}