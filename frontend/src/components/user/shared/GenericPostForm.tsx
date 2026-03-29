"use client";

import React, { ReactNode } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { ListingModalLayout, ListingModalBody, ListingModalFooter } from "./ListingModalLayout";
import { ListingImagesField, ListingLocationField, getFirstFormErrorMessage } from "./ListingFormFields";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import type { ListingImage } from "@/types/listing";

interface GenericPostFormProps {
    form: UseFormReturn<any>;
    title: string;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    onClose: () => void;
    isSubmitting: boolean;
    isEditMode: boolean;
    images: ListingImage[];
    onImageUpload: (files: File[]) => void;
    onImageRemove: (id: string) => void;
    locationDisplay?: string;
    children: ReactNode;
    submitLabel?: string;
    formId: string;
}

export function GenericPostForm({
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
}: GenericPostFormProps) {
    const imagesError = getFirstFormErrorMessage(form.formState.errors.images);
    const locationError = getFirstFormErrorMessage(form.formState.errors.location);
    const locationHelperText = locationDisplay
        ? "This listing uses your Business profile location. Update it in Business Hub if needed."
        : "Add a Business profile location in Business Hub before publishing.";

    return (
        <FormProvider {...form}>
            <ListingModalLayout title={title} onClose={onClose}>
                    <form id={formId} onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <ListingModalBody>
                            <div className="space-y-8">
                                {children}

                                <ListingImagesField
                                    images={images}
                                    onUpload={onImageUpload}
                                    onRemove={onImageRemove}
                                    firstImageBadgeLabel={isEditMode ? "CURRENT" : "COVER"}
                                    error={imagesError}
                                    helperText="Add clear product photos. The first photo will be used as the cover image."
                                />

                                <ListingLocationField 
                                    display={locationDisplay || ''} 
                                    fixedLabel="Fixed" 
                                    error={locationError}
                                    helperText={locationHelperText}
                                />
                            </div>
                        </ListingModalBody>

                        <ListingModalFooter>
                            <Button
                                type="submit"
                                form={formId}
                                size="lg"
                                disabled={isSubmitting}
                                className={cn(
                                    "w-full font-semibold transition-all active:scale-[0.98]",
                                    "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-70"
                                )}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
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
