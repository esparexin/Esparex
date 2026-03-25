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
}

export function ListingImagesField({
    images,
    onUpload,
    onRemove,
    firstImageBadgeLabel = "MAIN",
}: ListingImagesFieldProps) {
    return (
        <Field label="Photos (up to 10)">
            <div className="space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Tap to add photos</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
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
                                {index === 0 && (
                                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-primary text-white py-0.5">
                                        {firstImageBadgeLabel}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemove(img.id)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Field>
    );
}

interface ListingLocationFieldProps {
    display: string;
    placeholder?: string;
    fixedLabel?: string;
}

export function ListingLocationField({
    display,
    placeholder,
    fixedLabel = "Fixed",
}: ListingLocationFieldProps) {
    return (
        <Field label="Listing Location">
            {display ? (
                <div className="flex items-center gap-2 h-12 px-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{display}</span>
                    <span className="ml-auto text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase font-bold shrink-0">
                        {fixedLabel}
                    </span>
                </div>
            ) : (
                placeholder
                    ? (
                        <div className="flex items-center gap-2 h-12 px-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm text-slate-700">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{placeholder}</span>
                            <span className="ml-auto text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase font-bold shrink-0">
                                {fixedLabel}
                            </span>
                        </div>
                    )
                    : <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
            )}
        </Field>
    );
}

interface ListingTitleFieldProps {
    label: string;
    error?: string;
    registerProps: UseFormRegisterReturn;
    placeholder: string;
    valueLength: number;
    maxLength?: number;
}
export function ListingTitleField({ label, error, registerProps, placeholder, valueLength, maxLength = 60 }: ListingTitleFieldProps) {
    return (
        <Field label={label} error={error}>
            <div className="relative">
                <Input
                    {...registerProps}
                    placeholder={placeholder}
                    className="h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary pr-16"
                />
                <span className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums pointer-events-none",
                    valueLength > (maxLength - 5) ? "text-red-400" : "text-slate-400"
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
    registerProps: UseFormRegisterReturn;
    placeholder?: string;
    showCurrencySymbol?: boolean;
}
export function ListingPriceField({ label = "Price (₹)", error, registerProps, placeholder = "0", showCurrencySymbol = false }: ListingPriceFieldProps) {
    return (
        <Field label={label} error={error}>
            <div className="relative">
                {showCurrencySymbol && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">₹</span>
                )}
                <Input
                    type="number"
                    min={0}
                    {...registerProps}
                    placeholder={placeholder}
                    className={cn(
                        "h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary",
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
    registerProps: UseFormRegisterReturn;
    placeholder?: string;
    valueLength: number;
    maxLength?: number;
}
export function ListingDescriptionField({ label = "Description", error, registerProps, placeholder, valueLength, maxLength = 2000 }: ListingDescriptionFieldProps) {
    return (
        <Field label={label} error={error}>
            <div className="relative">
                <Textarea
                    {...registerProps}
                    placeholder={placeholder}
                    className="min-h-[120px] rounded-xl border-2 border-slate-200 bg-white text-sm pb-6"
                />
                <span className={cn(
                    "absolute right-3 bottom-2 text-[10px] font-medium tabular-nums pointer-events-none",
                    valueLength > (maxLength - 100) ? "text-red-400" : "text-slate-400"
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
}

export function CategorySelectorGrid({
    categories,
    selectedCategoryId,
    onSelect,
    disabled = false,
    defaultIcon: DefaultIcon
}: CategorySelectorGridProps) {
    return (
        <div className="grid grid-cols-4 gap-2">
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
                            "flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all text-center",
                            selected
                                ? "bg-primary border-primary text-white"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200",
                            disabled && !selected ? "opacity-40" : ""
                        )}
                    >
                        <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-slate-400")} />
                        <span className="text-[10px] font-bold leading-tight truncate w-full px-1">
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

