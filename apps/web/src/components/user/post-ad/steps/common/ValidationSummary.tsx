"use client";

import { usePostAdFlow } from "../../context";

export function ValidationSummary() {
    const { formError, form, currentStep, stepValidationAttempts } = usePostAdFlow();
    const { errors, submitCount } = form.formState;

    const hasAttemptedSubmit = submitCount > 0;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[currentStep]);

    if (!formError && (!hasAttemptedSubmit && !hasAttemptedStepValidation || Object.keys(errors).length === 0)) {
        return null;
    }

    const errorList = Object.entries(errors).map(([key, error]) => ({
        key,
        message: (error as any)?.message as string
    })).filter(e => e.message);

    const scrollToField = (fieldName: string) => {
        if (typeof document === "undefined") return;
        const selector = fieldName === "images" 
            ? "input[type='file']" 
            : `[name='${fieldName}']`;
        
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            // Optionally focus
            if (el instanceof HTMLElement) el.focus();
        }
    };

    return (
        <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
            <p className="font-semibold text-red-800">Please fix the following errors:</p>
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
