import { useState } from "react";
import type { UseFormReturn, FieldValues, FieldErrors, Path } from "react-hook-form";
import { useBusinessWizardBridge, getBusinessWizardFieldsForStep } from "../useBusinessWizardBridge";

export function useProfileWizardController<TFormShape extends FieldValues>(
    form: UseFormReturn<TFormShape>, 
    options: { requireDocuments: boolean }
) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formError, setFormError] = useState<string | null>(null);
    const { trigger, watch, setValue, formState: { errors, isSubmitting } } = form;
    const formData = watch();
    
    const { legacyFormData, setLegacyFormData } = useBusinessWizardBridge({ 
        formData: formData as TFormShape, 
        errors: errors as FieldErrors<TFormShape>, 
        setValue: setValue as UseFormReturn<TFormShape>["setValue"] 
    });

    const handleNext = async () => {
        if (formError) setFormError(null);
        const fields = getBusinessWizardFieldsForStep(currentStep, { requireDocuments: options.requireDocuments }) as Path<TFormShape>[];
        const isValid = await trigger(fields);
        if (!isValid) {
            // Focus the first invalid field (matches post-ad wizard behavior)
            const firstInvalid = fields.find((f) => form.getFieldState(f, form.formState).invalid);
            if (firstInvalid) {
                // Use requestAnimationFrame to ensure the error UI is rendered
                requestAnimationFrame(() => {
                    try {
                        form.setFocus(firstInvalid);
                    } catch {
                        // Field may not be focusable; ignore
                    }
                });
            }
            return;
        }
        setCurrentStep((prev) => prev + 1);
    };

    return { 
        currentStep, 
        setCurrentStep, 
        formError, 
        setFormError, 
        isSubmitting, 
        legacyFormData, 
        setLegacyFormData, 
        handleNext 
    };
}
