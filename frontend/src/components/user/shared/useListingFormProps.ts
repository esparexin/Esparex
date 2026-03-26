import { useRouter } from "next/navigation";
import { UseFormReturn } from "react-hook-form";
import { ListingImage } from "@/types/listing";
import { appendListingImages, removeListingImageById, getBusinessLocationDisplay } from "./listingFormShared";

/**
 * Shared hook to generate common props for GenericPostForm.
 * This eliminates the repetitive prop passing in PostServiceForm and PostSparePartForm.
 */
export function useListingFormProps({
    form,
    images,
    setImages,
    isEditMode,
    isSubmitting,
    onValidSubmit,
    businessData,
}: {
    form: UseFormReturn<any>;
    images: ListingImage[];
    setImages: React.Dispatch<React.SetStateAction<ListingImage[]>>;
    isEditMode: boolean;
    isSubmitting: boolean;
    onValidSubmit: (data: any) => Promise<void>;
    businessData: any;
}) {
    const router = useRouter();
    const { handleSubmit, watch } = form;

    return {
        form,
        onSubmit: handleSubmit(onValidSubmit),
        onClose: () => router.back(),
        isSubmitting,
        isEditMode,
        images,
        onImageUpload: (files: File[]) => setImages(prev => appendListingImages(prev, files)),
        onImageRemove: (id: string) => setImages(prev => removeListingImageById(prev, id)),
        locationDisplay: watch("location.display") || getBusinessLocationDisplay(businessData?.location),
    };
}
