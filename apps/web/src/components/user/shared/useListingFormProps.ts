import type React from "react";
import { useRouter } from "next/navigation";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { ListingImage } from "@/types/listing";
import {
    getBusinessLocationDisplay,
    type MaybeBusinessLocation,
} from "./listingFormShared";

/**
 * Shared hook to generate common props for GenericPostForm.
 * This eliminates the repetitive prop passing in PostServiceForm and PostSparePartForm.
 */
type GenericListingFormValues = FieldValues & {
    location?: unknown;
};

export function useListingFormProps<TFormValues extends GenericListingFormValues>({
    form,
    images,
    onImageUpload,
    onImageRemove,
    isEditMode,
    isSubmitting,
    onValidSubmit,
    businessData,
}: {
    form: UseFormReturn<TFormValues>;
    images: ListingImage[];
    onImageUpload: (files: File[]) => void;
    onImageRemove: (id: string | number) => void;
    isEditMode: boolean;
    isSubmitting: boolean;
    onValidSubmit: (data: TFormValues) => Promise<void | unknown>;
    businessData: { location?: MaybeBusinessLocation } | null | undefined;
}) {
    const router = useRouter();
    const { handleSubmit } = form;

    const handleSubmitWrapped = async (e?: React.BaseSyntheticEvent): Promise<void> => {
        await handleSubmit(async (data: TFormValues) => {
            await onValidSubmit(data);
        })(e);
    };

    return {
        form,
        onSubmit: handleSubmitWrapped,
        onClose: () => router.back(),
        isSubmitting,
        isEditMode,
        images,
        onImageUpload,
        onImageRemove,
        locationDisplay: getBusinessLocationDisplay(businessData?.location),
    };
}
