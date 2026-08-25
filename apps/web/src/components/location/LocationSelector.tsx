"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@esparex/ui";
import { Input } from "@/components/ui/input";
import { useLocationStatus, useLocationDispatch, useLocationData } from "@/context/LocationContext";
import { Search, MapPin, Target, Loader2 } from "@/icons/IconRegistry";
import type { Location } from "@/lib/api/user/locations";
import { normalizeLocationName } from "@/lib/location/locationService";
import { cn } from "@/components/ui/utils";
import { toCanonicalGeoPoint } from "@esparex/shared";
import { type SelectorVariant } from "./locationSelectorCore.helpers";
import { useLocationSearch } from "./useLocationSearch";

import { LocationResultsList, POPULAR_CITIES } from "./components/LocationResultsList";
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
    const manuallyClearedRef = useRef(false);

    const applySelection = useCallback((loc: Location, source: "manual" | "gps" = "manual") => {
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

        const targetSource = source === "gps" ? "auto" : "manual";

        setManualLocation(
            loc.city || loc.name, loc.state, loc.name || loc.city,
            loc.locationId || loc.id, loc.coordinates,
            {
                country: loc.country, level: loc.level, persistProfile: mode === "profile",
                logSelectionAnalytics: mode === "search",
                source: targetSource,
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

        const handleClickOutside = (event: MouseEvent | TouchEvent | PointerEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
            setIsOpen(false);
            if (!hasSelection && query.length < 2) setQuery("");
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener("pointerdown", handleClickOutside);
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
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
            const canonicalGeoJSONPoint = toCanonicalGeoPoint(loc.coordinates) || {
                type: "Point" as const,
                coordinates: [78.4867, 17.3850] as [number, number]
            };
            const finalLoc = {
                id: loc.locationId || loc.id || [loc.city || loc.name, loc.state].filter(Boolean).join("-").toLowerCase(),
                locationId: loc.locationId || loc.id || [loc.city || loc.name, loc.state].filter(Boolean).join("-").toLowerCase(),
                slug: loc.slug || [loc.city || loc.name, loc.state].filter(Boolean).join("-").toLowerCase(),
                city: loc.city || loc.name,
                state: loc.state || loc.city || loc.name,
                country: loc.country || "India",
                name: loc.name || loc.city,
                display: loc.display || loc.displayName || [loc.city || loc.name, loc.state].filter(Boolean).join(", "),
                displayName: loc.displayName || loc.name || loc.city,
                level: loc.level || "city",
                coordinates: canonicalGeoJSONPoint,
            };

            applySelection(finalLoc as Location, "manual");
            if (isPanel) {
                onClose?.();
            }
        } finally {
            searchApi.setIsSearching(false);
        }
    }, [applySelection, isPanel, onClose, searchApi]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const activeList = query.trim() ? searchApi.locations : POPULAR_CITIES;
        const isInteractionActive = isPanel || (isOpen && !hasSelection);
        if (!isInteractionActive || activeList.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < activeList.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
            case "Home":
                e.preventDefault();
                setSelectedIndex(0);
                break;
            case "End":
                e.preventDefault();
                setSelectedIndex(activeList.length - 1);
                break;
            case "Enter":
                if (selectedIndex >= 0 && activeList[selectedIndex]) {
                    e.preventDefault();
                    void handleSelect(activeList[selectedIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                if (isPanel) {
                    onClose?.();
                } else {
                    setIsOpen(false);
                }
                break;
        }
    }, [handleSelect, isPanel, isOpen, hasSelection, onClose, query, searchApi.locations, selectedIndex]);

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

        return parts.join(", ");
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
            selectedCityName={location?.city || location?.name}
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
                onKeyDown={handleKeyDown}
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
                    role="combobox"
                    aria-expanded={isOpen && !hasSelection}
                    aria-haspopup="listbox"
                    aria-controls="location-results-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={selectedIndex >= 0 ? `location-option-${selectedIndex}` : undefined}
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

            {isOpen && !hasSelection && !disabled && (
                <div ref={dropdownRef} className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-[280px] bg-popover border rounded-xl shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
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
                                    ) : (location?.source === "auto" || location?.source === "ip") && location?.display && location?.display !== "India" ? (
                                        <>
                                            <span className="truncate w-full font-semibold text-foreground">{location.city || location.name}{location.state ? `, ${location.state}` : ''}</span>
                                            <span className="text-tiny font-medium text-emerald-600 mt-0.5 w-full truncate">Auto-Detected Location</span>
                                        </>
                                    ) : (
                                        <span className="truncate w-full font-medium">Use Current Location</span>
                                    )}
                                </div>
                            </div>
                        </Button>
                        {searchApi.detectFeedback && !searchApi.isDetecting && (
                            <div className="px-2 py-1 bg-destructive/5 rounded-lg border border-destructive/10 mt-1">
                                <p className="text-tiny font-medium text-destructive">{searchApi.detectFeedback}</p>
                            </div>
                        )}
                    </div>
                    {renderResults()}
                </div>
            )}
        </div>
    );
}
