"use client";

import { useCallback, useLayoutEffect } from "react";
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
import { ModelSearchSelect } from "@/components/user/ModelSearchSelect";
import { Z_INDEX } from "@/lib/zIndexConfig";

const getNestedFieldMeta = (source: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, source);

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
        stepValidationAttempts,
        currentStep,
        form,
        loadSparePartsForCategory,
        loadBrandsForCategory,
        brandsError,
        sparePartsError,
        brandIsPending,
    } = usePostAd();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    // Use brand name (not ID) as value for BrandSearchSelect since PostAd
    // context maps names → IDs internally via handleBrandChange
    const brandNameValue = String(watch("brand") || "");
    const brandIdValue = String(watch("brandId") || "");
    
    // Model state
    const modelId = String(watch("modelId") || "");
    const modelNameValue = String(watch("model") || "");

    const screenSize = String(watch("screenSize") || "");
    const spareParts = watch("spareParts") || [];
    const deviceCondition = watch("deviceCondition");
    const {
        touchedFields,
    } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]) || currentStep > 1;
    const shouldShowFieldError = useCallback(
        (path: string) => {
            if (hasAttemptedStepValidation) return true;
            return Boolean(getNestedFieldMeta(touchedFields, path));
        },
        [hasAttemptedStepValidation, touchedFields]
    );
    const categoryError = shouldShowFieldError("categoryId") || shouldShowFieldError("category")
        ? (errors.categoryId?.message ?? errors.category?.message)
        : undefined;
    const brandError = shouldShowFieldError("brand") || shouldShowFieldError("brandId")
        ? (errors.brand?.message ?? errors.brandId?.message)
        : undefined;
    const screenSizeError = shouldShowFieldError("screenSize") ? errors.screenSize?.message : undefined;
    const modelError = shouldShowFieldError("model") || shouldShowFieldError("modelId")
        ? (errors.model?.message ?? errors.modelId?.message)
        : undefined;
    const deviceConditionError = shouldShowFieldError("deviceCondition") ? errors.deviceCondition?.message : undefined;

    // PostAd tracks brand as name string in form "brand" field.
    // BrandSearchSelect matches by id — use name as id so selection round-trips correctly.
    const brandMapForSelect = Object.fromEntries(
        availableBrands.map((name) => [name, { id: name }])
    );

    useLayoutEffect(() => {
        register("category");
        register("brand");
        register("brandId");
        register("model");
        register("modelId");
        register("screenSize");
        register("deviceCondition");
    }, [register]);

    return (
        <div className="space-y-6" data-testid="device-identity-fields">

            {/* Category */}
            <section className="space-y-4">
                <Field error={categoryError} label="Select Category" required>
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
                                    <Icon className={cn("w-5 h-5", selected ? "text-primary-foreground" : "text-foreground-subtle")} />
                                    <span className={cn("text-xs font-semibold text-center leading-tight truncate w-full px-1", selected ? "text-primary-foreground" : "text-foreground-tertiary")}>
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
                    <Field label="Brand" error={brandError} required>
                        {brandIsPending && availableBrands.length === 0 ? (
                            <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                        ) : (
                            <BrandSearchSelect
                                brands={availableBrands}
                                brandMap={brandMapForSelect}
                                value={brandNameValue}
                                onChange={(_id, name) => handleBrandChange(name)}
                                disabled={brandIsPending}
                                placeholder={brandIsPending ? "Loading brands…" : "Search or select brand"}
                            />
                        )}
                        {brandIsPending && availableBrands.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                Updating brands…
                            </p>
                        )}
                    </Field>
                    
                    {brandsError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs text-red-700 text-center mb-2">
                                {brandsError}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => loadBrandsForCategory(categoryId)}
                                className="w-full text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Model — server-side search enabled */}
                    <Field 
                        label="Model" 
                        error={modelError} 
                        required
                        className={cn(!brandNameValue && "opacity-60 grayscale-[0.5] pointer-events-none")}
                    >
                        {!brandNameValue ? (
                            <div className="h-12 w-full rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 text-sm text-slate-400 font-medium">
                                Select brand first...
                            </div>
                        ) : (
                            <ModelSearchSelect
                                brandId={brandIdValue}
                                brandName={brandNameValue}
                                categoryId={categoryId}
                                value={modelId || modelNameValue}
                                onChange={(mId, mName) => {
                                    setValue("modelId", mId as any, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                    setValue("model", mName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                }}
                                onBrandResolved={(resolvedBrandId, resolvedBrandName) => {
                                    // A new pending brand was created — sync its ID back into the form
                                    // so the ad payload carries the correct brandId ObjectId.
                                    setValue("brandId", resolvedBrandId as any, { shouldDirty: true });
                                    setValue("brand", resolvedBrandName, { shouldDirty: true });
                                }}
                            />
                        )}
                    </Field>

                    {/* Screen Size — only for LED-TV / monitor categories */}
                    {requiresScreenSize && (
                        <Field label="Screen Size" error={screenSizeError}>
                            <Select
                                value={screenSize || undefined}
                                onValueChange={(val) => setValue("screenSize", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 bg-white font-bold text-foreground focus:border-primary transition-colors px-3 text-sm">
                                    <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: Z_INDEX.selectContent }} className="rounded-xl border-2 border-slate-100 shadow-xl">
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
                    <label className="text-sm font-bold text-foreground text-center block w-full">
                        Working Spare Parts
                    </label>
                    {isLoadingSpareParts ? (
                        <div className="space-y-2">
                            <p className="text-xs text-foreground-subtle text-center">
                                Loading spare parts...
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ) : sparePartsError ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-xs text-red-700 text-center mb-2">
                                    {sparePartsError}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadSparePartsForCategory(categoryId)}
                                    className="w-full text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    Try Again
                                </Button>
                            </div>
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
                                            "h-auto rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all",
                                            isSelected
                                                ? "bg-primary border-primary text-primary-foreground shadow-sm scale-[1.02]"
                                                : "bg-white border-slate-100 text-foreground-tertiary hover:border-slate-200"
                                        )}
                                    >
                                        <span className="truncate">{part.name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-foreground-tertiary text-center py-3">
                            No spare parts available for this category.
                        </p>
                    )}
                </section>
            )}

            {/* Device Condition — compact inline toggles */}
            <section className="space-y-3">
                <Field label="Device Condition" error={deviceConditionError}>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: "power_on", label: "Power On", dot: "bg-green-500", active: "bg-green-600 text-white border-green-600 shadow-sm" },
                            { value: "power_off", label: "Power Off", dot: "bg-red-500", active: "bg-red-600 text-white border-red-600 shadow-sm" },
                        ].map(({ value, label, dot, active }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setValue("deviceCondition", value as any, { shouldValidate: true, shouldTouch: true })}
                                className={cn(
                                    "flex items-center gap-2 h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all",
                                    deviceCondition === value
                                        ? active
                                        : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300"
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
