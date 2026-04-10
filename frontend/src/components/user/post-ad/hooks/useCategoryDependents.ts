import { useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { ListingCategory } from "@/types/listing";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";

export function useCategoryDependents(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    brandMap: Record<string, any>,
    setFormError: (error: string | null) => void,
    setBrandIsPending: (isPending: boolean) => void,
    setSpareParts: (parts: string[]) => void,
    loadBrandsForCategory: (id: string) => Promise<void>,
    loadSparePartsForCategory: (id: string) => Promise<void>,
    loadCategorySchema: (id: string) => Promise<void>
) {
    const selectedCategoryId = String(form.watch("categoryId") || form.watch("category") || "");
    
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
        form.setValue("category", id as any, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        form.setValue("categoryId", id as any, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        form.setValue("brand", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("brandId", "", { shouldValidate: true, shouldDirty: true });
        form.setValue("screenSize", "", { shouldValidate: true, shouldDirty: true });
        setSpareParts([]);
        form.setValue("spareParts", [] as any, { shouldValidate: true, shouldDirty: true });
        setBrandIsPending(false);
        
        await loadBrandsForCategory(id);
        await loadSparePartsForCategory(id);
        await loadCategorySchema(id);
    }, [form, setFormError, setSpareParts, setBrandIsPending, loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema]);

    const handleBrandChange = useCallback(async (name: string) => {
        setFormError(null);
        form.setValue("brand", name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        const brandObj = brandMap[name];
        const brandId = normalizeOptionalObjectId(brandObj?.id);
        form.setValue("brandId", brandId ?? "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        setSpareParts([]);
        form.setValue("spareParts", [] as any, { shouldValidate: true, shouldDirty: true });
        setBrandIsPending(false);
    }, [form, brandMap, setFormError, setSpareParts, setBrandIsPending]);

    return { requiresScreenSize, handleCategoryChange, handleBrandChange };
}
