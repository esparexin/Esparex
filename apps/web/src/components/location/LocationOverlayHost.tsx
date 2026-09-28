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
    /** Only used for desktop dropdown positioning */
    containerRef: RefObject<HTMLDivElement | null>;
    locationQuery?: string;
    onLocationQueryChange?: (val: string) => void;
}

/**
 * LocationOverlayHost
 * Single presentation owner for the Location Selector overlay.
 * Viewport Strategy:
 * - Mobile (isMobile = true): 100% untouched Radix Sheet bottom drawer portalled to document.body
 *   Controlled by BottomSheetManager for mutual exclusion with other bottom sheets.
 * - Desktop (isMobile = false): Streamlined dropdown anchored flush below location input trigger
 *
 * IMPORTANT: This component must be rendered OUTSIDE any CSS display:none container
 * so that Radix UI's DismissableLayer event system works correctly on mobile.
 * It is rendered at the <header> root level in Header.tsx.
 */
export function LocationOverlayHost({
    containerRef,
    locationQuery = "",
    onLocationQueryChange,
}: LocationOverlayHostProps) {
    const isMobile = useIsMobile();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { setManualLocation } = useLocationDispatch();
    const { location } = useLocationData();
    const { activeSheetId, registerSheet, unregisterSheet, closeSheet } = useBottomSheetManager();

    // Register the location sheet on mount
    useEffect(() => {
        registerSheet("location", {
            onClose: () => {
                // Reset local desktop state if needed
            },
        });
        return () => unregisterSheet("location");
    }, [registerSheet, unregisterSheet]);

    // Local state for desktop dropdown
    const [desktopOpen, setDesktopOpen] = useState(false);

    // Anchor position for the desktop dropdown — anchored flush 2px below input bounds with matched width.
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
    useEffect(() => {
        if (!desktopOpen || isMobile) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 2,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [desktopOpen, isMobile, containerRef]);

    // Handle selection from desktop dropdown list
    const handleDesktopSelect = useCallback((loc: Location) => {
        setManualLocation(
            loc.city || loc.name,
            loc.state,
            loc.name || loc.city,
            loc.locationId || loc.id,
            loc.coordinates,
            {
                country: loc.country,
                level: loc.level,
                persistProfile: false,
                logSelectionAnalytics: true,
                source: "manual",
            }
        );
        if (onLocationQueryChange) onLocationQueryChange("");
        if (isMobile) {
            closeSheet("location");
        } else {
            setDesktopOpen(false);
        }
    }, [setManualLocation, onLocationQueryChange, isMobile, closeSheet]);

    // Desktop search hook instance
    const desktopSearchApi = useLocationSearch({
        isOpen: desktopOpen && !isMobile,
        isPanel: false,
        query: locationQuery,
        onApplySelection: handleDesktopSelect,
        onClose: () => setDesktopOpen(false),
    });

    useDismissableLayer({
        isOpen: desktopOpen && !isMobile,
        containerRef: [containerRef, dropdownRef],
        onDismiss: () => setDesktopOpen(false),
    });

    const isMobileSheetActive = activeSheetId === "location";

    // Mobile View: Visual-viewport-aware bottom sheet drawer (controlled by BottomSheetManager)
    if (isMobile && isMobileSheetActive) {
        return (
            <Sheet open={true} onOpenChange={(open) => !open && closeSheet("location")}>
                <SheetContent
                    side="bottom"
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        setTimeout(() => {
                            const input = document.getElementById("location-selector-search-input") as HTMLInputElement | null;
                            input?.focus({ preventScroll: true });
                        }, 150);
                    }}
                    className="h-[min(480px,calc(var(--visual-viewport-height,100dvh)-1rem))] max-h-[var(--visual-viewport-height,100dvh)] overflow-hidden rounded-t-2xl border-t-0 p-0 shadow-2xl mx-auto max-w-sm w-full sm:h-[min(520px,calc(var(--visual-viewport-height,100dvh)-2rem))]"
                >
                    <SheetTitle className="sr-only">Select Location</SheetTitle>
                    <SheetDescription className="sr-only">Choose your city</SheetDescription>
                    <LocationSelector variant="panel" onClose={() => closeSheet("location")} />
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
                    onSelect={handleDesktopSelect}
                    getLocationPrimaryLabel={(loc) => loc.name || loc.city || loc.displayName || ""}
                    getLocationSecondaryLabel={(loc) => loc.state || ""}
                />
            </div>
        </div>
    );
}