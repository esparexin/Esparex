import { useCallback, useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { generateAIContent, checkAiStatus } from "@/lib/api/user/ai";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";
import { MAX_AD_DESCRIPTION_CHARS } from "@esparex/contracts";
import { ListingCategory } from "@/types/listing";
import { SparePart } from "@/lib/api/user/masterData";
import { trackPostAdEvent } from "@/lib/analytics/trackPostAd";
import { AiErrorCode } from "@esparex/contracts/v1/common/enums";
import type { AiCache } from "../context/types";
import { createAiContextSignature, buildSmartTitle } from "./aiGenerationHelpers";

export { createAiContextSignature, buildSmartTitle } from "./aiGenerationHelpers";

export function usePostAdAiGeneration(
    form: UseFormReturn<PostAdFormData>,
    categoryMap: Record<string, ListingCategory>,
    availableSpareParts: SparePart[],
    setFormError: (error: string | null) => void
) {
    const [isGeneratingAI, setIsGeneratingAI] = useState<'title' | 'description' | null>(null);
    const [isAiAvailable, setIsAiAvailable] = useState(true);
    const [aiCache, setAiCache] = useState<AiCache | null>(null);
    const [titleVariantIndex, setTitleVariantIndex] = useState(0);

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

        const resolvedPowerStatus = deviceCondition === 'power_on' ? 'On' : deviceCondition === 'power_off' ? 'Off' : undefined;

        const context = {
            brand: resolvedBrand,
            model: resolvedModel,
            category: categoryName,
            condition: deviceCondition || "device",
            powerStatus: resolvedPowerStatus,
            workingParts: selectedSparePartNames.join(", "),
        };
        const contextSignature = createAiContextSignature(context);

        if (targetField === 'title') {
            const nextTitle = buildSmartTitle(context, titleVariantIndex);
            setTitleVariantIndex(prev => prev + 1);
            form.setValue("title", nextTitle, { shouldValidate: true });
            form.trigger("title");
            setAiCache(prev => ({
                contextSignature,
                generatedAt: Date.now(),
                title: nextTitle,
                description: prev?.description || ""
            }));
            trackPostAdEvent({ event: "ai_title_generated" });
            return;
        }

        if (!options?.forceRegenerate && aiCache && aiCache.contextSignature === contextSignature) {
            const cachedValue = aiCache.description;
            if (cachedValue) {
                const truncated = cachedValue.slice(0, MAX_AD_DESCRIPTION_CHARS);
                form.setValue("description", truncated, { shouldValidate: true });
                form.trigger("description");
                trackPostAdEvent({ event: `ai_description_generated_from_cache` });
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

            if (output && output.description) {
                const newTitle = aiCache?.title || "";
                const newDescription = output.description;

                setAiCache({
                    contextSignature,
                    generatedAt: Date.now(),
                    title: newTitle,
                    description: newDescription
                });

                const truncated = output.description.slice(0, MAX_AD_DESCRIPTION_CHARS);
                form.setValue("description", truncated, { shouldValidate: true });
                form.trigger("description");
                trackPostAdEvent({ event: "ai_description_generated" });
            }
        } catch {
            // Client-side instant fallback when network or API fails
            const condLabel = context.condition === 'power_on' ? 'Working Condition' : context.condition === 'power_off' ? 'Power Off' : context.condition !== 'device' ? context.condition : '';
            const descLines = [
                `${context.brand} ${context.model} (${context.category}) for sale.`,
                condLabel ? `Condition: ${condLabel}.` : '',
                context.workingParts ? `Working parts: ${context.workingParts}.` : '',
                'Genuine item listed for sale on Esparex marketplace.'
            ].filter(Boolean);
            const fallbackDesc = descLines.join(' ').slice(0, MAX_AD_DESCRIPTION_CHARS);
            form.setValue("description", fallbackDesc, { shouldValidate: true });
            form.trigger("description");
            setFormError(null);
            trackPostAdEvent({ event: "ai_generation_failure", field: targetField, metadata: { fallback: true } });
        } finally {
            setIsGeneratingAI(null);
        }
    }, [categoryMap, availableSpareParts, form, setFormError, isGeneratingAI, isAiAvailable, aiCache, titleVariantIndex]);

    return { generateDescription, isGeneratingAI, isAiAvailable, aiCache };
}
