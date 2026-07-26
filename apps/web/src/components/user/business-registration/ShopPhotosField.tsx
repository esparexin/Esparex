import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { cn } from "@/components/ui/utils";
import {
    BUSINESS_IMAGE_ACCEPT,
    BUSINESS_UPLOAD_MAX_MB,
    validateBusinessImageSelection,
} from "@/schemas/business.schema.shared";
import { getRemovePhotoAriaLabel } from "@/components/user/shared/uploadHelpers";
import { useImageDropzone } from "@/components/user/shared/useImageDropzone";
import { useFilePreviewUrl } from "./useFilePreviewUrl";
import type { StepBaseProps } from "./types";

function ShopImageTile({
    file,
    index,
    total,
    onRemove,
}: {
    file: File | string;
    index: number;
    total: number;
    onRemove: () => void;
}) {
    const previewUrl = useFilePreviewUrl(file);

    if (!previewUrl) {
        return null;
    }

    return (
        <div className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <Image
                src={previewUrl}
                alt={`Shop ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover"
            />
            <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-t from-slate-900/65 via-slate-900/0 to-slate-900/0 p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-foreground-secondary shadow-sm">
                    Photo {index + 1}
                </span>
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={onRemove}
                    aria-label={getRemovePhotoAriaLabel(index, total)}
                    className="h-11 w-11 rounded-full bg-white/90 text-foreground-secondary shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface ShopPhotosFieldProps extends StepBaseProps {
    helperText?: string;
}

export function ShopPhotosField({
    formData,
    setFormData,
    helperText = "Upload 1 to 5 clear photos of the real shop or workspace reviewers should verify.",
}: ShopPhotosFieldProps) {
    const [localError, setLocalError] = useState<string | null>(null);

    const removeShopImage = (index: number) => {
        const nextImages = [...formData.images];
        nextImages.splice(index, 1);
        setFormData({ ...formData, images: nextImages });
        setLocalError(null);
    };

    const handleShopImageUpload = (files: FileList | File[]) => {
        const remainingSlots = Math.max(0, 5 - formData.images.length);
        const nextFiles = Array.from(files).slice(0, remainingSlots);

        if (nextFiles.length === 0) {
            setLocalError("You already added the maximum 5 shop photos.");
            return;
        }

        const validFiles: File[] = [];
        let firstValidationError: string | null = null;

        for (const file of nextFiles) {
            const validationError = validateBusinessImageSelection(file);
            if (validationError) {
                firstValidationError = validationError;
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            setLocalError(firstValidationError || "Unable to add these files.");
            return;
        }

        setFormData({
            ...formData,
            images: [...formData.images, ...validFiles],
        });
        setLocalError(null);
    };

    const { isDraggingOver, dropzoneProps } = useImageDropzone({
        onUpload: handleShopImageUpload,
    });

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <p className="text-sm font-medium text-foreground-secondary">
                    Shop or workshop photos <span className="text-destructive">*</span>
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                    {helperText} Supported formats: JPG, PNG, WebP, AVIF, HEIC, HEIF up to {BUSINESS_UPLOAD_MAX_MB}MB each.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {formData.images.map((file, index) => (
                    <ShopImageTile
                        key={`${typeof file === "string" ? file : file.name}-${index}`}
                        file={file}
                        index={index}
                        total={formData.images.length}
                        onRemove={() => removeShopImage(index)}
                    />
                ))}

                {formData.images.length < 5 && (
                    <label
                        tabIndex={0}
                        role="button"
                        aria-label={`Add shop photo, ${formData.images.length} of 5 uploaded`}
                        {...dropzoneProps}
                        className={cn(
                            "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isDraggingOver
                                ? "border-primary bg-primary/10 scale-[1.02] shadow-md"
                                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                        )}
                    >
                        <Upload className="mb-3 h-6 w-6 text-foreground-subtle" />
                        <span className="text-sm font-semibold text-foreground-secondary">Add photo</span>
                        <span className="mt-1 text-xs text-muted-foreground">{formData.images.length}/5 uploaded</span>
                        <input
                            id="reg-shop-images"
                            name="reg-shop-images"
                            type="file"
                            accept={BUSINESS_IMAGE_ACCEPT}
                            multiple
                            className="hidden"
                            tabIndex={-1}
                            aria-label="Add shop photos"
                            onChange={(e) => e.target.files && handleShopImageUpload(e.target.files)}
                        />
                    </label>
                )}
            </div>

            <FormError message={formData.errors?.images || localError || undefined} />
        </div>
    );
}
