import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Loader2, Target } from "@/icons/IconRegistry";

import { Button } from "@esparex/ui";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import logger from "@/lib/logger";
import {
    getCurrentLocationResult,
    normalizeLocationName,
} from "@/lib/location/locationService";
import { LocationFacade, toCanonicalGeoPoint as normalizeCoordinates } from "@esparex/shared";
import type { AppLocation, AppLocationSource } from "@/types/location";

import type { StepBaseProps } from "./types";

type StepAddressProps = StepBaseProps;

const asOptionalString = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value.trim();
};

const buildDetectedLocationDisplay = (location: AppLocation): string =>
    normalizeLocationName(
        LocationFacade.format(location) || "Current location",
    );

const getCurrentLocationSourceLabel = (source: AppLocationSource | ""): string => {
    if (source === "auto") return "GPS";
    if (source === "ip") return "IP";
    return "";
};

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
        currentLocationSource: detectedLocation.source || "auto",
        currentLocationCity: detectedLocation.city || previous.currentLocationCity,
        currentLocationState: detectedLocation.state || previous.currentLocationState,
        currentLocationPincode: detectedLocation.pincode || previous.currentLocationPincode,
        currentLocationCountry: detectedLocation.country || previous.currentLocationCountry,
        coordinates: normalizedCoordinates || null,
        isSnapped: detectedLocation.isSnapped,
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
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    value={value}
                    readOnly
                    placeholder={placeholder}
                    className="bg-slate-50 font-medium flex-1 h-11"
                    aria-invalid={Boolean(error)}
                />
                {fieldAction ? <div className="shrink-0">{fieldAction}</div> : null}
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

    const hasCurrentLocation = useMemo(
        () => Boolean(asOptionalString(formData.currentLocationDisplay) && formData.coordinates),
        [formData.coordinates, formData.currentLocationDisplay],
    );
    const currentLocationError = formData.errors?.currentLocationDisplay || formData.errors?.coordinates;
    const sourceLabel = getCurrentLocationSourceLabel(formData.currentLocationSource);

    // B4: Clear GPS feedback on unmount to prevent stale error on re-mount
    useEffect(() => {
        return () => {
            setDetectFeedback(null);
        };
    }, []);

    const handleDetectCurrentLocation = async () => {
        setIsDetectingLocation(true);
        setDetectFeedback(null);

        try {
            const detectionResult = await getCurrentLocationResult({
                allowApproximateFallback: false,
                enableHighAccuracy: true,
                maximumAgeMs: 0,
            });

            if (!detectionResult.location) {
                setDetectFeedback(detectionResult.failure?.message || "Use current location to continue.");
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
            <div className="grid gap-4 md:grid-cols-2">
                <CompactReadonlyField
                    id="reg-contact-number"
                    label="Business contact"
                    value={formData.mobile}
                    error={formData.errors?.mobile}
                    badge={(
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-tiny font-medium text-emerald-600">
                            Verified
                        </span>
                    )}
                />

                <CompactReadonlyField
                    id="reg-detected-location"
                    label="Detected location"
                    value={asOptionalString(formData.currentLocationDisplay)}
                    placeholder="No location detected yet"
                    error={currentLocationError}
                    badge={
                        hasCurrentLocation ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-tiny font-medium text-primary">
                                {sourceLabel || "GPS"} Recorded
                            </span>
                        ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-tiny font-medium text-foreground-subtle">
                                Required
                            </span>
                        )
                    }
                    fieldAction={(
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDetectCurrentLocation}
                            disabled={isDetectingLocation}
                            size="icon"
                            aria-label={isDetectingLocation ? "Detecting current location" : "Use current location"}
                            title={isDetectingLocation ? "Detecting current location" : "Use current location"}
                            className="h-11 w-11 rounded-xl border-border bg-card text-foreground hover:bg-muted"
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
                        <p className="text-tiny font-medium text-destructive">{detectFeedback}</p>
                    ) : null}
                </CompactReadonlyField>

                {asOptionalString(formData.currentLocationPincode) ? (
                  <CompactReadonlyField
                      id="reg-detected-pincode"
                      label="Detected pincode"
                      value={asOptionalString(formData.currentLocationPincode)}
                      placeholder="—"
                      error={formData.errors?.currentLocationPincode}
                  />
                ) : null}
            </div>

            {hasCurrentLocation ? (
                <Field
                    label="Full address"
                    required
                    error={formData.errors?.address}
                    headerExtra={
                        <span className={`shrink-0 text-xs font-medium ${formData.address.length >= 300 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {formData.address.length}/300
                        </span>
                    }
                    className="space-y-1"
                >
                    <Textarea
                        id="reg-full-address"
                        value={formData.address}
                        onChange={(event) =>
                            setFormData({
                                ...formData,
                                address: event.target.value.slice(0, 300),
                            })
                        }
                        placeholder="e.g. Shop 4, MG Road, Near Old Bus Stand, Guntur, Andhra Pradesh 522413"
                        maxLength={300}
                        rows={2}
                        className="min-h-[64px] text-body-lg md:text-body"
                        aria-invalid={Boolean(formData.errors?.address)}
                    />
                </Field>
            ) : null}
        </div>
    );
}
