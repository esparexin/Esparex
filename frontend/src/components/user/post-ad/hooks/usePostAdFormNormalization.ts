import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";

export function usePostAdFormNormalization(
    form: UseFormReturn<PostAdFormData>,
    isLocationLocked: boolean,
    setSpareParts: (parts: string[]) => void
) {
    const buildEditAdPayload = useCallback((payload: any) => {
        const editPayload: Record<string, unknown> = {
            title: payload.title,
            description: payload.description,
            price: payload.price,
            images: payload.images,
            isFree: payload.isFree,
        };

        if (!isLocationLocked && payload.location) {
            editPayload.location = payload.location;
        }

        return editPayload;
    }, [isLocationLocked]);

    const normalizeIdentityFieldsBeforeSubmit = useCallback(() => {
        const rawCategoryId = form.getValues("categoryId");
        const rawCategory = form.getValues("category");
        const normalizedCategoryId =
            sanitizeMongoObjectId(rawCategoryId) ||
            sanitizeMongoObjectId(rawCategory) ||
            "";

        if (String(rawCategoryId || "") !== normalizedCategoryId) {
            form.setValue("categoryId", normalizedCategoryId as any, { shouldValidate: false, shouldDirty: false });
        }
        if (String(rawCategory || "") !== normalizedCategoryId) {
            form.setValue("category", normalizedCategoryId as any, { shouldValidate: false, shouldDirty: false });
        }

        const rawBrandId = form.getValues("brandId");
        const normalizedBrandId = sanitizeMongoObjectId(rawBrandId) || "";
        if (String(rawBrandId || "") !== normalizedBrandId) {
            form.setValue("brandId", normalizedBrandId as any, { shouldValidate: false, shouldDirty: false });
        }

        const rawSpareParts = form.getValues("spareParts");
        if (Array.isArray(rawSpareParts)) {
            const normalizedSpareParts = rawSpareParts
                .map((partId) => sanitizeMongoObjectId(partId))
                .filter((partId): partId is string => Boolean(partId));
            const hasChanged =
                normalizedSpareParts.length !== rawSpareParts.length ||
                normalizedSpareParts.some((partId, index) => partId !== rawSpareParts[index]);

            if (hasChanged) {
                setSpareParts(normalizedSpareParts);
                form.setValue("spareParts", normalizedSpareParts as any, { shouldValidate: false, shouldDirty: false });
            }
        }
    }, [form, setSpareParts]);

    return { buildEditAdPayload, normalizeIdentityFieldsBeforeSubmit };
}
