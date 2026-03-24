"use client";

import { useMemo } from "react";
import { useLocationState } from "@/context/LocationContext";
import LocationSelector from "@/components/location/LocationSelector";
import type { Location } from "@/api/user/locations";
import { cn } from "@/components/ui/utils";


type LocationTabProps = {
  onSaveLocation?: (location: Location) => void;
  defaultLocation?: Location | null;
  showAsTab?: boolean;
};

export function LocationTab({
  onSaveLocation,
  defaultLocation = null,
  showAsTab = true,
}: LocationTabProps) {
  const { location: appLocation } = useLocationState();

  const contextLocation = useMemo(() => {
    if (!appLocation?.city || appLocation.source === 'default') return null;
    const fallbackId = `manual-${appLocation.city.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      id: appLocation.locationId ?? appLocation.id ?? fallbackId,
      slug: appLocation.locationId ?? appLocation.id ?? fallbackId,
      name: appLocation.name || appLocation.city,
      display: appLocation.formattedAddress || appLocation.display || appLocation.city,
      city: appLocation.city,
      state: appLocation.state || appLocation.city,
      country: appLocation.country || 'Unknown',
      level: appLocation.level || 'city',
      coordinates: appLocation.coordinates,
      isActive: true,
      isPopular: false,
    } as unknown as Location;
  }, [appLocation]);

  const selected = contextLocation || defaultLocation || null;

  const handleLocationSelect = (loc: Location | null) => {
    if (!loc) return;
    onSaveLocation?.(loc);
  };

  return (
    <div className={cn("space-y-3", showAsTab && "max-w-2xl mx-auto")}>
      {showAsTab && (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Choose Your Location</h2>
          <p className="text-sm text-muted-foreground">
            Detect your location or search and select manually.
          </p>
        </div>
      )}

      <LocationSelector variant="inline"
        currentDisplay={selected?.display || selected?.name || undefined}
        onLocationSelect={handleLocationSelect}
      />

      {selected?.display && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selected.display}</span>
        </p>
      )}
    </div>
  );
}
