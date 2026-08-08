"use client";


import { Field } from "@/components/ui/field";
import { MapPin } from "@/icons/IconRegistry";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";



// Extracted ListingPriceField to its own file
export { ListingImagesField } from "./ListingImagesField";
export { ListingPriceField } from "./ListingPriceField";

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
        <Field label="Listing Location" labelClassName="text-sm font-medium" error={error}>
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
        <Field label={label} labelClassName="text-sm font-medium" error={error} required={required}>
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
        <Field label={label} labelClassName="text-sm font-medium" error={error} required={required}>
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
    categories: Array<{ id?: string; name?: string; icon?: any }>;
    selectedCategoryId?: string;
    onSelect: (id: string) => void;
    disabled?: boolean;
    defaultIcon: any;
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
                        onClick={(e) => {
                            e.currentTarget.blur();
                            onSelect(cat.id || "");
                        }}
                        disabled={disabled || (disabled && !selected)}
                        aria-pressed={selected}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 h-[56px] sm:h-[60px] py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer select-none group border",
                            selected
                                ? "bg-blue-50/90 border-2 border-blue-600 text-blue-950 font-bold shadow-sm ring-2 ring-blue-600/15"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs",
                            disabled && !selected ? "opacity-40 cursor-not-allowed" : ""
                        )}
                    >
                        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-colors", selected ? "text-blue-600 stroke-[2.2]" : "text-slate-400 group-hover:text-blue-600")} />
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
