"use client";

import { AlertCircle, MapPin, RefreshCw } from "@/icons/IconRegistry";
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

export function LocationResultsList({
    query,
    showSkeleton,
    searchError,
    retryCount,
    locations,
    isSearching,
    selectedIndex,
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
    isSearching: boolean;
    selectedIndex: number;
    onRetry: () => void;
    onSelect: (loc: Location) => void;
    getLocationPrimaryLabel: (loc: Location) => string;
    getLocationSecondaryLabel: (loc: Location) => string;
}) {
    return (
        <div className="py-0.5" role="listbox" id="location-results-listbox" aria-label="Location search results">
            {query ? (
                showSkeleton ? (
                    <LocationSkeleton count={4} />
                ) : searchError ? (
                    <div className="p-3 text-center space-y-2">
                        <div className="flex justify-center">
                            <AlertCircle className="w-7 h-7 text-destructive/60" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs font-medium text-destructive">{searchError.message}</p>
                            {searchError.retryable && (
                                <p className="text-tiny text-muted-foreground">
                                    {retryCount > 0 && `Attempt ${retryCount} of 3`}
                                </p>
                            )}
                        </div>
                        {searchError.retryable && retryCount < 3 && (
                            <Button type="button" variant="outline" onClick={onRetry} className="gap-1.5 h-8 text-xs">
                                <RefreshCw className="w-3.5 h-3.5" /> Try Again
                            </Button>
                        )}
                        {locations.length > 0 && (
                            <div className="pt-2 border-t">
                                <p className="text-tiny text-muted-foreground mb-1">Cached results:</p>
                                <div className="space-y-0.5">
                                    {locations.slice(0, 3).map((loc, index) => (
                                        <button
                                            key={`fallback-${loc.id || index}`}
                                            id={`location-fallback-option-${index}`}
                                            role="option"
                                            aria-selected={selectedIndex === index}
                                            type="button"
                                            onClick={() => void onSelect(loc)}
                                            className="flex items-start gap-2 w-full px-3 py-2 rounded-xl hover:bg-accent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer select-none"
                                        >
                                            <MapPin className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block truncate text-xs font-medium text-foreground">
                                                    {getLocationPrimaryLabel(loc)}
                                                </span>
                                                <span className="block truncate text-tiny text-muted-foreground">
                                                    {getLocationSecondaryLabel(loc)}
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : locations.length > 0 ? (
                    locations.slice(0, MAX_DROPDOWN_RESULTS).map((loc, index) => {
                        return (
                                <button
                                    key={`loc-${loc.id || index}`}
                                    id={`location-option-${index}`}
                                    role="option"
                                    aria-selected={selectedIndex === index}
                                    type="button"
                                    onClick={() => void onSelect(loc)}
                                    className={cn(
                                        "flex items-start gap-2 w-full px-3 py-2.5 text-left transition-colors rounded-xl",
                                        "hover:bg-accent cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                        selectedIndex === index && "bg-accent"
                                    )}
                                >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-semibold text-foreground">
                                        {getLocationPrimaryLabel(loc)}
                                    </span>
                                    <span className="block truncate text-tiny text-muted-foreground">
                                        {getLocationSecondaryLabel(loc)}
                                    </span>
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                        {isSearching ? "Searching..." : "No locations found."}
                    </div>
                )
            ) : (
                <div className="space-y-1">
                    <p className="text-tiny font-medium text-muted-foreground px-2 py-1">Popular Cities</p>
                    {POPULAR_CITIES.map((loc, index) => (
                        <button
                            key={`popular-${loc.id}`}
                            id={`popular-option-${index}`}
                            role="option"
                            aria-selected={selectedIndex === index}
                            type="button"
                            onClick={() => void onSelect(loc)}
                            className={cn(
                                "flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors rounded-xl hover:bg-accent cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                selectedIndex === index && "bg-accent"
                            )}
                        >
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-foreground">
                                    {loc.name}
                                </span>
                                <span className="block truncate text-tiny text-muted-foreground">
                                    {loc.state}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
