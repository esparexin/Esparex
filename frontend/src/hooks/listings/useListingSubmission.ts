"use client";

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { useNavigation } from "@/context/NavigationContext";
import logger from "@/lib/logger";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/api/routes";
import { notify } from "@/lib/notify";
import type { ListingImage } from "@/types/listing";
import { sanitizeMongoObjectId } from "@/utils/listings/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";

import { generateIdempotencyKey } from "@/utils/listings/submissionUtils";

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
    folder?: string;
}

/**
 * 🚀 Unified Submission Hook for Listings
 * Handles validation, image uploads, and API calls.
 */
export function useListingSubmission<T extends Record<string, any>>({
    listingImages,
    isEditMode,
    editId,
    schema,
    partialSchema,
    submitFn,
    onSuccess,
    onError,
    folder = "ads"
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
                if (!img.file) continue;

                const formData = new FormData();
                formData.append("file", img.file);
                formData.append("folder", isEditMode ? folder : "staging");
                if (isEditMode && editId) formData.append("id", editId);

                const uploadResponse = await apiClient.post<{ data: { url: string } }>(
                    API_ROUTES.USER.USERS_UPLOAD,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                const url = uploadResponse.data?.url;
                if (url) finalImageUrls.push(url);
                else throw new Error("Image upload failed: no URL returned");
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
            const msg = e instanceof Error ? e.message : "Submission failed. Please try again.";
            if (onError) onError(msg);
            else notify.error(msg);
            resetIdempotency();
        } finally {
            setIsSubmitting(false);
        }
        return null;
    }, [
        listingImages, isEditMode, editId, folder, schema, partialSchema, 
        submitFn, onSuccess, onError, idempotencyKey, setIsDirty
    ]);

    return {
        onValidSubmit,
        isSubmitting,
        idempotencyKey,
        resetIdempotency
    };
}
