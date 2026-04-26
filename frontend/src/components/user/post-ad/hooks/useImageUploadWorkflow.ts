import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { ListingImage } from "@/types/listing";
import logger from "@/lib/logger";
import { notify } from "@/lib/notify";
import { apiClient } from "@/lib/api/client";

export function useImageUploadWorkflow<T>(
    form: UseFormReturn<PostAdFormData>,
    listingImages: ListingImage[],
    setListingImages: (images: ListingImage[]) => void,
    normalizeIdentityFieldsBeforeSubmit: () => void,
    onValidSubmit: (data: PostAdFormData) => Promise<T>,
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
                    const updatedImages = [...listingImages];
                    const uploadPromises = updatedImages.map(async (img, idx) => {
                        if (img.isRemote || !img.file) return;

                        const formData = new FormData();
                        formData.append("image", img.file);
                        formData.append("folder", "ads");

                        try {
                            const csrfToken = await (apiClient as unknown as { getCsrfToken?: () => Promise<string> }).getCsrfToken?.() || "";
                            console.log("[FRONTEND CSRF TOKEN]", csrfToken);
                            
                            const headers = {
                                "x-csrf-token": csrfToken,
                            };
                            console.log("[UPLOAD HEADERS]", headers);

                            const response = await fetch("/api/upload/ad-image", {
                                method: "POST",
                                headers,
                                body: formData,
                                credentials: "include",
                            });
                            const payload = await response.json().catch(() => ({} as { success?: boolean; url?: string; error?: string }));
                            const remoteUrl = typeof payload?.url === "string" ? payload.url : "";

                            if (!response.ok || !remoteUrl) {
                                throw new Error(payload?.error || "Image upload failed. Please try again.");
                            }

                            if (payload.success) {
                                updatedImages[idx] = {
                                    ...img,
                                    preview: remoteUrl,
                                    isRemote: true
                                };
                            }
                        } catch (uploadErr) {
                            logger.error("[PostAdSubmit] Image upload failed:", uploadErr);
                            throw new Error(`Failed to upload image ${idx + 1}. Please try again.`);
                        }
                    });

                    await Promise.all(uploadPromises);
                    setListingImages(updatedImages);

                    const ad = await onValidSubmit(data);
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
            }, (errors) => {
                logger.error("[PostAdSubmit] Form validation errors:", errors);
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
