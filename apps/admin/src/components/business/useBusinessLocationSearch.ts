"use client";

import { useState, useEffect } from "react";
import { CHAT_STATUS } from "@esparex/contracts";
import { AdminApiError } from "@/lib/api/adminClient";
import { getLocationOptions, reverseGeocode } from "@/lib/api/locations";
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
  const [detecting, setDetecting] = useState(false);

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
          status: CHAT_STATUS.ACTIVE,
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const coords = { type: "Point" as const, coordinates: [longitude, latitude] as [number, number] };
          const match = await reverseGeocode(latitude, longitude);

          setForm((f) => ({
            ...f,
            coordinates: coords,
            city: match?.city || f.city,
            state: match?.state || f.state,
            pincode: match?.pincode || f.pincode,
            locationId: match?.locationId || match?.id || f.locationId,
          }));

          if (match) setSelectedLocationLabel(formatLocationLabel(match));
          setDetecting(false);
        } catch {
          setError("Failed to resolve address from your position.");
          setDetecting(false);
        }
      },
      (err) => {
        setError(`Location access denied or failed: ${err.message}`);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return {
    locationQuery,
    setLocationQuery,
    locationResults,
    locationSearchLoading,
    locationSearchError,
    selectedLocationLabel,
    detecting,
    handleCanonicalLocationSelect,
    handleDetectLocation,
  };
}
