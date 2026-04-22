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
import { useImageUploadWorkflow } from "./useImageUploadWorkflow";
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
    setListingImages,
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

    const submitAdApiCall = useCallback((payload: PostAdFormData, options?: { idempotencyKey?: string }) => {
        const listingData = payload as unknown as Partial<Listing>;
        return (isEditMode && editAdId)
            ? updateAdListing(editAdId, buildEditAdPayload(payload) as Partial<Listing>)
            : createAdListing(listingData, options);
    }, [buildEditAdPayload, editAdId, isEditMode]);

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages,
        isEditMode,
        editId: editAdId,
        schema: postAdSchema,
        partialSchema: partialAdSchema,
        submitFn: submitAdApiCall,
        onSuccess: (ad) => setSubmittedAd(ad),
        onError: setFormError,
    });

    const { submitAd, isInternalUploading } = useImageUploadWorkflow(
        form,
        listingImages,
        setListingImages,
        normalizeIdentityFieldsBeforeSubmit,
        onValidSubmit,
        setFormError,
        setSubmittedAd
    );

    return {
        submitAd,
        isSubmitting,
        isInternalUploading,
    };
}
