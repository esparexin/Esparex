"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocationState, useLocationDispatch } from "@/context/LocationContext";
import { Search, MapPin, Target, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { Location } from "@/lib/api/user/locations";
import { normalizeLocationName } from "@/lib/location/locationService";
import { cn } from "@/components/ui/utils";
import LocationSkeleton from "./LocationSkeleton";
import { MAX_DROPDOWN_RESULTS, toGeoPoint, type SelectorVariant } from "./locationSelectorCore.helpers";
import { useLocationSearch } from "./useLocationSearch";

interface LocationSelectorCoreProps {
    variant: SelectorVariant;
    mode?: "search" | "profile" | "postAd";
    onLocationSelect?: (loc: Location | null) => void;
    currentDisplay?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    onClose?: () => void;
}

export default function LocationSelectorCore({
    variant,
    mode = "search",
    onLocationSelect,
    currentDisplay,
    error,
    disabled,
    className,
    onClose,
}: LocationSelectorCoreProps) {
    const isPanel = variant === "panel";
    const { detectError } = useLocationState();
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
            setSelectedLabel(normalizeLocationName(loc.display || loc.name || loc.city));
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

    const searchApi = useLocationSearch({ mode, isOpen, isPanel, query, onApplySelection: applySelection, onClose });

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
                displayName: loc.displayName || loc.name || loc.city,
                level: loc.level, coordinates: canonicalGeoJSONPoint,
            };

            applySelection(finalLoc as Location);
            if (isPanel) onClose?.();
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

    const handleClear = () => {
        manuallyClearedRef.current = true;
        setSelectedLabel("");
        setHasSelection(false);
        setQuery("");
        setIsOpen(true);
        searchApi.clearSearchSession();
        onLocationSelect?.(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSelectedFieldActivate = () => {
        if (!hasSelection || disabled) return;
        handleClear();
    };

    const renderResultsBody = () => (
        <div className="py-1">
            {query ? (
                searchApi.showSkeleton ? (
                    <LocationSkeleton count={5} />
                ) : searchApi.searchError ? (
                    <div className="p-6 text-center space-y-3">
                        <div className="flex justify-center">
                            <AlertCircle className="w-12 h-12 text-destructive/60" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-destructive">{searchApi.searchError.message}</p>
                            {searchApi.searchError.retryable && (
                                <p className="text-xs text-muted-foreground">
                                    {searchApi.retryCount > 0 && `Attempt ${searchApi.retryCount} of 3`}
                                </p>
                            )}
                        </div>
                        {searchApi.searchError.retryable && searchApi.retryCount < 3 && (
                            <Button type="button" variant="outline" size="sm" onClick={searchApi.handleRetry} className="gap-2">
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </Button>
                        )}
                        {searchApi.locations.length > 0 && (
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Showing cached results:</p>
                                <div className="space-y-1">
                                    {searchApi.locations.slice(0, 3).map((loc, index) => (
                                        <button
                                            key={`fallback-${loc.id || index}`}
                                            onMouseDown={(e) => { e.preventDefault(); void handleSelect(loc); }}
                                            className="flex items-center gap-2 w-full px-3 py-3 rounded-xl hover:bg-accent text-left text-sm"
                                        >
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{normalizeLocationName(loc.display || loc.name || loc.city)}</span>
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
                                    "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors rounded-xl",
                                    "hover:bg-accent cursor-pointer",
                                    selectedIndex === index && "bg-accent"
                                )}
                            >
                                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium truncate">
                                    {normalizeLocationName(loc.display || loc.name || loc.city)}
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        {searchApi.isSearching ? "Searching..." : "No locations found."}
                    </div>
                )
            ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    Start typing to search for a state, district, city, area, or village.
                </div>
            )}
        </div>
    );

    if (isPanel) {
        return (
            <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
                <div className="flex min-h-0 flex-1 flex-col p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                    <div className="shrink-0 space-y-4 pb-4">
                        <Button variant="outline" className="w-full flex items-center justify-between gap-3 h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl px-4" disabled={searchApi.isDetecting} onClick={() => searchApi.handleDetect()}>
                            <div className="flex items-center gap-3">
                                <Target className={`h-5 w-5 ${searchApi.isDetecting ? "animate-spin" : ""}`} />
                                <span className="font-medium text-base">{searchApi.isDetecting ? "Detecting location..." : "Use Current Location"}</span>
                            </div>
                            <span className="text-xs opacity-70">Enable GPS</span>
                        </Button>
                        {searchApi.detectFeedback && (
                            <div className="space-y-2 px-1">
                                <p className="text-xs text-destructive">{searchApi.detectFeedback}</p>
                            </div>
                        )}

                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search state, district, city, area or village..." className="pl-10 h-12 rounded-xl text-base" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus disabled={disabled} />
                            {searchApi.isSearching && <div className="absolute right-3 top-3.5 h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                            {query && !searchApi.isSearching && <button onClick={() => setQuery("")} className="absolute right-3 top-3.5" type="button"><X className="h-5 w-5" /></button>}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                    placeholder="Search state, district, city, area or village..."
                    disabled={disabled}
                    aria-label={hasSelection
                        ? `Selected location ${selectedLabel}. Activate to change location.`
                        : "Search state, district, city, area or village"}
                    title={hasSelection ? "Tap to change location" : undefined}
                    className={cn(
                        "pl-10 h-12 rounded-xl transition-all text-base",
                        hasSelection ? "bg-primary/5 font-semibold text-primary border-primary/20 cursor-pointer" : "bg-background cursor-text",
                        error ? "border-destructive ring-destructive/50" : "",
                        className
                    )}
                    onClick={handleSelectedFieldActivate}
                />
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    {(searchApi.isSearching || searchApi.isDetecting) && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                    {hasSelection && !disabled && (
                        <button type="button" onClick={handleClear} className="flex items-center px-2.5 py-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground" title="Change location">
                            <span className="text-xs font-medium underline mr-1">Change</span>
                        </button>
                    )}
                </div>
            </div>

            {isOpen && !hasSelection && !disabled && (
                <>
                    <div className="fixed inset-0 z-[9998] bg-transparent" onMouseDown={() => { setIsOpen(false); if (!hasSelection && query.length < 2) setQuery(""); }} />
                    <div ref={dropdownRef} style={dropdownStyle} className="bg-popover border rounded-xl shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b">
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground h-11 px-3 font-normal" disabled={searchApi.isDetecting} onClick={() => searchApi.handleDetect(() => setIsOpen(false))}>
                            <Target className={`mr-2 h-4 w-4 ${searchApi.isDetecting ? "animate-spin text-primary" : ""}`} />
                            {searchApi.isDetecting ? "Detecting location..." : "Use Current Location"}
                        </Button>
                        {searchApi.detectFeedback && (
                            <div className="mt-2 space-y-2 px-1">
                                <p className="text-xs text-destructive">{searchApi.detectFeedback}</p>
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
