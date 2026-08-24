"use client";

import { useEffect } from "react";
import { AlertCircle, Check, MapPin, RefreshCw } from "@/icons/IconRegistry";
import type { Location } from "@/lib/api/user/locations";
import { Button } from "@esparex/ui";
import { cn } from "@/components/ui/utils";
import LocationSkeleton from "../LocationSkeleton";
import { MAX_DROPDOWN_RESULTS } from "../locationSelectorCore.helpers";

export const POPULAR_CITIES: Location[] = [
    { id: "hyderabad", locationId: "hyderabad", slug: "hyderabad", city: "Hyderabad", state: "Telangana", country: "India", name: "Hyderabad", display: "Hyderabad, Telangana", displayName: "Hyderabad", level: "city", coordinates: { type: "Point", coordinates: [78.4867, 17.3850] }, isActive: true, isPopular: true },
    { id: "vijayawada", locationId: "vijayawada", slug: "vijayawada", city: "Vijayawada", state: "Andhra Pradesh", country: "India", name: "Vijayawada", display: "Vijayawada, Andhra Pradesh", displayName: "Vijayawada", level: "city", coordinates: { type: "Point", coordinates: [80.6480, 16.5062] }, isActive: true, isPopular: true },
    { id: "visakhapatnam", locationId: "visakhapatnam", slug: "visakhapatnam", city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", name: "Visakhapatnam", display: "Visakhapatnam, Andhra Pradesh", displayName: "Visakhapatnam", level: "city", coordinates: { type: "Point", coordinates: [83.2185, 17.6868] }, isActive: true, isPopular: true },
    { id: "bengaluru", locationId: "bengaluru", slug: "bengaluru", city: "Bengaluru", state: "Karnataka", country: "India", name: "Bengaluru", display: "Bengaluru, Karnataka", displayName: "Bengaluru", level: "city", coordinates: { type: "Point", coordinates: [77.5946, 12.9716] }, isActive: true, isPopular: true },
    { id: "mumbai", locationId: "mumbai", slug: "mumbai", city: "Mumbai", state: "Maharashtra", country: "India", name: "Mumbai", display: "Mumbai, Maharashtra", displayName: "Mumbai", level: "city", coordinates: { type: "Point", coordinates: [72.8777, 19.0760] }, isActive: true, isPopular: true },
    { id: "delhi", locationId: "delhi", slug: "delhi", city: "Delhi", state: "Delhi", country: "India", name: "Delhi", display: "Delhi, NCT", displayName: "Delhi", level: "city", coordinates: { type: "Point", coordinates: [77.1025, 28.7041] }, isActive: true, isPopular: true },
];

function formatLocationLine(primary: string, secondary?: string): { main: string; sub: string | null } {
    const trimmedPrimary = primary.trim();
    const trimmedSecondary = secondary?.trim() || "";

    if (!trimmedSecondary) {
        return { main: trimmedPrimary, sub: null };
    }

    // If primary already includes the secondary state (e.g. "Machaloddi, Telangana")
    if (trimmedPrimary.toLowerCase().endsWith(trimmedSecondary.toLowerCase())) {
        return { main: trimmedPrimary, sub: null };
    }

    return { main: trimmedPrimary, sub: `, ${trimmedSecondary}` };
}

export function LocationResultsList({
    query,
    showSkeleton,
    searchError,
    retryCount,
    locations,
    isSearching: _isSearching,
    selectedIndex,
    selectedCityName,
    onRetry,
    onSelect,
    getLocationPrimaryLabel,
    getLocationSecondaryLabel,
}: {
    query: string;
    showSkeleton: boolean;
    searchError: { message: string; retryable?: boolean } | null;
    retryCount: number;
    locations: Location[];
    isSearching?: boolean;
    selectedIndex: number;
    selectedCityName?: string;
    onRetry: () => void;
    onSelect: (loc: Location) => void;
    getLocationPrimaryLabel: (loc: Location) => string;
    getLocationSecondaryLabel: (loc: Location) => string;
}) {
    useEffect(() => {
        if (selectedIndex < 0) return;
        const optionId = query ? `location-option-${selectedIndex}` : `popular-option-${selectedIndex}`;
        const el = document.getElementById(optionId) || document.getElementById(`location-fallback-option-${selectedIndex}`);
        if (el) {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedIndex, query]);

    const isCurrentCity = (cityName?: string) => {
        if (!cityName || !selectedCityName) return false;
        return cityName.trim().toLowerCase() === selectedCityName.trim().toLowerCase();
    };

    return (
        <div className="py-1 space-y-1" role="listbox" id="location-results-listbox" aria-label="Location search results">
            {query.trim().length === 1 ? (
                <div className="p-3 text-center text-foreground-subtle text-caption">
                    Type at least 2 characters to search...
                </div>
            ) : query ? (
                showSkeleton ? (
                    <LocationSkeleton count={4} />
                ) : searchError ? (
                    <div className="p-3 text-center space-y-2">
                        <div className="flex justify-center">
                            <AlertCircle className="w-7 h-7 text-destructive/60" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-caption font-medium text-destructive">{searchError.message}</p>
                            {searchError.retryable && (
                                <p className="text-tiny text-muted-foreground">
                                    {retryCount > 0 && `Attempt ${retryCount} of 3`}
                                </p>
                            )}
                        </div>
                        {searchError.retryable && retryCount < 3 && (
                            <Button type="button" variant="outline" onClick={onRetry} className="gap-1.5 h-8 text-caption">
                                <RefreshCw className="w-3.5 h-3.5" /> Try Again
                            </Button>
                        )}
                        {locations.length > 0 && (
                            <div className="pt-2 border-t border-border/60">
                                <p className="text-tiny font-bold uppercase tracking-wider text-muted-foreground/80 px-3 mb-1">Cached results:</p>
                                <div className="space-y-1">
                                    {locations.slice(0, 3).map((loc, index) => {
                                        const isSelected = selectedIndex === index || isCurrentCity(loc.city || loc.name);
                                        const { main, sub } = formatLocationLine(
                                            getLocationPrimaryLabel(loc),
                                            getLocationSecondaryLabel(loc)
                                        );
                                        return (
                                            <button
                                                key={`fallback-${loc.id || index}`}
                                                id={`location-fallback-option-${index}`}
                                                role="option"
                                                aria-selected={isSelected}
                                                type="button"
                                                onClick={() => void onSelect(loc)}
                                                className={cn(
                                                    "flex items-center justify-between gap-2.5 w-full px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                                    isSelected ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted/80 active:bg-muted"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <MapPin className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                                                    <span className="min-w-0 flex-1 truncate text-caption font-semibold text-foreground">
                                                        {main}
                                                        {sub ? <span className="font-normal text-muted-foreground text-caption">{sub}</span> : null}
                                                    </span>
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : locations.length > 0 ? (
                    <div className="space-y-1">
                        <p className="text-tiny font-bold uppercase tracking-wider text-muted-foreground/80 px-3 pt-2 pb-0.5">Search Results</p>
                        {locations.slice(0, MAX_DROPDOWN_RESULTS).map((loc, index) => {
                            const isSelected = selectedIndex === index || isCurrentCity(loc.city || loc.name);
                            const { main, sub } = formatLocationLine(
                                getLocationPrimaryLabel(loc),
                                getLocationSecondaryLabel(loc)
                            );
                            return (
                                <button
                                    key={`loc-${loc.id || index}`}
                                    id={`location-option-${index}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    type="button"
                                    onClick={() => void onSelect(loc)}
                                    className={cn(
                                        "flex items-center justify-between gap-2.5 w-full px-3 py-2.5 text-left transition-colors rounded-lg cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                        isSelected ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted/80 active:bg-muted"
                                    )}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <MapPin className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                                        <span className="min-w-0 flex-1 truncate text-caption font-semibold text-foreground">
                                            {main}
                                            {sub ? <span className="font-normal text-muted-foreground text-caption">{sub}</span> : null}
                                        </span>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-4 text-center text-foreground-subtle text-caption">
                        No locations found.
                    </div>
                )
            ) : (
                <div className="space-y-1">
                    <p className="text-tiny font-bold uppercase tracking-wider text-muted-foreground/80 px-3 pt-2 pb-0.5">Popular Cities</p>
                    {POPULAR_CITIES.map((loc, index) => {
                        const isSelected = selectedIndex === index || isCurrentCity(loc.city || loc.name);
                        return (
                            <button
                                key={`popular-${loc.id}`}
                                id={`popular-option-${index}`}
                                role="option"
                                aria-selected={isSelected}
                                type="button"
                                onClick={() => void onSelect(loc)}
                                className={cn(
                                    "flex items-center justify-between gap-2.5 w-full px-3 py-2.5 text-left transition-colors rounded-lg cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                    isSelected ? "bg-primary/10 border border-primary/20 text-primary" : "hover:bg-muted/80 active:bg-muted"
                                )}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <MapPin className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-primary/70")} />
                                    <span className="min-w-0 flex-1 truncate text-caption font-semibold">
                                        <span className={isSelected ? "text-primary" : "text-foreground"}>{loc.name}</span>
                                        <span className="font-normal text-muted-foreground text-caption">, {loc.state}</span>
                                    </span>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
