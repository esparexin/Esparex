import type { CatalogSearchTelemetrySnapshot, BehavioralSearchEvent } from './types';
import { normalizeCatalogSearchText, isSuspiciousQueryPattern } from './transliteration';

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

const AUTOCOMPLETE_WINDOW_MS = 60_000;
const AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW = 80;
const SUSPICIOUS_AUTOCOMPLETE_MAX_REQUESTS_PER_WINDOW = 24;
const autocompleteWindows = new Map<string, { count: number; resetAt: number }>();
const behavioralWindows = new Map<string, { count: number; clicks: number; abandons: number; resetAt: number }>();

export const getCatalogSearchTelemetrySnapshot = (): CatalogSearchTelemetrySnapshot => ({
    ...telemetry,
    topQueries: { ...telemetry.topQueries },
});

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

export { telemetry };
