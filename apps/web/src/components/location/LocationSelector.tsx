"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocationStatus, useLocationDispatch } from "@/context/LocationContext";
import { Search, MapPin, Target, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { Location } from "@/lib/api/user/locations";
import { normalizeLocationName } from "@/lib/location/locationService";
import { cn } from "@/components/ui/utils";
import LocationSkeleton from "./LocationSkeleton";
import { MAX_DROPDOWN_RESULTS, toGeoPoint, type SelectorVariant } from "./locationSelectorCore.helpers";
import { useLocationSearch } from "./useLocationSearch";
import { Z_INDEX } from "@/lib/zIndexConfig";

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

    const applySelection = useCallback((loc: Location) => {
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
        if (detectError) searchApi.setDetectFeedback(detectError);
    }, [detectError, searchApi]);

    useEffect(() => {
        if (isPanel) return;
        if (manuallyClearedRef.current) return;
        if (currentDisplay) {
            setSelectedLabel(currentDisplay);
            setHasSelection(true);
        } else if (!currentDisplay && !isOpen && !query) {
            setSelectedLabel("");
            setHasSelection(false);
        }
    }, [currentDisplay, isOpen, isPanel, query]);

    useEffect(() => {
        if (isPanel || !isOpen) return;

        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownMaxH = 320;
                if (spaceBelow < dropdownMaxH && rect.top > dropdownMaxH) {
                    setDropdownStyle({ position: "fixed", top: rect.top - dropdownMaxH - 4, left: rect.left, width: rect.width, zIndex: 9999, maxHeight: dropdownMaxH });
                } else {
                    setDropdownStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999, maxHeight: Math.min(dropdownMaxH, spaceBelow - 8) });
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
        setSelectedIndex(-1);
    }, [isOpen, isPanel, query]);

    const handleSelect = useCallback(async (loc: Location) => {
        searchApi.setIsSearching(true);
        try {
            const canonicalGeoJSONPoint = toGeoPoint(loc.coordinates);
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

            applySelection(finalLoc as Location);
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

    const renderResultsBody = () => (
        <div className="py-0.5">
            {query ? (
                searchApi.showSkeleton ? (
                    <LocationSkeleton count={4} />
                ) : searchApi.searchError ? (
                    <div className="p-3 text-center space-y-2">
                        <div className="flex justify-center">
                            <AlertCircle className="w-7 h-7 text-destructive/60" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-medium text-destructive">{searchApi.searchError.message}</p>
                            {searchApi.searchError.retryable && (
                                <p className="text-[11px] text-muted-foreground">
                                    {searchApi.retryCount > 0 && `Attempt ${searchApi.retryCount} of 3`}
                                </p>
                            )}
                        </div>
                        {searchApi.searchError.retryable && searchApi.retryCount < 3 && (
                            <Button type="button" variant="outline" onClick={searchApi.handleRetry} className="gap-1.5 h-8 text-xs">
                                <RefreshCw className="w-3.5 h-3.5" /> Try Again
                            </Button>
                        )}
                        {searchApi.locations.length > 0 && (
                            <div className="pt-2 border-t">
                                <p className="text-[11px] text-muted-foreground mb-1">Cached results:</p>
                                <div className="space-y-0.5">
                                    {searchApi.locations.slice(0, 3).map((loc, index) => (
                                        <button
                                            key={`fallback-${loc.id || index}`}
                                            onMouseDown={(e) => { e.preventDefault(); void handleSelect(loc); }}
                                            className="flex items-start gap-2 w-full px-3 py-2 rounded-xl hover:bg-accent text-left"
                                        >
                                            <MapPin className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block truncate text-xs font-medium text-foreground">
                                                    {getLocationPrimaryLabel(loc)}
                                                </span>
                                                <span className="block truncate text-[11px] text-muted-foreground">
                                                    {getLocationSecondaryLabel(loc)}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : searchApi.locations.length > 0 ? (
                    searchApi.locations.slice(0, MAX_DROPDOWN_RESULTS).map((loc, index) => {
                        return (
                            <button
                                key={`loc-${loc.id || index}`}
                                onMouseDown={(e) => { e.preventDefault(); void handleSelect(loc); }}
                                className={cn(
                                    "flex items-start gap-2 w-full px-3 py-2.5 text-left transition-colors rounded-xl",
                                    "hover:bg-accent cursor-pointer",
                                    selectedIndex === index && "bg-accent"
                                )}
                            >
                                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 py-0.5">
                                    <span className="block truncate text-sm font-semibold text-foreground">
                                        {getLocationPrimaryLabel(loc)}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {getLocationSecondaryLabel(loc)}
                                    </span>
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                        {searchApi.isSearching ? "Searching..." : "No locations found."}
                    </div>
                )
            ) : (
                <div className="p-4 text-center text-muted-foreground text-xs">
                    Type to search city, area, district or state.
                </div>
            )}
        </div>
    );

    if (isPanel) {
        return (
            <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
                <div className="sticky top-0 z-10 border-b bg-background/95 px-3 pb-3 pt-2 backdrop-blur" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">Choose location</p>
                            <p className="text-[11px] text-muted-foreground">Use GPS or search by city and state.</p>
                        </div>
                        {onClose ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 rounded-full"
                                onClick={onClose}
                                aria-label="Close location selector"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className={cn(
                                "h-11 w-full justify-between rounded-xl border-primary/20 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10",
                                searchApi.isDetecting && "border-primary/40 bg-primary/10"
                            )}
                            disabled={searchApi.isDetecting}
                            onClick={handlePanelDetect}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <Target className={cn("h-4 w-4 shrink-0", searchApi.isDetecting && "animate-spin")} />
                                <span className="truncate">
                                    {searchApi.isDetecting ? "Detecting current location..." : "Use Current Location"}
                                </span>
                            </span>
                            <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                GPS
                            </span>
                        </Button>

                        {searchApi.detectFeedback && !searchApi.isDetecting && (
                            <div className="rounded-lg border border-destructive/10 bg-destructive/5 px-3 py-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                                    <p className="text-[11px] font-medium leading-4 text-destructive">{searchApi.detectFeedback}</p>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search city, area, district..."
                                className="h-11 rounded-xl pl-9 pr-9 text-sm"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                                disabled={disabled}
                            />
                            {searchApi.isSearching ? (
                                <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : query ? (
                                <button onClick={handleClearQuery} className="absolute right-3 top-1/2 -translate-y-1/2" type="button" aria-label="Clear search">
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-3 pb-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                    <div className={cn("min-h-0 flex-1 overflow-y-auto pt-2 pr-1", searchApi.isSearching && "pointer-events-none opacity-60")}>
                        {renderResultsBody()}
                    </div>
                </div>
            </div>
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
                    {hasSelection && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                            {/* We could get the source from global state here if needed */}
                            GPS
                        </span>
                    )}
                    {hasSelection && !disabled && (
                        <button type="button" onClick={handleClear} className="flex items-center justify-center h-8 px-2.5 rounded-lg bg-muted/60 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" title="Change location">
                            Change
                        </button>
                    )}
                </div>
            </div>

            {isOpen && !hasSelection && !disabled && (
                <>
                    <div style={{ zIndex: Z_INDEX.locationSelectorBackdrop }} className="fixed inset-0 bg-transparent" onMouseDown={handleBackdropMouseDown} />
                    <div ref={dropdownRef} style={dropdownStyle} className="bg-popover border rounded-xl shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-1 border-b">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground h-11 px-2 text-xs font-normal hover:bg-primary/5 group" disabled={searchApi.isDetecting} onClick={() => searchApi.handleDetect(() => setIsOpen(false))}>
                            <Target className={cn("mr-2 h-4 w-4", searchApi.isDetecting ? "animate-spin text-primary" : "group-hover:text-primary transition-colors")} />
                            <div className="flex flex-col items-start leading-none">
                                <span className={cn("font-medium", searchApi.isDetecting ? "text-primary" : "")}>
                                    {searchApi.isDetecting ? (searchApi.detectFeedback?.split('.')[0] + '...') : "Use Current Location"}
                                </span>
                                {searchApi.isDetecting && <span className="text-[10px] opacity-60">Wait a moment...</span>}
                            </div>
                        </Button>
                        {searchApi.detectFeedback && !searchApi.isDetecting && (
                            <div className="px-2 py-1 bg-destructive/5 rounded-lg border border-destructive/10 mt-1">
                                <p className="text-[10px] font-medium text-destructive">{searchApi.detectFeedback}</p>
                            </div>
                        )}
                    </div>
                    {renderResultsBody()}
                    </div>
                </>
            )}
        </div>
    );
}
