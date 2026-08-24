"use client";

import { RefObject, useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { useIsMobile } from "@/components/ui/useMobile";
import LocationSelector from "@/components/location/LocationSelector";
import { Sheet, SheetContent, SheetDescription, SheetTitle, Z_INDEX } from "@esparex/ui";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";
import { LocationResultsList } from "@/components/location/components/LocationResultsList";
import { useLocationSearch } from "@/components/location/useLocationSearch";
import { useLocationDispatch, useLocationData } from "@/context/LocationContext";
import type { Location } from "@/lib/api/user/locations";

interface LocationOverlayHostProps {
    isOpen: boolean;
    onClose: () => void;
    containerRef: RefObject<HTMLDivElement | null>;
    locationQuery?: string;
    onLocationQueryChange?: (val: string) => void;
}

/**
 * LocationOverlayHost
 * Single presentation owner for the Location Selector overlay.
 * Viewport Strategy:
 * - Mobile (isMobile = true): 100% untouched Radix Sheet bottom drawer portalled to document.body
 * - Desktop (isMobile = false): Streamlined dropdown anchored flush below location input trigger
 *
 * IMPORTANT: This component must be rendered OUTSIDE any CSS display:none container
 * so that Radix UI's DismissableLayer event system works correctly on mobile.
 * It is rendered at the <header> root level in Header.tsx.
 */
export function LocationOverlayHost({
    isOpen,
    onClose,
    containerRef,
    locationQuery = "",
    onLocationQueryChange,
}: LocationOverlayHostProps) {
    const isMobile = useIsMobile();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { setManualLocation } = useLocationDispatch();
    const { location } = useLocationData();

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
        onClose();
    }, [setManualLocation, onLocationQueryChange, onClose]);

    // Desktop search hook instance
    const desktopSearchApi = useLocationSearch({
        isOpen: isOpen && !isMobile,
        isPanel: false,
        query: locationQuery,
        onApplySelection: handleDesktopSelect,
        onClose,
    });

    useDismissableLayer({
        isOpen: isOpen && !isMobile,
        containerRef: [containerRef, dropdownRef],
        onDismiss: onClose,
    });

    if (!isOpen) return null;

    // Mobile View: 100% UNTOUCHED bottom sheet drawer
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

    // Desktop View: Pure city suggestions list dropdown anchored flush below header input
    return (
        <div
            ref={dropdownRef}
            // design-token-ignore: dynamic anchored dropdown positioning
            style={{ zIndex: Z_INDEX.userHeaderDropdown, ...dropdownStyle }}
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
