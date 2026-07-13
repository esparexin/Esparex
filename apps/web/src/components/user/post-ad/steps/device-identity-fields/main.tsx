"use client";

import { useCallback, useLayoutEffect } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { CircuitBoard } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { ModelSearchSelect } from "@/components/user/ModelSearchSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Z_INDEX } from "@/lib/zIndexConfig";
import { getVisibleAttributeFilters, renderAttributeField } from "./attribute-fields";

const DEVICE_CONDITION_OPTIONS = [
    { value: "power_on", label: "Power On", dot: "bg-green-500", active: "bg-green-600 text-white border-green-600 shadow-sm" },
    { value: "power_off", label: "Power Off", dot: "bg-red-500", active: "bg-red-600 text-white border-red-600 shadow-sm" },
] as const;

const getNestedFieldMeta = (source: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, source);

export default function DeviceIdentityFields({ currentStep = 1 }: { currentStep?: number }) {
    const { dynamicCategories, brandMap, availableBrands, availableSizes, availableSpareParts, isLoadingSpareParts, requiresScreenSize, categorySchema, brandsError, sparePartsError, brandIsPending } = usePostAdCatalog();
    const { stepValidationAttempts, form, errors, isEditMode, listingId } = usePostAdFlow();
    const { register, watch, setValue, handleCategoryChange, handleBrandChange, toggleSparePart, loadSparePartsForCategory, loadBrandsForCategory, refreshBrands } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");
    const brandIdValue = String(watch("brandId") ?? "");
    const attributes = watch("attributes") as Record<string, unknown> | undefined;
    const modelId = String(watch("modelId") ?? "");
    const modelNameValue = String(watch("model") ?? "");
    const screenSize = String(watch("screenSize") || "");
    const spareParts = watch("spareParts") || [];
    const deviceCondition = watch("deviceCondition");
    const { touchedFields } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]) || currentStep > 1;

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const categoryError = (shouldShowFieldError("categoryId") || shouldShowFieldError("category")) ? (errors.categoryId?.message ?? errors.category?.message) : undefined;
    const brandError = (shouldShowFieldError("brand") || shouldShowFieldError("brandId")) ? (errors.brand?.message ?? errors.brandId?.message) : undefined;
    const screenSizeError = shouldShowFieldError("screenSize") ? errors.screenSize?.message : undefined;
    const modelError = (shouldShowFieldError("model") || shouldShowFieldError("modelId")) ? (errors.model?.message ?? errors.modelId?.message) : undefined;
    const deviceConditionError = shouldShowFieldError("deviceCondition") ? errors.deviceCondition?.message : undefined;

    useLayoutEffect(() => { register("category"); register("brand"); register("brandId"); register("model"); register("modelId"); register("attributes"); register("screenSize"); register("deviceCondition"); }, [register]);

    const updateAttribute = useCallback((id: string, value: unknown) => {
        const current = form.getValues("attributes") as Record<string, unknown> | undefined;
        setValue("attributes", { ...(current ?? {}), [id]: value } as any, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [form, setValue]);

    const dynamicAttributeFilters = getVisibleAttributeFilters(categorySchema, attributes);

    return (
        <div className="space-y-4" data-testid="device-identity-fields">
            {/* Category */}
            <section className={cn("space-y-3", currentStep !== 1 && "hidden")}>
                <Field error={categoryError} label="Select Category" required>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {dynamicCategories.map((cat) => {
                            const Icon = cat.icon || CircuitBoard;
                            const selected = cat.id === categoryId;
                            return <Button key={cat.id} type="button" variant={selected ? "default" : "outline"} onClick={() => !isEditMode && handleCategoryChange(cat.id)} disabled={isEditMode && !selected}
                                className={cn("flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-xl transition-all duration-200 border-2", selected ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-slate-50 border-slate-100", isEditMode && "opacity-60 cursor-not-allowed")}>
                                <Icon className={cn("w-5 h-5", selected ? "text-primary-foreground" : "text-foreground-subtle")} aria-hidden="true" focusable="false" />
                                <span className={cn("text-xs font-semibold text-center leading-tight truncate w-full px-1", selected ? "text-primary-foreground" : "text-foreground-tertiary")}>{cat.name}</span>
                            </Button>;
                        })}
                    </div>
                </Field>
            </section>

            {/* Brand & Model */}
            <section className={cn("space-y-3", currentStep !== 2 && "hidden")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Field label="Brand" error={brandError} required>
                            {brandIsPending && availableBrands.length === 0 ? <div className="h-11 w-full rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                                : <BrandSearchSelect brands={availableBrands} brandMap={brandMap} categoryId={categoryId} value={brandNameValue} onChange={(_id, name, rId) => !isEditMode && handleBrandChange(name, rId)} onRequestSuccess={() => refreshBrands()} disabled={brandIsPending || isEditMode} placeholder={brandIsPending ? "Loading brands…" : "Search or select brand"} listingId={listingId} />}
                            {brandIsPending && availableBrands.length > 0 && <p className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full border-2 border-primary border-t-transparent animate-spin" />Updating brands&hellip;</p>}
                        </Field>
                        {brandsError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-xs text-red-700 text-center mb-2">{brandsError}</p><Button type="button" variant="outline" size="sm" onClick={() => loadBrandsForCategory(categoryId)} className="w-full text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50">Try Again</Button></div>}
                    </div>
                    {!requiresScreenSize && <div className="space-y-3">
                        <Field label="Model" error={modelError} className={cn((!brandNameValue || isEditMode) && "opacity-60 grayscale-[0.5] pointer-events-none")}>
                            {!brandNameValue ? <div className="h-11 w-full rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 text-sm text-slate-400 font-medium">Select brand first...</div>
                                : <ModelSearchSelect brandId={brandIdValue} brandName={brandNameValue} categoryId={categoryId} value={modelId || modelNameValue} modelDisplayName={modelNameValue}
                                    onChange={(mId, mName, rId) => { const aid = mId || rId || ""; setValue("modelId", aid, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); setValue("model", mName, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); setValue("deviceCondition", undefined, { shouldValidate: true, shouldDirty: true }); setValue("spareParts", [], { shouldValidate: true, shouldDirty: true }); }}
                                    onBrandResolved={(rbId, rbName) => { setValue("brandId", rbId, { shouldDirty: true }); setValue("brand", rbName, { shouldDirty: true }); }} listingId={listingId} />}
                        </Field>
                    </div>}
                </div>
                <div className="flex flex-col gap-3">
                    {dynamicAttributeFilters.length > 0 ? <section className={cn("space-y-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3", isEditMode && "opacity-60 pointer-events-none")}>
                        <div><p className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary">Category Details</p></div>
                        <div className="space-y-3">{dynamicAttributeFilters.map((f) => renderAttributeField(f, getAttributeValue(attributes, f.id) ?? f.defaultValue, shouldShowFieldError(`attributes.${f.id}`) ? (getNestedFieldMeta(errors, `attributes.${f.id}.message`) as string | undefined) : undefined, updateAttribute))}</div>
                    </section> : null}
                    {requiresScreenSize && <Field label="Screen Size" error={screenSizeError} className={cn(isEditMode && "opacity-60 pointer-events-none")}>
                        <Select value={screenSize || undefined} onValueChange={(val) => { setValue("screenSize", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); setValue("spareParts", [], { shouldValidate: true, shouldDirty: true }); }}>
                            <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 bg-white font-bold text-foreground focus:border-primary transition-colors px-3 text-sm"><SelectValue placeholder="Select size" /></SelectTrigger>
                            <SelectContent style={{ zIndex: Z_INDEX.selectContent }} className="rounded-xl border-2 border-slate-100 shadow-xl">
                                {availableSizes.map((size) => <SelectItem key={size} value={size} className="font-medium py-2.5 px-3 text-sm">{size}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>}
                </div>
            </section>

            {/* Condition & Extras */}
            <div className={cn("space-y-4", currentStep !== 3 && "hidden")}>
                {categoryId && <section className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider block ml-1">Working Spare Parts</label>
                    {isLoadingSpareParts ? <div className="grid grid-cols-4 gap-1.5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-6 rounded-lg bg-slate-100 animate-pulse" />)}</div>
                        : sparePartsError ? <div className="p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-xs text-red-700 text-center mb-2">{sparePartsError}</p><Button type="button" variant="outline" size="sm" onClick={() => loadSparePartsForCategory(categoryId)} className="w-full text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50">Try Again</Button></div>
                            : availableSpareParts.length > 0 ? <div className="flex flex-wrap gap-1.5">{availableSpareParts.map((part) => {
                                const selected = spareParts.includes(part.id as string);
                                return <button key={part.id as string} type="button" onClick={() => toggleSparePart(part.id as string)}
                                    className={cn("h-6 px-2.5 rounded-full border text-[11px] font-bold transition-all", selected ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300")}>{part.name}</button>;
                            })}</div> : null}
                </section>}
                <section className="space-y-3" data-field="deviceCondition">
                    <Field label="Device Condition" error={deviceConditionError}>
                        <div className="flex gap-2 flex-wrap">
                            {DEVICE_CONDITION_OPTIONS.map(({ value, label, dot, active }) => (
                                <button key={value} type="button" onClick={() => setValue("deviceCondition", value, { shouldValidate: true, shouldTouch: true })}
                                    className={cn("flex items-center gap-2 h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all", deviceCondition === value ? active : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300")}>
                                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", deviceCondition === value ? "bg-white/80" : dot)} />{label}
                                </button>
                            ))}
                        </div>
                    </Field>
                </section>
            </div>
        </div>
    );
}

const getAttributeValue = (attributes: unknown, id: string): unknown => {
    if (!attributes || typeof attributes !== "object") return undefined;
    return (attributes as Record<string, unknown>)[id];
};
