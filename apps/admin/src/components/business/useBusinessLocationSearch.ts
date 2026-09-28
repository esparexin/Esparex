"use client";

import { useState, useEffect } from "react";
import { LIFECYCLE_STATUS } from "@esparex/contracts";
import { AdminApiError } from "@/lib/api/adminClient";
import { getLocationOptions } from "@/lib/api/locations";
import type { Location } from "@/types/location";
import {
  type BusinessModifyFormState,
  formatLocationLabel,
} from "./businessModifyTypes";

interface UseBusinessLocationSearchParams {
  form: BusinessModifyFormState;
  setForm: React.Dispatch<React.SetStateAction<BusinessModifyFormState>>;
  setError: (err: string) => void;
  initialDisplay?: string;
}

export function useBusinessLocationSearch({
  form,
  setForm,
  setError,
  initialDisplay,
}: UseBusinessLocationSearchParams) {
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<Location[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState("");
  const [selectedLocationLabel, setSelectedLocationLabel] = useState(
    form.locationId
      ? formatLocationLabel({
          display: initialDisplay,
          city: form.city,
          state: form.state,
        })
      : ""
  );

  useEffect(() => {
    if (form.pincode) return;
    const match = form.address.match(/\b\d{6}\b/);
    if (match) {
      void (async () => {
        setForm((f) => ({ ...f, pincode: match[0] }));
      })();
    }
  }, [form.address, form.pincode, setForm]);

  useEffect(() => {
    const parts = [form.shopNo, form.street, form.landmark, form.city].filter(Boolean);
    if (parts.length > 0 && !form.address) {
      void (async () => {
        setForm((f) => ({ ...f, address: parts.join(", ") }));
      })();
    }
  }, [form.shopNo, form.street, form.landmark, form.city, form.address, setForm]);

  useEffect(() => {
    const nextQuery = locationQuery.trim();
    if (nextQuery.length < 2) {
      void (async () => {
        setLocationResults([]);
        setLocationSearchLoading(false);
        setLocationSearchError("");
      })();
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLocationSearchLoading(true);
      setLocationSearchError("");
      try {
        const nextResults = await getLocationOptions({
          search: nextQuery,
          status: LIFECYCLE_STATUS.ACTIVE,
          limit: 8,
        });

        if (!active) return;
        setLocationResults(
          nextResults.filter((loc) => loc.level !== "country" && loc.level !== "state")
        );
      } catch (searchError) {
        if (!active) return;
        setLocationResults([]);
        setLocationSearchError(
          AdminApiError.resolveMessage(searchError, "Failed to search active locations")
        );
      } finally {
        if (active) setLocationSearchLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locationQuery]);

  const handleCanonicalLocationSelect = (location: Location) => {
    setForm((prev) => ({
      ...prev,
      locationId: location.locationId || location.id,
      coordinates: location.coordinates ?? null,
      city: location.city || location.name || prev.city,
      state: location.state || prev.state,
      pincode: location.pincode || prev.pincode,
    }));
    setSelectedLocationLabel(formatLocationLabel(location));
    setLocationQuery("");
    setLocationResults([]);
    setLocationSearchError("");
  };

  return {
    locationQuery,
    setLocationQuery,
    locationResults,
    locationSearchLoading,
    locationSearchError,
    selectedLocationLabel,
    handleCanonicalLocationSelect,
  };
}
