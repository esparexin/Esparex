"use client";

import { usePostAdFlow } from "../../context";
import { useCallback } from "react";

const FIELD_LABELS: Record<string, string> = {
    title: "Title",
    description: "Description",
    price: "Price",
    isFree: "Free / Paid",
    images: "Product Photos",
    location: "Location",
    // categoryId and category are aliases — deduplicated by canonical key
    categoryId: "Category",
    category: "Category",
    // brandId and brand are aliases — deduplicated by canonical key
    brandId: "Brand",
    brand: "Brand",
    // modelId and model are aliases — deduplicated by canonical key
    modelId: "Model",
    model: "Model",
    deviceCondition: "Device Condition",
    spareParts: "Spare Parts",
    screenSize: "Screen Size",
    attributes: "Category Details",
};

/** Maps aliased field names to their canonical primary key for deduplication. */
const FIELD_CANONICAL: Record<string, string> = {
    category: "categoryId",
    brand: "brandId",
    model: "modelId",
};

export function ValidationSummary() {
    const { formError, form, currentStep, stepValidationAttempts } = usePostAdFlow();
    const { errors, submitCount } = form.formState;

    const hasAttemptedSubmit = submitCount > 0;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[currentStep]);

    const scrollToField = useCallback((fieldName: string) => {
        if (typeof document === "undefined") return;
        const selector = fieldName === "images" 
            ? "input[type='file']" 
            : `[name='${fieldName}']`;
        
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            if (el instanceof HTMLElement) el.focus();
        }
    }, []);

    const labelForKey = useCallback((key: string): string => {
        return FIELD_LABELS[key] ?? key;
    }, []);

    if (!formError && (!hasAttemptedSubmit && !hasAttemptedStepValidation || Object.keys(errors).length === 0)) {
        return null;
    }

    // Deduplicate aliased fields (e.g., category + categoryId share the same label)
    const seen = new Set<string>();
    const errorList = Object.entries(errors)
        .map(([key, error]) => ({
            key,
            canonicalKey: FIELD_CANONICAL[key] ?? key,
            message: (error as any)?.message as string,
        }))
        .filter((e) => {
            if (!e.message) return false;
            if (seen.has(e.canonicalKey)) return false;
            seen.add(e.canonicalKey);
            return true;
        });

    return (
        <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="rounded-xl border border-red-200/80 bg-red-50/50 p-4 text-sm text-red-700 space-y-1.5"
        >
            <p className="font-semibold text-red-900 text-sm">Please fix the following issues before continuing:</p>
            {formError && (
                <p className="mt-1 font-medium">{formError}</p>
            )}
            
            {errorList.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-1">
                    {errorList.map((err) => (
                        <li key={err.key}>
                            <button 
                                type="button" 
                                onClick={() => scrollToField(err.key)}
                                aria-label={`Go to ${labelForKey(err.key)} field`}
                                className="hover:underline text-left"
                            >
                                {err.message}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
