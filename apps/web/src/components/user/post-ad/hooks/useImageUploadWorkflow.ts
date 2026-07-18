import { useState, useCallback } from "react";
import { type FieldErrors, UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { ListingImage } from "@/types/listing";
import logger from "@/lib/logger";
import { notify } from "@/lib/feedback";

export function useImageUploadWorkflow<T>(
    form: UseFormReturn<PostAdFormData>,
    listingImages: ListingImage[],
    setListingImages: (images: ListingImage[]) => void,
    normalizeIdentityFieldsBeforeSubmit: () => void,
    onValidSubmit: (data: PostAdFormData, overrideImages?: ListingImage[]) => Promise<T>,
    setFormError: (err: string | null) => void,
    setSubmittedAd: (ad: T) => void
) {
    const [isInternalUploading, setIsInternalUploading] = useState(false);

    const submitAd = useCallback(
        async () => {
            normalizeIdentityFieldsBeforeSubmit();
            return form.handleSubmit(async (data: PostAdFormData) => {
                setIsInternalUploading(true);
                try {
                    const ad = await onValidSubmit(data, listingImages);
                    if (ad) {
                        setSubmittedAd(ad);
                    }
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Submission failed. Please try again.";
                    logger.error("[PostAdSubmit] Overall submission failed:", err);
                    setFormError(message);
                    notify.error(message);
                } finally {
                    setIsInternalUploading(false);
                }
            }, (errors: FieldErrors<PostAdFormData>) => {
                const sanitizedErrors = Object.keys(errors).reduce((acc: Record<string, { message?: string; type?: string }>, key) => {
                    const err = errors[key as keyof PostAdFormData];
                    acc[key] = {
                        message: err?.message as string | undefined,
                        type: err?.type as string | undefined
                    };
                    return acc;
                }, {});

                logger.error("[PostAdSubmit] Form validation errors:", sanitizedErrors);
                
                const firstErrorKey = Object.keys(errors)[0];
                if (typeof document !== "undefined" && firstErrorKey) {
                    if (firstErrorKey === "images") {
                        document.querySelector("input[type='file']")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else {
                        document.querySelector(`[name='${firstErrorKey}']`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
            })();
        },
        [form, listingImages, normalizeIdentityFieldsBeforeSubmit, onValidSubmit, setFormError, setSubmittedAd, setListingImages]
    );

    return { submitAd, isInternalUploading };
}
