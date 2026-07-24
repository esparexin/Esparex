"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { getNestedFieldMeta } from "../common/utils";
import { Button } from "@esparex/ui";

export function BrandSection() {
    const { availableBrands, brandMap, brandIsPending, brandsError } = usePostAdCatalog();
    const { watch, handleBrandChange, loadBrandsForCategory } = usePostAdAction();
    const { form, stepValidationAttempts, isEditMode } = usePostAdFlow();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const brandError = (shouldShowFieldError("brand") || shouldShowFieldError("brandId")) ? (errors.brand?.message ?? errors.brandId?.message) : undefined;

    const onBrandChange = useCallback((name: string, rId?: string) => {
        if (isEditMode) return;
        handleBrandChange(name, rId);
    }, [isEditMode, handleBrandChange]);

    return (
        <section className="space-y-2" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="sr-only">Brand</h2>
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
                        disabled={brandIsPending || isEditMode} 
                        placeholder={brandIsPending ? "Loading brands…" : "Search or select brand"} 
                    />
                )}
                {brandIsPending && availableBrands.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-1.5">
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
        </section>
    );
}
