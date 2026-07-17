import { Dispatch, SetStateAction, useCallback } from "react";
import { Path, UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";

interface UsePostAdStepNavigationProps {
    form: UseFormReturn<PostAdFormData>;
    currentStep: number;
    setCurrentStep: Dispatch<SetStateAction<number>>;
    setStepValidationAttempts: Dispatch<SetStateAction<Record<number, boolean>>>;
    requiresScreenSize: boolean;
    trigger: UseFormReturn<PostAdFormData>["trigger"];
    maxStep?: number;
}

export function usePostAdStepNavigation({
    form,
    currentStep,
    setCurrentStep,
    setStepValidationAttempts,
    requiresScreenSize,
    trigger,
    maxStep = 2,
}: UsePostAdStepNavigationProps) {
    const scrollToFirstError = useCallback(() => {
        requestAnimationFrame(() => {
            const firstError = document.querySelector(".text-destructive");
            const scrollTarget = firstError?.closest("[data-field]") ?? firstError;
            if (scrollTarget) {
                scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }, []);

    const nextStep = useCallback(async () => {
        setStepValidationAttempts((prev) =>
            prev[currentStep] ? prev : { ...prev, [currentStep]: true }
        );

        let fieldsToValidate: Path<PostAdFormData>[] = [];

        if (currentStep === 1) {
            fieldsToValidate = [
                "categoryId",
                "category",
                "brand",
                requiresScreenSize ? "screenSize" : "model",
            ] as Path<PostAdFormData>[];
            if (requiresScreenSize) {
                fieldsToValidate.push("deviceCondition" as Path<PostAdFormData>);
            }
        } else if (currentStep === 2) {
            fieldsToValidate = ["title", "description", "price", "location"] as Path<PostAdFormData>[];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            if (currentStep < maxStep) {
                setCurrentStep((prev) => prev + 1);
                document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
            }
            return;
        }

        scrollToFirstError();
    }, [
        currentStep,
        form,
        maxStep,
        requiresScreenSize,
        setCurrentStep,
        setStepValidationAttempts,
        trigger,
        scrollToFirstError,
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
