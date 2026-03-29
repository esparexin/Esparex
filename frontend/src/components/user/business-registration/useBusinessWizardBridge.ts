import type { Dispatch, SetStateAction } from "react";
import type { FieldErrors, UseFormSetValue } from "react-hook-form";
import type { StepData } from "./types";

const NON_FORM_FIELDS = new Set(["errors"]);

const resolveFieldErrorMessage = (fieldError: unknown): string => {
    const err = fieldError as any;
    if (!err) return "Invalid field";
    if (typeof err.message === "string" && err.message.trim()) return err.message;
    if (typeof err?.root?.message === "string" && err.root.message.trim()) return err.root.message;
    if (Array.isArray(err)) {
        const nested = err.find((item: any) => typeof item?.message === "string" && item.message.trim());
        if (nested?.message) return nested.message;
    }
    if (err && typeof err === "object") {
        for (const value of Object.values(err)) {
            if (value && typeof (value as any).message === "string" && (value as any).message.trim()) {
                return (value as any).message;
            }
        }
    }
    return "Invalid field";
};

export function getBusinessWizardFieldsForStep(
    currentStep: number,
    options: { requireDocuments?: boolean } = {},
) {
    const { requireDocuments = true } = options;

    if (currentStep === 0) {
        return ["businessName", "businessDescription", "contactNumber", "email", "shopImages"];
    }

    if (currentStep === 1) {
        return ["shopNo", "street", "city", "state", "pincode"];
    }

    if (currentStep === 2 && requireDocuments) {
        return ["idProofType", "idProof", "businessProof"];
    }

    return [];
}

export function useBusinessWizardBridge<TFormData extends Record<string, unknown>>({
    formData,
    errors,
    setValue,
    extraFields,
}: {
    formData: TFormData;
    errors: FieldErrors<TFormData>;
    setValue: UseFormSetValue<TFormData>;
    extraFields?: Partial<StepData>;
}) {
    const legacyFormData: StepData = {
        ...(formData as Record<string, unknown>),
        ...(extraFields ?? {}),
        errors: Object.keys(errors).reduce((acc, key) => {
            acc[key as keyof StepData] = resolveFieldErrorMessage((errors as Record<string, unknown>)[key]);
            return acc;
        }, {} as NonNullable<StepData["errors"]>),
    } as StepData;

    const setLegacyFormData: Dispatch<SetStateAction<StepData>> = (updater) => {
        const next = typeof updater === "function" ? updater(formData as unknown as StepData) : updater;
        Object.entries(next).forEach(([key, value]) => {
            if (NON_FORM_FIELDS.has(key)) {
                return;
            }

            setValue(key as never, value as never, {
                shouldDirty: true,
            });
        });
    };

    return {
        legacyFormData,
        setLegacyFormData,
    };
}
