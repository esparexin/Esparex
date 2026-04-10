import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { generateAIContent } from "@/lib/api/user/ai";
import { notify } from "@/lib/notify";
import { ListingCategory } from "@/types/listing";

export function usePostAdAiGeneration(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    setIsLoading: (isLoading: boolean) => void,
    setFormError: (error: string | null) => void
) {
    const generateDescription = useCallback(async (targetField: 'title' | 'description') => {
        const { brand, screenSize, category, categoryId } = form.getValues();
        const selectedCategoryId = String(categoryId || category || "");
        const categoryName = categoryMap[selectedCategoryId]?.name || "device";
        const resolvedBrand = String(brand || "").trim() || categoryName;
        const resolvedDescriptor = String(screenSize || "").trim() || categoryName;
        
        if (!resolvedBrand || !resolvedDescriptor) return;
        
        setIsLoading(true);
        try {
            const output = await generateAIContent({
                type: 'generate',
                context: {
                    brand: resolvedBrand,
                    model: resolvedDescriptor,
                    condition: "device",
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
    }, [categoryMap, form, setFormError, setIsLoading]);

    return { generateDescription };
}
