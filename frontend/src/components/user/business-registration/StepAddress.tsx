import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logger from "@/lib/logger";
import {
    getCurrentLocationResult,
    normalizeLocationName,
    reverseGeocode,
} from "@/lib/location/locationService";
import { normalizeCoordinates } from "@/lib/location/utils";
import type { AppLocation } from "@/types/location";

import type { StepBaseProps } from "./types";

interface StepAddressProps extends StepBaseProps {}

const asOptionalString = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value.trim();
};

const buildDetectedLocationDisplay = (location: AppLocation): string =>
    normalizeLocationName(
        location.display
        || location.formattedAddress
        || [location.city, location.state].filter(Boolean).join(", ")
        || "Current location",
    );

const getCurrentLocationSourceLabel = (source: "auto" | ""): string => {
    if (source === "auto") return "GPS";
    return "";
};

const isGenericCapturedLocation = (display: string): boolean =>
    ["current location", "current location captured", "approximate current location"].includes(display.toLowerCase());

export const applyDetectedCurrentLocation = ({
    detectedLocation,
    setFormData,
}: {
    detectedLocation: AppLocation;
    setFormData: StepAddressProps["setFormData"];
}) => {
    const normalizedCoordinates = normalizeCoordinates(detectedLocation.coordinates);
    const display = buildDetectedLocationDisplay(detectedLocation);

    setFormData((previous) => ({
        ...previous,
        currentLocationDisplay: display,
        currentLocationSource: "auto",
        currentLocationCity: detectedLocation.city || previous.currentLocationCity,
        currentLocationState: detectedLocation.state || previous.currentLocationState,
        currentLocationPincode: detectedLocation.pincode || previous.currentLocationPincode,
        currentLocationCountry: detectedLocation.country || previous.currentLocationCountry,
        coordinates: normalizedCoordinates || null,
    }));
};

