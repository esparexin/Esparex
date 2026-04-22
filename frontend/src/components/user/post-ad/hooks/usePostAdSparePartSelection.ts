import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import type { SparePart } from "@/lib/api/user/masterData";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";

export function usePostAdSparePartSelection(
    form: UseFormReturn<PostAdFormData>,
    availableSpareParts: SparePart[]
) {
    const toggleAllSpareParts = useCallback((selectAll: boolean) => {
        if (selectAll) {
            const ids = availableSpareParts
                .map((part) => normalizeOptionalObjectId(part.id))
                .filter((partId): partId is string => Boolean(partId));
            const distinct = Array.from(new Set(ids));
            form.setValue("spareParts", distinct as never, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            });
            return;
        }

        form.setValue("spareParts", [] as never, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [availableSpareParts, form]);

    const toggleSparePart = useCallback((partId: string) => {
        const normalizedPartId = normalizeOptionalObjectId(partId);
        if (!normalizedPartId) return;

        const currentParts = (form.getValues("spareParts") || []) as string[];
        const next = currentParts.includes(normalizedPartId)
            ? currentParts.filter((id) => id !== normalizedPartId)
            : [...currentParts, normalizedPartId];

        form.setValue("spareParts", next as never, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [form]);

    return {
        toggleAllSpareParts,
        toggleSparePart,
    };
}
