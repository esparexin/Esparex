export interface ITaxonomyAiAnalysis {
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

export interface ITaxonomyAiDecision {
    autoAccepted: boolean;
    requiresReview: boolean;
    reviewedBy?: string;
    reviewedAt?: Date;
}

export interface ITaxonomyAiResult {
    analysis: ITaxonomyAiAnalysis;
    decision: ITaxonomyAiDecision;
}
