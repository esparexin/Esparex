"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePostAd } from "../PostAdContext";
import { useFormContext } from "react-hook-form";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Location } from "@/lib/api/user/locations";

import { X, Upload, Loader2 } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";

import { resolveCanonicalLocationId } from "@shared/listingUtils/locationUtils";
import { useLocationState } from "@/context/LocationContext";

import LocationSelector from "@/components/location/LocationSelector";
import { getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";
import { MAX_AD_IMAGES, MAX_AD_DESCRIPTION_CHARS, MAX_AD_TITLE_CHARS } from "@shared/constants/adLimits";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";

const getNestedFieldMeta = (source: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, source);

export default function ListingDetailsFields() {
    const {
        register,
        setValue,
        setError,
        watch,
        trigger,
        formState: { errors, touchedFields, submitCount },
    } = useFormContext<PostAdFormData>();

    const {
        generateDescription,
        isLoading,
        isUploadingImages,
        addImages,
        removeImage,
        listingImages,
        setLocation: setContextLocation,
        isLocationLocked,
        stepValidationAttempts,
    } = usePostAd();

    // Watch values for UI logic
    const isFree = watch("isFree");

    const { location: globalLocation } = useLocationState();
    const [userHasInteracted, setUserHasInteracted] = useState(false);

    // Extracted primitives — breaking the object-reference dependency that caused
    // the infinite render loop. Each value here is a scalar (string / stable ref);
    // the effect below therefore only re-fires when data actually changes.
    const {
        city: locCity,
        state: locState,
        coordinates: locCoordinates,
        formattedAddress: locFormattedAddress,
        name: locName,
        locationId: locLocationId,
    } = globalLocation ?? {};

    // One-shot guard: ensures the auto-sync runs at most once per component
    // lifetime even if the primitives above happen to produce a new identity.
    const hasSyncedRef = useRef(false);

    const handleSelectLocation = useCallback((loc: Location | null) => {
        // Clear path — called when user clicks "Change" in LocationSelector
        if (!loc) {
            setValue("location", undefined as any, { shouldValidate: false, shouldDirty: true, shouldTouch: true });
            setContextLocation("", undefined as any, {});
            setUserHasInteracted(false);
            return;
        }
        if (!loc.coordinates) return;

        // Guard: locations without state data cannot pass schema superRefine.
        // Surface an inline error immediately rather than failing silently at submit.
        if (!loc.state?.trim()) {
            setError("location.display" as any, {
                type: "manual",
                message: "This area is missing region/state data. Please search for a nearby city or area."
            });
            return;
        }

        setUserHasInteracted(true);
        const geo = loc.coordinates;
        const canonicalLocationId = resolveCanonicalLocationId(loc);
        
        setContextLocation(loc.display || loc.name || loc.city || "", geo as any, { 
            city: loc.city || loc.name, 
            state: loc.state, 
            id: canonicalLocationId 
        });
        
        setValue("location", { 
            city: loc.city || loc.name || "", 
            state: loc.state,
            display: loc.display || loc.name || "", 
            locationId: canonicalLocationId as any, 
            coordinates: geo as any 
        }, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [setContextLocation, setValue, setError]);

    useEffect(() => {
        // Guard 1: user manually picked a location — do not overwrite their choice.
        if (userHasInteracted) return;
        // Guard 2: one-shot — prevent any possibility of re-running after first sync.
        if (hasSyncedRef.current) return;
        // Guard 3: only sync when GPS/context has a complete, valid location.
        if (!locCity || !locCoordinates || !locState?.trim()) return;

        hasSyncedRef.current = true;

        const display =
            locFormattedAddress ||
            (locState ? `${locName || locCity}, ${locState}` : locName || locCity) ||
            "";
        const canonicalLocationId = resolveCanonicalLocationId({
            city: locCity,
            state: locState,
            locationId: locLocationId,
        } as any);

        setContextLocation(display, locCoordinates as any, {
            city: locCity || "",
            state: locState,
            id: canonicalLocationId,
        });

        setValue(
            "location",
            {
                city: locCity || "",
                state: locState,
                display,
                locationId: canonicalLocationId as any,
                coordinates: locCoordinates as any,
            },
            { shouldValidate: true, shouldDirty: false }
        );
    }, [
        // ✅ All scalar primitives — no object-reference churn.
        // ❌ Never put globalLocation (full object) here; it causes infinite loops.
        locCity,
        locState,
        locCoordinates,
        locFormattedAddress,
        locName,
        locLocationId,
        setContextLocation,
        setValue,
        userHasInteracted,
    ]);

    const locationVal = watch("location");
    const hasAttemptedSubmit = submitCount > 0;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[2]);
    const shouldShowFieldError = useCallback(
        (path: string) => {
            if (hasAttemptedSubmit || hasAttemptedStepValidation) return true;
            return Boolean(getNestedFieldMeta(touchedFields, path));
        },
        [hasAttemptedStepValidation, hasAttemptedSubmit, touchedFields]
    );

    const titleError = shouldShowFieldError("title") ? errors.title?.message : undefined;
    const descriptionError = shouldShowFieldError("description") ? errors.description?.message : undefined;
    const imagesError = shouldShowFieldError("images") ? getFirstFormErrorMessage(errors.images) : undefined;
    const locationError = shouldShowFieldError("location") ? getFirstFormErrorMessage(errors.location) : undefined;
    const priceError = shouldShowFieldError("price") ? errors.price?.message : undefined;

    return (
        <div className="space-y-6" data-testid="listing-details-fields">
            {/* Ad Title */}
            <section className="space-y-4">
                <Field label="Choose a catchy title" error={titleError}>
                    <div className="space-y-3">
                        <div className="relative">
                            <Input
                                {...register("title")}
                                placeholder="e.g. iPhone 13 Pro - Screen issue"
                                maxLength={MAX_AD_TITLE_CHARS}
                                className="h-14 rounded-xl border-2 border-slate-100 focus:border-primary font-bold text-base pr-20"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => generateDescription('title')}
                                disabled={isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-11 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-semibold"
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "AI Suggest"}
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <span className={cn(
                                "text-xs font-bold tracking-tight",
                                (watch("title") || "").length >= MAX_AD_TITLE_CHARS ? "text-amber-600" : "text-foreground-subtle"
                            )}>
                                {(watch("title") || "").length} / {MAX_AD_TITLE_CHARS}
                            </span>
                        </div>
                    </div>
                </Field>
            </section>

            {/* Description */}
            <section className="space-y-4">
                <Field label="Describe your product" error={descriptionError}>
                    <div className="space-y-3">
                        <div className="relative">
                            <Textarea
                                {...register("description")}
                                placeholder="Describe the condition, issues, and what's included..."
                                maxLength={MAX_AD_DESCRIPTION_CHARS}
                                className="min-h-[200px] rounded-2xl border-2 border-slate-100 focus:border-primary font-medium text-base py-4"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => generateDescription('description')}
                                disabled={isLoading}
                                className="absolute bottom-3 right-3 h-11 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-semibold"
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "AI Enhance"}
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <span className={cn(
                                "text-xs font-bold tracking-tight",
                                (watch("description") || "").length >= MAX_AD_DESCRIPTION_CHARS ? "text-amber-600" : "text-foreground-subtle"
                            )}>
                                {(watch("description") || "").length} / {MAX_AD_DESCRIPTION_CHARS}
                            </span>
                        </div>
                    </div>
                </Field>
            </section>

            {/* Photos */}
            <section className="space-y-6">
                <div className="text-center space-y-1">
                    <label className="text-sm font-bold text-foreground block">Product Photos</label>
                    <p className="text-xs text-foreground-subtle font-medium italic">Photos should be clear and product-focused</p>
                </div>

                <Field error={imagesError}>
                    <div className="grid grid-cols-3 gap-3">
                        {listingImages.map((img, idx) => (
                            <div key={img.id} className="aspect-square relative group rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm">
                                <img src={img.preview} alt="Listing" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                {idx === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs font-semibold text-center py-1">MAIN PHOTO</div>
                                )}
                            </div>
                        ))}
                        
                        {listingImages.length < MAX_AD_IMAGES && (
                            <label className={cn(
                                "aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-50/50",
                                isUploadingImages ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-primary hover:bg-primary/5 hover:shadow-inner"
                            )}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => addImages(Array.from(e.target.files || []))}
                                    disabled={isUploadingImages}
                                />
                                {isUploadingImages ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-foreground-subtle" />
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-slate-100">
                                            <Upload className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Add Photo</span>
                                        <span className="text-2xs text-foreground-subtle mt-0.5">{listingImages.length}/{MAX_AD_IMAGES}</span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>
                </Field>
            </section>

            {/* Location */}
            <section className="space-y-4">
                <Field label="Where are you located?" error={locationError}>
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

            {/* Price */}
            <section className="space-y-6">
                <Field label="Set your price" error={priceError}>
                    <div className="space-y-4">
                        <div className="relative h-20">
                            <Input
                                {...register("price", { valueAsNumber: true })}
                                type="number"
                                placeholder="Enter Amount"
                                disabled={isFree}
                                className={cn(
                                    "h-full pl-12 pr-4 rounded-2xl border-2 font-bold text-2xl transition-all",
                                    isFree ? "bg-slate-50 border-slate-100 text-foreground-subtle" : "bg-white border-slate-200 focus:border-primary"
                                )}
                            />
                            <span className={cn(
                                "absolute left-5 top-1/2 -translate-y-1/2 font-bold text-2xl",
                                isFree ? "text-foreground-subtle" : "text-foreground-subtle"
                            )}>₹</span>
                        </div>

                        <div 
                            onClick={() => {
                                const nextVal = !isFree;
                                setValue("isFree", nextVal);
                                if (nextVal) {
                                    setValue("price", 0, { shouldValidate: true });
                                } else {
                                    trigger("price");
                                }
                            }}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                isFree ? "bg-green-50 border-green-200 ring-2 ring-green-100" : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                    isFree ? "bg-green-600 text-white" : "bg-slate-100 text-foreground-subtle"
                                )}>
                                    <Checkbox
                                        id="isFree-check"
                                        className="hidden"
                                        checked={!!isFree}
                                    />
                                    <span className="font-bold text-xs">FREE</span>
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-sm">Mark as Free</p>
                                    <p className="text-2xs text-muted-foreground font-medium">This item is a giveaway</p>
                                </div>
                            </div>
                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                isFree ? "bg-green-600 border-green-600" : "bg-white border-slate-200"
                            )}>
                                {isFree && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </div>
                    </div>
                </Field>
            </section>
        </div>
    );
}
