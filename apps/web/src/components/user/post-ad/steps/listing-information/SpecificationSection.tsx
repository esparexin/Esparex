"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { useCascadeConfirmation } from "@/components/ui/cascade-confirm-dialog";
import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";
import { getVisibleAttributeFilters, renderAttributeField } from "../common/attribute-fields";

export function SpecificationSection() {
    const { categorySchema, requiresScreenSize, availableSizes } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();
    const { withCascadeConfirmation, ConfirmDialog, dialogProps } = useCascadeConfirmation();

    const attributes = watch("attributes") as Record<string, unknown> | undefined;
    const screenSize = String(watch("screenSize") || "");
    const spareParts = (watch("spareParts") || []) as string[];

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const screenSizeError = shouldShowFieldError("screenSize") ? errors.screenSize?.message : undefined;

    const onScreenSizeChange = useCallback((val: string) => {
        const affected: string[] = [];
        if (spareParts.length > 0) affected.push("Selected Spare Parts");

        withCascadeConfirmation("Screen Size", affected, () => {
            setValue("screenSize", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
            setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        });
    }, [spareParts.length, setValue, withCascadeConfirmation]);

    const updateAttribute = useCallback((id: string, value: unknown) => {
        const current = form.getValues("attributes") as Record<string, unknown> | undefined;
        setValue("attributes", { ...(current ?? {}), [id]: value } as any, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [form, setValue]);

    const dynamicAttributeFilters = getVisibleAttributeFilters(categorySchema, attributes);
    
    if (dynamicAttributeFilters.length === 0 && !requiresScreenSize) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3">
            {dynamicAttributeFilters.length > 0 ? (
                <section className={cn("space-y-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3", isEditMode && "opacity-60 pointer-events-none")}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary">Category Details</p>
                    </div>
                    <div className="space-y-3">
                        {dynamicAttributeFilters.map((f) => renderAttributeField(
                            f, 
                            getAttributeValue(attributes, f.id) ?? f.defaultValue, 
                            shouldShowFieldError(`attributes.${f.id}`) ? (getNestedFieldMeta(errors, `attributes.${f.id}.message`) as string | undefined) : undefined, 
                            updateAttribute
                        ))}
                    </div>
                </section>
            ) : null}

            {requiresScreenSize && (
                <Field label="Screen Size" error={screenSizeError as string} className={cn(isEditMode && "opacity-60 pointer-events-none")}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {availableSizes.map((size) => {
                            const isSelected = screenSize === size;
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => onScreenSizeChange(size)}
                                    className={cn(
                                        "flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-200 active:scale-[0.98]",
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </Field>
            )}
            
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}

const getAttributeValue = (attributes: unknown, id: string): unknown => {
    if (!attributes || typeof attributes !== "object") return undefined;
    return (attributes as Record<string, unknown>)[id];
};
