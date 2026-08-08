import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { cn } from "@/components/ui/utils";
import {
    BUSINESS_IMAGE_ACCEPT,
    validateBusinessImageSelection,
} from "@/schemas/business.schema.shared";
import { getRemovePhotoAriaLabel } from "@/components/user/shared/uploadHelpers";
import { useImageDropzone } from "@/components/user/shared/useImageDropzone";
import { UploadSourcePicker } from "@/components/user/shared/UploadSourcePicker";
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
        <div className="group relative h-24 sm:h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <Image
                src={previewUrl}
                alt={`Shop ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover"
            />
            <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-t from-slate-900/65 via-slate-900/0 to-slate-900/0 p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-2xs font-semibold text-foreground-secondary shadow-sm">
                    Photo {index + 1}
                </span>
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={onRemove}
                    aria-label={getRemovePhotoAriaLabel(index, total)}
                    className="h-7 w-7 rounded-full bg-white/90 text-foreground-secondary shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <X className="h-3.5 w-3.5" />
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
}: ShopPhotosFieldProps) {
    const [localError, setLocalError] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

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

    const handleOpenPicker = () => {
        if (pickerOpen) return;
        setPickerOpen(true);
    };

    const handleCamera = () => {
        if (cameraInputRef.current) {
            cameraInputRef.current.value = "";
            cameraInputRef.current.click();
        }
    };

    const handleGallery = () => {
        if (galleryInputRef.current) {
            galleryInputRef.current.value = "";
            galleryInputRef.current.click();
        }
    };

    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-foreground-secondary truncate">
                Shop photo <span className="text-destructive">*</span>
            </p>

            <div className="grid grid-cols-1 gap-2">
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
                    <div
                        {...dropzoneProps}
                        className={cn(
                            "flex min-h-[96px] sm:min-h-[104px] w-full flex-col items-center justify-center rounded-2xl border border-dashed p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isDraggingOver
                                ? "border-primary bg-primary/10 scale-[1.02] shadow-md"
                                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                        )}
                    >
                        <span className="text-tiny font-medium text-muted-foreground mb-1.5">
                            {formData.images.length}/5 uploaded
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleOpenPicker}
                            aria-label="Add shop photo"
                            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold text-foreground-secondary shadow-2xs hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-primary touch-manipulation"
                        >
                            <Upload className="h-3.5 w-3.5 text-primary" />
                            <span>+ Add Photo</span>
                        </Button>
                    </div>
                )}
            </div>

            <input
                ref={cameraInputRef}
                id="reg-shop-camera"
                name="reg-shop-camera"
                type="file"
                accept={BUSINESS_IMAGE_ACCEPT}
                capture="environment"
                className="hidden"
                tabIndex={-1}
                aria-label="Take shop photo with camera"
                onChange={(e) => {
                    if (e.target.files) handleShopImageUpload(e.target.files);
                    e.target.value = "";
                }}
            />

            <input
                ref={galleryInputRef}
                id="reg-shop-images"
                name="reg-shop-images"
                type="file"
                accept={BUSINESS_IMAGE_ACCEPT}
                multiple
                className="hidden"
                tabIndex={-1}
                aria-label="Add shop photos"
                onChange={(e) => {
                    if (e.target.files) handleShopImageUpload(e.target.files);
                    e.target.value = "";
                }}
            />

            <UploadSourcePicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onCamera={handleCamera}
                onGallery={handleGallery}
                variant="listing"
            />

            <FormError message={formData.errors?.images || localError || undefined} />
        </div>
    );
}

