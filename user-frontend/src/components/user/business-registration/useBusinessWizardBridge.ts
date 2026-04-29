import type { Dispatch, SetStateAction } from "react";
import type { FieldError, FieldErrors, UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";
import type { StepData } from "./types";

const NON_FORM_FIELDS = new Set(["errors"]);

type FieldErrorLike = FieldError | FieldError[] | Record<string, FieldError> | undefined;

const resolveFieldErrorMessage = (fieldError: FieldErrorLike): string => {
    if (!fieldError) return "Invalid field";
    if (typeof (fieldError as FieldError).message === "string" && (fieldError as FieldError).message!.trim()) {
        return (fieldError as FieldError).message!;
    }
    if (typeof (fieldError as { root?: FieldError }).root?.message === "string") {
        return (fieldError as { root: FieldError }).root.message!;
    }
    if (Array.isArray(fieldError)) {
        const nested = (fieldError as FieldError[]).find(
            (item) => typeof item?.message === "string" && item.message.trim()
        );
        if (nested?.message) return nested.message;
    }
    if (fieldError && typeof fieldError === "object") {
        for (const value of Object.values(fieldError as Record<string, FieldError>)) {
            if (value && typeof value.message === "string" && value.message.trim()) {
                return value.message;
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
        return [
            "businessName",
            "businessDescription",
            "contactNumber",
            "email",
            "currentLocationDisplay",
            "coordinates",
            "fullAddress",
        ];
    }

    if (currentStep === 1) {
        return requireDocuments
            ? ["shopImages", "idProofType", "idProof", "businessProof"]
            : ["shopImages"];
    }

    return [];
}

export function useBusinessWizardBridge<TFieldValues extends FieldValues>({
    formData,
    errors,
    setValue,
    extraFields,
}: {
    formData: TFieldValues;
    errors: FieldErrors<TFieldValues>;
    setValue: UseFormSetValue<TFieldValues>;
    extraFields?: Partial<StepData>;
}) {
    const legacyFormData: StepData = {
        ...(formData as Record<string, unknown>),
        ...(extraFields ?? {}),
        errors: Object.keys(errors).reduce((acc, key) => {
            acc[key as keyof StepData] = resolveFieldErrorMessage(
                (errors as Record<string, FieldErrorLike>)[key]
            );
            return acc;
        }, {} as NonNullable<StepData["errors"]>),
    } as StepData;

    const setLegacyFormData: Dispatch<SetStateAction<StepData>> = (updater) => {
        const next = typeof updater === "function" ? updater(formData as unknown as StepData) : updater;
        Object.entries(next).forEach(([key, value]) => {
            if (NON_FORM_FIELDS.has(key)) {
                return;
            }

            setValue(key as Path<TFieldValues>, value as PathValue<TFieldValues, Path<TFieldValues>>, {
                shouldDirty: true,
            });
        });
    };

    return {
        legacyFormData,
        setLegacyFormData,
    };
}
