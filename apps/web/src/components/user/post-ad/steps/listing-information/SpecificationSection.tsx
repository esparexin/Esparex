"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";
import { getVisibleAttributeFilters, renderAttributeField } from "../common/attribute-fields";

export function SpecificationSection() {
    const { categorySchema } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();

    const attributes = watch("attributes") as Record<string, unknown> | undefined;

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);

    const updateAttribute = useCallback((id: string, value: unknown) => {
        const current = form.getValues("attributes") as Record<string, unknown> | undefined;
        setValue("attributes", { ...(current ?? {}), [id]: value } as any, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [form, setValue]);

    const dynamicAttributeFilters = getVisibleAttributeFilters(categorySchema, attributes);
    
    if (dynamicAttributeFilters.length === 0) {
        return null;
    }

    return (
        <section className={cn("space-y-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3 w-full", isEditMode && "opacity-60 pointer-events-none")}>
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
    );
}

const getAttributeValue = (attributes: unknown, id: string): unknown => {
    if (!attributes || typeof attributes !== "object") return undefined;
    return (attributes as Record<string, unknown>)[id];
};
