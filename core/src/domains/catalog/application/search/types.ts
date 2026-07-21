export interface CatalogSearchTelemetrySnapshot {
    searches: number;
    atlasAttempts: number;
    atlasFallbacks: number;
    autocompleteQueries: number;
    autocompleteSuppressed: number;
    duplicateDetections: number;
    duplicateSuppressions: number;
    transliterationMatches: number;
    transliterationLowConfidenceMatches: number;
    zeroResultQueries: number;
    canonicalOverrides: number;
    variantSuppressions: number;
    weakAliasSuppressions: number;
    suspiciousQuerySuppressions: number;
    popularityAnomalies: number;
    seoThinPageSuppressions: number;
    crawlBudgetSuppressions: number;
    aliasPollutionSignals: number;
    duplicateConfidenceTotal: number;
    resultConfidenceTotal: number;
    canonicalCertaintyTotal: number;
    crawlQualityTotal: number;
    behavioralEvents: number;
    searchClicks: number;
    autocompleteSelections: number;
    searchAbandonments: number;
    zeroResultRecoveries: number;
    duplicateResultFrustrations: number;
    transliterationCorrections: number;
    variantEngagements: number;
    moderatorOverrides: number;
    replayEvaluations: number;
    replayRegressions: number;
    experimentAssignments: number;
    trustAgingReviews: number;
    behaviorAnomalySignals: number;
    satisfactionScoreTotal: number;
    rankingQualityScoreTotal: number;
    autocompleteConfidenceScoreTotal: number;
    queryFrustrationScoreTotal: number;
    fairnessQualityScoreTotal: number;
    diversityScoreTotal: number;
    longTailExposureScoreTotal: number;
    canonicalDominanceScoreTotal: number;
    autocompleteDiversityScoreTotal: number;
    popularityConcentrationScoreTotal: number;
    metricIntegrityScoreTotal: number;
    experimentConfidenceScoreTotal: number;
    behavioralOverfitRiskTotal: number;
    fairnessEvaluations: number;
    longTailExposureAdjustments: number;
    diversityMixAdjustments: number;
    metricIntegritySignals: number;
    experimentQualityEvaluations: number;
    behavioralOverfitPreventions: number;
    queryCostUnits: number;
    atlasLatencyMs: number;
    totalLatencyMs: number;
    lastLatencyMs: number;
    topQueries: Record<string, number>;
}

export interface AtlasCatalogSearchResult {
    ids: string[];
    scores: Map<string, number>;
}

export interface DuplicateCandidate {
    id: string;
    label: string;
    score: number;
    reasons: string[];
    confidence: number;
}

export interface CatalogTrustSignals {
    catalogTrustScore?: number;
    variantTrustScore?: number;
    aliasTrustScore?: number;
    synonymTrustScore?: number;
    transliterationTrustScore?: number;
    moderatorTrustScore?: number;
    moderationReliabilityScore?: number;
    aliasApprovalConfidence?: number;
    synonymApprovalConfidence?: number;
    popularityConfidenceScore?: number;
    canonicalCertaintyScore?: number;
    duplicateConfidenceScore?: number;
    seoQualityScore?: number;
    crawlDepthLimit?: number;
    indexable?: boolean;
    lastAuditAt?: Date;
}

export interface SearchQualityScore {
    score: number;
    canonicalCertainty: number;
    resultConfidence: number;
    duplicateConfidence: number;
    transliterationConfidence: number;
    aliasTrust: number;
    synonymTrust: number;
    popularityConfidence: number;
    reasons: string[];
}

export interface RankingExplanation {
    id: string;
    reasons: string[];
    confidenceSummary: {
        resultConfidence: number;
        canonicalCertainty: number;
        transliterationConfidence: number;
        duplicateConfidence: number;
        popularityConfidence: number;
        fairnessConfidence: number;
    };
    canonicalOverrideExplanation?: string;
    transliterationExplanation?: string;
    duplicateSuppressionExplanation?: string;
    variantGroupingExplanation?: string;
}

export interface FairnessRankingScore {
    fairnessScore: number;
    diversityScore: number;
    longTailExposureScore: number;
    popularityBoundedScore: number;
    explorationScore: number;
    overfitRisk: number;
    reasons: string[];
}

