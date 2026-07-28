import type { UseFormReturn } from "react-hook-form";
import type { PostSparePartFormValues } from "@/schemas/postSparePartForm.schema";
import { useListingFormOrchestration } from "@/components/user/shared/useListingFormOrchestration";
import { sparePartFormConfig } from "@/components/user/post-spare-part/PostSparePartForm";

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
    return useListingFormOrchestration({
        config: sparePartFormConfig,
        form: form as any,
        editId: editSparePartId,
        loadBrandsForCategory,
        loadCatalogItems: loadSparePartsForCategory,
        onSubmitted,
    });
}
