"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, AlertCircle } from "@/icons/IconRegistry";
import type { ListingImage } from "@/types/listing";
import { cn } from "@/components/ui/utils";
import { Stack } from "@esparex/ui";

import { getRemovePhotoAriaLabel } from "./uploadHelpers";
import { useImageDropzone } from "./useImageDropzone";
import { UploadSourcePicker } from "./UploadSourcePicker";
import { useIsMobileDevice } from "@/components/ui/useMobile";

interface ListingImagesFieldProps {
    images: ListingImage[];
    onUpload: (files: File[]) => void;
    onRemove: (idOrIndex: any) => void;
    onSetMain?: (index: number) => void;
    onReorder?: (startIndex: number, endIndex: number) => void;
    firstImageBadgeLabel?: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
}

export function ListingImagesField({
    images,
    onUpload,
    onRemove,
    onSetMain,
    onReorder,
    firstImageBadgeLabel = "Cover Photo",
    error,
    helperText,
    disabled = false,
}: ListingImagesFieldProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const isMobileDevice = useIsMobileDevice();

    const { isDraggingOver, dropzoneProps } = useImageDropzone({ onUpload, disabled });

    const handleOpenPicker = () => {
        if (disabled || pickerOpen) return;
        if (isMobileDevice) {
            setPickerOpen(true);
        } else {
            if (galleryInputRef.current) {
                galleryInputRef.current.value = "";
                galleryInputRef.current.click();
            }
        }
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

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (onReorder && draggedIndex !== null && draggedIndex !== targetIndex) {
            onReorder(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
        setDropTargetIndex(null);
    }, [draggedIndex, onReorder]);

    return (
        <Stack gap="sm">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-foreground">
                    Photos (up to 10)
                </label>
                <span className="text-tiny font-medium text-muted-foreground">
                    {images.length}/10 uploaded
                </span>
            </div>

            <div className="w-full">
                <Stack gap="md">
                    <div
                        {...dropzoneProps}
                        className={cn(
                            "flex min-h-[112px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 relative overflow-hidden",
                            disabled
                                ? "opacity-60 cursor-not-allowed border-border bg-muted/50"
                                : isDraggingOver
                                    ? "border-primary bg-primary/10 scale-[1.01] shadow-md"
                                    : "border-border bg-card hover:bg-muted/30 hover:border-primary/50"
                        )}
                    >
                        {disabled ? (
                            <div className="flex flex-col items-center justify-center text-primary animate-pulse py-2">
                                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                                <span className="text-xs font-semibold">Processing & Compressing Photos...</span>
                            </div>
                        ) : isDraggingOver ? (
                            <div className="flex flex-col items-center justify-center text-primary py-2">
                                <Upload className="w-8 h-8 mb-2 text-primary animate-bounce" />
                                <span className="text-xs font-semibold">Drop photos here</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={handleOpenPicker}
                                    aria-label="Add product photos"
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation cursor-pointer active:scale-95"
                                >
                                    <Upload className="w-4 h-4 text-primary" />
                                    <span>+ Add Photos</span>
                                </button>
                                {images.length === 0 && (
                                    <span className="text-xs text-muted-foreground">First image will be the cover</span>
                                )}
                            </div>
                        )}
                    </div>

                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        tabIndex={-1}
                        aria-label="Take photo with camera"
                        disabled={disabled}
                        onChange={(e) => {
                            if (!e.target.files) return;
                            onUpload(Array.from(e.target.files));
                            e.target.value = "";
                        }}
                    />

                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        tabIndex={-1}
                        aria-label="Choose photos from gallery"
                        disabled={disabled}
                        onChange={(e) => {
                            if (!e.target.files) return;
                            onUpload(Array.from(e.target.files));
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

                    {images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {images.map((img, index) => (
                                <div
                                    key={img.id || index}
                                    draggable={Boolean(onReorder && !disabled)}
                                    onDragStart={(e) => {
                                        setDraggedIndex(index);
                                        e.dataTransfer.effectAllowed = "move";
                                        e.dataTransfer.setData("text/plain", String(index));
                                    }}
                                    onDragOver={(e) => {
                                        if (onReorder) {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                            if (draggedIndex !== index) {
                                                setDropTargetIndex(index);
                                            }
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (dropTargetIndex === index) {
                                            setDropTargetIndex(null);
                                        }
                                    }}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={() => {
                                        setDraggedIndex(null);
                                        setDropTargetIndex(null);
                                    }}
                                    className={cn(
                                        "relative aspect-square rounded-xl overflow-hidden border bg-muted group shadow-sm transition-all duration-200",
                                        onReorder && !disabled && "cursor-grab active:cursor-grabbing",
                                        draggedIndex === index && "opacity-40 scale-90 border-primary border-dashed",
                                        dropTargetIndex === index && "ring-2 ring-primary ring-offset-2 scale-105",
                                        "border-border"
                                    )}
                                >
                                    <Image
                                        src={img.preview}
                                        alt={`Photo ${index + 1}`}
                                        fill
                                        unoptimized
                                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                                        className="object-cover pointer-events-none"
                                    />

                                    {/* Mobile Always-Visible Remove Button / Desktop Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-auto">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm("Remove this photo?")) {
                                                        onRemove(img.id ?? index);
                                                    }
                                                }}
                                                aria-label={getRemovePhotoAriaLabel(index, images.length)}
                                                className="p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer shadow-sm"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {onSetMain && index !== 0 && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSetMain(index);
                                                }}
                                                className="w-full py-1.5 text-[10px] font-bold text-white bg-black/70 rounded-md backdrop-blur-sm hover:bg-primary transition-colors uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation cursor-pointer"
                                            >
                                                Make Cover
                                            </button>
                                        )}
                                    </div>

                                    {index === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/95 py-1 text-center text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none shadow-sm backdrop-blur-sm">
                                            {firstImageBadgeLabel}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Stack>
            </div>
            
            {(error || helperText) && (
                <div className="mt-1.5">
                    {error ? (
                        <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-xs">{helperText}</p>
                    )}
                </div>
            )}
        </Stack>
    );
}
