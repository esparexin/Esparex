import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { generateAIContent } from "@/lib/api/user/ai";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";
import { notify } from "@/lib/notify";
import { ListingCategory } from "@/types/listing";
import { SparePart } from "@/lib/api/user/masterData";

export function usePostAdAiGeneration(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    availableSpareParts: SparePart[],
    setIsLoading: (isLoading: boolean) => void,
    setFormError: (error: string | null) => void
) {
    const generateDescription = useCallback(async (targetField: 'title' | 'description') => {
        const { brand, model, screenSize, category, categoryId, deviceCondition, spareParts } = form.getValues();
        
        const selectedCategoryId = resolveCatalogEntityId(categoryId, category);
        const categoryName = categoryMap[selectedCategoryId]?.name || "device";
        
        const resolvedBrand = String(brand || "").trim() || categoryName;
        const resolvedModel = String(model || "").trim() || String(screenSize || "").trim() || categoryName;
        
        // Map spare part IDs to names for AI context
        const selectedSparePartNames = (spareParts || [])
            .map(id => availableSpareParts.find(p => p.id === id || p._id === id)?.name)
            .filter((name): name is string => Boolean(name));

        setIsLoading(true);
        try {
            const output = await generateAIContent({
                type: 'generate',
                context: {
                    brand: resolvedBrand,
                    model: resolvedModel,
                    category: categoryName,
                    condition: deviceCondition || "device",
                    workingParts: selectedSparePartNames.join(", "),
                    targetField
                }
            });
            if (output) {
                if (targetField === 'title' && output.title) {
                    form.setValue("title", output.title, { shouldValidate: true });
                    form.trigger("title");
                    notify.success("Title generated successfully!");
                }
                if (targetField === 'description' && output.description) {
                    form.setValue("description", output.description, { shouldValidate: true });
                    form.trigger("description");
                    notify.success("Description generated successfully!");
                }
            }
        } catch {
            setFormError(`AI generation failed. Please enter ${targetField} manually.`);
        } finally {
            setIsLoading(false);
        }
    }, [categoryMap, availableSpareParts, form, setFormError, setIsLoading]);

    return { generateDescription };
}