function CompactReadonlyField({
    id,
    label,
    value,
    placeholder,
    helperText,
    error,
    badge,
    fieldAction,
    children,
}: {
    id: string;
    label: string;
    value: string;
    placeholder?: string;
    helperText?: string;
    error?: string;
    badge?: ReactNode;
    fieldAction?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium leading-snug text-foreground-secondary" htmlFor={id}>
                    {label}
                </label>
                {badge}
            </div>
            {helperText ? <p className="text-xs leading-5 text-muted-foreground">{helperText}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                    id={id}
                    value={value}
                    readOnly
                    placeholder={placeholder}
                    className="bg-slate-50 font-medium sm:flex-1"
                    aria-invalid={Boolean(error)}
                />
                {fieldAction ? <div className="sm:shrink-0">{fieldAction}</div> : null}
            </div>
            {children}
            <FormError message={error} className="text-xs font-medium text-destructive" />
        </div>
    );
}

export function StepAddress({
    formData,
    setFormData,
}: StepAddressProps) {
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [detectFeedback, setDetectFeedback] = useState<string | null>(null);
    const refreshedGenericLocationKeyRef = useRef<string | null>(null);

    const hasCurrentLocation = useMemo(
        () => Boolean(asOptionalString(formData.currentLocationDisplay) && formData.coordinates),
        [formData.coordinates, formData.currentLocationDisplay],
    );
    const currentLocationError = formData.errors?.currentLocationDisplay || formData.errors?.coordinates;
    const sourceLabel = getCurrentLocationSourceLabel(formData.currentLocationSource);
    const normalizedDetectedDisplay = asOptionalString(formData.currentLocationDisplay);
    const normalizedDetectedCoordinates = useMemo(
        () => normalizeCoordinates(formData.coordinates),
        [formData.coordinates],
    );
    const detectedLocationSignature = normalizedDetectedCoordinates
        ? `${normalizedDetectedCoordinates.coordinates[0]}:${normalizedDetectedCoordinates.coordinates[1]}`
        : "";

    useEffect(() => {
        if (
            !normalizedDetectedCoordinates
            || !normalizedDetectedDisplay
            || !isGenericCapturedLocation(normalizedDetectedDisplay)
        ) {
            refreshedGenericLocationKeyRef.current = null;
            return;
        }

        if (refreshedGenericLocationKeyRef.current === detectedLocationSignature) {
            return;
        }

        refreshedGenericLocationKeyRef.current = detectedLocationSignature;
        let cancelled = false;

        void (async () => {
            try {
                const refreshedLocation = await reverseGeocode(
                    normalizedDetectedCoordinates.coordinates[1],
                    normalizedDetectedCoordinates.coordinates[0],
                );
                if (!refreshedLocation || cancelled) {
                    return;
                }

                const refreshedDisplay = buildDetectedLocationDisplay(refreshedLocation);
                if (!refreshedDisplay || isGenericCapturedLocation(refreshedDisplay)) {
                    return;
                }

                applyDetectedCurrentLocation({
                    detectedLocation: {
                        ...refreshedLocation,
                        source: "auto",
                    },
                    setFormData,
                });
            } catch (error) {
                logger.warn("Failed to refresh generic detected location label", error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        detectedLocationSignature,
        formData.currentLocationSource,
        normalizedDetectedCoordinates,
        normalizedDetectedDisplay,
        setFormData,
    ]);

    // B4: Clear GPS feedback on unmount to prevent stale error on re-mount
    useEffect(() => {
        return () => {
            setDetectFeedback(null);
        };
    }, []);

    const handleDetectCurrentLocation = async () => {
        setIsDetectingLocation(true);
        setDetectFeedback(null);
        refreshedGenericLocationKeyRef.current = null;

        try {
            const detectionResult = await getCurrentLocationResult({
                mode: "precise",
            });

            if (!detectionResult.location) {
                // B4: Map known GPS failure reasons to user-friendly messages
                const failureReason = detectionResult.failure?.reason;
                let feedbackMsg: string;
                if (failureReason === "permission_denied") {
                    feedbackMsg = "Location permission was denied. Please allow location access in your browser or device settings and try again.";
                } else if (failureReason === "position_unavailable") {
                    feedbackMsg = "Your location could not be determined. Make sure GPS is enabled on your device.";
                } else if (failureReason === "timeout") {
                    feedbackMsg = "Location detection timed out. You may be in a low-signal area — try moving to an open space and retry.";
                } else if (failureReason === "insecure_context" || failureReason === "unsupported") {
                    feedbackMsg = "Location is not supported in this browser or connection. Try using Chrome or Safari over HTTPS.";
                } else {
                    feedbackMsg = detectionResult.failure?.message || "Use current location to continue.";
                }
                setDetectFeedback(feedbackMsg);
                return;
            }

            const normalizedCoordinates = normalizeCoordinates(detectionResult.location.coordinates);
            if (!normalizedCoordinates) {
                setDetectFeedback("We found your location, but could not save the coordinates. Try again.");
                return;
            }

            applyDetectedCurrentLocation({
                detectedLocation: detectionResult.location,
                setFormData,
            });
        } catch (error) {
            logger.error("Current location detection failed", error);
            setDetectFeedback("We couldn't detect your current location right now. Please try again.");
        } finally {
            setIsDetectingLocation(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
                <CompactReadonlyField
                    id="reg-contact-number"
                    label="Business contact"
                    value={formData.contactNumber}
                    helperText="Uses your verified account mobile number."
                    error={formData.errors?.contactNumber}
                    badge={(
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Verified
                        </span>
                    )}
                />

                <CompactReadonlyField
                    id="reg-detected-location"
                    label="Detected location"
                    value={asOptionalString(formData.currentLocationDisplay)}
                    placeholder="No location detected yet"
                    helperText={
                        hasCurrentLocation
                            ? isGenericCapturedLocation(normalizedDetectedDisplay)
                                ? "Current coordinates recorded. Our location database could not name this spot yet, but you can continue with the full address."
                                : "GPS location recorded. This proof is required for business registration."
                            : "Required. Tap the location button to record your current GPS position."
                    }
                    error={currentLocationError}
                    badge={(
                        <>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                                Required
                            </span>
                            {sourceLabel ? (
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-link-dark">
                                    {sourceLabel}
                                </span>
                            ) : null}
                        </>
                    )}
                    fieldAction={(
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDetectCurrentLocation}
                            disabled={isDetectingLocation}
                            size="icon"
                            aria-label={isDetectingLocation ? "Detecting current location" : "Use current location"}
                            title={isDetectingLocation ? "Detecting current location" : "Use current location"}
                            className="h-9 w-9 rounded-xl border-slate-300 bg-white text-foreground hover:bg-slate-100"
                        >
                            {isDetectingLocation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Target className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                >
                    {detectFeedback ? (
                        <p className="text-xs font-medium text-red-600">{detectFeedback}</p>
                    ) : null}
                </CompactReadonlyField>

                {asOptionalString(formData.currentLocationPincode) ? (
                  <CompactReadonlyField
                      id="reg-detected-pincode"
                      label="Detected pincode"
                      value={asOptionalString(formData.currentLocationPincode)}
                      placeholder="—"
                      helperText="Auto-resolved from your GPS position."
                      error={formData.errors?.currentLocationPincode}
                      badge={(
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-link-dark">
                              Auto-filled
                          </span>
                      )}
                  />
                ) : null}
            </div>

            {hasCurrentLocation ? (
                <Field
                    label="Full address"
                    required
                    error={formData.errors?.fullAddress}
                    className="space-y-1.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs leading-5 text-muted-foreground">
                            Include shop/building name, street/area, pincode, and landmark.
                        </span>
                        <span className={`shrink-0 ml-3 text-xs font-medium ${formData.fullAddress.length >= 300 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {formData.fullAddress.length}/300
                        </span>
                    </div>
                    <Textarea
                        id="reg-full-address"
                        value={formData.fullAddress}
                        onChange={(event) =>
                            setFormData({
                                ...formData,
                                fullAddress: event.target.value.slice(0, 300),
                            })
                        }
                        placeholder="e.g. Shop 4, MG Road, Near Old Bus Stand, Guntur, Andhra Pradesh 522413"
                        maxLength={300}
                        rows={4}
                        aria-invalid={Boolean(formData.errors?.fullAddress)}
                    />
                </Field>
            ) : null}
        </div>
    );
}
