import type { Document, Model } from 'mongoose';
import { escapeRegExp } from '../../utils/stringUtils';
import logger from '../../utils/logger';

const TELUGU_TRANSLITERATION_MAP: Array<[RegExp, string]> = [
    [/గు/g, 'gu'],
    [/మ్మ/g, 'mma'],
    [/డి/g, 'di'],
    [/ధి/g, 'dhi'],
    [/శా/g, 'sha'],
    [/సా/g, 'sa'],
    [/ం/g, 'm'],
    [/ా/g, 'a'],
    [/ి/g, 'i'],
    [/ీ/g, 'i'],
    [/ు/g, 'u'],
    [/ూ/g, 'u'],
    [/ె/g, 'e'],
    [/ే/g, 'e'],
    [/ై/g, 'ai'],
    [/ొ/g, 'o'],
    [/ో/g, 'o'],
    [/ౌ/g, 'au'],
    [/క/g, 'ka'],
    [/గ/g, 'ga'],
    [/చ/g, 'cha'],
    [/జ/g, 'ja'],
    [/ట/g, 'ta'],
    [/డ/g, 'da'],
    [/త/g, 'ta'],
    [/ద/g, 'da'],
    [/న/g, 'na'],
    [/ప/g, 'pa'],
    [/బ/g, 'ba'],
    [/మ/g, 'ma'],
    [/య/g, 'ya'],
    [/ర/g, 'ra'],
    [/ల/g, 'la'],
    [/వ/g, 'va'],
    [/శ/g, 'sha'],
    [/స/g, 'sa'],
    [/హ/g, 'ha'],
];

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

const telemetry: CatalogSearchTelemetrySnapshot = {
    searches: 0,
    atlasAttempts: 0,
    atlasFallbacks: 0,
    autocompleteQueries: 0,
    autocompleteSuppressed: 0,
    duplicateDetections: 0,
    duplicateSuppressions: 0,
    transliterationMatches: 0,
    transliterationLowConfidenceMatches: 0,
    zeroResultQueries: 0,
    canonicalOverrides: 0,
    variantSuppressions: 0,
    weakAliasSuppressions: 0,
    suspiciousQuerySuppressions: 0,
    popularityAnomalies: 0,
    seoThinPageSuppressions: 0,
    crawlBudgetSuppressions: 0,
    aliasPollutionSignals: 0,
    duplicateConfidenceTotal: 0,
    resultConfidenceTotal: 0,
    canonicalCertaintyTotal: 0,
    crawlQualityTotal: 0,
    behavioralEvents: 0,
    searchClicks: 0,
    autocompleteSelections: 0,
    searchAbandonments: 0,
    zeroResultRecoveries: 0,
    duplicateResultFrustrations: 0,
    transliterationCorrections: 0,
    variantEngagements: 0,
    moderatorOverrides: 0,
    replayEvaluations: 0,
    replayRegressions: 0,
    experimentAssignments: 0,
    trustAgingReviews: 0,
    behaviorAnomalySignals: 0,
    satisfactionScoreTotal: 0,
    rankingQualityScoreTotal: 0,
    autocompleteConfidenceScoreTotal: 0,
    queryFrustrationScoreTotal: 0,
    fairnessQualityScoreTotal: 0,
    diversityScoreTotal: 0,
    longTailExposureScoreTotal: 0,
    canonicalDominanceScoreTotal: 0,
    autocompleteDiversityScoreTotal: 0,
    popularityConcentrationScoreTotal: 0,
    metricIntegrityScoreTotal: 0,
    experimentConfidenceScoreTotal: 0,
    behavioralOverfitRiskTotal: 0,
    fairnessEvaluations: 0,
    longTailExposureAdjustments: 0,
    diversityMixAdjustments: 0,
    metricIntegritySignals: 0,
    experimentQualityEvaluations: 0,
    behavioralOverfitPreventions: 0,
    queryCostUnits: 0,
    atlasLatencyMs: 0,
    totalLatencyMs: 0,
    lastLatencyMs: 0,
    topQueries: {},
};

export const getCatalogSearchTelemetrySnapshot = (): CatalogSearchTelemetrySnapshot => ({
    ...telemetry,
    topQueries: { ...telemetry.topQueries },
});

const compact = (value: string): string => value.replace(/[^a-z0-9]+/g, '');
const MAX_SEARCH_VARIANTS = 5;
const MAX_ATLAS_SHOULD_CLAUSES = 36;
const AUTOCOMPLETE_WINDOW_MS = 60_000;
const AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW = 80;
const SUSPICIOUS_AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW = 24;
const MIN_ALIAS_TRUST_FOR_RANKING = 0.35;
const MIN_SYNONYM_TRUST_FOR_RANKING = 0.3;
const MIN_SEO_INDEX_QUALITY = 0.52;
const MAX_SEO_CRAWL_DEPTH = 4;
const TRUST_REVIEW_AGE_DAYS = 180;
const MODERATOR_INACTIVE_DECAY_DAYS = 90;
const MAX_POPULARITY_RANKING_CONTRIBUTION = 12;
const MAX_NON_CANONICAL_POPULARITY_CONTRIBUTION = 4;
const autocompleteWindows = new Map<string, { count: number; resetAt: number }>();
const behavioralWindows = new Map<string, { count: number; clicks: number; abandons: number; resetAt: number }>();

const fieldWeights: Record<string, number> = {
    canonicalName: 1000,
    slug: 900,
    hierarchyPath: 850,
    displayName: 760,
    name: 740,
    aliases: 520,
    synonyms: 420,
};

