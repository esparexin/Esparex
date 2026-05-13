export interface ICatalogAiAnalysis {
    categorySuggestion?: string;
    brandSuggestion?: string;
    modelSuggestion?: string;
    variantSuggestion?: string;
    variantAttributes?: Record<string, string>;
    confidence: number;
    explanation?: string;
    provider: string;
    model: string;
    analyzedAt: Date;
    promptVersion: string;
}

export interface ICatalogAiDecision {
    autoAccepted: boolean;
    requiresReview: boolean;
    reviewedBy?: string;
    reviewedAt?: Date;
}

export interface ICatalogAiResult {
    analysis: ICatalogAiAnalysis;
    decision: ICatalogAiDecision;
}
