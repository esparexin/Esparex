"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { Button } from "@esparex/ui";

export function BrandSection() {
    const { availableBrands, brandMap, isLoadingBrands, brandsError } = usePostAdCatalog();
    const { watch, handleBrandChange, loadBrandsForCategory } = usePostAdAction();
    const { form, isEditMode } = usePostAdFlow();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");
    const customBrandName = String(watch("customBrandName") ?? "");

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
        <section className="flex flex-col gap-2" aria-labelledby="brand-heading">
            <h2 id="brand-heading" className="sr-only">Brand</h2>
            <FieldRoot<any>
                name="brand"
                render={() => (
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel required className="text-sm font-semibold">Brand</FieldLabel>
                        <FieldControl animateOnError>
                            <BrandSearchSelect 
                                brands={availableBrands} 
                                brandMap={brandMap as any} 
                                categoryId={categoryId} 
                                value={brandNameValue} 
                                onChange={(_id, name) => onBrandChange(name, _id)}
                                onProposeCustom={onProposeCustomBrand}
                                onClear={() => onBrandChange("", "")}
                                isCustom={Boolean(customBrandName)}
                                disabled={isEditMode} 
                                loading={isLoadingBrands}
                                placeholder={isLoadingBrands ? "Loading brands…" : "Search or select brand"} 
                            />
                        </FieldControl>
                        <FieldMessage />
                    </div>
                )}
            />
            {brandsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-2">
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
