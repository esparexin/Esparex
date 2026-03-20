"use client";

import { useState, useRef, useEffect, useMemo, type CSSProperties } from "react";
import { usePostAd } from "../PostAdContext";
import { Check, CircuitBoard } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";

export default function DeviceIdentityFields() {
    const {
        // Data
        dynamicCategories,
        availableBrands,
        availableSizes,

        // RHF
        register,
        watch,
        setValue,
        errors,

        // Logic
        handleCategoryChange,
        handleBrandChange,
        toggleSparePart,
        // Error management
        setFormError,

        availableSpareParts,
        isLoadingSpareParts,
        requiresScreenSize,
    } = usePostAd();

    // Watch values for UI logic
    const categoryId = String(watch("category") || "");
    const brandName = String(watch("brand") || "");
    const screenSize = String(watch("screenSize") || "");
    const spareParts = watch("spareParts") || [];

    const [brandSearch, setBrandSearch] = useState("");
    const [isEditingBrand, setIsEditingBrand] = useState(false);

    const brandInputRef = useRef<HTMLInputElement>(null);
    const brandContainerRef = useRef<HTMLDivElement>(null);
    const [brandDropdownStyle, setBrandDropdownStyle] = useState<CSSProperties>({});

    // Register fields for RHF
    useEffect(() => {
        register("category");
        register("brand");
        register("brandId");
        register("screenSize");
        register("deviceCondition");
    }, [register]);

    // Fixed-position brand dropdown — avoids overflow-y:auto clipping on desktop modal layout.
    useEffect(() => {
        if (!brandSearch) {
            setBrandDropdownStyle({});
            return;
        }
        const updateBrandPosition = () => {
            const container = brandContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownMaxH = 280;
            setBrandDropdownStyle({
                position: "fixed",
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                maxHeight: Math.min(dropdownMaxH, Math.max(spaceBelow - 8, 80)),
            });
        };
        updateBrandPosition();
        window.addEventListener("scroll", updateBrandPosition, true);
        window.addEventListener("resize", updateBrandPosition);
        return () => {
            window.removeEventListener("scroll", updateBrandPosition, true);
            window.removeEventListener("resize", updateBrandPosition);
        };
    }, [brandSearch]);

    // Clear search input when brand is selected
    useEffect(() => {
        if (brandName) setBrandSearch("");
    }, [brandName]);

    const filteredBrands = useMemo(
        () =>
            brandSearch
                ? availableBrands.filter((b) =>
                    b.toLowerCase().includes(brandSearch.toLowerCase())
                )
                : availableBrands,
        [availableBrands, brandSearch]
    );

    const deviceCondition = watch("deviceCondition");

    return (
        <div className="space-y-6" data-testid="device-identity-fields">

            {/* Category */}
            <section className="space-y-4">
                <Field error={errors.category?.message} label="Select Category">
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

            {/* Brand & Screen Size (shown for LED-TV / monitor categories) */}
            <section className="space-y-4">
                <div className="flex flex-col gap-4">
                    <Field label="Brand" error={errors.brand?.message}>
                        {brandName && !isEditingBrand ? (
                            <div className="flex items-center justify-between border-2 rounded-xl px-3 h-12 bg-slate-50/50 border-slate-100">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                    <span className="font-bold text-slate-900 text-sm truncate">{brandName}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingBrand(true)}
                                    className="text-primary hover:bg-primary/5 font-bold h-8 px-2 text-xs"
                                >
                                    Edit
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-1.5 items-start">
                                    <div className="relative flex-1" ref={brandContainerRef}>
                                        <Command className="border-2 rounded-xl border-slate-200 overflow-visible bg-white focus-within:border-primary transition-colors">
                                            <CommandInput
                                                ref={brandInputRef}
                                                value={brandSearch}
                                                onValueChange={(val) => {
                                                    setBrandSearch(val);
                                                    setFormError(null);
                                                }}
                                                placeholder="Search brand"
                                                className="h-10 border-none focus:ring-0 font-bold text-slate-900 text-sm"
                                            />
                                            {brandSearch && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[9998] bg-transparent"
                                                        onMouseDown={() => setBrandSearch("")}
                                                    />
                                                    <div
                                                        style={brandDropdownStyle}
                                                        className="bg-white border-2 rounded-xl shadow-xl border-slate-100 overflow-y-auto"
                                                    >
                                                        <CommandList>
                                                            {filteredBrands.length === 0 ? (
                                                                <CommandEmpty>
                                                                    <div className="py-6 px-4 text-center">
                                                                        <span className="text-sm text-slate-400">No brands found for "{brandSearch}"</span>
                                                                    </div>
                                                                </CommandEmpty>
                                                            ) : (
                                                                <CommandGroup>
                                                                    {filteredBrands.slice(0, 8).map((b) => (
                                                                        <CommandItem
                                                                            key={b}
                                                                            value={b}
                                                                            onSelect={() => {
                                                                                handleBrandChange(b);
                                                                                setBrandSearch("");
                                                                                setIsEditingBrand(false);
                                                                            }}
                                                                            className="py-2.5 px-3 aria-selected:bg-primary/5 aria-selected:text-primary cursor-pointer text-sm"
                                                                        >
                                                                            <span className="font-medium">{b}</span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            )}
                                                        </CommandList>
                                                    </div>
                                                </>
                                            )}
                                        </Command>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Field>

                    {/* Screen Size — only for LED-TV / monitor categories */}
                    {requiresScreenSize && (
                        <Field label="Screen Size" error={errors.screenSize?.message}>
                            <Select
                                value={screenSize}
                                onValueChange={(val) => setValue("screenSize", val, { shouldValidate: true })}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-900 focus:border-primary transition-colors px-3 text-sm">
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-slate-100 shadow-xl">
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
                        /* Loading skeleton */
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

            {/* Device Condition */}
            <section className="space-y-4">
                <Field label="Device Condition" error={errors.deviceCondition?.message}>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            type="button"
                            variant={deviceCondition === "power_on" ? "default" : "outline"}
                            onClick={() => setValue("deviceCondition", "power_on", { shouldValidate: true })}
                            className={cn(
                                "h-20 rounded-2xl flex flex-col gap-2 font-bold transition-all",
                                deviceCondition === "power_on"
                                    ? "bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-lg"
                                    : "bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-600"
                            )}
                        >
                            <div className={cn("w-3 h-3 rounded-full", deviceCondition === "power_on" ? "bg-white" : "bg-green-500")} />
                            <span>power on</span>
                        </Button>
                        <Button
                            type="button"
                            variant={deviceCondition === "power_off" ? "default" : "outline"}
                            onClick={() => setValue("deviceCondition", "power_off", { shouldValidate: true })}
                            className={cn(
                                "h-20 rounded-2xl flex flex-col gap-2 font-bold transition-all",
                                deviceCondition === "power_off"
                                    ? "bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-lg"
                                    : "bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-600"
                            )}
                        >
                            <div className={cn("w-3 h-3 rounded-full", deviceCondition === "power_off" ? "bg-white" : "bg-red-500")} />
                            <span>power off</span>
                        </Button>
                    </div>
                </Field>
            </section>

        </div>
    );
}
