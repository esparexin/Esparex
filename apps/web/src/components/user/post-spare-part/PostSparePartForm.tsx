"use client";

import { ListingForm } from "@/components/user/shared/ListingForm";
import { CircuitBoard } from "@esparex/ui";
import { LISTING_TYPE, PostSparePartFormSchema } from "@esparex/contracts";
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
        label: "Description & Supported Models",
        placeholder: "List compatible device models (e.g. MacBook Pro A2338, iPhone 14 Pro), part condition, warranty, or specifications...",
        helperText: "Specify all compatible models, part numbers, and condition to help buyers find your part.",
        maxLength: 2000,
    },
    defaultValues: {
        title: "",
        categoryId: "",
        brandId: "",
        sparePartTypeId: "",
        price: undefined,
        description: "",
    },
};

export default function PostSparePartForm({ editSparePartId }: { editSparePartId?: string }) {
    return <ListingForm config={sparePartFormConfig} editId={editSparePartId} />;
}
