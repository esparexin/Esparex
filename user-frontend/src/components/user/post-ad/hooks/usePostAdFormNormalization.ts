import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import {
    buildPostAdEditPayload,
    buildPostAdIdentityPatch,
} from "@/lib/listings/postingFormNormalization";

export function usePostAdFormNormalization(
    form: UseFormReturn<PostAdFormData>,
    isLocationLocked: boolean
) {
    const buildEditAdPayload = useCallback((payload: any) => {
        return buildPostAdEditPayload(payload, isLocationLocked);
    }, [isLocationLocked]);

    const normalizeIdentityFieldsBeforeSubmit = useCallback(() => {
        const nextValues = buildPostAdIdentityPatch({
            categoryId: form.getValues("categoryId"),
            category: form.getValues("category"),
            brandId: form.getValues("brandId"),
            modelId: form.getValues("modelId"),
            spareParts: form.getValues("spareParts"),
        });

        (Object.entries(nextValues) as Array<[keyof typeof nextValues, unknown]>).forEach(([field, value]) => {
            const currentValue = form.getValues(field as keyof PostAdFormData);
            const hasChanged = Array.isArray(value)
                ? JSON.stringify(currentValue ?? []) !== JSON.stringify(value)
                : String(currentValue ?? "") !== String(value ?? "");

            if (hasChanged) {
                form.setValue(field as keyof PostAdFormData, value as any, {
                    shouldValidate: false,
                    shouldDirty: false,
                });
            }
        });
    }, [form]);

    return { buildEditAdPayload, normalizeIdentityFieldsBeforeSubmit };
}
