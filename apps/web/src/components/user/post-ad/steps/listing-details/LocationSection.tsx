"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdLocationState, usePostAdFlow, usePostAdAction } from "../../context";
import { useLocationData } from "@/context/LocationContext";
import { Field } from "@/components/ui/field";
import type { Location } from "@/lib/api/user/locations";
import LocationSelector from "@/components/location/LocationSelector";
import { adaptLocationInput } from "@shared";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { getNestedFieldMeta } from "../common/utils";
import { getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";

type SnappedLocation = Location & { formattedAddress?: string; isSnapped?: boolean };

const buildLocationValue = (adapted: ReturnType<typeof adaptLocationInput>): NonNullable<PostAdFormData["location"]> => ({
    city: adapted?.city || "",
    state: adapted?.state,
    display: adapted?.display || "",
    locationId: adapted?.locationId,
    coordinates: adapted?.coordinates,
});

export function LocationSection() {
    const { setValue, setError } = useFormContext<PostAdFormData>();
    const { isLocationLocked } = usePostAdLocationState();
    const { form, stepValidationAttempts } = usePostAdFlow();
    const { setLocation: setContextLocation } = usePostAdAction();

    const locationVal = useWatch({ name: "location" });
    const { location } = useLocationData();
    const [userHasInteracted, setUserHasInteracted] = useState(false);

    const {
        city: locCity,
        state: locState,
        coordinates: locCoordinates,
        formattedAddress: locFormattedAddress,
        name: locName,
        locationId: locLocationId,
        isSnapped: locIsSnapped,
    } = (location ?? {}) as Partial<SnappedLocation>;

    const hasSyncedRef = useRef(false);

    const handleSelectLocation = useCallback((loc: Location | null) => {
        if (!loc) {
            setValue("location", {}, {
                shouldValidate: false,
                shouldDirty: true,
                shouldTouch: true
            });
            setContextLocation("", null, {});
            setUserHasInteracted(false);
            return;
        }
        if (!loc.coordinates) return;

        if (!loc.state?.trim()) {
            setError("location.display", {
                type: "manual",
                message: "This area is missing region/state data. Please search for a nearby city or area."
            });
            return;
        }

        setUserHasInteracted(true);
        const adapted = adaptLocationInput(loc);
        
        if (!adapted || !adapted.coordinates) {
            setError("location.display", {
                type: "manual",
                message: "Valid location with coordinates is required."
            });
            return;
        }

        setContextLocation(adapted.display, adapted.coordinates, {
            city: adapted.city,
            state: adapted.state,
            id: adapted.locationId
        });

        setValue("location", buildLocationValue(adapted), {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [setContextLocation, setValue, setError]);

    useEffect(() => {
        if (userHasInteracted) return;
        if (hasSyncedRef.current) return;
        if (!locCity || !locCoordinates || !locState?.trim()) return;

        hasSyncedRef.current = true;

        const adapted = adaptLocationInput({
            city: locCity,
            state: locState,
            coordinates: locCoordinates,
            formattedAddress: locFormattedAddress,
            name: locName,
            locationId: locLocationId,
            isSnapped: locIsSnapped,
            display: locFormattedAddress || (locState ? `${locName || locCity}, ${locState}` : locName || locCity) || ""
        });

        if (!adapted) return;

        setContextLocation(adapted.display, adapted.coordinates!, {
            city: adapted.city,
            state: adapted.state,
            id: adapted.locationId,
        });

        setValue(
            "location",
            buildLocationValue(adapted),
            { shouldValidate: true, shouldDirty: false }
        );
    }, [
        locCity,
        locState,
        locCoordinates,
        locFormattedAddress,
        locName,
        locLocationId,
        locIsSnapped,
        setContextLocation,
        setValue,
        userHasInteracted,
    ]);

    const { touchedFields, errors, submitCount } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[2]);
    const hasAttemptedSubmit = submitCount > 0;

    const shouldShowFieldError = useCallback((path: string) => {
        if (hasAttemptedSubmit || hasAttemptedStepValidation) return true;
        return Boolean(getNestedFieldMeta(touchedFields, path));
    }, [hasAttemptedStepValidation, hasAttemptedSubmit, touchedFields]);

    const locationError = shouldShowFieldError("location") ? getFirstFormErrorMessage(errors.location) : undefined;

    return (
        <section className="space-y-4">
            <Field label="Where are you located?" required error={locationError as string}>
                <div className="space-y-3">
                    <LocationSelector
                        variant="inline"
                        mode="postAd"
                        onLocationSelect={handleSelectLocation}
                        currentDisplay={locationVal?.display}
                        className="h-14 font-bold rounded-2xl border-2"
                        disabled={isLocationLocked}
                    />
                    {isLocationLocked ? (
                        <p className="text-xs text-amber-600 text-center font-medium">
                            Location cannot be changed once an ad is live or under review.
                        </p>
                    ) : (
                        <p className="text-xs text-foreground-subtle text-center font-medium">Use GPS auto-detect or search manually for your city.</p>
                    )}
                </div>
            </Field>
        </section>
    );
}