export function normalizeCatalogSearchText(value: unknown): string {
    if (typeof value !== 'string') return '';
    let text = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (const [pattern, replacement] of TELUGU_TRANSLITERATION_MAP) {
        text = text.replace(pattern, replacement);
    }
    return text
        .replace(/[^a-z0-9\s-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function buildSearchVariants(search: string): string[] {
    const normalized = normalizeCatalogSearchText(search);
    const collapsed = compact(normalized);
    const variants: string[] = [];
    const pushVariant = (value: string) => {
        const normalizedValue = normalizeCatalogSearchText(value);
        if (normalizedValue.length < 2) return;
        if (!variants.includes(normalizedValue)) variants.push(normalizedValue);
    };

    pushVariant(search.trim());
    if (normalized) pushVariant(normalized);
    if (collapsed && collapsed !== normalized && collapsed.length >= 4) pushVariant(collapsed);

    // Conservative phonetic variants for common catalog misspellings.
    if (normalized.length >= 4) {
        pushVariant(normalized.replace(/\biphne\b/g, 'iphone'));
        pushVariant(normalized.replace(/\bsamung\b/g, 'samsung'));
    }
    if (normalized.length >= 6) {
        pushVariant(normalized.replace(/dh/g, 'd'));
        pushVariant(normalized.replace(/dy/g, 'di'));
    }

    return variants.slice(0, MAX_SEARCH_VARIANTS);
}

export function buildRegexSearchClauses(search: string, searchFields: string[]): Record<string, unknown>[] {
    const variants = buildSearchVariants(search);
    const clauses: Record<string, unknown>[] = [];
    for (const variant of variants) {
        const safeSearch = escapeRegExp(variant);
        for (const field of searchFields) {
            clauses.push({ [field]: { $regex: safeSearch, $options: 'i' } });
        }
    }
    return clauses;
}

export function getTransliterationConfidence(search: string, candidate: string): number {
    const normalizedSearch = normalizeCatalogSearchText(search);
    const normalizedCandidate = normalizeCatalogSearchText(candidate);
    if (!normalizedSearch || !normalizedCandidate) return 0;
    if (normalizedSearch === normalizedCandidate) return 1;
    const searchCompact = compact(normalizedSearch);
    const candidateCompact = compact(normalizedCandidate);
    if (!searchCompact || !candidateCompact) return 0;
    if (searchCompact === candidateCompact) return 0.92;
    if (candidateCompact.startsWith(searchCompact) || searchCompact.startsWith(candidateCompact)) return 0.78;
    if (candidateCompact.includes(searchCompact) || searchCompact.includes(candidateCompact)) return 0.62;
    return 0;
}

const clamp01 = (value: unknown, fallback = 0.5): number => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(1, Math.max(0, numeric));
};

const getTrustSignals = (item: Record<string, unknown>): CatalogTrustSignals => {
    const source = item.marketplaceTrust && typeof item.marketplaceTrust === 'object'
        ? item.marketplaceTrust as Record<string, unknown>
        : item.searchGovernance && typeof item.searchGovernance === 'object'
            ? item.searchGovernance as Record<string, unknown>
            : item;
    return {
        catalogTrustScore: clamp01(source.catalogTrustScore ?? item.catalogTrustScore, 0.72),
        variantTrustScore: clamp01(source.variantTrustScore ?? item.variantTrustScore, 0.66),
        aliasTrustScore: clamp01(source.aliasTrustScore ?? item.aliasTrustScore, 0.62),
        synonymTrustScore: clamp01(source.synonymTrustScore ?? item.synonymTrustScore, 0.58),
        transliterationTrustScore: clamp01(source.transliterationTrustScore ?? item.transliterationTrustScore, 0.64),
        moderatorTrustScore: clamp01(source.moderatorTrustScore ?? item.moderatorTrustScore, 0.7),
        moderationReliabilityScore: clamp01(source.moderationReliabilityScore ?? item.moderationReliabilityScore, 0.7),
        aliasApprovalConfidence: clamp01(source.aliasApprovalConfidence ?? item.aliasApprovalConfidence, 0.6),
        synonymApprovalConfidence: clamp01(source.synonymApprovalConfidence ?? item.synonymApprovalConfidence, 0.55),
        popularityConfidenceScore: clamp01(source.popularityConfidenceScore ?? item.popularityConfidenceScore, 0.65),
        canonicalCertaintyScore: clamp01(source.canonicalCertaintyScore ?? item.canonicalCertaintyScore, 0.72),
        duplicateConfidenceScore: clamp01(source.duplicateConfidenceScore ?? item.duplicateConfidenceScore, 0.5),
        seoQualityScore: clamp01(source.seoQualityScore ?? item.seoQualityScore, 0.6),
        crawlDepthLimit: Number(source.crawlDepthLimit ?? item.crawlDepthLimit) || MAX_SEO_CRAWL_DEPTH,
        indexable: typeof source.indexable === 'boolean' ? source.indexable : undefined,
        lastAuditAt: source.lastAuditAt instanceof Date ? source.lastAuditAt : undefined,
    };
};

export function scoreModeratorTrust(params: {
    approvedActions?: number;
    reversedActions?: number;
    duplicateApprovals?: number;
    aliasApprovals?: number;
    synonymApprovals?: number;
    conflictWarnings?: number;
}): number {
    const approved = Math.max(0, Number(params.approvedActions ?? 0));
    const reversed = Math.max(0, Number(params.reversedActions ?? 0));
    const duplicateApprovals = Math.max(0, Number(params.duplicateApprovals ?? 0));
    const aliasApprovals = Math.max(0, Number(params.aliasApprovals ?? 0));
    const synonymApprovals = Math.max(0, Number(params.synonymApprovals ?? 0));
    const conflicts = Math.max(0, Number(params.conflictWarnings ?? 0));
    const sampleConfidence = Math.min(0.2, approved / 250);
    const reversalPenalty = approved > 0 ? Math.min(0.35, reversed / Math.max(approved, 1)) : 0;
    const enrichmentSignal = Math.min(0.15, (duplicateApprovals + aliasApprovals + synonymApprovals) / 300);
    const conflictPenalty = Math.min(0.25, conflicts / 100);
    return clamp01(0.62 + sampleConfidence + enrichmentSignal - reversalPenalty - conflictPenalty, 0.62);
}

export function scorePopularityConfidence(params: {
    usageCount?: unknown;
    uniqueUsers?: unknown;
    windowCount?: unknown;
    repeatedQueryCount?: unknown;
    moderatorTrustScore?: unknown;
}): number {
    const usageCount = Math.max(0, Number(params.usageCount ?? 0));
    const uniqueUsers = Math.max(0, Number(params.uniqueUsers ?? 0));
    const windowCount = Math.max(0, Number(params.windowCount ?? 0));
    const repeatedQueryCount = Math.max(0, Number(params.repeatedQueryCount ?? 0));
    const moderatorTrust = clamp01(params.moderatorTrustScore, 0.65);
    const diversity = usageCount > 0 ? Math.min(1, uniqueUsers / Math.max(usageCount, 1)) : 0.6;
    const burstPenalty = windowCount > 0 ? Math.min(0.45, repeatedQueryCount / Math.max(windowCount, 1)) : 0;
    const volumeConfidence = Math.min(0.2, Math.log10(usageCount + 1) / 8);
    const confidence = 0.42 + (diversity * 0.25) + (moderatorTrust * 0.18) + volumeConfidence - burstPenalty;
    if (confidence < 0.35 || burstPenalty > 0.3) telemetry.popularityAnomalies++;
    return clamp01(confidence, 0.55);
}

export function isSuspiciousQueryPattern(search: string): boolean {
    const normalized = normalizeCatalogSearchText(search);
    if (!normalized) return false;
    const compacted = compact(normalized);
    if (compacted.length > 48) return true;
    if (/([a-z0-9])\1{5,}/.test(compacted)) return true;
    if (normalized.split(' ').length > 10) return true;
    if (/free|casino|betting|escort|whatsapp|wa me/.test(normalized)) return true;
    return false;
}

const toTimestamp = (value: unknown): number => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string' || typeof value === 'number') {
        const time = new Date(value).getTime();
        return Number.isFinite(time) ? time : 0;
    }
    return 0;
};

const daysSince = (value: unknown, now = Date.now()): number => {
    const timestamp = toTimestamp(value);
    if (!timestamp) return Number.POSITIVE_INFINITY;
    return Math.max(0, Math.floor((now - timestamp) / 86_400_000));
};

export function recordBehavioralSearchTelemetry(event: BehavioralSearchEvent): void {
    const normalized = normalizeCatalogSearchText(event.query);
    telemetry.behavioralEvents++;
    if (event.type === 'search_click') telemetry.searchClicks++;
    if (event.type === 'autocomplete_select') telemetry.autocompleteSelections++;
    if (event.type === 'search_abandon') telemetry.searchAbandonments++;
    if (event.type === 'zero_result_recovery') telemetry.zeroResultRecoveries++;
    if (event.type === 'duplicate_frustration') telemetry.duplicateResultFrustrations++;
    if (event.type === 'transliteration_correction' || event.transliterationCorrected) telemetry.transliterationCorrections++;
    if (event.type === 'variant_engagement' || event.variantSelected) telemetry.variantEngagements++;
    if (event.type === 'moderator_override' || event.moderatorOverride) telemetry.moderatorOverrides++;
    if (normalized) telemetry.topQueries[normalized] = (telemetry.topQueries[normalized] ?? 0) + 1;

    const sessionKey = `${event.sessionKey ?? 'anonymous'}:${normalized.slice(0, 48)}`;
    const now = Date.now();
    const current = behavioralWindows.get(sessionKey);
    if (!current || current.resetAt <= now) {
        behavioralWindows.set(sessionKey, {
            count: 1,
            clicks: event.type === 'search_click' ? 1 : 0,
            abandons: event.type === 'search_abandon' ? 1 : 0,
            resetAt: now + AUTOCOMPLETE_WINDOW_MS,
        });
        return;
    }
    current.count++;
    if (event.type === 'search_click') current.clicks++;
    if (event.type === 'search_abandon') current.abandons++;
}

export function scoreSearchSatisfaction(params: {
    impressions?: unknown;
    clicks?: unknown;
    autocompleteSelections?: unknown;
    abandonments?: unknown;
    refinements?: unknown;
    zeroResults?: unknown;
    zeroResultRecoveries?: unknown;
    duplicateFrustrations?: unknown;
    transliterationCorrections?: unknown;
    lowConfidenceTransliterations?: unknown;
}): SearchSatisfactionScore {
    const impressions = Math.max(1, Number(params.impressions ?? 1));
    const clicks = Math.max(0, Number(params.clicks ?? 0));
    const autocompleteSelections = Math.max(0, Number(params.autocompleteSelections ?? 0));
    const abandonments = Math.max(0, Number(params.abandonments ?? 0));
    const refinements = Math.max(0, Number(params.refinements ?? 0));
    const zeroResults = Math.max(0, Number(params.zeroResults ?? 0));
    const zeroResultRecoveries = Math.max(0, Number(params.zeroResultRecoveries ?? 0));
    const duplicateFrustrations = Math.max(0, Number(params.duplicateFrustrations ?? 0));
    const transliterationCorrections = Math.max(0, Number(params.transliterationCorrections ?? 0));
    const lowConfidenceTransliterations = Math.max(0, Number(params.lowConfidenceTransliterations ?? 0));
    const reasons: string[] = [];

    const ctr = Math.min(1, clicks / impressions);
    const autocompleteRate = Math.min(1, autocompleteSelections / impressions);
    const abandonmentRate = Math.min(1, abandonments / impressions);
    const refinementRate = Math.min(1, refinements / impressions);
    const zeroResultRate = Math.min(1, zeroResults / impressions);
    const recoveryRate = zeroResults > 0 ? Math.min(1, zeroResultRecoveries / zeroResults) : 1;
    const duplicateFrustrationRate = Math.min(1, duplicateFrustrations / impressions);
    const transliterationCorrectionRate = Math.min(1, transliterationCorrections / impressions);
    const lowConfidenceTransliterationRate = Math.min(1, lowConfidenceTransliterations / impressions);

    if (abandonmentRate > 0.35) reasons.push('high_abandonment');
    if (refinementRate > 0.45) reasons.push('high_refinement');
    if (duplicateFrustrationRate > 0.1) reasons.push('duplicate_dissatisfaction');
    if (lowConfidenceTransliterationRate > 0.1) reasons.push('low_confidence_transliteration_corrections');
    if (zeroResultRate > 0.2 && recoveryRate < 0.5) reasons.push('poor_zero_result_recovery');

    const searchSatisfactionScore = clamp01(0.58 + (ctr * 0.28) + (recoveryRate * 0.1) - (abandonmentRate * 0.32) - (refinementRate * 0.18) - (duplicateFrustrationRate * 0.28), 0.55);
    const rankingQualityScore = clamp01(0.6 + (ctr * 0.22) - (refinementRate * 0.2) - (duplicateFrustrationRate * 0.3) - (zeroResultRate * 0.16), 0.6);
    const autocompleteConfidenceScore = clamp01(0.55 + (autocompleteRate * 0.28) + (transliterationCorrectionRate * 0.06) - (abandonmentRate * 0.18) - (lowConfidenceTransliterationRate * 0.2), 0.55);
    const queryFrustrationScore = clamp01((abandonmentRate * 0.36) + (refinementRate * 0.26) + (duplicateFrustrationRate * 0.24) + (zeroResultRate * 0.18) + (lowConfidenceTransliterationRate * 0.16), 0);

    telemetry.satisfactionScoreTotal += searchSatisfactionScore;
    telemetry.rankingQualityScoreTotal += rankingQualityScore;
    telemetry.autocompleteConfidenceScoreTotal += autocompleteConfidenceScore;
    telemetry.queryFrustrationScoreTotal += queryFrustrationScore;

    return {
        searchSatisfactionScore,
        rankingQualityScore,
        autocompleteConfidenceScore,
        queryFrustrationScore,
        reasons,
    };
}

