"use client";

import React, { ReactNode } from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";
import { ListingModalLayout, ListingModalBody, ListingModalFooter } from "./ListingModalLayout";
import { ListingImagesField, ListingLocationField, getFirstFormErrorMessage } from "./ListingFormFields";
import { Button, Spinner } from "@esparex/ui";
import type { ListingImage } from "@/types/listing";

type GenericPostFormValues = FieldValues & {
    images?: unknown;
    location?: unknown;
};

interface GenericPostFormProps<TFormValues extends GenericPostFormValues> {
    form: UseFormReturn<TFormValues>;
    title: string;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    onClose: () => void;
    isSubmitting: boolean;
    isEditMode: boolean;
    images: ListingImage[];
    onImageUpload: (files: File[]) => void;
    onImageRemove: (id: string | number) => void;
    locationDisplay?: string;
    children: ReactNode;
    submitLabel?: string;
    formId: string;
    priceSlot?: ReactNode;
}

export function GenericPostForm<TFormValues extends GenericPostFormValues>({
    form,
    title,
    onSubmit,
    onClose,
    isSubmitting,
    isEditMode,
    images,
    onImageUpload,
    onImageRemove,
    locationDisplay,
    children,
    submitLabel,
    formId,
    priceSlot,
}: GenericPostFormProps<TFormValues>) {
    const imagesError = getFirstFormErrorMessage((form.formState.errors as Record<string, unknown>).images);
    const locationError = getFirstFormErrorMessage((form.formState.errors as Record<string, unknown>).location);
    const locationHelperText = locationDisplay
        ? undefined
        : "Add a Business profile location in Business Hub before publishing.";

    return (
        <FormProvider {...form}>
            <ListingModalLayout title={title} onClose={onClose}>
                    <form id={formId} onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <ListingModalBody>
                            <div className="space-y-5">
                                {children}

                                <ListingImagesField
                                    images={images}
                                    onUpload={onImageUpload}
                                    onRemove={onImageRemove}
                                    firstImageBadgeLabel={isEditMode ? "CURRENT" : "COVER"}
                                    error={imagesError}
                                    helperText="Add clear product photos. The first photo will be used as the cover image."
                                />

                                {priceSlot ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                                        {priceSlot}
                                        <ListingLocationField 
                                            display={locationDisplay || ''} 
                                            fixedLabel="Fixed" 
                                            error={locationError}
                                            helperText={locationHelperText}
                                        />
                                    </div>
                                ) : (
                                    <ListingLocationField 
                                        display={locationDisplay || ''} 
                                        fixedLabel="Fixed" 
                                        error={locationError}
                                        helperText={locationHelperText}
                                    />
                                )}
                            </div>
                        </ListingModalBody>

                        <ListingModalFooter>
                            <Button
                                type="submit"
                                form={formId}
                                variant="primary"
                                disabled={isSubmitting}
                                className="w-full h-11 rounded-xl font-semibold text-body transition-all active:scale-[0.98] shadow-xs"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner size="sm" /> Submitting...
                                    </span>
                                ) : (
                                    submitLabel || (isEditMode ? "Save Changes" : "Submit →")
                                )}
                            </Button>
                        </ListingModalFooter>
                    </form>
            </ListingModalLayout>
        </FormProvider>
    );
}
