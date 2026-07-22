"use client";

import { AlertCircle, MapPin, RefreshCw } from "lucide-react";
import type { Location } from "@/lib/api/user/locations";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import LocationSkeleton from "../LocationSkeleton";
import { MAX_DROPDOWN_RESULTS } from "../locationSelectorCore.helpers";

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
        <div className="py-0.5">
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
                                <p className="text-[11px] text-muted-foreground">
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
                                <p className="text-[11px] text-muted-foreground mb-1">Cached results:</p>
                                <div className="space-y-0.5">
                                    {locations.slice(0, 3).map((loc, index) => (
                                        <button
                                            key={`fallback-${loc.id || index}`}
                                            onMouseDown={(e) => { e.preventDefault(); void onSelect(loc); }}
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
                ) : locations.length > 0 ? (
                    locations.slice(0, MAX_DROPDOWN_RESULTS).map((loc, index) => {
                        return (
                            <button
                                key={`loc-${loc.id || index}`}
                                onMouseDown={(e) => { e.preventDefault(); void onSelect(loc); }}
                                className={cn(
                                    "flex items-start gap-2 w-full px-3 py-2.5 text-left transition-colors rounded-xl",
                                    "hover:bg-accent cursor-pointer",
                                    selectedIndex === index && "bg-accent"
                                )}
                            >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-semibold text-foreground">
                                        {getLocationPrimaryLabel(loc)}
                                    </span>
                                    <span className="block truncate text-[11px] text-muted-foreground">
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
                <div className="p-4 text-center text-muted-foreground text-xs">
                    Type to search city, area, district or state.
                </div>
            )}
        </div>
    );
}
