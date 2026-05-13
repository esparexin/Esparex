import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { generateAIContent } from "@/lib/api/user/ai";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";
import { notify } from "@/lib/feedback";
import { ListingCategory } from "@/types/listing";
import { SparePart } from "@/lib/api/user/masterData";
import { analyzeTaxonomy } from "@/lib/api/user/taxonomyAi";

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

    const autoFillTaxonomy = useCallback(async () => {
        const title = form.getValues("title");
        if (!title || title.length < 5) return;

        setIsLoading(true);
        try {
            const result = await analyzeTaxonomy(title);
            if (result?.analysis) {
                const { categorySuggestion, brandSuggestion, modelSuggestion, confidence } = result.analysis;
                
                if (confidence >= 0.8) {
                    // Try to find category ID
                    const category = Object.values(categoryMap).find(c => 
                        c.name.toLowerCase() === categorySuggestion.toLowerCase()
                    );
                    
                    if (category) {
                        form.setValue("categoryId", category.id, { shouldValidate: true });
                        form.setValue("category", category.name);
                        
                        // We set brand and model names. 
                        // The BrandSearchSelect and ModelSearchSelect will handle these as "custom/pending" 
                        // if they aren't in the list, or match them if they are.
                        form.setValue("brand", brandSuggestion, { shouldValidate: true });
                        if (modelSuggestion) {
                            form.setValue("model", modelSuggestion, { shouldValidate: true });
                        }
                        
                        notify.success(`AI suggested: ${category.name} > ${brandSuggestion}${modelSuggestion ? ' > ' + modelSuggestion : ''}`);
                    }
                }
            }
        } catch (err) {
            console.error("AI Taxonomy auto-fill failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, [form, categoryMap, setIsLoading]);

    return { generateDescription, autoFillTaxonomy };
}
