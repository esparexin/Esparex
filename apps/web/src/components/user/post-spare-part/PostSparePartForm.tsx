"use client";

import { ListingForm } from "@/components/user/shared/ListingForm";
import { PostSparePartFormSchema } from "@/schemas/postSparePartForm.schema";
import { CircuitBoard } from "@/icons/IconRegistry";
import { LISTING_TYPE } from "@esparex/contracts";
import type { ListingFormConfig } from "@/components/user/shared/listingFormConfig";

export const sparePartFormConfig: ListingFormConfig = {
    listingType: LISTING_TYPE.SPARE_PART,
    schema: PostSparePartFormSchema,
    entityLabel: "Spare Part",
    pendingSection: "spare-parts",
    formId: "post-spare-part-form",
    icon: CircuitBoard,
    catalogFieldName: "sparePartTypeId",
    catalogLabel: "Spare Part Type",
    catalogMultiSelect: false,
    catalogGridCols: "grid-cols-3",
    catalogEmptyErrorMessage: "No spare part types are configured for this category yet. Choose another category to continue.",
    titleProps: {
        label: "Part Title",
        placeholder: "e.g. iPhone 14 OEM Display Screen",
        maxLength: 120,
    },
    descriptionProps: {
        label: "Description",
        placeholder: "Describe origin, quality, compatibility notes...",
        maxLength: 2000,
    },
    defaultValues: {
        title: "",
        categoryId: "",
        brandId: "",
        sparePartTypeId: "",
        price: undefined as any,
        description: "",
    },
};

export default function PostSparePartForm({ editSparePartId }: { editSparePartId?: string }) {
    return <ListingForm config={sparePartFormConfig} editId={editSparePartId} />;
}