export function classifyMarketplaceIntent(params: {
    query: string;
    categorySlug?: string;
    brandSlug?: string;
    listingType?: string;
    pathSegments?: string[];
}): MarketplaceIntentScore {
    const normalized = normalizeCatalogSearchText(params.query);
    const signals: string[] = [];
    let intent: MarketplaceIntentType = 'unknown';
    let confidence = 0.35;

    if (/\b(buy|price|used|new|sale|for sale)\b/.test(normalized) || params.listingType === 'ad') {
        intent = 'buyer';
        confidence += 0.28;
        signals.push('buyer_terms');
    }
    if (/\b(sell|post|dealer|inventory)\b/.test(normalized)) {
        intent = 'seller';
        confidence += 0.25;
        signals.push('seller_terms');
    }
    if (/\b(repair|service|fix|technician|screen replacement)\b/.test(normalized) || params.listingType === 'service') {
        intent = 'repair';
        confidence += 0.3;
        signals.push('repair_terms');
    }
    if (/\b(spare|part|battery|display|screen|compatible|compatibility)\b/.test(normalized) || params.listingType === 'spare_part') {
        intent = 'spare_part_compatibility';
        confidence += 0.32;
        signals.push('compatibility_terms');
    }
    if (params.brandSlug || /\b(apple|samsung|vivo|oppo|oneplus|mi|xiaomi)\b/.test(normalized)) {
        if (intent === 'unknown') intent = 'brand_preference';
        confidence += 0.12;
        signals.push('brand_signal');
    }
    if ((params.pathSegments?.length ?? 0) >= 2 || params.categorySlug) {
        if (intent === 'unknown') intent = 'hierarchy_navigation';
        confidence += 0.12;
        signals.push('hierarchy_signal');
    }

    return {
        intent,
        confidence: clamp01(confidence, 0.35),
        signals,
    };
}

export function applyTrustAgingGovernance(params: {
    trustScore?: unknown;
    aliasLastReviewedAt?: unknown;
    synonymLastReviewedAt?: unknown;
    transliterationLastReviewedAt?: unknown;
    moderatorLastActiveAt?: unknown;
    now?: Date;
}): TrustAgingDecision {
    const now = params.now?.getTime() ?? Date.now();
    const baseTrust = clamp01(params.trustScore, 0.7);
    const aliasAge = daysSince(params.aliasLastReviewedAt, now);
    const synonymAge = daysSince(params.synonymLastReviewedAt, now);
    const transliterationAge = daysSince(params.transliterationLastReviewedAt, now);
    const moderatorInactiveAge = daysSince(params.moderatorLastActiveAt, now);
    const staleAlias = aliasAge > TRUST_REVIEW_AGE_DAYS;
    const staleSynonym = synonymAge > TRUST_REVIEW_AGE_DAYS;
    const outdatedTransliteration = transliterationAge > TRUST_REVIEW_AGE_DAYS;
    const inactiveModeratorDecay = moderatorInactiveAge > MODERATOR_INACTIVE_DECAY_DAYS;
    const reasons: string[] = [];
    let decay = 0;

    if (staleAlias) {
        decay += Math.min(0.18, (aliasAge - TRUST_REVIEW_AGE_DAYS) / 1200);
        reasons.push('stale_alias_review');
    }
    if (staleSynonym) {
        decay += Math.min(0.16, (synonymAge - TRUST_REVIEW_AGE_DAYS) / 1400);
        reasons.push('stale_synonym_review');
    }
    if (outdatedTransliteration) {
        decay += Math.min(0.18, (transliterationAge - TRUST_REVIEW_AGE_DAYS) / 1200);
        reasons.push('outdated_transliteration_review');
    }
    if (inactiveModeratorDecay) {
        decay += Math.min(0.22, (moderatorInactiveAge - MODERATOR_INACTIVE_DECAY_DAYS) / 900);
        reasons.push('inactive_moderator_decay');
    }

    const adjustedTrustScore = clamp01(baseTrust - decay, baseTrust);
    const reviewRequired = reasons.length > 0 || adjustedTrustScore < 0.45;
    if (reviewRequired) telemetry.trustAgingReviews++;
    return {
        adjustedTrustScore,
        reviewRequired,
        staleAlias,
        staleSynonym,
        outdatedTransliteration,
        inactiveModeratorDecay,
        reasons,
    };
}

export function detectBehavioralAnomaly(params: {
    query: string;
    sessionKey?: string;
    impressions?: unknown;
    clicks?: unknown;
    uniqueUsers?: unknown;
    autocompleteSelections?: unknown;
    repeatedQueryCount?: unknown;
    transliterationCorrections?: unknown;
}): BehavioralAnomalyScore {
    const impressions = Math.max(1, Number(params.impressions ?? 1));
    const clicks = Math.max(0, Number(params.clicks ?? 0));
    const uniqueUsers = Math.max(0, Number(params.uniqueUsers ?? 0));
    const autocompleteSelections = Math.max(0, Number(params.autocompleteSelections ?? 0));
    const repeatedQueryCount = Math.max(0, Number(params.repeatedQueryCount ?? 0));
    const transliterationCorrections = Math.max(0, Number(params.transliterationCorrections ?? 0));
    const reasons: string[] = [];
    let anomalyConfidence = 0;

    const clickConcentration = clicks > 0 ? 1 - Math.min(1, uniqueUsers / clicks) : 0;
    const repeatedRate = Math.min(1, repeatedQueryCount / impressions);
    const autocompleteSelectionRate = Math.min(1, autocompleteSelections / impressions);
    const correctionRate = Math.min(1, transliterationCorrections / impressions);

    if (isSuspiciousQueryPattern(params.query)) {
        anomalyConfidence += 0.25;
        reasons.push('suspicious_query_pattern');
    }
    if (clickConcentration > 0.7 && clicks >= 10) {
        anomalyConfidence += 0.28;
        reasons.push('low_quality_click_concentration');
    }
    if (repeatedRate > 0.5) {
        anomalyConfidence += 0.22;
        reasons.push('suspicious_query_amplification');
    }
    if (autocompleteSelectionRate > 0.85 && repeatedRate > 0.35) {
        anomalyConfidence += 0.18;
        reasons.push('autocomplete_spam_behavior');
    }
    if (correctionRate > 0.35) {
        anomalyConfidence += 0.16;
        reasons.push('transliteration_abuse_pattern');
    }

    const finalConfidence = clamp01(anomalyConfidence, 0);
    if (finalConfidence >= 0.45) telemetry.behaviorAnomalySignals++;
    return {
        anomalyConfidence: finalConfidence,
        suspiciousRankingSuppression: finalConfidence >= 0.62,
        autocompletePoisoningRisk: clamp01((autocompleteSelectionRate * 0.35) + (repeatedRate * 0.35) + (finalConfidence * 0.3), 0),
        reasons,
    };
}

