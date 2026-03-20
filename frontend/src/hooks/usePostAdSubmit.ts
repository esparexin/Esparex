import { useState, useCallback } from "react";
import { FieldPath, UseFormReturn } from "react-hook-form";
import { sanitizeMongoObjectId } from "@/lib/location/locationService";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import { useNavigation } from "@/context/NavigationContext";

import { AdPayloadSchema as postAdSchema, PartialAdPayloadSchema as partialAdSchema, AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import type { AdImage } from "@/components/user/post-ad/types";
import logger from "@/lib/logger";
import type { UserPage } from "@/lib/routeUtils";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/api/routes";
import { type Ad, createAd, updateAd } from "@/api/user/ads";
import { notify } from "@/lib/notify";


const generateFallbackUuidV4 = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const randomValue = Math.floor(Math.random() * 16);
        const nextValue = char === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
        return nextValue.toString(16);
    });

const generateIdempotencyKey = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return generateFallbackUuidV4();
};

interface UsePostAdSubmitParams {
    form: UseFormReturn<PostAdFormData>;
    spareParts: string[];
    adImages: AdImage[];
    isEditMode: boolean;
    editAdId?: string;
    navigateTo: (page: UserPage, adId?: string | number, category?: string) => void;
    setFormError: (error: string | null) => void;
}

/**
 * Encapsulates the PostAd form submission logic.
 * Handles ZOD validation, image encoding, payload construction, and API calls.
 * Returns `onValidSubmit` (to pass to react-hook-form `handleSubmit`) and `isSubmitting`.
 */
export function usePostAdSubmit({
    form,
    spareParts,
    adImages,
    isEditMode,
    editAdId,
    navigateTo,
    setFormError,
}: UsePostAdSubmitParams) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setIsDirty } = useNavigation();

    const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

    const generateNewIdempotencyKey = () => setIdempotencyKey(generateIdempotencyKey);

    // Throttle: minimum 1 second between submits
    let lastSubmitTime = 0;
    const MIN_SUBMIT_INTERVAL = 1000;

    const onValidSubmit = useCallback(async (data: PostAdFormData) => {
        const now = Date.now();
        if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) return;
        lastSubmitTime = now;

        setIsSubmitting(true); // Move before any async code
        setFormError(null);
        form.clearErrors();

        // Logging submit attempt
        logger.info("PostAd submit attempt", { data });

        const canonicalLocationPayload = {
            city: data.location?.city || "",
            state: data.location?.state || "",
            coordinates: toCanonicalGeoPoint(data.location?.coordinates),
            locationId: sanitizeMongoObjectId(data.location?.locationId) || undefined,
        };

        const imageNamesForValidation = adImages.map((img) => (img.isRemote ? img.preview : img.file ? img.file.name : img.preview));

        // Edit mode: validate without location (backend rejects location changes after posting).
        // Create mode: validate with full schema including required location.
        const payloadForValidation = (isEditMode && editAdId)
            ? { ...data, spareParts, images: imageNamesForValidation }
            : { ...data, spareParts, images: imageNamesForValidation, location: canonicalLocationPayload };

        const schemaToUse = (isEditMode && editAdId) ? partialAdSchema : postAdSchema;
        const result = schemaToUse.safeParse(payloadForValidation);
        if (!result.success) {
            setIsSubmitting(false); // Reset immediately if validation fails
            const firstError = result.error.errors[0]!;
            const firstErrorMessage = firstError.message || "Please complete required fields before posting.";
            logger.error("Validation failed:", result.error.format());
            setFormError(firstErrorMessage); // Show global error banner

            const errorPath = firstError.path.join(".");
            if (errorPath) {
                form.setError(errorPath as FieldPath<PostAdFormData>, {
                    type: "manual",
                    message: firstErrorMessage,
                });
                // Scroll to first error field
                const fieldElem = document.querySelector(`[name='${errorPath}']`);
                if (fieldElem) fieldElem.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                form.setError("root", {
                    type: "manual",
                    message: firstErrorMessage,
                });
            }
            return;
        }

        try {
            // 1. Handle image uploads (sequential for audit safety)
            const finalImageUrls: string[] = [];
            
            for (const img of adImages) {
                if (img.isRemote) {
                    finalImageUrls.push(img.preview);
                    continue;
                }

                if (!img.file) continue;

                const formData = new FormData();
                formData.append("file", img.file);
                
                if (isEditMode && editAdId) {
                    formData.append("folder", "ads");
                    formData.append("adId", editAdId);
                } else {
                    formData.append("folder", "staging");
                }

                try {
                    const uploadResponse = await apiClient.post<{ 
                        success: boolean; 
                        data: { url: string } 
                    }>(
                        API_ROUTES.USER.USERS_UPLOAD, 
                        formData, 
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );

                    const url = uploadResponse.data?.url;
                    if (url) {
                        finalImageUrls.push(url);
                    } else {
                        logger.error("Upload response missing URL", uploadResponse);
                        throw new Error("Image upload failed: no URL returned");
                    }
                } catch (uploadError) {
                    logger.error("Individual image upload failed", uploadError);
                    throw new Error("Failed to upload one or more images. Please try again.");
                }
            }

            // 2. Prepare final payload
            const finalPayload: any = {
                ...data,
                spareParts,
                images: finalImageUrls,
                location: {
                    ...canonicalLocationPayload,
                    locationId: canonicalLocationPayload.locationId || undefined
                },
                // Cleanup display helper fields that aren't in the backend schema
                category: undefined,
                brand: undefined,
                model: undefined
            };

            // 3. API Interaction
            let result: Ad | null = null;
            if (isEditMode && editAdId) {
                result = await updateAd(editAdId, finalPayload);
                notify.success("Ad updated successfully!");
                setIsDirty(false);
                navigateTo("home");
            } else {
                result = await createAd(finalPayload, { idempotencyKey });
                setIsDirty(false); // Clear dirty state so navigation blockers don't fire on success
                // We DO NOT redirect here. We return the result so the parent context/UI renders the Success Popup.
            }

            if (!result) {
                throw new Error("Failed to save ad. Please try again.");
            }

            return result; // Add return so the parent can set submittedAd state

        } catch (e: any) {
            logger.error("Ad submission failed", e);
            const errorMessage = e instanceof Error ? e.message : "Failed to post ad. Please try again.";
            setFormError(errorMessage);
            generateNewIdempotencyKey(); // Reset on error to allow retry
        } finally {
            setIsSubmitting(false);
        }
        return null;
    }, [
        form,
        spareParts,
        adImages,
        isEditMode,
        editAdId,
        navigateTo,
        setFormError,
        setIsDirty,
        idempotencyKey,
        generateNewIdempotencyKey,
    ]);

    return {
        onValidSubmit,
        isSubmitting
    };
}
