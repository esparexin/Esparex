"use client";

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { useNavigation } from "@/context/NavigationContext";
import logger from "@/lib/logger";
import { notify } from "@/lib/notify";
import type { ListingImage } from "@/types/listing";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import { fileToBase64 } from "@/components/user/business-registration/utils";

import { generateIdempotencyKey } from "@/lib/listings/submissionUtils";
import { injectApiErrors } from "@/lib/injectApiErrors";

interface UseListingSubmissionProps<TFieldValues extends Record<string, any>> {
    form: UseFormReturn<TFieldValues>;
    listingImages: ListingImage[];
    isEditMode: boolean;
    editId?: string;
    schema: any;
    partialSchema?: any;
    submitFn: (payload: any, options?: { idempotencyKey?: string }) => Promise<any>;
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
}

/**
 * 🚀 Unified Submission Hook for Listings
 * Handles validation, image uploads, and API calls.
 */
export function useListingSubmission<T extends Record<string, any>>({
    form,
    listingImages,
    isEditMode,
    editId,
    schema,
    partialSchema,
    submitFn,
    onSuccess,
    onError,
}: UseListingSubmissionProps<T>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);
    const { setIsDirty } = useNavigation();

    const resetIdempotency = () => setIdempotencyKey(generateIdempotencyKey());

    const onValidSubmit = useCallback(async (data: T) => {
        setIsSubmitting(true);
        if (onError) onError("");

        try {
            // 1. Image Upload Pipeline (Sequential)
            const finalImageUrls: string[] = [];
            for (const img of listingImages) {
                if (img.isRemote) {
                    finalImageUrls.push(img.preview);
                    continue;
                }
                
                // If it is a string and starts with http, it is already a URL (fallback)
                if (typeof img.preview === 'string' && img.preview.startsWith('http')) {
                    finalImageUrls.push(img.preview);
                    continue;
                }

                if (!img.file) continue;

                // Only convert to base64 if it's a local file and NOT already remote
                const base64 = await fileToBase64(img.file);
                finalImageUrls.push(base64);
            }

            // 2. Payload Construction
            const location = (data as any).location;
            const canonicalLocation = location ? {
                city: location.city || "",
                state: location.state || "",
                coordinates: toCanonicalGeoPoint(location.coordinates),
                locationId: sanitizeMongoObjectId(location.locationId) || undefined,
            } : undefined;

            const finalPayload = {
                ...data,
                images: finalImageUrls,
                location: canonicalLocation,
                // Remove UI-only fields if they exist
                category: undefined,
                brand: undefined,
                model: undefined
            };

            // 3. Validation Check
            const activeSchema = (isEditMode && partialSchema) ? partialSchema : schema;
            const validation = activeSchema.safeParse(finalPayload);
            
            if (!validation.success) {
                const firstError = validation.error.errors[0]!;
                // Scroll to the first invalid field so it is visible on long forms
                const firstPath = firstError.path[0];
                if (typeof firstPath === "string" && typeof document !== "undefined") {
                    const el = document.querySelector(`[name='${firstPath}']`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                throw new Error(firstError.message || "Validation failed. Please check your inputs.");
            }

            // 4. API Submission
            const result = await submitFn(finalPayload, { 
                idempotencyKey: isEditMode ? undefined : idempotencyKey 
            });

            if (!result) throw new Error("Submission failed. No result returned.");

            setIsDirty(false);
            onSuccess?.(result);
            return result;

        } catch (e: any) {
            logger.error("[Submission] Failed:", e);
            
            // 🛡️ Policy Guard: Intercept Business Required Threshold
            if (e.code === 'BUSINESS_REQUIRED_THRESHOLD' || (e.response && e.response.data && e.response.data.code === 'BUSINESS_REQUIRED_THRESHOLD')) {
                const limitMsg = e.response?.data?.message || e.message;
                notify.error(limitMsg, {
                    duration: 6000,
                    // In a real app, we might trigger an 'Upgrade to Business' modal here via a global event or context
                    description: "Please upgrade to a Business account or purchase a premium slot to post more spare parts."
                });
                return null;
            }

            const msg = e instanceof Error ? e.message : "Submission failed. Please try again.";
            if (onError) onError(msg);
            else notify.error(msg);
            // Inject API field-level errors into the form (highlights specific fields)
            if (form) injectApiErrors(form, e);
            resetIdempotency();
        } finally {
            setIsSubmitting(false);
        }
        return null;
    }, [
        listingImages, isEditMode, editId, schema, partialSchema, 
        submitFn, onSuccess, onError, idempotencyKey, setIsDirty
    ]);

    return {
        onValidSubmit,
        isSubmitting,
        idempotencyKey,
        resetIdempotency
    };
}