export function scoreCatalogSearchQuality(item: Record<string, unknown>, search: string, searchFields: string[]): SearchQualityScore {
    const trust = getTrustSignals(item);
    const normalizedQuery = normalizeCatalogSearchText(search);
    const queryCompact = compact(normalizedQuery);
    const canonicalValue = normalizeCatalogSearchText(String(item.canonicalName ?? ''));
    const slugCompact = compact(String(item.slug ?? ''));
    const reasons: string[] = [];

    let bestTransliteration = 0;
    let aliasMatch = false;
    let synonymMatch = false;
    let canonicalMatch = false;
    let fieldMatchScore = 0;

    for (const field of searchFields) {
        const normalizedValue = normalizeCatalogSearchText(getDocValue(item, field));
        if (!normalizedValue) continue;
        const valueCompact = compact(normalizedValue);
        const transliterationConfidence = getTransliterationConfidence(search, normalizedValue);
        bestTransliteration = Math.max(bestTransliteration, transliterationConfidence);
        if (normalizedValue === normalizedQuery || (queryCompact && valueCompact === queryCompact)) {
            fieldMatchScore += fieldWeights[field] ?? 50;
            if (field === 'canonicalName' || field === 'slug') canonicalMatch = true;
            if (field === 'aliases') aliasMatch = true;
            if (field === 'synonyms') synonymMatch = true;
        } else if (normalizedValue.includes(normalizedQuery) || (queryCompact && valueCompact.includes(queryCompact))) {
            fieldMatchScore += Math.floor((fieldWeights[field] ?? 50) / 2);
            if (field === 'aliases') aliasMatch = true;
            if (field === 'synonyms') synonymMatch = true;
        }
    }

    if (canonicalValue === normalizedQuery || (queryCompact && slugCompact === queryCompact)) {
        canonicalMatch = true;
    }

    const aliasTrust = (trust.aliasTrustScore ?? 0.62) * (trust.aliasApprovalConfidence ?? 0.6);
    const synonymTrust = (trust.synonymTrustScore ?? 0.58) * (trust.synonymApprovalConfidence ?? 0.55);
    const canonicalCertainty = clamp01((trust.canonicalCertaintyScore ?? 0.72) + (canonicalMatch ? 0.2 : 0) - (aliasMatch && aliasTrust < MIN_ALIAS_TRUST_FOR_RANKING ? 0.25 : 0), 0.68);
    const duplicateConfidence = clamp01(trust.duplicateConfidenceScore, 0.5);
    const popularityConfidence = clamp01(trust.popularityConfidenceScore, 0.65);
    const baseTrust = clamp01(((trust.catalogTrustScore ?? 0.72) + (trust.moderationReliabilityScore ?? 0.7) + canonicalCertainty) / 3, 0.7);
    let resultConfidence = clamp01((baseTrust * 0.55) + (bestTransliteration * 0.15) + (popularityConfidence * 0.1) + Math.min(0.2, fieldMatchScore / 4000), 0.62);

    if (aliasMatch && aliasTrust < MIN_ALIAS_TRUST_FOR_RANKING) {
        resultConfidence = Math.max(0, resultConfidence - 0.28);
        reasons.push('weak_alias_trust');
    }
    if (synonymMatch && synonymTrust < MIN_SYNONYM_TRUST_FOR_RANKING) {
        resultConfidence = Math.max(0, resultConfidence - 0.2);
        reasons.push('weak_synonym_trust');
    }
    if (bestTransliteration > 0 && bestTransliteration < 0.62) {
        reasons.push('low_transliteration_confidence');
    }
    if (canonicalMatch) reasons.push('canonical_match');

    const score = clamp01((resultConfidence * 0.5) + (canonicalCertainty * 0.25) + (baseTrust * 0.15) + ((1 - duplicateConfidence) * 0.1), 0.62);
    telemetry.resultConfidenceTotal += resultConfidence;
    telemetry.canonicalCertaintyTotal += canonicalCertainty;
    telemetry.duplicateConfidenceTotal += duplicateConfidence;

    return {
        score,
        canonicalCertainty,
        resultConfidence,
        duplicateConfidence,
        transliterationConfidence: bestTransliteration,
        aliasTrust,
        synonymTrust,
        popularityConfidence,
        reasons,
    };
}

const getDocValue = (item: Record<string, unknown>, field: string): string => {
    const value = field.split('.').reduce<unknown>((current, key) => {
        if (!current || typeof current !== 'object') return undefined;
        return (current as Record<string, unknown>)[key];
    }, item);
    if (Array.isArray(value)) return value.map(String).join(' ');
    return value == null ? '' : String(value);
};

const toPlainRecord = (item: unknown): Record<string, unknown> =>
    typeof (item as { toObject?: () => unknown })?.toObject === 'function'
        ? (item as { toObject: () => Record<string, unknown> }).toObject()
        : (item as Record<string, unknown>);

const lineageKeyFor = (item: Record<string, unknown>): string =>
    compact(normalizeCatalogSearchText(String(
        item.variantOfModelId ??
        item.parentModelId ??
        item.canonicalId ??
        item.modelId ??
        item.brandId ??
        item.canonicalName ??
        item.displayName ??
        item.name ??
        item.slug ??
        ''
    )));

const isLongTailCatalogItem = (item: Record<string, unknown>, query: string): boolean => {
    const usageCount = Number(item.usageCount ?? item.searchUsageCount ?? item.popularityCount ?? 0) || 0;
    const normalizedQuery = normalizeCatalogSearchText(query);
    const queryIsSparse = normalizedQuery.split(' ').filter(Boolean).length >= 3 || normalizedQuery.length >= 18;
    const emerging = item.emergingBrand === true || item.longTailEligible === true || item.lowFrequency === true;
    return emerging || usageCount <= 12 || queryIsSparse;
};

export function scoreFairnessAwareRanking(item: Record<string, unknown>, query: string, searchFields: string[]): FairnessRankingScore {
    const quality = scoreCatalogSearchQuality(item, query, searchFields);
    const usageCount = Math.max(0, Number(item.usageCount ?? item.searchUsageCount ?? item.popularityCount ?? 0) || 0);
    const popularityConcentration = clamp01(Math.log10(usageCount + 1) / 4, 0);
    const longTailEligible = isLongTailCatalogItem(item, query);
    const boundedPopularity = clamp01(quality.popularityConfidence * (1 - Math.min(0.45, popularityConcentration * 0.45)), 0.5);
    const longTailExposureScore = longTailEligible
        ? clamp01(0.58 + (quality.resultConfidence * 0.24) + ((1 - popularityConcentration) * 0.18), 0.58)
        : clamp01(0.48 + ((1 - popularityConcentration) * 0.12), 0.48);
    const explorationScore = longTailEligible
        ? clamp01(0.08 + (quality.canonicalCertainty * 0.08) + ((1 - quality.duplicateConfidence) * 0.08), 0)
        : clamp01(0.03 + ((1 - popularityConcentration) * 0.03), 0);
    const diversityScore = clamp01((longTailExposureScore * 0.45) + ((1 - popularityConcentration) * 0.3) + (quality.canonicalCertainty * 0.25), 0.55);
    const overfitRisk = clamp01((popularityConcentration * 0.5) + ((1 - boundedPopularity) * 0.2) + (quality.duplicateConfidence * 0.3), 0);
    const fairnessScore = clamp01((quality.score * 0.45) + (diversityScore * 0.28) + (longTailExposureScore * 0.17) + ((1 - overfitRisk) * 0.1), 0.58);
    const reasons: string[] = [];

    if (longTailEligible) reasons.push('long_tail_exposure_supported');
    if (usageCount > 1000) reasons.push('popularity_influence_bounded');
    if (explorationScore >= 0.12) reasons.push('controlled_exploration');
    if (overfitRisk >= 0.55) reasons.push('behavioral_overfit_risk');

    telemetry.fairnessEvaluations++;
    telemetry.fairnessQualityScoreTotal += fairnessScore;
    telemetry.diversityScoreTotal += diversityScore;
    telemetry.longTailExposureScoreTotal += longTailExposureScore;
    telemetry.popularityConcentrationScoreTotal += popularityConcentration;
    telemetry.behavioralOverfitRiskTotal += overfitRisk;
    if (longTailEligible) telemetry.longTailExposureAdjustments++;
    if (overfitRisk >= 0.55) telemetry.behavioralOverfitPreventions++;

    return {
        fairnessScore,
        diversityScore,
        longTailExposureScore,
        popularityBoundedScore: boundedPopularity,
        explorationScore,
        overfitRisk,
        reasons,
    };
}

export function explainRankingDecision(
    item: Record<string, unknown>,
    query: string,
    searchFields: string[],
    options: { duplicateSuppressed?: boolean; variantGrouped?: boolean } = {}
): RankingExplanation {
    const quality = scoreCatalogSearchQuality(item, query, searchFields);
    const fairness = scoreFairnessAwareRanking(item, query, searchFields);
    const id = String(item._id ?? item.id ?? '');
    const reasons = [...new Set([...quality.reasons, ...fairness.reasons])];

    return {
        id,
        reasons,
        confidenceSummary: {
            resultConfidence: quality.resultConfidence,
            canonicalCertainty: quality.canonicalCertainty,
            transliterationConfidence: quality.transliterationConfidence,
            duplicateConfidence: quality.duplicateConfidence,
            popularityConfidence: quality.popularityConfidence,
            fairnessConfidence: fairness.fairnessScore,
        },
        canonicalOverrideExplanation: quality.reasons.includes('canonical_match')
            ? 'Canonical lineage match received protected relevance priority.'
            : undefined,
        transliterationExplanation: quality.transliterationConfidence > 0
            ? `Transliteration confidence bucket: ${quality.transliterationConfidence >= 0.78 ? 'high' : quality.transliterationConfidence >= 0.62 ? 'medium' : 'review'}`
            : undefined,
        duplicateSuppressionExplanation: options.duplicateSuppressed || quality.duplicateConfidence > 0.72
            ? 'Duplicate confidence is high enough to require suppression or moderator review.'
            : undefined,
        variantGroupingExplanation: options.variantGrouped
            ? 'Variant result was grouped under its canonical parent to avoid lineage flooding.'
            : undefined,
    };
}

