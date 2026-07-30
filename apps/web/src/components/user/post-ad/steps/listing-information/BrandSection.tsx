"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { getNestedFieldMeta } from "../common/utils";
import { Button } from "@esparex/ui";

export function BrandSection() {
    const { availableBrands, brandMap, isLoadingBrands, brandsError } = usePostAdCatalog();
    const { watch, handleBrandChange, loadBrandsForCategory } = usePostAdAction();
    const { form, stepValidationAttempts, isEditMode } = usePostAdFlow();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");
    const customBrandName = String(watch("customBrandName") ?? "");

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const brandError = (shouldShowFieldError("brand") || shouldShowFieldError("brandId")) ? (errors.brand?.message ?? errors.brandId?.message) : undefined;

    const onBrandChange = useCallback((name: string, rId?: string) => {
        if (isEditMode) return;
        form.setValue("customBrandName", "", { shouldDirty: true });
        handleBrandChange(name, rId);
    }, [isEditMode, handleBrandChange, form]);

    const onProposeCustomBrand = useCallback((customName: string) => {
        if (isEditMode) return;
        form.setValue("customBrandName", customName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("brand", customName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("brandId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        handleBrandChange(customName, "");
    }, [isEditMode, form, handleBrandChange]);

    return (
        <section className="space-y-2" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="sr-only">Brand</h2>
            <Field label="Brand" error={brandError as string} required>
                <BrandSearchSelect 
                    brands={availableBrands} 
                    brandMap={brandMap as any} 
                    categoryId={categoryId} 
                    value={brandNameValue} 
                    onChange={(_id, name) => onBrandChange(name, _id)}
                    onProposeCustom={onProposeCustomBrand}
                    disabled={isEditMode} 
                    loading={isLoadingBrands}
                    placeholder={isLoadingBrands ? "Loading brands…" : "Search or select brand"} 
                />
            </Field>
            {customBrandName && (
                <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900 font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Custom Brand proposal: <strong className="font-semibold">{customBrandName}</strong>
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">Pending Admin Approval</span>
                </div>
            )}
            {brandsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-700 text-center mb-2">{brandsError}</p>
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
        </section>
    );
}
