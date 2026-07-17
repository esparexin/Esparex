import { useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";
import { ListingCategory } from "@/types/listing";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";
import type { Brand } from "@/lib/api/user/masterData";

export function useCategoryDependents(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    brandMap: Record<string, Brand>,
    setFormError: (error: string | null) => void,
    setBrandIsPending: (isPending: boolean) => void,
    loadBrandsForCategory: (id: string) => Promise<void>,
    loadSparePartsForCategory: (id: string) => Promise<void>,
    loadCategorySchema: (id: string) => Promise<void>,
    loadModelsForBrand: (brandId?: string, categoryId?: string, search?: string) => Promise<void>
) {
    const selectedCategoryId = resolveCatalogEntityId(
        form.watch("categoryId"),
        form.watch("category")
    );
    
    const requiresScreenSize = useMemo(() => {
        const category = categoryMap[selectedCategoryId];
        if (!category) return false;
        return Boolean(category.hasScreenSizes);
    }, [selectedCategoryId, categoryMap]);

    /**
     * Centralized clearing of dependent fields child to Brand (models only).
     * Screen sizes, spare parts, and device condition are independent of brand and are not cleared.
     */
    const clearBrandDependents = useCallback(() => {
        form.setValue("model", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("modelId", "", { shouldValidate: true, shouldDirty: true });
    }, [form]);

    /**
     * Centralized clearing of all dependent fields child to Category (brand + model + screen size + spare parts + device condition).
     */
    const clearCategoryDependents = useCallback(() => {
        form.setValue("brand", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("brandId", "", { shouldValidate: true, shouldDirty: true });
        clearBrandDependents();
        form.setValue("screenSize", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        form.setValue("deviceCondition", undefined, { shouldValidate: true, shouldDirty: true });
    }, [form, clearBrandDependents]);

    /**
     * Explicit selection action for Category. Sets canonical form values, clears dependents, and triggers catalog queries.
     */
    const selectCategory = useCallback(async (id: string) => {
        setFormError(null);
        form.setValue("category", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("categoryId", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        clearCategoryDependents();
        setBrandIsPending(false);
        
        await Promise.all([
            loadBrandsForCategory(id),
            loadSparePartsForCategory(id),
            loadCategorySchema(id)
        ]);
    }, [form, setFormError, clearCategoryDependents, setBrandIsPending, loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema]);

    /**
     * Explicit selection action for Brand. Sets canonical form values, clears child dependents when changed, and triggers models query.
     */
    const selectBrand = useCallback(async (id: string, name: string) => {
        const currentBrandId = form.getValues("brandId");
        const currentBrandName = form.getValues("brand");
        const brandChanged = currentBrandId !== id && currentBrandName !== name;

        setFormError(null);
        form.setValue("brand", name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("brandId", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        if (brandChanged) {
            clearBrandDependents();
        }

        if (id) {
            await loadModelsForBrand(id, selectedCategoryId);
        } else {
            await loadModelsForBrand("", selectedCategoryId);
        }
        
        setBrandIsPending(false);
    }, [form, setFormError, clearBrandDependents, loadModelsForBrand, selectedCategoryId, setBrandIsPending]);

    /**
     * Explicit selection action for Model. Sets canonical form values cleanly without HTTP queries or cache changes.
     */
    const selectModel = useCallback((id: string, name: string) => {
        setFormError(null);
        form.setValue("model", name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("modelId", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [form, setFormError]);

    /**
     * Backward-compatible alias for existing callers.
     */
    const handleCategoryChange = selectCategory;

    /**
     * Backward-compatible handler for existing callers passing name + optional requestId.
     */
    const handleBrandChange = useCallback(async (name: string, requestId?: string) => {
        const brandObj = brandMap[name];
        const brandId = sanitizeMongoObjectId(brandObj?.id || brandObj?._id) || requestId || "";
        return selectBrand(brandId, name);
    }, [brandMap, selectBrand]);

    const handleModelChange = useCallback((id: string, name: string) => {
        selectModel(id, name);
    }, [selectModel]);

    return {
        requiresScreenSize,
        handleCategoryChange,
        handleBrandChange,
        handleModelChange,
        selectCategory,
        selectBrand,
        selectModel,
        clearBrandDependents,
        clearCategoryDependents,
    };
}
