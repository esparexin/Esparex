"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocationStatus, useLocationDispatch, useLocationData } from "@/context/LocationContext";
import { Search, MapPin, Target, Loader2 } from "lucide-react";
import type { Location } from "@/lib/api/user/locations";
import { normalizeLocationName } from "@/lib/location/locationService";
import { cn } from "@/components/ui/utils";
import { normalizeGeoPoint, type SelectorVariant } from "./locationSelectorCore.helpers";
import { useLocationSearch } from "./useLocationSearch";
import { Z_INDEX } from "@/lib/zIndexConfig";
import { LocationResultsList } from "./components/LocationResultsList";
import { LocationSelectorPanel } from "./components/LocationSelectorPanel";

type SnappedLocation = Location & { isSnapped?: boolean };

interface LocationSelectorProps {
    variant: SelectorVariant;
    mode?: "search" | "profile" | "postAd";
    onLocationSelect?: (loc: Location | null) => void;
    currentDisplay?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    onClose?: () => void;
}

export default function LocationSelector({
    variant,
    mode = "search",
    onLocationSelect,
    currentDisplay,
    error,
    disabled,
    className,
    onClose,
}: LocationSelectorProps) {
    const isPanel = variant === "panel";
    const { detectError } = useLocationStatus();
    const { setManualLocation } = useLocationDispatch();
    const { location } = useLocationData();

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selectedLabel, setSelectedLabel] = useState(currentDisplay || "");
    const [hasSelection, setHasSelection] = useState(Boolean(currentDisplay));

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
    const manuallyClearedRef = useRef(false);

    const applySelection = useCallback((loc: Location, _source: "manual" | "gps" = "manual") => {
        manuallyClearedRef.current = false;
        if (!isPanel) {
            const rawLabel = normalizeLocationName(loc.display || loc.name || loc.city);
            const prefix = (loc as SnappedLocation).isSnapped ? "~ " : "";
            setSelectedLabel(`${prefix}${rawLabel}`);
            setHasSelection(true);
            setIsOpen(false);
        }
        setQuery("");
        onLocationSelect?.(loc);

        if (mode === "postAd") return;

        setManualLocation(
            loc.city || loc.name, loc.state, loc.name || loc.city,
            loc.locationId || loc.id, loc.coordinates,
            {
                country: loc.country, level: loc.level, persistProfile: mode === "profile",
                logSelectionAnalytics: mode === "search",
            }
        );
    }, [isPanel, mode, onLocationSelect, setManualLocation]);

    const searchApi = useLocationSearch({ isOpen, isPanel, query, onApplySelection: applySelection, onClose });

    useEffect(() => {
        if (!detectError) return;
        void (async () => { searchApi.setDetectFeedback(detectError); })();
    }, [detectError, searchApi]);

    useEffect(() => {
        if (isPanel || manuallyClearedRef.current) return;

        void (async () => {
            if (currentDisplay) {
                setSelectedLabel(currentDisplay);
                setHasSelection(true);
            } else if (!currentDisplay && !isOpen && !query) {
                setSelectedLabel("");
                setHasSelection(false);
            }
        })();
    }, [currentDisplay, isOpen, isPanel, query]);

    useEffect(() => {
        if (isPanel || !isOpen) return;

        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownMaxH = 320;
                if (spaceBelow < dropdownMaxH && rect.top > dropdownMaxH) {
                    setDropdownStyle({ 
                        position: "fixed", 
                        bottom: window.innerHeight - rect.top + 4, 
                        left: rect.left, 
                        width: rect.width, 
                        zIndex: Z_INDEX.locationSelectorDropdown, 
                        maxHeight: dropdownMaxH 
                    });
                } else {
                    setDropdownStyle({ 
                        position: "fixed", 
                        top: rect.bottom + 4, 
                        left: rect.left, 
                        width: rect.width, 
                        zIndex: Z_INDEX.locationSelectorDropdown, 
                        maxHeight: Math.min(dropdownMaxH, spaceBelow - 8) 
                    });
                }
            }
        };

        updatePosition();

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
            setIsOpen(false);
            if (!hasSelection && query.length < 2) setQuery("");
        };

        const handleScrollOrResize = () => updatePosition();

        const timeoutId = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScrollOrResize, true);
            window.addEventListener("resize", handleScrollOrResize);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, [hasSelection, isOpen, isPanel, query]);

    useEffect(() => {
        const interactionOpen = isPanel || isOpen;
        if (!interactionOpen) return;
        void (async () => { setSelectedIndex(-1); })();
    }, [isOpen, isPanel, query]);

    const handleSelect = useCallback(async (loc: Location) => {
        searchApi.setIsSearching(true);
        try {
            const canonicalGeoJSONPoint = normalizeGeoPoint(loc.coordinates);
            if (!canonicalGeoJSONPoint) {
                searchApi.setSearchError({
                    type: "unknown",
                    message: "This location doesn't have map coordinates yet. Please search for a nearby city or area.",
                    retryable: false
                });
                return;
            }
            const finalLoc = {
                id: loc.locationId || loc.id, locationId: loc.locationId || loc.id,
                slug: loc.slug, city: loc.city || loc.name, state: loc.state,
                country: loc.country, name: loc.name || loc.city,
                display: loc.display || loc.displayName || [loc.city || loc.name, loc.state].filter(Boolean).join(", "),
                displayName: loc.displayName || loc.name || loc.city,
                level: loc.level, coordinates: canonicalGeoJSONPoint,
            };

            applySelection(finalLoc as Location, "manual");
            if (isPanel) {
                await new Promise<void>(r => setTimeout(r, 80));
                onClose?.();
            }
        } finally {
            searchApi.setIsSearching(false);
        }
    }, [applySelection, isPanel, onClose, searchApi]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen || searchApi.locations.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < searchApi.locations.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && searchApi.locations[selectedIndex]) {
                    void handleSelect(searchApi.locations[selectedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    }, [handleSelect, isOpen, searchApi.locations, selectedIndex]);

    const handleClear = useCallback(() => {
        manuallyClearedRef.current = true;
        setSelectedLabel("");
        setHasSelection(false);
        setQuery("");
        setIsOpen(true);
        searchApi.clearSearchSession();
        onLocationSelect?.(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, [searchApi, onLocationSelect]);

    const handleSelectedFieldActivate = useCallback(() => {
        if (!hasSelection || disabled) return;
        handleClear();
    }, [hasSelection, disabled, handleClear]);

    const handleClearQuery = useCallback(() => setQuery(""), []);

    const handlePanelDetect = useCallback(() => { void searchApi.handleDetect(); }, [searchApi]);

    const handleBackdropMouseDown = useCallback(() => {
        setIsOpen(false);
        if (!hasSelection && query.length < 2) setQuery("");
    }, [hasSelection, query.length]);

    const getLocationPrimaryLabel = useCallback((loc: Location) => (
        normalizeLocationName(loc.name || loc.city || loc.display || "")
    ), []);

    const getLocationSecondaryLabel = useCallback((loc: Location) => {
        const parts = [loc.city, loc.state]
            .map((value) => normalizeLocationName(value))
            .filter(Boolean);

        if (parts.length === 2 && parts[0] === parts[1]) {
            return loc.country ? normalizeLocationName(loc.country) : "";
        }

        return parts.join(", ") || normalizeLocationName(loc.display || "");
    }, []);

    const renderResults = () => (
        <LocationResultsList
            query={query}
            showSkeleton={searchApi.showSkeleton}
            searchError={searchApi.searchError}
            retryCount={searchApi.retryCount}
            locations={searchApi.locations}
            isSearching={searchApi.isSearching}
            selectedIndex={selectedIndex}
            onRetry={searchApi.handleRetry}
            onSelect={(loc) => void handleSelect(loc)}
            getLocationPrimaryLabel={getLocationPrimaryLabel}
            getLocationSecondaryLabel={getLocationSecondaryLabel}
        />
    );

    if (isPanel) {
        return (
            <LocationSelectorPanel
                className={className}
                onClose={onClose}
                isDetecting={searchApi.isDetecting}
                successFeedback={searchApi.successFeedback}
                detectFeedback={searchApi.detectFeedback}
                handlePanelDetect={handlePanelDetect}
                location={location}
                query={query}
                setQuery={setQuery}
                disabled={disabled}
                isSearching={searchApi.isSearching}
                handleClearQuery={handleClearQuery}
            >
                {renderResults()}
            </LocationSelectorPanel>
        );
    }

    return (
        <div className="relative space-y-2" ref={containerRef}>
            <div className="relative">
                <div className="absolute left-3 top-3 z-10 text-muted-foreground">{hasSelection ? <MapPin className="w-5 h-5 text-primary" /> : <Search className="w-5 h-5" />}</div>
                <Input
                    ref={inputRef}
                    value={hasSelection ? selectedLabel : query}
                    readOnly={hasSelection}
                    onChange={(e) => {
                        if (hasSelection) return;
                        setQuery(e.target.value);
                        if (e.target.value.length > 0) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!hasSelection) setIsOpen(true);
                    }}
                    onKeyDown={(event) => {
                        if (hasSelection && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            handleSelectedFieldActivate();
                            return;
                        }
                        handleKeyDown(event);
                    }}
                    placeholder="Search city, area or district..."
                    disabled={disabled}
                    aria-label={hasSelection
                        ? `Selected location ${selectedLabel}. Activate to change location.`
                        : "Search city, area or district"}
                    title={hasSelection ? "Tap to change location" : undefined}
                    className={cn(
                        "pl-10 h-11 rounded-xl transition-all text-sm",
                        hasSelection ? "bg-primary/5 font-semibold text-primary border-primary/20 cursor-pointer" : "bg-background cursor-text",
                        error ? "border-destructive ring-destructive/50" : "",
                        className
                    )}
                    onClick={handleSelectedFieldActivate}
                />
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    {(searchApi.isSearching || searchApi.isDetecting) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {hasSelection && !disabled && (
                        <button type="button" onClick={handleClear} className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" title="Change location">
                            Change
                        </button>
                    )}
                </div>
            </div>

            {isOpen && !hasSelection && !disabled && typeof document !== "undefined" && createPortal(
                <>
                    <div style={{ zIndex: Z_INDEX.locationSelectorBackdrop }} className="fixed inset-0 bg-transparent" onMouseDown={handleBackdropMouseDown} />
                    <div ref={dropdownRef} style={dropdownStyle} className="bg-popover border rounded-xl shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-1 border-b">
                        <Button variant="ghost" className="h-auto min-h-[44px] py-2 w-full justify-between text-muted-foreground px-2 text-xs font-normal hover:bg-primary/5 group" disabled={searchApi.isDetecting || !!searchApi.successFeedback} onClick={() => searchApi.handleDetect(() => setIsOpen(false))}>
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                {searchApi.successFeedback ? (
                                    <Target className="h-4 w-4 shrink-0 text-green-600" />
                                ) : (
                                    <Target className={cn("h-4 w-4 shrink-0", searchApi.isDetecting ? "animate-spin text-primary" : "group-hover:text-primary transition-colors")} />
                                )}
                                <div className="flex flex-col items-start leading-tight min-w-0 flex-1 text-left">
                                    {searchApi.successFeedback ? (
                                        <span className="text-green-600 font-semibold truncate w-full">{searchApi.successFeedback}</span>
                                    ) : searchApi.isDetecting ? (
                                        <span className="truncate w-full">{searchApi.detectFeedback || "Detecting location..."}</span>
                                    ) : (location?.source !== "default" && location?.display && location?.display !== "India") ? (
                                        <>
                                            <span className="truncate w-full font-semibold text-foreground">{location.city || location.name}{location.state ? `, ${location.state}` : ''}</span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5 w-full truncate">Current Location</span>
                                        </>
                                    ) : (
                                        <span className="truncate w-full">Detect My Location</span>
                                    )}
                                </div>
                            </div>
                        </Button>
                        {searchApi.detectFeedback && !searchApi.isDetecting && (
                            <div className="px-2 py-1 bg-destructive/5 rounded-lg border border-destructive/10 mt-1">
                                <p className="text-[10px] font-medium text-destructive">{searchApi.detectFeedback}</p>
                            </div>
                        )}
                    </div>
                    {renderResults()}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}

