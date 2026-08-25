"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, AlertCircle } from "@/icons/IconRegistry";
import type { ListingImage } from "@/types/listing";
import { cn } from "@/components/ui/utils";
import { Stack } from "@esparex/ui";

import { useImageDropzone } from "./useImageDropzone";
import { UploadSourcePicker } from "./UploadSourcePicker";
import { useIsMobileDevice } from "@/components/ui/useMobile";
import { ListingImageTile } from "./ListingImageTile";

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

            <div className="w-full" {...dropzoneProps}>
                <Stack gap="md">
                    {images.length === 0 ? (
                        <div className="w-full">
                            {disabled ? (
                                <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-primary animate-pulse px-4">
                                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs font-semibold">Processing & Compressing Photos...</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={handleOpenPicker}
                                    aria-label="Add product photos"
                                    className={cn(
                                        "flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                        isDraggingOver
                                            ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-sm"
                                            : "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary text-primary"
                                    )}
                                >
                                    <Upload className={cn("w-4 h-4 text-primary", isDraggingOver && "animate-bounce")} />
                                    <span>{isDraggingOver ? "Drop photos here" : "+ Add Photos"}</span>
                                    {!isDraggingOver && (
                                        <span className="text-tiny font-normal text-muted-foreground ml-1">(First photo is cover)</span>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                            {images.map((img, index) => (
                                <ListingImageTile
                                    key={img.id || index}
                                    img={img}
                                    index={index}
                                    totalImages={images.length}
                                    disabled={disabled}
                                    onReorder={onReorder}
                                    onRemove={onRemove}
                                    onSetMain={onSetMain}
                                    firstImageBadgeLabel={firstImageBadgeLabel}
                                    draggedIndex={draggedIndex}
                                    dropTargetIndex={dropTargetIndex}
                                    setDraggedIndex={setDraggedIndex}
                                    setDropTargetIndex={setDropTargetIndex}
                                    onDrop={handleDrop}
                                />
                            ))}

                            {/* Compact Add Photo Tile inside grid */}
                            {images.length < 10 && (
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={handleOpenPicker}
                                    aria-label="Add more photos"
                                    className="aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-card hover:bg-muted/40 hover:border-primary/50 text-foreground transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
                                >
                                    <Upload className="w-4 h-4 text-primary" />
                                    <span className="text-tiny font-semibold text-muted-foreground">+ Add</span>
                                </button>
                            )}
                        </div>
                    )}

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
