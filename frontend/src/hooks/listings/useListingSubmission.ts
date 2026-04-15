"use client";

import { useState, useCallback } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useNavigation } from "@/context/NavigationContext";
import logger from "@/lib/logger";
import { notify } from "@/lib/notify";
import type { ListingImage } from "@/types/listing";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import { fileToBase64 } from "@/components/user/business-registration/utils";
import { z } from "zod";

import { generateIdempotencyKey } from "@/lib/listings/submissionUtils";
import { injectApiErrors } from "@/lib/injectApiErrors";
import { mapErrorToMessage } from "@/lib/errorMapper";

function getBackendErrorCode(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined;

    const record = error as {
        code?: unknown;
        context?: { backendErrorCode?: unknown };
        response?: { data?: { code?: unknown } };
    };

    if (typeof record.code === "string" && record.code.trim().length > 0) {
        return record.code;
    }

    if (typeof record.context?.backendErrorCode === "string" && record.context.backendErrorCode.trim().length > 0) {
        return record.context.backendErrorCode;
    }

    const responseCode = record.response?.data?.code;
    return typeof responseCode === "string" && responseCode.trim().length > 0 ? responseCode : undefined;
}

interface UseListingSubmissionProps<TFieldValues extends FieldValues, TResult = unknown> {
    form: UseFormReturn<TFieldValues>;
    listingImages: ListingImage[];
    isEditMode: boolean;
    editId?: string;
    schema: z.ZodTypeAny;
    partialSchema?: z.ZodTypeAny;
    submitFn: (payload: any, options?: { idempotencyKey?: string }) => Promise<TResult>;
    onSuccess?: (result: TResult) => void;
    onError?: (error: string) => void;
}

/**
 * 🚀 Unified Submission Hook for Listings
 * Handles validation, image uploads, and API calls.
 */
export function useListingSubmission<T extends FieldValues, R = unknown>({
    form,
    listingImages,
    isEditMode,
    editId,
    schema,
    partialSchema,
    submitFn,
    onSuccess,
    onError,
}: UseListingSubmissionProps<T, R>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);
    const { setIsDirty } = useNavigation();

    const resetIdempotency = () => setIdempotencyKey(generateIdempotencyKey());

    const onValidSubmit = useCallback(async (data: T) => {
        setIsSubmitting(true);
        if (onError) onError("");

        try {
            if (listingImages.length === 0) {
                form.setError("images" as Path<T>, {
                    type: "manual",
                    message: "Add at least one photo to continue.",
                });
                if (typeof document !== "undefined") {
                    document.querySelector("input[type='file']")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return null;
            }
            form.clearErrors("images" as Path<T>);

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
            const location = (data as Record<string, any>).location;
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
            };

            // 3. Validation Check
            const activeSchema = (isEditMode && partialSchema) ? partialSchema : schema;
            const validation = activeSchema.safeParse(finalPayload);
            
            if (!validation.success) {
                const { issues } = validation.error;
                const [firstIssue] = issues;

                issues.forEach((issue: z.ZodIssue) => {
                    const fieldPath = issue.path
                        .filter((segment: string | number): segment is string | number => typeof segment === "string" || typeof segment === "number")
                        .join(".");

                    if (fieldPath) {
                        form.setError(fieldPath as Path<T>, {
                            type: "manual",
                            message: issue.message,
                        });
                    }
                });

                const firstPath = firstIssue?.path
                    .filter((segment: string | number): segment is string | number => typeof segment === "string" || typeof segment === "number")
                    .join(".");

                if (typeof document !== "undefined") {
                    if (firstPath === "images") {
                        document.querySelector("input[type='file']")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else if (firstPath) {
                        const el = document.querySelector(`[name='${firstPath}']`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }

                return null;
            }

            // 4. API Submission
            const result = await submitFn(finalPayload, { 
                idempotencyKey: isEditMode ? undefined : idempotencyKey 
            });

            if (!result) throw new Error("Submission failed. No result returned.");

            setIsDirty(false);
            onSuccess?.(result);
            return result;

        } catch (e: unknown) {
            logger.error("[Submission] Failed:", e);
            
            // 🛡️ Policy Guard: Intercept Business Required Threshold
            if (getBackendErrorCode(e) === 'BUSINESS_REQUIRED_THRESHOLD') {
                const limitMsg = mapErrorToMessage(e, "Business account required.");
                notify.error(limitMsg, {
                    duration: 6000,
                    // In a real app, we might trigger an 'Upgrade to Business' modal here via a global event or context
                    description: "Please upgrade to a Business account or purchase a premium slot to post more spare parts."
                });
                return null;
            }

            // Inject API field-level errors into the form (highlights specific fields)
            const injected = form ? injectApiErrors(form, e) : false;
            const msg = mapErrorToMessage(e, "Submission failed. Please try again.");

            if (onError) onError(msg);
            else if (!injected) notify.error(msg);
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
