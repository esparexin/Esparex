"use client";

import { usePostAdImages, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { X, Upload, Loader2 } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { MAX_AD_IMAGES } from "@shared";
import Image from "next/image";
import { getNestedFieldMeta } from "../common/utils";
import { getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";

export function ImageUploadSection() {
    const { listingImages, isUploadingImages } = usePostAdImages();
    const { form, stepValidationAttempts } = usePostAdFlow();
    const { addImages, removeImage } = usePostAdAction();

    const { touchedFields, errors, submitCount } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[2]);
    const hasAttemptedSubmit = submitCount > 0;
    const showFieldError = hasAttemptedSubmit || hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, "images"));
    const imagesError = showFieldError ? getFirstFormErrorMessage(errors.images) : undefined;

    return (
        <section className="space-y-6">
            <div className="text-center space-y-1">
                <label className="text-sm font-bold text-foreground block">Product Photos</label>
                <p className="text-xs text-foreground-subtle font-medium italic">Photos should be clear and product-focused</p>
            </div>

            <Field error={imagesError}>
                <div className="grid grid-cols-3 gap-3">
                    {listingImages.map((img, idx) => (
                        <div key={img.id} className="aspect-square relative group rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm">
                            <Image 
                                src={img.preview} 
                                alt={`Product photo ${idx + 1}`}
                                fill
                                className="object-cover" 
                                unoptimized={true}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                aria-label={`Remove image ${idx + 1}`}
                                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            {idx === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs font-semibold text-center py-1">MAIN PHOTO</div>
                            )}
                        </div>
                    ))}
                    
                    {listingImages.length < MAX_AD_IMAGES && (
                        <label className={cn(
                            "aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-slate-50/50",
                            isUploadingImages ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-primary hover:bg-primary/5 hover:shadow-inner"
                        )}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                aria-label="Add product photos"
                                className="hidden"
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
                                    <span className="text-2xs text-foreground-subtle mt-0.5">{listingImages.length}/{MAX_AD_IMAGES}</span>
                                </>
                            )}
                        </label>
                    )}
                </div>
            </Field>
        </section>
    );
}
