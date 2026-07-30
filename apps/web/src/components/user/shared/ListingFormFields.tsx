"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Field } from "@/components/ui/field";
import { MapPin, Upload, X } from "@/icons/IconRegistry";
import type { LucideIcon } from "@/icons/IconRegistry";
import type { ListingImage } from "@/types/listing";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";

import { getRemovePhotoAriaLabel } from "./uploadHelpers";
import { useImageDropzone } from "./useImageDropzone";
import { UploadSourcePicker } from "./UploadSourcePicker";

interface ListingImagesFieldProps {
    images: ListingImage[];
    onUpload: (files: File[]) => void;
    onRemove: (idOrIndex: any) => void;
    onSetMain?: (index: number) => void;
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
    firstImageBadgeLabel = "MAIN",
    error,
    helperText,
    disabled = false,
}: ListingImagesFieldProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const { isDraggingOver, dropzoneProps } = useImageDropzone({ onUpload, disabled });

    const handleOpenPicker = () => {
        if (disabled || pickerOpen) return;
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
        <Field label="Photos (up to 10)" error={error}>
            <div className="space-y-3">
                <div
                    {...dropzoneProps}
                    className={cn(
                        "flex min-h-[112px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 relative overflow-hidden",
                        disabled
                            ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                            : isDraggingOver
                                ? "border-primary bg-primary/10 scale-[1.01] shadow-md"
                                : "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                    )}
                >
                    {disabled ? (
                        <div className="flex flex-col items-center justify-center text-primary animate-pulse py-2">
                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1.5" />
                            <span className="text-xs font-semibold">Processing & Compressing Photos...</span>
                        </div>
                    ) : isDraggingOver ? (
                        <div className="flex flex-col items-center justify-center text-primary py-2">
                            <Upload className="w-6 h-6 mb-1 text-primary animate-bounce" />
                            <span className="text-sm font-semibold">Drop photos here to upload</span>
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={handleOpenPicker}
                            aria-label="Add product photos"
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation cursor-pointer"
                        >
                            <Upload className="w-4 h-4 text-primary" />
                            <span>+ Add Photos</span>
                        </button>
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                        {images.map((img, index) => (
                            <div
                                key={img.id || index}
                                className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
                            >
                                <Image
                                    src={img.preview}
                                    alt={`Photo ${index + 1}`}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                                    className="object-cover"
                                />

                                {/* Mobile Always-Visible Remove Button / Desktop Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-1.5 pointer-events-auto">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove(img.id ?? index);
                                            }}
                                            aria-label={getRemovePhotoAriaLabel(index, images.length)}
                                            className="p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
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
                                            className="w-full py-1 text-tiny font-semibold text-white bg-black/70 rounded-md backdrop-blur-sm hover:bg-primary transition-colors uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation"
                                        >
                                            Set Main
                                        </button>
                                    )}
                                </div>

                                {index === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 bg-primary/95 py-0.5 text-center text-tiny font-bold text-white uppercase tracking-wider pointer-events-none shadow-xs">
                                        {firstImageBadgeLabel}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {helperText && !error ? (
                    <p className="text-xs text-muted-foreground">{helperText}</p>
                ) : null}
            </div>
        </Field>
    );
}

interface ListingLocationFieldProps {
    display: string;
    placeholder?: string;
    fixedLabel?: string;
    error?: string;
    helperText?: string;
}

export function ListingLocationField({
    display,
    placeholder,
    fixedLabel = "Fixed",
    error,
    helperText,
}: ListingLocationFieldProps) {
    return (
        <Field label="Listing Location" error={error}>
            <div className="space-y-2">
                {display ? (
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-foreground-secondary">
                        <MapPin className="w-4 h-4 text-foreground-subtle shrink-0" />
                        <span className="truncate">{display}</span>
                        <span className="ml-auto shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                            {fixedLabel}
                        </span>
                    </div>
                ) : (
                    placeholder
                        ? (
                            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-foreground-secondary">
                                <MapPin className="w-4 h-4 text-foreground-subtle shrink-0" />
                                <span className="truncate">{placeholder}</span>
                                <span className="ml-auto shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                                    {fixedLabel}
                                </span>
                            </div>
                        )
                        : <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                )}
                {helperText && !error ? (
                    <p className="text-xs text-muted-foreground">{helperText}</p>
                ) : null}
            </div>
        </Field>
    );
}

interface ListingTitleFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    registerProps: UseFormRegisterReturn;
    placeholder: string;
    valueLength: number;
    maxLength?: number;
}
export function ListingTitleField({ label, error, required = true, registerProps, placeholder, valueLength, maxLength = 60 }: ListingTitleFieldProps) {
    return (
        <Field label={label} error={error} required={required}>
            <div className="relative">
                <Input
                    {...registerProps}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="pr-16 h-11 text-sm font-medium border-slate-200 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600"
                />
                <span className={cn(
                    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums",
                    valueLength > (maxLength - 5) ? "text-red-400" : "text-foreground-subtle"
                )}>
                    {valueLength}/{maxLength}
                </span>
            </div>
        </Field>
    );
}

interface ListingPriceFieldProps {
    label?: string;
    error?: string;
    required?: boolean;
    registerProps: UseFormRegisterReturn;
    placeholder?: string;
    showCurrencySymbol?: boolean;
    isFree?: boolean;
    onToggleFree?: () => void;
    disabled?: boolean;
}
export function ListingPriceField({
    label = "Price (₹)",
    error,
    required = true,
    registerProps,
    placeholder = "0",
    showCurrencySymbol = false,
    isFree = false,
    onToggleFree,
    disabled = false,
}: ListingPriceFieldProps) {
    return (
        <Field label={label} error={error} required={required}>
            <div className="flex flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                    {showCurrencySymbol && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pointer-events-none">₹</span>
                    )}
                    <Input
                        type="number"
                        min={0}
                        disabled={disabled || isFree}
                        {...registerProps}
                        placeholder={placeholder}
                        className={cn(
                            "h-11 text-sm font-medium border-slate-200 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600",
                            showCurrencySymbol && "pl-8",
                            isFree && "bg-slate-50 border-slate-100 text-foreground-subtle"
                        )}
                    />
                </div>
                {onToggleFree && (
                    <button
                        type="button"
                        role="switch"
                        aria-checked={!!isFree}
                        onClick={onToggleFree}
                        onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                                e.preventDefault();
                                onToggleFree();
                            }
                        }}
                        className={cn(
                            "flex items-center justify-center gap-2 h-11 px-4 rounded-xl border cursor-pointer transition-all duration-200 shrink-0 sm:w-[35%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isFree ? "bg-green-50 border-green-200 text-green-800" : "bg-white border-slate-200 hover:border-slate-300 text-foreground-secondary"
                        )}
                    >
                        <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                            isFree ? "bg-green-600 border-green-600" : "bg-white border-slate-300"
                        )}>
                            {isFree && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">Free</span>
                    </button>
                )}
            </div>
        </Field>
    );
}

interface ListingDescriptionFieldProps {
    label?: string;
    error?: string;
    required?: boolean;
    registerProps: UseFormRegisterReturn;
    placeholder?: string;
    valueLength: number;
    maxLength?: number;
}
export function ListingDescriptionField({ label = "Description", error, required = true, registerProps, placeholder, valueLength, maxLength = 2000 }: ListingDescriptionFieldProps) {
    return (
        <Field label={label} error={error} required={required}>
            <div className="relative">
                <Textarea
                    {...registerProps}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="min-h-[120px] pb-6 text-sm font-medium border-slate-200 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600"
                />
                <span className={cn(
                    "pointer-events-none absolute right-3 bottom-2 text-xs font-medium tabular-nums",
                    valueLength > (maxLength - 100) ? "text-red-400" : "text-foreground-subtle"
                )}>
                    {valueLength}/{maxLength}
                </span>
            </div>
        </Field>
    );
}

interface CategorySelectorGridProps {
    categories: Array<{ id?: string; name?: string; icon?: LucideIcon }>;
    selectedCategoryId?: string;
    onSelect: (id: string) => void;
    disabled?: boolean;
    defaultIcon: LucideIcon;
    error?: string;
}

export function CategorySelectorGrid({
    categories,
    selectedCategoryId,
    onSelect,
    disabled = false,
    defaultIcon: DefaultIcon,
    error
}: CategorySelectorGridProps) {
    return (
        <div className="space-y-1.5">
            <div className={cn(
                "grid grid-cols-3 sm:grid-cols-4 gap-2.5 rounded-xl",
                error ? "ring-2 ring-red-100 bg-red-50/30 p-1" : ""
            )}>
            {categories.map((cat) => {
                const Icon = cat.icon || DefaultIcon;
                const selected = cat.id === selectedCategoryId;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id || "")}
                        disabled={disabled || (disabled && !selected)}
                        aria-pressed={selected}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 h-[68px] sm:h-[72px] py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer select-none group border",
                            selected
                                ? "bg-blue-50/90 border-2 border-blue-600 text-blue-950 font-bold shadow-sm ring-2 ring-blue-600/15"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs",
                            disabled && !selected ? "opacity-40 cursor-not-allowed" : ""
                        )}
                    >
                        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6 transition-colors", selected ? "text-blue-600 stroke-[2.2]" : "text-slate-400 group-hover:text-blue-600")} />
                        <span className={cn(
                            "text-tiny sm:text-xs font-semibold text-center leading-tight tracking-tight w-full px-0.5",
                            selected ? "text-blue-950 font-bold" : "text-slate-700 group-hover:text-slate-900 line-clamp-2"
                        )}>
                            {cat.name}
                        </span>
                    </button>
                );
            })}
            </div>
            {error && <p className="text-xs font-medium text-red-500 px-1">{error}</p>}
        </div>
    );
}

export function getFirstFormErrorMessage(error: unknown): string | undefined {
    if (!error) return undefined;
    if (typeof error === "string") return error;
    if (Array.isArray(error)) {
        for (const item of error) {
            const nested = getFirstFormErrorMessage(item);
            if (nested) return nested;
        }
        return undefined;
    }
    if (typeof error === "object") {
        const record = error as Record<string, unknown>;
        if (typeof record.message === "string" && record.message.trim().length > 0) {
            return record.message;
        }
        for (const value of Object.values(record)) {
            const nested = getFirstFormErrorMessage(value);
            if (nested) return nested;
        }
    }
    return undefined;
}
