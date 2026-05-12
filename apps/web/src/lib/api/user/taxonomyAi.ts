import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "../routes";
import { unwrapApiPayload } from "@/lib/api/result";

export interface TaxonomyAiResult {
    analysis: {
        categorySuggestion: string;
        brandSuggestion: string;
        modelSuggestion?: string;
        confidence: number;
        explanation: string;
        isDuplicate?: boolean;
        matchedWith?: string;
    };
}

export async function analyzeTaxonomy(input: string, context?: { brand?: string; category?: string }): Promise<TaxonomyAiResult | null> {
    const response = await apiClient.post(API_ROUTES.USER.AI_TAXONOMY_ANALYZE, {
        input,
        ...context
    });
    return unwrapApiPayload<TaxonomyAiResult>(response);
}
