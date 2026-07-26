"use client";

import Image from "next/image";
import { Field } from "@/components/ui/field";
import { MapPin, Upload, X } from "@/icons/IconRegistry";
import type { LucideIcon } from "lucide-react";
import type { ListingImage } from "@/types/listing";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";

interface ListingImagesFieldProps {
    images: ListingImage[];
    onUpload: (files: File[]) => void;
    onRemove: (id: string) => void;
    firstImageBadgeLabel?: string;
    error?: string;
    helperText?: string;
}

export function ListingImagesField({
    images,
    onUpload,
    onRemove,
    firstImageBadgeLabel = "MAIN",
    error,
    helperText,
}: ListingImagesFieldProps) {
    return (
        <Field label="Photos (up to 10)" error={error}>
            <div className="space-y-3">
                <label
                    tabIndex={0}
                    role="button"
                    aria-label="Tap to add photos"
                    onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.querySelector("input")?.click();
                        }
                    }}
                    className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <Upload className="w-6 h-6 text-foreground-subtle mb-1" />
                    <span className="text-sm font-medium text-foreground-tertiary">Tap to add photos</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        tabIndex={-1}
                        aria-label="Upload photos"
                        onChange={(e) => {
                            if (!e.target.files) return;
                            onUpload(Array.from(e.target.files));
                            e.target.value = "";
                        }}
                    />
                </label>
                {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group"
                            >
                                <Image
                                    src={img.preview}
                                    alt={`Photo ${index + 1}`}
                                    fill
                                    unoptimized
                                    sizes="25vw"
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-start justify-end p-1">
                                    <button
                                        type="button"
                                        onClick={() => onRemove(img.id)}
                                        aria-label={`Remove photo ${index + 1} of ${images.length}`}
                                        className="p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {index === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 bg-primary py-0.5 text-center text-xs font-semibold text-white pointer-events-none">
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
                    className="pr-16"
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
}
export function ListingPriceField({ label = "Price (₹)", error, required = true, registerProps, placeholder = "0", showCurrencySymbol = false }: ListingPriceFieldProps) {
    return (
        <Field label={label} error={error} required={required}>
            <div className="relative">
                {showCurrencySymbol && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pointer-events-none">₹</span>
                )}
                <Input
                    type="number"
                    min={0}
                    {...registerProps}
                    placeholder={placeholder}
                    className={cn(
                        "",
                        showCurrencySymbol && "pl-8"
                    )}
                />
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
                    className="min-h-[132px] pb-6"
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
                "grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-xl p-1",
                error ? "ring-2 ring-red-100 bg-red-50/30" : ""
            )}>
            {categories.map((cat) => {
                const Icon = cat.icon || DefaultIcon;
                const selected = cat.id === selectedCategoryId;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id || "")}
                        disabled={disabled}
                        className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-center transition-all",
                            selected
                                ? "bg-primary border-primary text-white"
                                : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300",
                            disabled && !selected ? "opacity-40" : ""
                        )}
                    >
                        <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-foreground-subtle")} />
                        <span className="w-full truncate px-1 text-xs font-semibold leading-tight">
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
