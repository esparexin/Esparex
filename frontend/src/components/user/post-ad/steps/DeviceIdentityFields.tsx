"use client";

import { useLayoutEffect } from "react";
import { usePostAd } from "../PostAdContext";
import { CircuitBoard } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";

export default function DeviceIdentityFields() {
    const {
        dynamicCategories,
        availableBrands,
        availableSizes,
        register,
        watch,
        setValue,
        errors,
        handleCategoryChange,
        handleBrandChange,
        toggleSparePart,
        availableSpareParts,
        isLoadingSpareParts,
        requiresScreenSize,
    } = usePostAd();

    const categoryId = String(watch("category") || "");
    // Use brand name (not ID) as value for BrandSearchSelect since PostAd
    // context maps names → IDs internally via handleBrandChange
    const brandNameValue = String(watch("brand") || "");
    const screenSize = String(watch("screenSize") || "");
    const spareParts = watch("spareParts") || [];
    const deviceCondition = watch("deviceCondition");

    // PostAd tracks brand as name string in form "brand" field.
    // BrandSearchSelect matches by id — use name as id so selection round-trips correctly.
    const brandMapForSelect = Object.fromEntries(
        availableBrands.map((name) => [name, { id: name }])
    );

    useLayoutEffect(() => {
        register("category");
        register("brand");
        register("brandId");
        register("screenSize");
        register("deviceCondition");
    }, [register]);

    return (
        <div className="space-y-6" data-testid="device-identity-fields">

            {/* Category */}
            <section className="space-y-4">
                <Field error={errors.categoryId?.message ?? errors.category?.message} label="Select Category">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {dynamicCategories.map((cat) => {
                            const Icon = cat.icon || CircuitBoard;
                            const selected = cat.id === categoryId;
                            return (
                                <Button
                                    key={cat.id}
                                    type="button"
                                    variant={selected ? "default" : "outline"}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 h-auto py-3 px-1 rounded-xl transition-all duration-200 border-2",
                                        selected
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-white hover:bg-slate-50 border-slate-100"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", selected ? "text-primary-foreground" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-bold text-center leading-tight truncate w-full px-1", selected ? "text-primary-foreground" : "text-slate-600")}>
                                        {cat.name}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                </Field>
            </section>

            {/* Brand & Screen Size */}
            <section className="space-y-4">
                <div className="flex flex-col gap-4">
                    <Field label="Brand" error={errors.brand?.message ?? errors.brandId?.message}>
                        <BrandSearchSelect
                            brands={availableBrands}
                            brandMap={brandMapForSelect}
                            value={brandNameValue}
                            onChange={(_id, name) => handleBrandChange(name)}
                        />
                    </Field>

                    {/* Screen Size — only for LED-TV / monitor categories */}
                    {requiresScreenSize && (
                        <Field label="Screen Size" error={errors.screenSize?.message}>
                            <Select
                                value={screenSize || undefined}
                                onValueChange={(val) => setValue("screenSize", val, { shouldValidate: true, shouldDirty: true })}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-900 focus:border-primary transition-colors px-3 text-sm">
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-slate-100 shadow-xl z-[99999]">
                                    {availableSizes.map((size) => (
                                        <SelectItem key={size} value={size} className="font-medium py-2.5 px-3 text-sm">
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                </div>
            </section>

            {/* Spare Parts — only show once a category is selected */}
            {categoryId && (
                <section className="space-y-4">
                    <label className="text-sm font-bold text-slate-900 text-center block w-full">
                        Working Spare Parts
                    </label>
                    {isLoadingSpareParts ? (
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : availableSpareParts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {availableSpareParts.map((part) => {
                                const isSelected = spareParts.includes(part.id as string);
                                return (
                                    <Button
                                        key={part.id as string}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        onClick={() => toggleSparePart(part.id as string)}
                                        className={cn(
                                            "h-auto py-2.5 px-2 rounded-xl border text-xs font-bold transition-all",
                                            isSelected
                                                ? "bg-primary border-primary text-primary-foreground shadow-sm scale-[1.02]"
                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                        )}
                                    >
                                        <span className="truncate">{part.name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-3">
                            No spare parts listed for this category.
                        </p>
                    )}
                </section>
            )}

            {/* Device Condition — compact inline toggles */}
            <section className="space-y-3">
                <Field label="Device Condition" error={errors.deviceCondition?.message}>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: "power_on", label: "Power On", dot: "bg-green-500", active: "bg-green-600 text-white border-green-600 shadow-sm" },
                            { value: "power_off", label: "Power Off", dot: "bg-red-500", active: "bg-red-600 text-white border-red-600 shadow-sm" },
                        ].map(({ value, label, dot, active }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setValue("deviceCondition", value as any, { shouldValidate: true })}
                                className={cn(
                                    "flex items-center gap-2 h-10 px-4 rounded-xl border-2 text-sm font-bold transition-all",
                                    deviceCondition === value
                                        ? active
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                )}
                            >
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", deviceCondition === value ? "bg-white/80" : dot)} />
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>
            </section>

        </div>
    );
}
