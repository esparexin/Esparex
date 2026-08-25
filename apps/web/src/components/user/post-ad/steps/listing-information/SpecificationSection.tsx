"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { useStepFieldError } from "../common/Utils";
import { cn } from "@/components/ui/utils";
import { getVisibleAttributeFilters, renderAttributeField } from "../common/attribute-fields";

import { clearStep2GeneratedDetails } from "../../hooks/useCategoryDependents";

export function SpecificationSection() {
    const { categorySchema, requiresScreenSize, availableSizes } = usePostAdCatalog();
    const { isEditMode, form } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();

    const attributes = watch("attributes") as Record<string, unknown> | undefined;
    const screenSize = String(watch("screenSize") || "");

    const getFieldError = useStepFieldError(1);
    const screenSizeError = getFieldError("screenSize");

    const onScreenSizeChange = useCallback((val: string) => {
        const current = form.getValues("screenSize");
        if (current !== val) {
            setValue("screenSize", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            clearStep2GeneratedDetails(form);
        }
    }, [form, setValue]);

    const updateAttribute = useCallback((id: string, value: unknown) => {
        const current = form.getValues("attributes") as Record<string, unknown> | undefined;
        setValue("attributes", { ...(current ?? {}), [id]: value } as Record<string, unknown>, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        clearStep2GeneratedDetails(form);
    }, [form, setValue]);

    const dynamicAttributeFilters = getVisibleAttributeFilters(categorySchema, attributes);
    
    if (dynamicAttributeFilters.length === 0 && !requiresScreenSize) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2.5">
            {dynamicAttributeFilters.length > 0 ? (
                <fieldset disabled={isEditMode} className={cn("space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/40 p-2.5 border-0 m-0", isEditMode && "opacity-60 cursor-not-allowed")}>
                    <div>
                        <p className="text-tiny sm:text-caption font-bold uppercase tracking-wider text-foreground-tertiary">Category Details</p>
                    </div>
                    <div className="space-y-2.5">
                        {dynamicAttributeFilters.map((f) => renderAttributeField(
                            f, 
                            getAttributeValue(attributes, f.id) ?? f.defaultValue, 
                            getFieldError(`attributes.${f.id}`), 
                            updateAttribute
                        ))}
                    </div>
                </fieldset>
            ) : null}

            {requiresScreenSize && (
                <fieldset disabled={isEditMode} className="w-full border-0 p-0 m-0">
                    <Field label="Screen Size" labelClassName="text-caption sm:text-body font-semibold text-foreground-secondary" error={screenSizeError as string} className={cn(isEditMode && "opacity-60 cursor-not-allowed")}>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {availableSizes.map((size) => {
                                const isSelected = screenSize === size;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        disabled={isEditMode}
                                        onClick={() => onScreenSizeChange(size)}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            "h-8 sm:h-9 px-3 sm:px-4 rounded-xl border text-caption sm:text-body font-medium transition-all duration-200 cursor-pointer select-none",
                                            isSelected
                                                ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20"
                                                : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300",
                                            isEditMode && "cursor-not-allowed opacity-60"
                                        )}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>
                </fieldset>
            )}

        </div>
    );
}

const getAttributeValue = (attributes: unknown, id: string): unknown => {
    if (!attributes || typeof attributes !== "object") return undefined;
    return (attributes as Record<string, unknown>)[id];
};
