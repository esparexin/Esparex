import { useState } from "react";
import type { UseFormReturn, UseFormSetValue, FieldValues, FieldErrors, Path } from "react-hook-form";
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
        setValue: setValue as unknown as UseFormSetValue<TFormShape> 
    });

    const handleNext = async () => {
        if (formError) setFormError(null);
        const isValid = await trigger(getBusinessWizardFieldsForStep(currentStep, { requireDocuments: options.requireDocuments }) as Path<TFormShape>[]);
        if (!isValid) return;
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
