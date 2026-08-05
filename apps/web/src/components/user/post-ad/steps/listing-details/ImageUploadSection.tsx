"use client";

import { usePostAdImages, usePostAdAction } from "../../context";
import { ListingImagesField } from "@/components/user/shared/ListingFormFields";
import { useStepFieldError } from "../common/Utils";

export function ImageUploadSection() {
    const { listingImages, isUploadingImages, imageUploadError } = usePostAdImages();
    const { addImages, removeImage, setMainImage, reorderImages } = usePostAdAction();

    const getFieldError = useStepFieldError(2);
    const imagesError = getFieldError("images");
    const combinedError = imageUploadError || imagesError;

    return (
        <section className="space-y-4" aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="sr-only">Product Photos</h2>
            <ListingImagesField
                images={listingImages}
                onUpload={addImages}
                onRemove={removeImage}
                onSetMain={setMainImage}
                onReorder={reorderImages}
                disabled={isUploadingImages}
                firstImageBadgeLabel="MAIN PHOTO"
                error={combinedError}
                helperText="Photos should be clear and product-focused"
            />
        </section>
    );
}
