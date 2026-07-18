"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Z_INDEX } from "@/lib/zIndexConfig";

import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";
import { getVisibleAttributeFilters, renderAttributeField } from "../common/attribute-fields";

export function SpecificationSection() {
    const { categorySchema, requiresScreenSize, availableSizes } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();


    const attributes = watch("attributes") as Record<string, unknown> | undefined;
    const screenSize = String(watch("screenSize") || "");
    const spareParts = (watch("spareParts") || []) as string[];

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const screenSizeError = shouldShowFieldError("screenSize") ? errors.screenSize?.message : undefined;

    const onScreenSizeChange = useCallback((val: string) => {
        setValue("screenSize", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
        setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

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
                    <Select value={screenSize || undefined} onValueChange={onScreenSizeChange}>
                        <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 bg-white font-bold text-foreground focus:border-primary transition-colors px-3 text-sm">
                            <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent style={{ zIndex: Z_INDEX.selectContent }} className="rounded-xl border-2 border-slate-100 shadow-xl">
                            {availableSizes.map((size) => (
                                <SelectItem key={size} value={size} className="font-medium py-2.5 px-3 text-sm">{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            )}
            
        </div>
    );
}

const getAttributeValue = (attributes: unknown, id: string): unknown => {
    if (!attributes || typeof attributes !== "object") return undefined;
    return (attributes as Record<string, unknown>)[id];
};
