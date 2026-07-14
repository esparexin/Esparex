"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { useCascadeConfirmation } from "@/components/ui/cascade-confirm-dialog";
import { getNestedFieldMeta } from "../common/utils";
import { Button } from "@/components/ui/button";

export function BrandSection() {
    const { availableBrands, brandMap, brandIsPending, brandsError } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts, listingId } = usePostAdFlow();
    const { watch, handleBrandChange, loadBrandsForCategory, refreshBrands } = usePostAdAction();
    const { withCascadeConfirmation, ConfirmDialog, dialogProps } = useCascadeConfirmation();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");
    const modelId = String(watch("modelId") ?? "");
    const screenSize = String(watch("screenSize") || "");
    const deviceCondition = String(watch("deviceCondition") || "");
    const spareParts = (watch("spareParts") || []) as string[];

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const brandError = (shouldShowFieldError("brand") || shouldShowFieldError("brandId")) ? (errors.brand?.message ?? errors.brandId?.message) : undefined;

    const onBrandChange = useCallback((name: string, rId?: string) => {
        if (isEditMode) return;
        const affected: string[] = [];
        if (modelId) affected.push("Model");
        if (screenSize) affected.push("Screen Size");
        if (deviceCondition) affected.push("Device Condition");
        if (spareParts.length > 0) affected.push("Selected Spare Parts");
        
        withCascadeConfirmation("Brand", affected, () => handleBrandChange(name, rId));
    }, [isEditMode, modelId, screenSize, deviceCondition, spareParts.length, handleBrandChange, withCascadeConfirmation]);

    return (
        <section className="space-y-3">
            <Field label="Brand" error={brandError as string} required>
                {brandIsPending && availableBrands.length === 0 ? (
                    <div className="h-11 w-full rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                ) : (
                    <BrandSearchSelect 
                        brands={availableBrands} 
                        brandMap={brandMap as any} 
                        categoryId={categoryId} 
                        value={brandNameValue} 
                        onChange={(_id, name) => onBrandChange(name, _id)} 
                        onRequestSuccess={() => refreshBrands()} 
                        disabled={brandIsPending || isEditMode} 
                        placeholder={brandIsPending ? "Loading brands…" : "Search or select brand"} 
                        listingId={listingId} 
                    />
                )}
                {brandIsPending && availableBrands.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Updating brands&hellip;
                    </p>
                )}
            </Field>
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
            <ConfirmDialog {...dialogProps} />
        </section>
    );
}
