"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import type { FieldValues } from "react-hook-form";
import { ModelSearchSelect } from "@/components/user/ModelSearchSelect";
import { cn } from "@/components/ui/utils";

export function ModelSection() {
    const { requiresScreenSize } = usePostAdCatalog();
    const { isEditMode } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");
    const brandIdValue = String(watch("brandId") ?? "");
    const modelId = String(watch("modelId") ?? "");
    const modelNameValue = String(watch("model") ?? "");
    const customModelName = String(watch("customModelName") ?? "");

    const onModelChange = useCallback((mId: string | null, mName: string) => {
        const aid = mId || ""; 
        setValue("customModelName", "", { shouldDirty: true });
        setValue("modelId", aid, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
        setValue("model", mName, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
        setValue("deviceCondition", undefined, { shouldValidate: true, shouldDirty: true }); 
        setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    const onProposeCustomModel = useCallback((customName: string) => {
        if (isEditMode) return;
        setValue("customModelName", customName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue("model", customName, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue("modelId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [isEditMode, setValue]);

    if (requiresScreenSize) return null;

    return (
        <fieldset disabled={!brandNameValue || isEditMode} className="w-full border-0 p-0 m-0 flex flex-col gap-2">
            <h2 id="model-heading" className="sr-only">Model</h2>
            <FieldRoot<FieldValues>
                name="model"
                render={() => (
                    <div className={cn("flex flex-col gap-1.5", (!brandNameValue || isEditMode) && "opacity-60 grayscale-[0.5] cursor-not-allowed")}>
                        <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground-secondary">Model</FieldLabel>
                        <FieldControl animateOnError>
                            {!brandNameValue ? (
                                <div className="h-11 w-full rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 text-xs sm:text-sm text-slate-400 font-medium">
                                    Select brand first...
                                </div>
                            ) : (
                                <ModelSearchSelect 
                                    brandId={brandIdValue} 
                                    brandName={brandNameValue} 
                                    categoryId={categoryId} 
                                    value={modelId || modelNameValue} 
                                    modelDisplayName={modelNameValue}
                                    disabled={!brandNameValue || isEditMode}
                                    onChange={(mId, mName) => onModelChange(mId, mName)}
                                    onProposeCustom={onProposeCustomModel}
                                    onClear={() => onModelChange("", "")}
                                    isCustom={Boolean(customModelName)}
                                    onBrandResolved={(rbId, rbName) => { 
                                        setValue("brandId", rbId, { shouldDirty: true }); 
                                        setValue("brand", rbName, { shouldDirty: true }); 
                                    }} 
                                />
                            )}
                        </FieldControl>
                        <FieldMessage />
                    </div>
                )}
            />
        </fieldset>
    );
}
