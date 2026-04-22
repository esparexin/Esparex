import React from "react";
import { UseFormReturn } from "react-hook-form";
import { useGenericListingForm } from "@/components/user/shared/useGenericListingForm";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import {
    createSparePartListing,
    updateSparePartListing,
} from "@/lib/api/user/listings/postingAPI";
import {
    EditPostSparePartFormSchema,
    PostSparePartFormSchema,
    type PostSparePartFormValues,
} from "@/schemas/postSparePartForm.schema";
import { buildSparePartListingEditValues } from "@/lib/listings/postingFormNormalization";

type SparePartSubmitPayload = {
    title: string;
    categoryId: string;
    brandId?: string;
    sparePartTypeId: string;
    price: number;
    description: string;
    images: string[];
};

const buildSparePartCreatePayload = (payload: SparePartSubmitPayload) => ({
    title: payload.title,
    categoryId: payload.categoryId,
    brandId: payload.brandId || undefined,
    sparePartId: payload.sparePartTypeId,
    price: payload.price,
    description: payload.description,
    images: payload.images,
});

const buildSparePartEditPayload = (payload: SparePartSubmitPayload) => ({
    title: payload.title,
    description: payload.description,
    price: payload.price,
    images: payload.images,
});

interface UsePostSparePartFormOrchestrationProps {
    form: UseFormReturn<PostSparePartFormValues>;
    editSparePartId?: string;
    loadBrandsForCategory: (categoryId: string) => Promise<void>;
    loadSparePartsForCategory: (categoryId: string) => Promise<void>;
    onSubmitted: () => void;
}

export function usePostSparePartFormOrchestration({
    form,
    editSparePartId,
    loadBrandsForCategory,
    loadSparePartsForCategory,
    onSubmitted,
}: UsePostSparePartFormOrchestrationProps) {
    const isEditMode = Boolean(editSparePartId);

    const onDataLoaded = React.useCallback((payload: Partial<PostSparePartFormValues> & Record<string, unknown>) => {
        form.reset(buildSparePartListingEditValues(payload));
    }, [form]);

    const loadCatalogForEdit = React.useCallback(async (payload: Partial<PostSparePartFormValues> & Record<string, unknown>) => {
        const resolvedCategoryId = buildSparePartListingEditValues(payload).categoryId || "";
        if (!resolvedCategoryId) return;

        await Promise.all([
            loadBrandsForCategory(resolvedCategoryId),
            loadSparePartsForCategory(resolvedCategoryId),
        ]);
    }, [loadBrandsForCategory, loadSparePartsForCategory]);

    const { images, setImages, isFetchingData, businessData } = useGenericListingForm({
        form,
        editId: editSparePartId,
        onDataLoaded: async (payload) => {
            onDataLoaded(payload);
            await loadCatalogForEdit(payload);
        },
    });

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editSparePartId,
        schema: PostSparePartFormSchema,
        partialSchema: EditPostSparePartFormSchema,
        submitFn: async (payload) => {
            if (isEditMode && editSparePartId) {
                return updateSparePartListing(editSparePartId, buildSparePartEditPayload(payload));
            }
            return createSparePartListing(buildSparePartCreatePayload(payload));
        },
        onSuccess: onSubmitted,
    });

    return {
        images,
        setImages,
        isFetchingData,
        businessData,
        onValidSubmit,
        isSubmitting,
    };
}
