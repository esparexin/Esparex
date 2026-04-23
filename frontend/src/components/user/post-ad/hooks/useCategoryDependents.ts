import { useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";
import { ListingCategory } from "@/types/listing";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
import type { Brand } from "@/lib/api/user/masterData";

export function useCategoryDependents(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    brandMap: Record<string, Brand>,
    setFormError: (error: string | null) => void,
    setBrandIsPending: (isPending: boolean) => void,
    loadBrandsForCategory: (id: string) => Promise<void>,
    loadSparePartsForCategory: (id: string) => Promise<void>,
    loadCategorySchema: (id: string) => Promise<void>
) {
    const selectedCategoryId = resolveCatalogEntityId(
        form.watch("categoryId"),
        form.watch("category")
    );
    
    const requiresScreenSize = useMemo(() => {
        const category = categoryMap[selectedCategoryId];
        if (!category) return false;
        const name = category.name?.toLowerCase() || "";
        const slug = category.slug?.toLowerCase() || "";
        return Boolean(category.hasScreenSizes) ||
               slug.includes("tv") ||
               slug.includes("monitor") ||
               name.includes("tv") ||
               name.includes("monitor");
    }, [selectedCategoryId, categoryMap]);

    const handleCategoryChange = useCallback(async (id: string) => {
        setFormError(null);
        form.setValue("category", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("categoryId", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        form.setValue("brand", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("brandId", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("model", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("modelId", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("screenSize", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        setBrandIsPending(false);
        
        await Promise.all([
            loadBrandsForCategory(id),
            loadSparePartsForCategory(id),
            loadCategorySchema(id)
        ]);
    }, [form, setFormError, setBrandIsPending, loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema]);

    const handleBrandChange = useCallback(async (name: string) => {
        const currentBrand = form.getValues("brand");
        const brandChanged = currentBrand !== name;

        setFormError(null);
        form.setValue("brand", name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        const brandObj = brandMap[name];
        const brandId = normalizeOptionalObjectId(brandObj?.id);
        form.setValue("brandId", brandId ?? "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        if (brandChanged) {
            form.setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
            form.setValue("model", "", { shouldValidate: true, shouldDirty: true });
            form.setValue("modelId", "", { shouldValidate: true, shouldDirty: true });
        }
        
        setBrandIsPending(false);
    }, [form, brandMap, setFormError, setBrandIsPending]);

    return { requiresScreenSize, handleCategoryChange, handleBrandChange };
}
