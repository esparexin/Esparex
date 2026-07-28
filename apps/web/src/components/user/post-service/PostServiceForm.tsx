"use client";

import { ListingForm } from "@/components/user/shared/ListingForm";
import { ServiceListingPayloadSchema } from "@/schemas/serviceListingPayload.schema";
import { Wrench } from "@/icons/IconRegistry";
import { LISTING_TYPE } from "@esparex/contracts";
import type { ListingFormConfig } from "@/components/user/shared/listingFormConfig";

export const serviceFormConfig: ListingFormConfig = {
    listingType: LISTING_TYPE.SERVICE,
    schema: ServiceListingPayloadSchema,
    entityLabel: "Service",
    pendingSection: "services",
    formId: "post-service-form",
    icon: Wrench,
    catalogFieldName: "serviceTypeIds",
    catalogLabel: "Service Types",
    catalogMultiSelect: true,
    catalogGridCols: "grid-cols-2",
    catalogEmptyErrorMessage: "No service types are configured for this category yet. Choose another category to continue.",
    titleProps: {
        label: "Service Title",
        placeholder: "e.g. iPhone Screen Replacement",
        maxLength: 100,
    },
    descriptionProps: {
        label: "Description",
        placeholder: "Describe your service...",
        maxLength: 2000,
    },
    defaultValues: {
        title: "",
        categoryId: "",
        brandId: "",
        serviceTypeIds: [],
        price: undefined as unknown as number,
        description: "",
    },
};

export function PostServiceForm({ editServiceId }: { editServiceId?: string }) {
    return <ListingForm config={serviceFormConfig} editId={editServiceId} />;
}
