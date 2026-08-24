"use client";

import React from "react";
import { Loader2, MapPin, Search } from "@esparex/ui";
import { useBusinessLocationSearch } from "./useBusinessLocationSearch";
import {
  type BusinessModifyFormState,
  formatLocationLabel,
} from "./businessModifyTypes";

export type { BusinessModifyFormState };
export { formatLocationLabel };

interface BusinessModifyLocationSectionProps {
  form: BusinessModifyFormState;
  setForm: React.Dispatch<React.SetStateAction<BusinessModifyFormState>>;
  loading: boolean;
  setError: (err: string) => void;
  renderField: (key: Exclude<keyof BusinessModifyFormState, "coordinates">, label: string) => React.ReactNode;
  initialDisplay?: string;
}

export function BusinessModifyLocationSection({
  form,
  setForm,
  loading,
  setError,
  renderField,
  initialDisplay,
}: BusinessModifyLocationSectionProps) {
  const {
    locationQuery,
    setLocationQuery,
    locationResults,
    locationSearchLoading,
    locationSearchError,
    selectedLocationLabel,
    detecting,
    handleCanonicalLocationSelect,
    handleDetectLocation,
  } = useBusinessLocationSearch({
    form,
    setForm,
    setError,
    initialDisplay,
  });

  return (
    <section className="space-y-3">
      <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-widest flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <MapPin size={12} /> Location
        </span>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detecting || loading}
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 normal-case font-semibold h-6 px-2 rounded-md hover:bg-primary/5 cursor-pointer text-caption"
        >
          {detecting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <MapPin size={12} />
          )}
          {detecting ? "Detecting..." : "Detect Current Location"}
        </button>
      </p>
      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-caption font-bold uppercase tracking-wider text-foreground-tertiary">
            Canonical location
          </p>
          <p className="text-caption text-foreground-secondary">
            Search an active city, district, village, or area to repair the verified location link and map coordinates.
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            disabled={loading}
            placeholder="Search active city or area"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-10 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {locationSearchLoading ? (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground-subtle" />
          ) : null}
        </div>
        {selectedLocationLabel ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-caption text-emerald-900">
            Linked to: <span className="font-semibold">{selectedLocationLabel}</span>
          </div>
        ) : null}
        {locationSearchError ? (
          <p className="text-caption text-destructive">{locationSearchError}</p>
        ) : null}
        {locationResults.length > 0 ? (
          <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border bg-card p-2">
            {locationResults.map((location) => (
              <button
                key={location.locationId || location.id}
                type="button"
                disabled={loading}
                onClick={() => handleCanonicalLocationSelect(location)}
                className="w-full rounded-lg border border-transparent px-3 py-2 text-left transition-all hover:border-primary/20 hover:bg-muted cursor-pointer"
              >
                <p className="text-body font-semibold text-foreground">
                  {formatLocationLabel(location)}
                </p>
                <p className="mt-1 text-tiny uppercase tracking-wide text-foreground-tertiary">
                  {location.level}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {renderField("shopNo", "Shop / Unit")}
        {renderField("street", "Street / Area")}
        {renderField("landmark", "Landmark")}
        {renderField("address", "Address Summary")}
        {renderField("city", "City")}
        {renderField("state", "State")}
        {renderField("pincode", "Pincode")}
      </div>
    </section>
  );
}
