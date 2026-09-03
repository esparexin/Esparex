import React from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import { useGenericListingForm } from "@/components/user/shared/useGenericListingForm";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import {
    createServiceListing,
    updateServiceListing,
    createSparePartListing,
    updateSparePartListing,
} from "@/lib/api/user/listings/postingAPI";
import {
    ServiceListingPayloadSchema,
} from "@/schemas/serviceListingPayload.schema";
import {
    EditPostSparePartFormSchema,
} from "@/schemas/postSparePartForm.schema";
import {
    buildServiceListingEditValues,
    buildSparePartListingEditValues,
    resolveServiceTypeSelectionIds,
} from "@/lib/listings/postingFormNormalization";
import type { ListingFormConfig } from "./listingFormConfig";
import { LISTING_TYPE } from "@esparex/contracts";
import type { ServiceType } from "@/lib/api/user/masterData";

const ServiceListingEditSchema = ServiceListingPayloadSchema.partial({
    categoryId: true,
    brandId: true,
    modelId: true,
    serviceTypeIds: true,
});

interface UseListingFormOrchestrationProps {
    config: ListingFormConfig;
    form: UseFormReturn<FieldValues>;
    editId?: string;
    loadBrandsForCategory: (categoryId: string) => Promise<void>;
    loadCatalogItems: (categoryId: string) => Promise<unknown>;
    onSubmitted: () => void;
}

export function useListingFormOrchestration({
    config,
    form,
    editId,
    loadBrandsForCategory,
    loadCatalogItems,
    onSubmitted,
}: UseListingFormOrchestrationProps) {
    const isEditMode = Boolean(editId);
    const { setValue } = form;

    const onDataLoaded = React.useCallback(async (payload: Record<string, unknown>) => {
        if (config.listingType === LISTING_TYPE.SERVICE) {
            const normalizedValues = buildServiceListingEditValues(payload);
            form.reset(normalizedValues);

            if (normalizedValues.categoryId) {
                const [, serviceTypes] = await Promise.all([
                    loadBrandsForCategory(normalizedValues.categoryId),
                    loadCatalogItems(normalizedValues.categoryId) as Promise<ServiceType[]>,
                ]);
                const resolvedIds = resolveServiceTypeSelectionIds(
                    normalizedValues.serviceTypeIds ?? [],
                    serviceTypes
                );
                if (resolvedIds.length > 0) {
                    setValue("serviceTypeIds", resolvedIds, { shouldValidate: true });
                }
            }
        } else {
            const normalizedValues = buildSparePartListingEditValues(payload);
            form.reset(normalizedValues);
            const categoryId = normalizedValues.categoryId || "";
            if (categoryId) {
                await Promise.all([
                    loadBrandsForCategory(categoryId),
                    loadCatalogItems(categoryId),
                ]);
            }
        }
    }, [config.listingType, form, loadBrandsForCategory, loadCatalogItems, setValue]);

    const { images, setImages, addImages, removeImage, isFetchingData, businessData } = useGenericListingForm({
        form,
        editId,
        onDataLoaded,
    });

    const submitFn = React.useCallback(async (payload: Record<string, unknown>, options?: { idempotencyKey?: string }) => {
        if (config.listingType === LISTING_TYPE.SERVICE) {
            if (isEditMode && editId) {
                return updateServiceListing(editId, {
                    title: payload.title,
                    description: payload.description,
                    images: payload.images,
                    serviceTypeIds: payload.serviceTypeIds,
                    priceMin: payload.price,
                });
            }
            const { price, ...rest } = payload;
            return createServiceListing({ ...rest, priceMin: price }, { idempotencyKey: options?.idempotencyKey });
        } else {
            if (isEditMode && editId) {
                return updateSparePartListing(editId, {
                    title: payload.title,
                    description: payload.description,
                    price: payload.price,
                    images: payload.images ?? [],
                });
            }
            return createSparePartListing({
                title: payload.title,
                categoryId: payload.categoryId,
                brandId: payload.brandId || undefined,
                sparePartId: payload.sparePartTypeId,
                price: payload.price,
                description: payload.description,
                images: payload.images ?? [],
            });
        }
    }, [config.listingType, editId, isEditMode]);

    const activePartialSchema = config.listingType === LISTING_TYPE.SERVICE 
        ? ServiceListingEditSchema 
        : EditPostSparePartFormSchema;

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId,
        schema: config.schema,
        partialSchema: activePartialSchema,
        submitFn,
        onSuccess: onSubmitted,
    });

    return {
        images,
        setImages,
        addImages,
        removeImage,
        isFetchingData,
        businessData,
        onValidSubmit,
        isSubmitting,
    };
}