export function rankCatalogSearchResults<T>(
    items: T[],
    search: string,
    searchFields: string[],
    atlasScores?: Map<string, number>,
    options: { autocomplete?: boolean; collapseVariants?: boolean } = {}
): T[] {
    const normalizedQuery = normalizeCatalogSearchText(search);
    if (!normalizedQuery && !atlasScores) return items;
    const queryCompact = compact(normalizedQuery);

    const scoreFor = (item: T): number => {
            const plain = toPlainRecord(item);
            const id = String(plain._id ?? plain.id ?? '');
            let score = atlasScores?.get(id) ?? 0;
            const quality = scoreCatalogSearchQuality(plain, search, searchFields);
            const fairness = scoreFairnessAwareRanking(plain, search, searchFields);
            searchFields.forEach((field, index) => {
                const weight = fieldWeights[field] ?? Math.max(1, searchFields.length - index) * 50;
                const normalizedValue = normalizeCatalogSearchText(getDocValue(plain, field));
                const valueCompact = compact(normalizedValue);
                if (!normalizedValue) return;
                const transliterationConfidence = getTransliterationConfidence(search, normalizedValue);
                const trustAdjustedWeight = field === 'aliases'
                    ? Math.floor(weight * Math.max(0.2, quality.aliasTrust))
                    : field === 'synonyms'
                        ? Math.floor(weight * Math.max(0.2, quality.synonymTrust))
                        : weight;
                if (normalizedValue === normalizedQuery) score += 100 + weight;
                else if (field === 'slug' && valueCompact === queryCompact) score += 96 + trustAdjustedWeight;
                else if (normalizedValue.startsWith(normalizedQuery)) score += 55 + Math.floor(trustAdjustedWeight / 2);
                else if (normalizedValue.includes(normalizedQuery)) score += 28 + Math.floor(trustAdjustedWeight / 4);
                else if (transliterationConfidence >= 0.78) score += Math.floor(35 * transliterationConfidence) + Math.floor(trustAdjustedWeight / 6);
                else if (transliterationConfidence > 0 && transliterationConfidence < 0.62) telemetry.transliterationLowConfidenceMatches++;
                if (queryCompact && valueCompact.includes(queryCompact)) score += 12;
            });
            const isVariant = Boolean((plain as { variantOfModelId?: unknown }).variantOfModelId || (plain as { parentModelId?: unknown }).parentModelId);
            const canonicalMatch = normalizeCatalogSearchText(String(plain.canonicalName ?? '')) === normalizedQuery ||
                compact(String(plain.slug ?? '')) === queryCompact;
            if (isVariant && !canonicalMatch) score -= options.autocomplete ? 30 : 8;
            if (!isVariant && canonicalMatch) {
                score += 80;
                telemetry.canonicalOverrides++;
            }
            const usageCount = Number((plain as { usageCount?: unknown }).usageCount ?? 0) || 0;
            const popularityCap = canonicalMatch ? MAX_POPULARITY_RANKING_CONTRIBUTION : MAX_NON_CANONICAL_POPULARITY_CONTRIBUTION;
            score += (Math.min(Math.max(usageCount, 0), 100) / (100 / popularityCap)) * quality.popularityConfidence;
            score += Math.round(quality.score * 90);
            score += Math.round(fairness.explorationScore * 35);
            score += Math.round(fairness.longTailExposureScore * (isLongTailCatalogItem(plain, search) ? 16 : 4));
            if (fairness.overfitRisk > 0.65 && !canonicalMatch) score -= 12;
            if (quality.reasons.includes('weak_alias_trust')) score -= options.autocomplete ? 120 : 45;
            if (quality.reasons.includes('weak_synonym_trust')) score -= options.autocomplete ? 80 : 30;
            return score;
        };

    const sorted = [...items].sort((a, b) => scoreFor(b) - scoreFor(a));
    if (!options.autocomplete && !options.collapseVariants) return sorted;

    const seenLabels = new Set<string>();
    const variantsByOwner = new Map<string, number>();
    const governed: T[] = [];
    for (const item of sorted) {
        const plain = toPlainRecord(item);
        const labelKey = compact(normalizeCatalogSearchText(String(plain.canonicalName ?? plain.displayName ?? plain.name ?? plain.slug ?? '')));
        const quality = scoreCatalogSearchQuality(plain, search, searchFields);
        if (options.autocomplete && quality.resultConfidence < 0.38) {
            telemetry.weakAliasSuppressions++;
            continue;
        }
        if (labelKey && seenLabels.has(labelKey)) {
            telemetry.duplicateSuppressions++;
            continue;
        }
        const ownerId = String(plain.variantOfModelId ?? plain.parentModelId ?? '');
        if (ownerId) {
            const currentCount = variantsByOwner.get(ownerId) ?? 0;
            if (currentCount >= 2) {
                telemetry.variantSuppressions++;
                continue;
            }
            variantsByOwner.set(ownerId, currentCount + 1);
        }
        if (labelKey) seenLabels.add(labelKey);
        governed.push(item);
    }
    if (options.autocomplete) {
        return mixDiversityAwareAutocomplete(governed, search, searchFields, options);
    }
    return governed;
}

