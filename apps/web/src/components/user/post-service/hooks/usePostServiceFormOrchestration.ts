import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
    ServiceListingPayloadSchema,
    type ServiceListingFormData,
} from "@/schemas/serviceListingPayload.schema";
import { useGenericListingForm } from "@/components/user/shared/useGenericListingForm";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import {
    createServiceListing,
    updateServiceListing,
} from "@/lib/api/user/listings/postingAPI";
import type { ServiceType } from "@/lib/api/user/masterData";
import {
    buildServiceListingEditValues,
    resolveServiceTypeSelectionIds,
} from "@/lib/listings/postingFormNormalization";

const ServiceListingEditSchema = ServiceListingPayloadSchema.partial({
    categoryId: true,
    brandId: true,
    modelId: true,
    serviceTypeIds: true,
});

type ServiceCreatePayload = ServiceListingFormData & { priceMin: number };
type ServiceEditPayload = Pick<ServiceListingFormData, "title" | "description" | "images" | "serviceTypeIds"> & { priceMin: number };

function buildServiceCreatePayload(payload: ServiceListingFormData): Omit<ServiceCreatePayload, "price"> {
    const { price, ...rest } = payload;
    return { ...rest, priceMin: price };
}

function buildServiceEditPayload(payload: ServiceListingFormData): ServiceEditPayload {
    return {
        title: payload.title,
        description: payload.description,
        images: payload.images,
        serviceTypeIds: payload.serviceTypeIds,
        priceMin: payload.price,
    };
}

interface UsePostServiceFormOrchestrationProps {
    form: UseFormReturn<ServiceListingFormData>;
    editServiceId?: string;
    loadBrandsForCategory: (categoryId: string) => Promise<void>;
    loadServiceTypes: (categoryId?: string) => Promise<ServiceType[]>;
    onSubmitted: () => void;
}

export function usePostServiceFormOrchestration({
    form,
    editServiceId,
    loadBrandsForCategory,
    loadServiceTypes,
    onSubmitted,
}: UsePostServiceFormOrchestrationProps) {
    const isEditMode = Boolean(editServiceId);
    const { setValue } = form;

    const onDataLoaded = React.useCallback(async (payload: Partial<ServiceListingFormData> & Record<string, unknown>) => {
        const normalizedValues = buildServiceListingEditValues(payload);
        form.reset(normalizedValues);

        if (normalizedValues.categoryId) {
            const [, serviceTypes] = await Promise.all([
                loadBrandsForCategory(normalizedValues.categoryId),
                loadServiceTypes(normalizedValues.categoryId),
            ]);
            const resolvedIds = resolveServiceTypeSelectionIds(
                normalizedValues.serviceTypeIds ?? [],
                serviceTypes
            );
            if (resolvedIds.length > 0) {
                setValue("serviceTypeIds", resolvedIds, { shouldValidate: true });
            }
        }
    }, [form, loadBrandsForCategory, loadServiceTypes, setValue]);

    const { images, setImages, addImages, removeImage, isFetchingData, businessData } = useGenericListingForm({
        form,
        editId: editServiceId,
        onDataLoaded,
    });

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editServiceId,
        schema: ServiceListingPayloadSchema,
        partialSchema: ServiceListingEditSchema,
        submitFn: async (payload, options) => {
            if (isEditMode && editServiceId) {
                return updateServiceListing(editServiceId, buildServiceEditPayload(payload));
            }
            return createServiceListing(buildServiceCreatePayload(payload), {
                idempotencyKey: options?.idempotencyKey,
            });
        },
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
