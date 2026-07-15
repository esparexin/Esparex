"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { ModelSearchSelect } from "@/components/user/ModelSearchSelect";
import { useCascadeConfirmation } from "@/components/ui/cascade-confirm-dialog";
import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";

export function ModelSection() {
    const { requiresScreenSize } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts, listingId } = usePostAdFlow();
    const { watch, setValue, createAndSelectModel } = usePostAdAction();
    const { withCascadeConfirmation, ConfirmDialog, dialogProps } = useCascadeConfirmation();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const brandNameValue = String(watch("brand") ?? "");
    const brandIdValue = String(watch("brandId") ?? "");
    const modelId = String(watch("modelId") ?? "");
    const modelNameValue = String(watch("model") ?? "");
    const deviceCondition = String(watch("deviceCondition") || "");
    const spareParts = (watch("spareParts") || []) as string[];

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const modelError = (shouldShowFieldError("model") || shouldShowFieldError("modelId")) ? (errors.model?.message ?? errors.modelId?.message) : undefined;

    const onModelChange = useCallback((mId: string | null, mName: string) => {
        const affected: string[] = [];
        if (deviceCondition) affected.push("Device Condition");
        if (spareParts.length > 0) affected.push("Selected Spare Parts");

        withCascadeConfirmation("Model", affected, () => {
            const aid = mId || ""; 
            setValue("modelId", aid, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
            setValue("model", mName, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
            setValue("deviceCondition", undefined, { shouldValidate: true, shouldDirty: true }); 
            setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        });
    }, [deviceCondition, spareParts.length, setValue, withCascadeConfirmation]);

    if (requiresScreenSize) return null;

    return (
        <section className="space-y-3">
            <Field label="Model" error={modelError as string} className={cn((!brandNameValue || isEditMode) && "opacity-60 grayscale-[0.5] pointer-events-none")}>
                {!brandNameValue ? (
                    <div className="h-11 w-full rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 text-sm text-slate-400 font-medium">
                        Select brand first...
                    </div>
                ) : (
                    <ModelSearchSelect 
                        brandId={brandIdValue} 
                        brandName={brandNameValue} 
                        categoryId={categoryId} 
                        value={modelId || modelNameValue} 
                        modelDisplayName={modelNameValue}
                        onChange={(mId, mName) => onModelChange(mId, mName)}
                        onCreateModel={createAndSelectModel}
                        onBrandResolved={(rbId, rbName) => { 
                            setValue("brandId", rbId, { shouldDirty: true }); 
                            setValue("brand", rbName, { shouldDirty: true }); 
                        }} 
                        listingId={listingId} 
                    />
                )}
            </Field>
            <ConfirmDialog {...dialogProps} />
        </section>
    );
}