export async function tryAtlasCatalogSearch(params: {
    model: Model<Document>;
    query: Record<string, unknown>;
    search: string;
    searchFields: string[];
    skip: number;
    limit: number;
    indexName?: string;
}): Promise<AtlasCatalogSearchResult | null> {
    const variants = buildSearchVariants(params.search);
    if (variants.length === 0) return null;
    const queryCost = variants.length * params.searchFields.length;
    telemetry.queryCostUnits += queryCost;
    if (queryCost > MAX_ATLAS_SHOULD_CLAUSES) {
        telemetry.atlasFallbacks++;
        return null;
    }
    telemetry.atlasAttempts++;

    try {
        const should = variants.flatMap((query) => params.searchFields.map((path) => ({
            text: {
                query,
                path,
                fuzzy: { maxEdits: query.length > 7 ? 2 : 1, prefixLength: Math.min(3, Math.max(1, query.length - 2)) },
                score: { boost: { value: path === 'canonicalName' ? 12 : path === 'slug' ? 10 : path === 'displayName' || path === 'name' ? 7 : 3 } },
            },
        }))).slice(0, MAX_ATLAS_SHOULD_CLAUSES);

        const filterClauses: Record<string, any>[] = [];
        const mustNotClauses: Record<string, any>[] = [];

        // Mapped fields that are explicitly indexed in Atlas Search
        const MAPPED_ATLAS_FIELDS = new Set([
            'isActive', 'isDeleted', 'approvalStatus', 'categoryIds',
            'brandId', 'parentModelId', 'variantOfModelId', 'type'
        ]);

        for (const [key, rawVal] of Object.entries(params.query)) {
            let targetPath = key;
            if (key === 'categoryId') targetPath = 'categoryIds';
            if (key === 'variantModelId') targetPath = 'variantOfModelId';

            if (!MAPPED_ATLAS_FIELDS.has(targetPath)) {
                continue;
            }

            if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal) && !(rawVal instanceof Date)) {
                const keys = Object.keys(rawVal);
                if (keys.length === 1) {
                    const op = keys[0];
                    const opVal = (rawVal as Record<string, any>)[op];
                    if (op === '$ne') {
                        mustNotClauses.push({
                            equals: {
                                path: targetPath,
                                value: typeof opVal === 'object' && opVal ? String(opVal) : opVal
                            }
                        });
                    } else if (op === '$in' && Array.isArray(opVal)) {
                        const formattedVals = opVal.map(v => typeof v === 'object' && v ? String(v) : v);
                        filterClauses.push({
                            in: {
                                path: targetPath,
                                value: formattedVals
                            }
                        });
                    } else if (op === '$nin' && Array.isArray(opVal)) {
                        const formattedVals = opVal.map(v => typeof v === 'object' && v ? String(v) : v);
                        mustNotClauses.push({
                            in: {
                                path: targetPath,
                                value: formattedVals
                            }
                        });
                    }
                }
            } else if (Array.isArray(rawVal)) {
                const formattedVals = rawVal.map(v => typeof v === 'object' && v ? String(v) : v);
                filterClauses.push({
                    in: {
                        path: targetPath,
                        value: formattedVals
                    }
                });
            } else {
                filterClauses.push({
                    equals: {
                        path: targetPath,
                        value: typeof rawVal === 'object' && rawVal ? String(rawVal) : rawVal
                    }
                });
            }
        }

        const compound: Record<string, any> = {
            should,
            minimumShouldMatch: 1,
        };

        if (filterClauses.length > 0) {
            compound.filter = filterClauses;
        }

        if (mustNotClauses.length > 0) {
            compound.mustNot = mustNotClauses;
        }

        const atlasStartedAt = Date.now();
        const rows = await params.model.aggregate([
            {
                $search: {
                    index: params.indexName || process.env.ATLAS_CATALOG_SEARCH_INDEX || 'catalog_search',
                    compound,
                },
            },
            { $match: params.query },
            { $skip: params.skip },
            { $limit: params.limit },
            { $project: { _id: 1, score: { $meta: 'searchScore' } } },
        ]).option({ maxTimeMS: Number(process.env.ATLAS_CATALOG_SEARCH_TIMEOUT_MS || 1200) });
        telemetry.atlasLatencyMs += Date.now() - atlasStartedAt;

        const scores = new Map<string, number>();
        const ids = rows.map((row) => {
            const id = String(row._id);
            scores.set(id, Number(row.score ?? 0));
            return id;
        });
        return { ids, scores };
    } catch (error) {
        telemetry.atlasFallbacks++;
        logger.warn('[CatalogSearch] Atlas Search unavailable; using governed regex fallback', {
            modelName: params.model.modelName,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

export function recordCatalogSearchTelemetry(params: {
    search: string;
    latencyMs: number;
    resultCount: number;
    autocomplete?: boolean;
    duplicateCandidates?: number;
}) {
    const normalized = normalizeCatalogSearchText(params.search);
    telemetry.searches++;
    telemetry.totalLatencyMs += params.latencyMs;
    telemetry.lastLatencyMs = params.latencyMs;
    if (params.autocomplete) telemetry.autocompleteQueries++;
    if (params.resultCount === 0) telemetry.zeroResultQueries++;
    if (params.duplicateCandidates) telemetry.duplicateDetections += params.duplicateCandidates;
    if (isSuspiciousQueryPattern(params.search)) telemetry.suspiciousQuerySuppressions++;
    if (normalized && normalized !== String(params.search).trim().toLowerCase()) telemetry.transliterationMatches++;
    if (normalized) telemetry.topQueries[normalized] = (telemetry.topQueries[normalized] ?? 0) + 1;
}

export function mixDiversityAwareAutocomplete<T>(
    items: T[],
    query: string,
    searchFields: string[],
    options: { limit?: number; autocomplete?: boolean; collapseVariants?: boolean } = {}
): T[] {
    const limit = Math.min(Math.max(options.limit ?? items.length, 1), 50);
    const selected: T[] = [];
    const deferred: T[] = [];
    const lineageCounts = new Map<string, number>();
    let longTailCount = 0;
    let transliterationCount = 0;

    for (const item of items) {
        const record = toPlainRecord(item);
        const lineageKey = lineageKeyFor(record);
        const lineageCount = lineageCounts.get(lineageKey) ?? 0;
        const quality = scoreCatalogSearchQuality(record, query, searchFields);
        const longTail = isLongTailCatalogItem(record, query);
        const transliteration = quality.transliterationConfidence >= 0.62 && !quality.reasons.includes('canonical_match');
        const shouldDefer = (lineageKey && lineageCount >= 1) ||
            (selected.length >= 3 && longTailCount === 0 && !longTail) ||
            (selected.length >= 4 && transliterationCount === 0 && !transliteration && query.length >= 3);

        if (shouldDefer) {
            deferred.push(item);
            continue;
        }

        selected.push(item);
        if (lineageKey) lineageCounts.set(lineageKey, lineageCount + 1);
        if (longTail) longTailCount++;
        if (transliteration) transliterationCount++;
        if (selected.length >= limit) break;
    }

    for (const item of deferred) {
        if (selected.length >= limit) break;
        const lineageKey = lineageKeyFor(toPlainRecord(item));
        if (options.autocomplete && lineageKey && (lineageCounts.get(lineageKey) ?? 0) >= 1 && selected.length >= Math.min(2, limit)) {
            continue;
        }
        selected.push(item);
        if (lineageKey) lineageCounts.set(lineageKey, (lineageCounts.get(lineageKey) ?? 0) + 1);
    }

    const uniqueLineages = new Set(selected.map((item) => lineageKeyFor(toPlainRecord(item))).filter(Boolean)).size;
    const diversityScore = selected.length > 0 ? uniqueLineages / selected.length : 1;
    telemetry.autocompleteDiversityScoreTotal += diversityScore;
    if (diversityScore < 0.8 || longTailCount > 0 || transliterationCount > 0) {
        telemetry.diversityMixAdjustments++;
    }
    return selected;
}

export function scoreMetricIntegrity(params: {
    impressions?: unknown;
    clicks?: unknown;
    uniqueUsers?: unknown;
    repeatedQueryCount?: unknown;
    anomaly?: BehavioralAnomalyScore;
    moderatorTrustScore?: unknown;
    satisfactionScore?: unknown;
}): MetricIntegrityScore {
    const impressions = Math.max(1, Number(params.impressions ?? 1));
    const clicks = Math.max(0, Number(params.clicks ?? 0));
    const uniqueUsers = Math.max(0, Number(params.uniqueUsers ?? 0));
    const repeatedQueryCount = Math.max(0, Number(params.repeatedQueryCount ?? 0));
    const moderatorTrust = clamp01(params.moderatorTrustScore, 0.65);
    const satisfaction = clamp01(params.satisfactionScore, 0.6);
    const rawCtr = Math.min(1, clicks / impressions);
    const userDiversity = clicks > 0 ? Math.min(1, uniqueUsers / clicks) : 0.8;
    const repeatedRate = Math.min(1, repeatedQueryCount / impressions);
    const anomalyConfidence = params.anomaly?.anomalyConfidence ?? 0;
    const manipulationRisk = clamp01((1 - userDiversity) * 0.34 + repeatedRate * 0.28 + anomalyConfidence * 0.38, 0);
    const trustWeightedCtr = clamp01(rawCtr * (0.45 + moderatorTrust * 0.35 + userDiversity * 0.2), 0);
    const anomalyAdjustedEngagement = clamp01((trustWeightedCtr * 0.7 + satisfaction * 0.3) * (1 - Math.min(0.8, manipulationRisk)), 0);
    const integrityScore = clamp01(0.72 + (moderatorTrust * 0.14) + (userDiversity * 0.12) - (repeatedRate * 0.2) - (anomalyConfidence * 0.34), 0.6);
    const reasons: string[] = [];

    if (userDiversity < 0.35) reasons.push('low_user_diversity_clicks');
    if (repeatedRate > 0.45) reasons.push('query_spam_loop_risk');
    if (anomalyConfidence >= 0.45) reasons.push('anomaly_adjusted_metric');
    if (manipulationRisk >= 0.5) reasons.push('behavior_metric_abuse_risk');

    telemetry.metricIntegrityScoreTotal += integrityScore;
    if (reasons.length > 0) telemetry.metricIntegritySignals++;

    return {
        integrityScore,
        trustWeightedCtr,
        anomalyAdjustedEngagement,
        manipulationRisk,
        reasons,
    };
}

export function shouldSuppressAutocomplete(params: { key: string; search: string; limit: number }): boolean {
    if (params.limit > 50 || params.search.trim().length === 0) return false;
    const now = Date.now();
    const normalized = normalizeCatalogSearchText(params.search).slice(0, 32);
    const key = `${params.key}:${normalized}`;
    const current = autocompleteWindows.get(key);
    if (!current || current.resetAt <= now) {
        autocompleteWindows.set(key, { count: 1, resetAt: now + AUTOCOMPLETE_WINDOW_MS });
        return false;
    }
    current.count++;
    const maxRequests = isSuspiciousQueryPattern(params.search)
        ? SUSPICIOUS_AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW
        : AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW;
    if (current.count > maxRequests) {
        telemetry.autocompleteSuppressed++;
        if (maxRequests === SUSPICIOUS_AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW) telemetry.suspiciousQuerySuppressions++;
        return true;
    }
    return false;
}

export function buildSeoCanonicalPath(item: Record<string, unknown>): string | null {
    const segments = [
        item.categorySlug,
        item.brandSlug,
        item.parentSlug,
        item.slug,
    ]
        .map((segment) => normalizeCatalogSearchText(segment).replace(/\s+/g, '-'))
        .filter(Boolean);
    if (segments.length === 0) return null;
    return `/${segments.join('/')}`;
}

export function evaluateSeoCrawlDecision(item: Record<string, unknown>): SeoCrawlDecision {
    const canonicalPath = buildSeoCanonicalPath(item);
    const trust = getTrustSignals(item);
    const segments = canonicalPath ? canonicalPath.split('/').filter(Boolean) : [];
    const crawlDepth = segments.length;
    const reasons: string[] = [];
    const canonicalName = normalizeCatalogSearchText(item.canonicalName);
    const displayName = normalizeCatalogSearchText(item.displayName ?? item.name);
    const descriptionLength = String(item.description ?? '').trim().length;
    const hasLineage = Boolean(item.categorySlug || item.brandSlug || item.parentSlug || item.modelId || item.brandId);
    const duplicateConfidence = trust.duplicateConfidenceScore ?? 0.5;
    let qualityScore = clamp01(trust.seoQualityScore, 0.6);

    if (!canonicalPath) {
        reasons.push('missing_canonical_path');
        qualityScore -= 0.3;
    }
    if (crawlDepth > Math.min(MAX_SEO_CRAWL_DEPTH, trust.crawlDepthLimit ?? MAX_SEO_CRAWL_DEPTH)) {
        reasons.push('crawl_depth_exceeded');
        telemetry.crawlBudgetSuppressions++;
        qualityScore -= 0.25;
    }
    if (!canonicalName || canonicalName === displayName && descriptionLength < 80) {
        reasons.push('thin_content');
        telemetry.seoThinPageSuppressions++;
        qualityScore -= 0.2;
    }
    if (!hasLineage) {
        reasons.push('weak_lineage');
        qualityScore -= 0.15;
    }
    if (duplicateConfidence > 0.72) {
        reasons.push('duplicate_seo_risk');
        qualityScore -= 0.25;
    }
    if (trust.indexable === false) {
        reasons.push('explicit_noindex');
        qualityScore = 0;
    }

    const finalQuality = clamp01(qualityScore, 0.6);
    telemetry.crawlQualityTotal += finalQuality;
    return {
        indexable: finalQuality >= MIN_SEO_INDEX_QUALITY && !reasons.includes('crawl_depth_exceeded') && !reasons.includes('explicit_noindex'),
        canonicalPath,
        qualityScore: finalQuality,
        crawlDepth,
        reasons,
    };
}

export function detectDuplicateCandidates(
    input: string,
    items: Array<Record<string, unknown>>,
    fields: string[] = ['name', 'displayName', 'canonicalName', 'slug', 'aliases', 'synonyms']
): DuplicateCandidate[] {
    const normalizedInput = normalizeCatalogSearchText(input);
    const inputCompact = compact(normalizedInput);
    if (inputCompact.length < 3) return [];

    return items.flatMap((item) => {
        const reasons: string[] = [];
        let score = 0;
        for (const field of fields) {
            const normalizedValue = normalizeCatalogSearchText(getDocValue(item, field));
            const valueCompact = compact(normalizedValue);
            if (!valueCompact) continue;
            if (valueCompact === inputCompact) {
                score += 100;
                reasons.push(`${field}:exact-normalized`);
            } else if (valueCompact.includes(inputCompact) || inputCompact.includes(valueCompact)) {
                score += 45;
                reasons.push(`${field}:contains-normalized`);
            }
        }
        if (score < 45) return [];
        const confidence = clamp01(score / 145, 0.45);
        return [{
            id: String(item._id ?? item.id ?? ''),
            label: String(item.displayName ?? item.name ?? item.canonicalName ?? ''),
            score,
            confidence,
            reasons,
        }];
    }).sort((a, b) => b.score - a.score).slice(0, 5);
}

export function buildModerationIntelligenceHints(params: {
    input: string;
    candidates: Array<Record<string, unknown>>;
    proposedAliases?: string[];
    proposedSynonyms?: string[];
}): ModerationIntelligenceHint[] {
    const hints: ModerationIntelligenceHint[] = [];
    const duplicates = detectDuplicateCandidates(params.input, params.candidates);
    for (const duplicate of duplicates.filter((item) => item.confidence >= 0.55).slice(0, 3)) {
        hints.push({
            type: duplicate.confidence > 0.8 ? 'canonical_merge_suggestion' : 'duplicate_suggestion',
            severity: duplicate.confidence > 0.8 ? 'critical' : 'warning',
            confidence: duplicate.confidence,
            message: `Potential canonical overlap with ${duplicate.label}`,
            targetId: duplicate.id,
        });
    }

    const normalizedInput = normalizeCatalogSearchText(params.input);
    for (const alias of params.proposedAliases ?? []) {
        const aliasConfidence = getTransliterationConfidence(alias, normalizedInput);
        if (isSuspiciousQueryPattern(alias) || alias.length > 80 || aliasConfidence < 0.2) {
            telemetry.aliasPollutionSignals++;
            hints.push({
                type: 'suspicious_alias',
                severity: 'warning',
                confidence: clamp01(1 - aliasConfidence, 0.7),
                message: `Alias requires moderator review before it can influence search: ${alias}`,
            });
        }
    }

    for (const synonym of params.proposedSynonyms ?? []) {
        const synonymConfidence = getTransliterationConfidence(synonym, normalizedInput);
        if (synonymConfidence > 0 && synonymConfidence < 0.62) {
            hints.push({
                type: 'transliteration_conflict',
                severity: 'warning',
                confidence: clamp01(1 - synonymConfidence, 0.6),
                message: `Synonym may conflict with canonical transliteration: ${synonym}`,
            });
        }
    }

    if (duplicates.length === 0 && normalizedInput.split(' ').length <= 1) {
        hints.push({
            type: 'low_confidence_lineage',
            severity: 'info',
            confidence: 0.52,
            message: 'Canonical lineage has limited context; verify category and parent before approval.',
        });
    }

    return hints;
}

const itemId = (item: unknown): string => {
    const record = toPlainRecord(item);
    return String(record?._id ?? record?.id ?? '');
};

const topIds = <T>(items: T[], limit = 10): string[] => items.map(itemId).filter(Boolean).slice(0, limit);

const overlapScore = (expected: string[] = [], actual: string[] = []): number => {
    if (expected.length === 0) return 1;
    const actualSet = new Set(actual);
    const hits = expected.filter((id) => actualSet.has(id)).length;
    return hits / expected.length;
};

export function replayRankingEvaluation<T>(input: RankingReplayInput<T>): RankingReplayResult {
    telemetry.replayEvaluations++;
    const baselineRanked = rankCatalogSearchResults(input.baselineItems, input.query, input.searchFields, undefined, {
        autocomplete: input.autocomplete,
        collapseVariants: true,
    });
    const candidateRanked = rankCatalogSearchResults(input.candidateItems ?? input.baselineItems, input.query, input.searchFields, undefined, {
        autocomplete: input.autocomplete,
        collapseVariants: true,
    });
    const baselineTopIds = topIds(baselineRanked);
    const candidateTopIds = topIds(candidateRanked);
    const clickedBaseline = overlapScore(input.expectedClickedIds, baselineTopIds.slice(0, 5));
    const clickedCandidate = overlapScore(input.expectedClickedIds, candidateTopIds.slice(0, 5));
    const canonicalBaseline = overlapScore(input.expectedCanonicalIds, baselineTopIds.slice(0, 5));
    const canonicalCandidate = overlapScore(input.expectedCanonicalIds, candidateTopIds.slice(0, 5));
    const duplicateSuppressionPassed = new Set(candidateTopIds).size === candidateTopIds.length;
    const transliterationQualityScore = candidateRanked.length > 0
        ? Math.max(...candidateRanked.slice(0, 5).map((item) => {
            const record = typeof (item as { toObject?: () => unknown })?.toObject === 'function'
                ? (item as { toObject: () => Record<string, unknown> }).toObject()
                : item as Record<string, unknown>;
            return getTransliterationConfidence(input.query, String(record.canonicalName ?? record.displayName ?? record.name ?? ''));
        }))
        : 0;
    const canonicalOverrideScore = (canonicalCandidate + transliterationQualityScore) / 2;
    const rankingQualityDelta = ((clickedCandidate + canonicalCandidate) / 2) - ((clickedBaseline + canonicalBaseline) / 2);
    const reasons: string[] = [];

    if (!duplicateSuppressionPassed) reasons.push('duplicate_suppression_regression');
    if (rankingQualityDelta < -0.15) reasons.push('ranking_quality_regression');
    if (transliterationQualityScore < 0.4) reasons.push('transliteration_replay_low_confidence');
    if (canonicalOverrideScore < 0.45) reasons.push('canonical_override_replay_low_confidence');

    const regressionDetected = reasons.length > 0;
    if (regressionDetected) telemetry.replayRegressions++;
    return {
        query: input.query,
        baselineTopIds,
        candidateTopIds,
        rankingQualityDelta,
        duplicateSuppressionPassed,
        transliterationQualityScore,
        canonicalOverrideScore,
        regressionDetected,
        reasons,
    };
}

export function buildAdaptiveAutocompleteSuggestions<T>(params: {
    items: T[];
    query: string;
    searchFields: string[];
    intent?: MarketplaceIntentScore;
    behaviorWeights?: Record<string, number>;
    limit?: number;
}): T[] {
    const ranked = rankCatalogSearchResults(params.items, params.query, params.searchFields, undefined, {
        autocomplete: true,
        collapseVariants: true,
    });
    const intent = params.intent ?? classifyMarketplaceIntent({ query: params.query });
    const behaviorWeights = params.behaviorWeights ?? {};
    const scoreItem = (item: T): number => {
        const record = typeof (item as { toObject?: () => unknown })?.toObject === 'function'
            ? (item as { toObject: () => Record<string, unknown> }).toObject()
            : item as Record<string, unknown>;
        const id = itemId(record);
        const quality = scoreCatalogSearchQuality(record, params.query, params.searchFields);
        const behaviorWeight = clamp01(behaviorWeights[id], 0.5);
        const intentBoost = intent.intent !== 'unknown' && (
            String(record.listingType ?? '').includes(intent.intent) ||
            String(record.slug ?? '').includes(intent.intent.replace(/_/g, '-')) ||
            String(record.canonicalName ?? '').includes(intent.intent.replace(/_/g, ' '))
        ) ? 0.08 : 0;
        return quality.score + (behaviorWeight * 0.16) + intentBoost;
    };

    const scored = [...ranked]
        .sort((a, b) => scoreItem(b) - scoreItem(a))
        .slice(0, Math.min(Math.max((params.limit ?? 10) * 2, 1), 50));
    return mixDiversityAwareAutocomplete(scored, params.query, params.searchFields, {
        autocomplete: true,
        collapseVariants: true,
        limit: params.limit ?? 10,
    });
}

export function buildRankingExperimentDecision(params: {
    experimentKey: string;
    subjectKey: string;
    enabled?: boolean;
    treatmentWeight?: number;
    experimentConfidenceScore?: number;
    guardrails?: string[];
}): RankingExperimentDecision {
    const treatmentWeight = clamp01(params.treatmentWeight, 0.1);
    const confidence = clamp01(params.experimentConfidenceScore, 0.7);
    const hash = Array.from(`${params.experimentKey}:${params.subjectKey}`).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bucketValue = (hash % 10_000) / 10_000;
    const enabled = params.enabled === true && confidence >= 0.52;
    if (enabled) telemetry.experimentAssignments++;
    return {
        experimentKey: params.experimentKey,
        enabled,
        bucket: enabled && bucketValue < treatmentWeight ? 'treatment' : 'control',
        weight: treatmentWeight,
        guardrails: [
            'canonical_lineage_authority_required',
            'moderator_trust_must_not_be_overridden',
            'popularity_influence_bounded',
            'fairness_regression_blocking',
            'replay_validation_required',
            ...(params.guardrails ?? []),
        ],
    };
}

export function evaluateExperimentQuality(params: {
    replay?: RankingReplayResult;
    fairnessQualityScore?: unknown;
    baselineFairnessQualityScore?: unknown;
    transliterationQualityScore?: unknown;
    baselineTransliterationQualityScore?: unknown;
    canonicalOverrideScore?: unknown;
    baselineCanonicalOverrideScore?: unknown;
    sampleSize?: unknown;
}): ExperimentQualityScore {
    const sampleSize = Math.max(0, Number(params.sampleSize ?? 0));
    const replayValidated = params.replay ? !params.replay.regressionDetected : false;
    const fairnessScore = clamp01(params.fairnessQualityScore, 0.6);
    const baselineFairness = clamp01(params.baselineFairnessQualityScore, fairnessScore);
    const transliterationScore = clamp01(params.transliterationQualityScore ?? params.replay?.transliterationQualityScore, 0.6);
    const baselineTransliteration = clamp01(params.baselineTransliterationQualityScore, transliterationScore);
    const canonicalScore = clamp01(params.canonicalOverrideScore ?? params.replay?.canonicalOverrideScore, 0.7);
    const baselineCanonical = clamp01(params.baselineCanonicalOverrideScore, canonicalScore);
    const fairnessRegressionDetected = fairnessScore < baselineFairness - 0.08;
    const transliterationRegressionDetected = transliterationScore < baselineTransliteration - 0.1;
    const canonicalRegressionDetected = canonicalScore < baselineCanonical - 0.08;
    const sampleConfidence = Math.min(0.18, Math.log10(sampleSize + 1) / 8);
    const regressionPenalty = [
        fairnessRegressionDetected,
        transliterationRegressionDetected,
        canonicalRegressionDetected,
        params.replay?.regressionDetected === true,
    ].filter(Boolean).length * 0.18;
    const experimentConfidenceScore = clamp01(0.58 + sampleConfidence + (replayValidated ? 0.14 : -0.12) - regressionPenalty, 0.55);
    const rollbackRequired = experimentConfidenceScore < 0.52 || fairnessRegressionDetected || canonicalRegressionDetected || params.replay?.regressionDetected === true;
    const reasons: string[] = [];

    if (!replayValidated) reasons.push('replay_validation_missing_or_failed');
    if (fairnessRegressionDetected) reasons.push('fairness_regression_detected');
    if (transliterationRegressionDetected) reasons.push('transliteration_regression_detected');
    if (canonicalRegressionDetected) reasons.push('canonical_regression_detected');
    if (sampleSize < 100) reasons.push('low_experiment_sample_confidence');

    telemetry.experimentQualityEvaluations++;
    telemetry.experimentConfidenceScoreTotal += experimentConfidenceScore;
    if (fairnessRegressionDetected || canonicalRegressionDetected) telemetry.replayRegressions++;

    return {
        experimentConfidenceScore,
        replayValidated,
        fairnessRegressionDetected,
        transliterationRegressionDetected,
        canonicalRegressionDetected,
        rollbackRequired,
        guardrails: [
            'replay_backed_validation',
            'fairness_regression_blocking',
            'transliteration_regression_detection',
            'canonical_regression_protection',
            'rollback_on_quality_drop',
        ],
        reasons,
    };
}

export function evaluateRelevanceScience(params: {
    replay?: RankingReplayResult;
    satisfaction?: SearchSatisfactionScore;
    rankedItems?: Array<Record<string, unknown>>;
    query: string;
    searchFields: string[];
}): RelevanceEvaluationScore {
    const rankedItems = params.rankedItems ?? [];
    const fairnessScores = rankedItems.slice(0, 10).map((item) => scoreFairnessAwareRanking(item, params.query, params.searchFields));
    const rankingQualityScore = clamp01(0.62 + Math.max(-0.25, Math.min(0.25, params.replay?.rankingQualityDelta ?? 0)) + ((params.satisfaction?.rankingQualityScore ?? 0.6) - 0.6) * 0.3, 0.62);
    const fairnessQualityScore = fairnessScores.length > 0
        ? fairnessScores.reduce((sum, score) => sum + score.fairnessScore, 0) / fairnessScores.length
        : 0.6;
    const transliterationQualityScore = clamp01(params.replay?.transliterationQualityScore ?? 0.6, 0.6);
    const duplicateSuppressionQualityScore = params.replay?.duplicateSuppressionPassed === false ? 0.35 : 0.82;
    const autocompleteUsefulnessScore = clamp01(params.satisfaction?.autocompleteConfidenceScore ?? 0.6, 0.6);
    const satisfactionBenchmarkScore = clamp01(params.satisfaction?.searchSatisfactionScore ?? 0.6, 0.6);
    const reasons: string[] = [];

    if (rankingQualityScore < 0.5) reasons.push('ranking_quality_below_benchmark');
    if (fairnessQualityScore < 0.55) reasons.push('fairness_quality_below_benchmark');
    if (duplicateSuppressionQualityScore < 0.5) reasons.push('duplicate_suppression_quality_failed');
    if (transliterationQualityScore < 0.5) reasons.push('transliteration_quality_below_benchmark');

    return {
        rankingQualityScore,
        fairnessQualityScore,
        transliterationQualityScore,
        duplicateSuppressionQualityScore,
        autocompleteUsefulnessScore,
        satisfactionBenchmarkScore,
        reasons,
    };
}

export function buildRankingIntelligenceInsights(params: {
    query: string;
    items: Array<Record<string, unknown>>;
    searchFields: string[];
    behavioralAnomaly?: BehavioralAnomalyScore;
}): RankingIntelligenceInsight[] {
    const insights: RankingIntelligenceInsight[] = [];
    const seenLabels = new Map<string, string>();

    for (const item of params.items.slice(0, 20)) {
        const id = String(item._id ?? item.id ?? '');
        const label = normalizeCatalogSearchText(String(item.canonicalName ?? item.displayName ?? item.name ?? ''));
        const quality = scoreCatalogSearchQuality(item, params.query, params.searchFields);
        if (quality.resultConfidence < 0.42) {
            insights.push({
                type: 'low_quality_result',
                severity: 'warning',
                confidence: clamp01(1 - quality.resultConfidence, 0.6),
                message: 'Result has low behavioral-quality confidence and should be reviewed before gaining ranking weight.',
                targetId: id,
            });
        }
        if (quality.reasons.includes('weak_synonym_trust')) {
            insights.push({
                type: 'synonym_quality_analysis',
                severity: 'warning',
                confidence: clamp01(1 - quality.synonymTrust, 0.6),
                message: 'Synonym match has weak approval confidence.',
                targetId: id,
            });
        }
        if (quality.reasons.includes('low_transliteration_confidence')) {
            insights.push({
                type: 'transliteration_quality_analysis',
                severity: 'warning',
                confidence: clamp01(1 - quality.transliterationConfidence, 0.6),
                message: 'Transliteration match needs review before stronger ranking influence.',
                targetId: id,
            });
        }
        if (label) {
            const existingId = seenLabels.get(label);
            if (existingId && existingId !== id) {
                insights.push({
                    type: 'duplicate_ranking_warning',
                    severity: 'critical',
                    confidence: 0.86,
                    message: 'Duplicate canonical labels appeared in the evaluated ranking set.',
                    targetId: id,
                });
            }
            seenLabels.set(label, id);
        }
    }

    if (params.behavioralAnomaly?.suspiciousRankingSuppression) {
        insights.push({
            type: 'ranking_anomaly_suggestion',
            severity: 'critical',
            confidence: params.behavioralAnomaly.anomalyConfidence,
            message: 'Behavioral anomaly suggests suppressing popularity contribution for this query cohort.',
        });
    }

    return insights.slice(0, 10);
}
