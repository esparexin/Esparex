import { Dispatch, SetStateAction, useCallback } from "react";
import { Path, UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import type { CategoryFilter } from "@esparex/contracts";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";

interface UsePostAdStepNavigationProps {
    form: UseFormReturn<PostAdFormData>;
    currentStep: number;
    setCurrentStep: Dispatch<SetStateAction<number>>;
    setStepValidationAttempts: Dispatch<SetStateAction<Record<number, boolean>>>;
    requiresScreenSize: boolean;
    categoryFilters?: CategoryFilter[];
    trigger: UseFormReturn<PostAdFormData>["trigger"];
    maxStep?: number;
}

export function usePostAdStepNavigation({
    form,
    currentStep,
    setCurrentStep,
    setStepValidationAttempts,
    requiresScreenSize,
    categoryFilters = [],
    trigger,
    maxStep = 2,
}: UsePostAdStepNavigationProps) {
    const nextStep = useCallback(async () => {
        setStepValidationAttempts((prev) =>
            prev[currentStep] ? prev : { ...prev, [currentStep]: true }
        );
        let hasErrors = false;

        if (currentStep === 1) {
            const { categoryId: catId, brand: brandName, screenSize: sz, deviceCondition: dc } = form.getValues();
            
            if (!catId) {
                form.setError("categoryId" as Path<PostAdFormData>, {
                    type: "manual",
                    message: "Please select a category",
                });
                hasErrors = true;
            }

            if (!brandName) {
                form.setError("brand" as Path<PostAdFormData>, {
                    type: "manual",
                    message: "Please select a brand",
                });
                hasErrors = true;
            }

            if (requiresScreenSize && !sz) {
                form.setError("screenSize" as Path<PostAdFormData>, {
                    type: "manual",
                    message: "Please select a screen size",
                });
                hasErrors = true;
            }

            const attributes = form.getValues("attributes") as Record<string, unknown> | undefined;
            categoryFilters.forEach((filter) => {
                if (!filter.isRequired) return;
                const value = attributes?.[filter.id];
                const isMissing = Array.isArray(value)
                    ? value.length === 0
                    : value === undefined || value === null || String(value).trim().length === 0;
                if (!isMissing) return;

                form.setError(`attributes.${filter.id}` as Path<PostAdFormData>, {
                    type: "manual",
                    message: `${filter.name} is required`,
                });
                hasErrors = true;
            });

            if (!dc) {
                form.setError("deviceCondition" as Path<PostAdFormData>, {
                    type: "manual",
                    message: "Please select device condition",
                });
                hasErrors = true;
            }
        }

        if (hasErrors) {
            trackPostAdEvent({ event: "validation_error", step: currentStep });
            requestAnimationFrame(() => {
                const firstError = document.querySelector(".text-destructive");
                const scrollTarget = firstError?.closest("[data-field]") ?? firstError;
                if (scrollTarget) {
                    scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
            return;
        }

        let fieldsToValidate: Path<PostAdFormData>[] = [];

        if (currentStep === 1) {
            fieldsToValidate = [
                "categoryId", 
                "category", 
                "brand", 
                requiresScreenSize ? "screenSize" : "model",
                "deviceCondition"
            ] as Path<PostAdFormData>[];
        } else if (currentStep === 2) {
            fieldsToValidate = ["title", "description", "price", "location"] as Path<PostAdFormData>[];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            trackPostAdEvent({ event: "step_completed", step: currentStep });
            if (currentStep < maxStep) {
                setCurrentStep((prev) => prev + 1);
                document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
            }
            return;
        }

        trackPostAdEvent({ event: "validation_error", step: currentStep });
        requestAnimationFrame(() => {
            const firstError = document.querySelector(".text-destructive");
            const scrollTarget = firstError?.closest("[data-field]") ?? firstError;
            if (scrollTarget) {
                scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }, [
        currentStep,
        categoryFilters,
        form,
        maxStep,
        requiresScreenSize,
        setCurrentStep,
        setStepValidationAttempts,
        trigger,
    ]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
            document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep, setCurrentStep]);

    return {
        nextStep,
        prevStep,
    };
}
