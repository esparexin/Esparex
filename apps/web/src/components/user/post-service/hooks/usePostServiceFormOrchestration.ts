import type { UseFormReturn } from "react-hook-form";
import type { ServiceListingFormData } from "@/schemas/serviceListingPayload.schema";
import type { ServiceType } from "@/lib/api/user/masterData";
import { useListingFormOrchestration } from "@/components/user/shared/useListingFormOrchestration";
import { serviceFormConfig } from "@/components/user/post-service/PostServiceForm";

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
    return useListingFormOrchestration({
        config: serviceFormConfig,
        form: form as any,
        editId: editServiceId,
        loadBrandsForCategory,
        loadCatalogItems: loadServiceTypes,
        onSubmitted,
    });
}
