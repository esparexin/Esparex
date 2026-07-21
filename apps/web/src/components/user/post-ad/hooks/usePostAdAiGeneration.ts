import { useCallback, useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { generateAIContent, checkAiStatus } from "@/lib/api/user/ai";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";
import { MAX_AD_TITLE_CHARS, MAX_AD_DESCRIPTION_CHARS } from "@esparex/contracts";
import { notify } from "@/lib/feedback";
import { ListingCategory } from "@/types/listing";
import { SparePart } from "@/lib/api/user/masterData";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";
import { AiErrorCode } from "@esparex/contracts/v1/common/enums";
import type { AiCache } from "../context/types";

export function createAiContextSignature(context: { brand: string, model: string, category: string, condition: string, workingParts: string }) {
    const parts = context.workingParts.split(',').map(p => p.trim()).filter(Boolean).sort();
    return `brand:${context.brand}|model:${context.model}|cat:${context.category}|cond:${context.condition}|parts:${parts.join(',')}`;
}

export function usePostAdAiGeneration(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    availableSpareParts: SparePart[],
    setFormError: (error: string | null) => void
) {
    const [isGeneratingAI, setIsGeneratingAI] = useState<'title' | 'description' | null>(null);
    const [isAiAvailable, setIsAiAvailable] = useState(true);
    const [aiCache, setAiCache] = useState<AiCache | null>(null);

    useEffect(() => {
        if (isAiAvailable) return;
        
        let timeoutId: NodeJS.Timeout;
        const pollStatus = async () => {
            try {
                const status = await checkAiStatus();
                if (status.available) {
                    setIsAiAvailable(true);
                } else if (status.retryAfter > 0) {
                    timeoutId = setTimeout(pollStatus, status.retryAfter * 1000);
                }
            } catch {
                // Ignore background polling errors
            }
        };

        // Initial check after 30 seconds if backend didn't provide a specific retryAfter during the error
        timeoutId = setTimeout(pollStatus, 30000);
        
        return () => clearTimeout(timeoutId);
    }, [isAiAvailable]);

    const generateDescription = useCallback(async (targetField: 'title' | 'description', options?: { forceRegenerate?: boolean }) => {
        if (isGeneratingAI !== null || !isAiAvailable) return;

        const { brand, model, screenSize, category, categoryId, deviceCondition, spareParts } = form.getValues();
        
        const selectedCategoryId = resolveCatalogEntityId(categoryId, category);
        const categoryName = categoryMap[selectedCategoryId]?.name || "device";
        
        const resolvedBrand = String(brand || "").trim() || categoryName;
        const resolvedModel = String(model || "").trim() || String(screenSize || "").trim() || categoryName;
        
        // Map spare part IDs to names for AI context
        const selectedSparePartNames = (spareParts || [])
            .map(id => availableSpareParts.find(p => p.id === id || p._id === id)?.name)
            .filter((name): name is string => Boolean(name));

        const context = {
            brand: resolvedBrand,
            model: resolvedModel,
            category: categoryName,
            condition: deviceCondition || "device",
            workingParts: selectedSparePartNames.join(", "),
        };
        const contextSignature = createAiContextSignature(context);

        if (!options?.forceRegenerate && aiCache && aiCache.contextSignature === contextSignature) {
            const cachedValue = targetField === 'title' ? aiCache.title : aiCache.description;
            if (cachedValue) {
                const truncated = cachedValue.slice(0, targetField === 'title' ? MAX_AD_TITLE_CHARS : MAX_AD_DESCRIPTION_CHARS);
                form.setValue(targetField, truncated, { shouldValidate: true });
                form.trigger(targetField);
                notify.success(`${targetField === 'title' ? 'Title' : 'Description'} generated from cache!`);
                trackPostAdEvent({ event: `ai_${targetField}_generated_from_cache` });
                return;
            }
        }

        setIsGeneratingAI(targetField);
        try {
            const { data: output, error } = await generateAIContent({
                type: 'generate',
                context: {
                    ...context,
                    targetField
                }
            });

            if (error) {
                const errorCode = error?.context?.backendErrorCode || error?.code;
                if (errorCode === AiErrorCode.AI_QUOTA_EXHAUSTED || errorCode === AiErrorCode.AI_UNAVAILABLE) {
                    setIsAiAvailable(false);
                    trackPostAdEvent({ event: "ai_generation_failure", field: targetField, metadata: { reason: errorCode } });
                    return; // Skip setting form error popup
                }
                throw error;
            }

            if (output && output.title && output.description) {
                setAiCache({
                    contextSignature,
                    generatedAt: Date.now(),
                    title: output.title,
                    description: output.description
                });

                if (targetField === 'title') {
                    const truncated = output.title.slice(0, MAX_AD_TITLE_CHARS);
                    form.setValue("title", truncated, { shouldValidate: true });
                    form.trigger("title");
                    notify.success("Title generated successfully!");
                    trackPostAdEvent({ event: "ai_title_generated" });
                }
                if (targetField === 'description') {
                    const truncated = output.description.slice(0, MAX_AD_DESCRIPTION_CHARS);
                    form.setValue("description", truncated, { shouldValidate: true });
                    form.trigger("description");
                    notify.success("Description generated successfully!");
                    trackPostAdEvent({ event: "ai_description_generated" });
                }
            }
        } catch {
            setFormError(`AI generation failed. Please enter ${targetField} manually.`);
            trackPostAdEvent({ event: "ai_generation_failure", field: targetField });
        } finally {
            setIsGeneratingAI(null);
        }
    }, [categoryMap, availableSpareParts, form, setFormError, isGeneratingAI, isAiAvailable, aiCache]);

    return { generateDescription, isGeneratingAI, isAiAvailable, aiCache };
}
