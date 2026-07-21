"use client";

import { usePostAdImages, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { X, Upload, Loader2 } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { MAX_AD_IMAGES } from "@esparex/contracts";
import Image from "next/image";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";
import { getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";

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
        <section className="space-y-6" aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="sr-only">Product Photos</h2>

            <Field label="Product Photos" error={combinedError}>
                <p className="text-xs text-foreground-subtle font-medium italic mb-3">Photos should be clear and product-focused</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {listingImages.map((img, idx) => (
                        <div key={img.id} className="aspect-square relative group rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-all hover:border-primary/50">
                            <Image 
                                src={img.preview} 
                                alt={`Product photo ${idx + 1} of ${listingImages.length}`}
                                fill
                                className="object-cover" 
                                unoptimized={true}
                            />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        aria-label="Remove image"
                                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                {idx !== 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setMainImage(idx)}
                                        className="w-full py-1 text-2xs font-bold text-white bg-black/60 rounded backdrop-blur-sm hover:bg-primary transition-colors uppercase tracking-wider"
                                    >
                                        Set as Main
                                    </button>
                                )}
                            </div>

                            {idx === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs font-semibold text-center py-1">MAIN PHOTO</div>
                            )}
                        </div>
                    ))}
                    
                    {listingImages.length < MAX_AD_IMAGES && (
                        <label className={cn(
                            "aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all bg-slate-50/50",
                            isUploadingImages ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-primary hover:bg-primary/5 hover:shadow-inner"
                        )}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                aria-label="Add product photos"
                                onChange={(e) => addImages(Array.from(e.target.files || []))}
                                disabled={isUploadingImages}
                            />
                            {isUploadingImages ? (
                                <Loader2 className="w-6 h-6 animate-spin text-foreground-subtle" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-slate-100">
                                        <Upload className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Add Photo</span>
                                    <span className="text-xs text-foreground-subtle mt-0.5">{listingImages.length}/{MAX_AD_IMAGES}</span>
                                </>
                            )}
                        </label>
                    )}
                </div>
            </Field>
        </section>
    );
}