export interface MetricIntegrityScore {
    integrityScore: number;
    trustWeightedCtr: number;
    anomalyAdjustedEngagement: number;
    manipulationRisk: number;
    reasons: string[];
}

export interface ExperimentQualityScore {
    experimentConfidenceScore: number;
    replayValidated: boolean;
    fairnessRegressionDetected: boolean;
    transliterationRegressionDetected: boolean;
    canonicalRegressionDetected: boolean;
    rollbackRequired: boolean;
    guardrails: string[];
    reasons: string[];
}

export interface RelevanceEvaluationScore {
    rankingQualityScore: number;
    fairnessQualityScore: number;
    transliterationQualityScore: number;
    duplicateSuppressionQualityScore: number;
    autocompleteUsefulnessScore: number;
    satisfactionBenchmarkScore: number;
    reasons: string[];
}

export interface SeoCrawlDecision {
    indexable: boolean;
    canonicalPath: string | null;
    qualityScore: number;
    crawlDepth: number;
    reasons: string[];
}

export interface ModerationIntelligenceHint {
    type:
        | 'duplicate_suggestion'
        | 'suspicious_alias'
        | 'transliteration_conflict'
        | 'canonical_merge_suggestion'
        | 'low_confidence_lineage';
    severity: 'info' | 'warning' | 'critical';
    confidence: number;
    message: string;
    targetId?: string;
}

export type BehavioralSearchEventType =
    | 'search_impression'
    | 'search_click'
    | 'autocomplete_select'
    | 'search_abandon'
    | 'zero_result_recovery'
    | 'duplicate_frustration'
    | 'transliteration_correction'
    | 'variant_engagement'
    | 'moderator_override';

export type MarketplaceIntentType = 'buyer' | 'seller' | 'repair' | 'spare_part_compatibility' | 'brand_preference' | 'hierarchy_navigation' | 'unknown';

export interface BehavioralSearchEvent {
    type: BehavioralSearchEventType;
    query: string;
    sessionKey?: string;
    resultId?: string;
    selectedSuggestion?: string;
    refinedQuery?: string;
    resultPosition?: number;
    resultCount?: number;
    duplicateVisibleCount?: number;
    transliterationCorrected?: boolean;
    variantSelected?: boolean;
    moderatorOverride?: boolean;
    timestamp?: Date;
}

export interface SearchSatisfactionScore {
    searchSatisfactionScore: number;
    rankingQualityScore: number;
    autocompleteConfidenceScore: number;
    queryFrustrationScore: number;
    reasons: string[];
}

export interface BehavioralAnomalyScore {
    anomalyConfidence: number;
    suspiciousRankingSuppression: boolean;
    autocompletePoisoningRisk: number;
    reasons: string[];
}

export interface MarketplaceIntentScore {
    intent: MarketplaceIntentType;
    confidence: number;
    signals: string[];
}

export interface TrustAgingDecision {
    adjustedTrustScore: number;
    reviewRequired: boolean;
    staleAlias: boolean;
    staleSynonym: boolean;
    outdatedTransliteration: boolean;
    inactiveModeratorDecay: boolean;
    reasons: string[];
}

export interface RankingReplayInput<T> {
    query: string;
    searchFields: string[];
    baselineItems: T[];
    candidateItems?: T[];
    expectedClickedIds?: string[];
    expectedCanonicalIds?: string[];
    autocomplete?: boolean;
}

export interface RankingReplayResult {
    query: string;
    baselineTopIds: string[];
    candidateTopIds: string[];
    rankingQualityDelta: number;
    duplicateSuppressionPassed: boolean;
    transliterationQualityScore: number;
    canonicalOverrideScore: number;
    regressionDetected: boolean;
    reasons: string[];
}

export interface RankingExperimentDecision {
    experimentKey: string;
    enabled: boolean;
    bucket: 'control' | 'treatment';
    weight: number;
    guardrails: string[];
}

export interface RankingIntelligenceInsight {
    type:
        | 'low_quality_result'
        | 'duplicate_ranking_warning'
        | 'transliteration_quality_analysis'
        | 'synonym_quality_analysis'
        | 'ranking_anomaly_suggestion';
    severity: 'info' | 'warning' | 'critical';
    confidence: number;
    message: string;
    targetId?: string;
}
