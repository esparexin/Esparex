"use client";

import { usePostAdImages, usePostAdFlow, usePostAdAction } from "../../context";
import { ListingImagesField, getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";

export function ImageUploadSection() {
    const { listingImages, isUploadingImages, imageUploadError } = usePostAdImages();
    const { form, stepValidationAttempts } = usePostAdFlow();
    const { addImages, removeImage, setMainImage } = usePostAdAction();

    const { touchedFields, errors, submitCount } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[2]);
    const hasAttemptedSubmit = submitCount > 0;

    const shouldShowFieldError = useCallback((path: string) => {
        if (hasAttemptedSubmit || hasAttemptedStepValidation) return true;
        return Boolean(getNestedFieldMeta(touchedFields, path));
    }, [hasAttemptedStepValidation, hasAttemptedSubmit, touchedFields]);

    const imagesError = shouldShowFieldError("images") ? getFirstFormErrorMessage(errors.images) : undefined;
    const combinedError = imageUploadError || imagesError;

    return (
        <section className="space-y-4" aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="sr-only">Product Photos</h2>
            <ListingImagesField
                images={listingImages}
                onUpload={addImages}
                onRemove={removeImage}
                onSetMain={setMainImage}
                disabled={isUploadingImages}
                firstImageBadgeLabel="MAIN PHOTO"
                error={combinedError}
                helperText="Photos should be clear and product-focused"
            />
        </section>
    );
}
