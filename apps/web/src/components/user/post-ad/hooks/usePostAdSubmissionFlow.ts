import { useCallback } from "react";
import { Listing } from "@/lib/api/user/listings/normalizer";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import {
    AdPayloadSchema as postAdSchema,
    PartialAdPayloadSchema as partialAdSchema,
} from "@/schemas/adPayload.schema";
import { UseFormReturn } from "react-hook-form";
import { ListingImage } from "@/types/listing";
import { createAdListing, updateAdListing } from "@/lib/api/user/listings/postingAPI";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";
import { usePostAdFormNormalization } from "./usePostAdFormNormalization";

interface UsePostAdSubmissionFlowProps {
    form: UseFormReturn<PostAdFormData>;
    listingImages: ListingImage[];
    setListingImages: (images: ListingImage[]) => void;
    isEditMode: boolean;
    editAdId?: string;
    isLocationLocked: boolean;
    setFormError: (message: string | null) => void;
    setSubmittedAd: (ad: Listing | null) => void;
}

export function usePostAdSubmissionFlow({
    form,
    listingImages,
    isEditMode,
    editAdId,
    isLocationLocked,
    setFormError,
    setSubmittedAd,
}: UsePostAdSubmissionFlowProps) {
    const { buildEditAdPayload, normalizeIdentityFieldsBeforeSubmit } = usePostAdFormNormalization(
        form,
        isLocationLocked
    );

    const submitAdApiCall = useCallback((payload: PostAdFormData, options?: { idempotencyKey?: string }): Promise<Listing> => {
        trackPostAdEvent({ event: "publish_clicked", metadata: { isEditMode } });
        const listingData = payload as unknown as Partial<Listing>;
        const result = (isEditMode && editAdId)
            ? updateAdListing(editAdId, buildEditAdPayload(payload) as Partial<Listing>)
            : createAdListing(listingData, options);
        return result as Promise<Listing>;
    }, [buildEditAdPayload, editAdId, isEditMode]);

    const handleSuccess = useCallback((ad: Listing) => {
        trackPostAdEvent({ event: "publish_success", metadata: { adId: ad.id } });
        setSubmittedAd(ad);
    }, [setSubmittedAd]);

    const handleError = useCallback((error: string | null) => {
        if (error) {
            trackPostAdEvent({ event: "publish_failure", metadata: { error } });
        }
        setFormError(error);
    }, [setFormError]);

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages,
        isEditMode,
        editId: editAdId,
        schema: postAdSchema,
        partialSchema: partialAdSchema,
        submitFn: submitAdApiCall,
        onSuccess: handleSuccess,
        onError: handleError,
    });

    const submitAd = useCallback(() => {
        normalizeIdentityFieldsBeforeSubmit();
        return form.handleSubmit((data) => onValidSubmit(data))();
    }, [normalizeIdentityFieldsBeforeSubmit, form, onValidSubmit]);

    return {
        submitAd,
        isSubmitting,
    };
}
