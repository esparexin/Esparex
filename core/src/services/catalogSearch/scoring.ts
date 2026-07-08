import type {
    CatalogTrustSignals,
    SearchQualityScore,
    FairnessRankingScore,
    MetricIntegrityScore,
    ExperimentQualityScore,
    RelevanceEvaluationScore,
    RankingReplayResult,
    SearchSatisfactionScore,
    BehavioralAnomalyScore,
    MarketplaceIntentScore,
    TrustAgingDecision,
    MarketplaceIntentType,
    RankingIntelligenceInsight,
} from './types';
import {
    normalizeCatalogSearchText,
    compact,
    getTransliterationConfidence,
    isSuspiciousQueryPattern,
} from './transliteration';
import { telemetry } from './telemetry';

const fieldWeights: Record<string, number> = {
    canonicalName: 1000,
    slug: 900,
    hierarchyPath: 850,
    displayName: 760,
    name: 740,
    aliases: 520,
    synonyms: 420,
};

const MIN_ALIAS_TRUST_FOR_RANKING = 0.35;
const MIN_SYNONYM_TRUST_FOR_RANKING = 0.3;
const TRUST_REVIEW_AGE_DAYS = 180;
const MODERATOR_INACTIVE_DECAY_DAYS = 90;

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
        crawlDepthLimit: Number(source.crawlDepthLimit ?? item.crawlDepthLimit) || 4,
        indexable: typeof source.indexable === 'boolean' ? source.indexable : undefined,
        lastAuditAt: source.lastAuditAt instanceof Date ? source.lastAuditAt : undefined,
    };
};

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

    return { searchSatisfactionScore, rankingQualityScore, autocompleteConfidenceScore, queryFrustrationScore, reasons };
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

    if (/\b(buy|price|used|new|sale|for sale)\b/.test(normalized) || params.listingType === 'ad') { intent = 'buyer'; confidence += 0.28; signals.push('buyer_terms'); }
    if (/\b(sell|post|dealer|inventory)\b/.test(normalized)) { intent = 'seller'; confidence += 0.25; signals.push('seller_terms'); }
    if (/\b(repair|service|fix|technician|screen replacement)\b/.test(normalized) || params.listingType === 'service') { intent = 'repair'; confidence += 0.3; signals.push('repair_terms'); }
    if (/\b(spare|part|battery|display|screen|compatible|compatibility)\b/.test(normalized) || params.listingType === 'spare_part') { intent = 'spare_part_compatibility'; confidence += 0.32; signals.push('compatibility_terms'); }
    if (params.brandSlug || /\b(apple|samsung|vivo|oppo|oneplus|mi|xiaomi)\b/.test(normalized)) { if (intent === 'unknown') intent = 'brand_preference'; confidence += 0.12; signals.push('brand_signal'); }
    if ((params.pathSegments?.length ?? 0) >= 2 || params.categorySlug) { if (intent === 'unknown') intent = 'hierarchy_navigation'; confidence += 0.12; signals.push('hierarchy_signal'); }

    return { intent, confidence: clamp01(confidence, 0.35), signals };
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

    if (staleAlias) { decay += Math.min(0.18, (aliasAge - TRUST_REVIEW_AGE_DAYS) / 1200); reasons.push('stale_alias_review'); }
    if (staleSynonym) { decay += Math.min(0.16, (synonymAge - TRUST_REVIEW_AGE_DAYS) / 1400); reasons.push('stale_synonym_review'); }
    if (outdatedTransliteration) { decay += Math.min(0.18, (transliterationAge - TRUST_REVIEW_AGE_DAYS) / 1200); reasons.push('outdated_transliteration_review'); }
    if (inactiveModeratorDecay) { decay += Math.min(0.22, (moderatorInactiveAge - MODERATOR_INACTIVE_DECAY_DAYS) / 900); reasons.push('inactive_moderator_decay'); }

    const adjustedTrustScore = clamp01(baseTrust - decay, baseTrust);
    const reviewRequired = reasons.length > 0 || adjustedTrustScore < 0.45;
    if (reviewRequired) telemetry.trustAgingReviews++;
    return { adjustedTrustScore, reviewRequired, staleAlias, staleSynonym, outdatedTransliteration, inactiveModeratorDecay, reasons };
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

    if (isSuspiciousQueryPattern(params.query)) { anomalyConfidence += 0.25; reasons.push('suspicious_query_pattern'); }
    if (clickConcentration > 0.7 && clicks >= 10) { anomalyConfidence += 0.28; reasons.push('low_quality_click_concentration'); }
    if (repeatedRate > 0.5) { anomalyConfidence += 0.22; reasons.push('suspicious_query_amplification'); }
    if (autocompleteSelectionRate > 0.85 && repeatedRate > 0.35) { anomalyConfidence += 0.18; reasons.push('autocomplete_spam_behavior'); }
    if (correctionRate > 0.35) { anomalyConfidence += 0.16; reasons.push('transliteration_abuse_pattern'); }

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
        const normalizedValue = normalizeCatalogSearchText(String(item[field] ?? ''));
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

    if (canonicalValue === normalizedQuery || (queryCompact && slugCompact === queryCompact)) canonicalMatch = true;

    const aliasTrust = (trust.aliasTrustScore ?? 0.62) * (trust.aliasApprovalConfidence ?? 0.6);
    const synonymTrust = (trust.synonymTrustScore ?? 0.58) * (trust.synonymApprovalConfidence ?? 0.55);
    const canonicalCertainty = clamp01((trust.canonicalCertaintyScore ?? 0.72) + (canonicalMatch ? 0.2 : 0) - (aliasMatch && aliasTrust < MIN_ALIAS_TRUST_FOR_RANKING ? 0.25 : 0), 0.68);
    const duplicateConfidence = clamp01(trust.duplicateConfidenceScore, 0.5);
    const popularityConfidence = clamp01(trust.popularityConfidenceScore, 0.65);
    const baseTrust = clamp01(((trust.catalogTrustScore ?? 0.72) + (trust.moderationReliabilityScore ?? 0.7) + canonicalCertainty) / 3, 0.7);
    let resultConfidence = clamp01((baseTrust * 0.55) + (bestTransliteration * 0.15) + (popularityConfidence * 0.1) + Math.min(0.2, fieldMatchScore / 4000), 0.62);

    if (aliasMatch && aliasTrust < MIN_ALIAS_TRUST_FOR_RANKING) { resultConfidence = Math.max(0, resultConfidence - 0.28); reasons.push('weak_alias_trust'); }
    if (synonymMatch && synonymTrust < MIN_SYNONYM_TRUST_FOR_RANKING) { resultConfidence = Math.max(0, resultConfidence - 0.2); reasons.push('weak_synonym_trust'); }
    if (bestTransliteration > 0 && bestTransliteration < 0.62) reasons.push('low_transliteration_confidence');
    if (canonicalMatch) reasons.push('canonical_match');

    const score = clamp01((resultConfidence * 0.5) + (canonicalCertainty * 0.25) + (baseTrust * 0.15) + ((1 - duplicateConfidence) * 0.1), 0.62);
    telemetry.resultConfidenceTotal += resultConfidence;
    telemetry.canonicalCertaintyTotal += canonicalCertainty;
    telemetry.duplicateConfidenceTotal += duplicateConfidence;

    return { score, canonicalCertainty, resultConfidence, duplicateConfidence, transliterationConfidence: bestTransliteration, aliasTrust, synonymTrust, popularityConfidence, reasons };
}

export function scoreFairnessAwareRanking(item: Record<string, unknown>, query: string, searchFields: string[]): FairnessRankingScore {
    const quality = scoreCatalogSearchQuality(item, query, searchFields);
    const usageCount = Math.max(0, Number(item.usageCount ?? item.searchUsageCount ?? item.popularityCount ?? 0) || 0);
    const popularityConcentration = clamp01(Math.log10(usageCount + 1) / 4, 0);
    const longTailEligible = usageCount <= 12 || (item.emergingBrand === true || item.longTailEligible === true || item.lowFrequency === true);
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

    return { fairnessScore, diversityScore, longTailExposureScore, popularityBoundedScore: boundedPopularity, explorationScore, overfitRisk, reasons };
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
    return { integrityScore, trustWeightedCtr, anomalyAdjustedEngagement, manipulationRisk, reasons };
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
    const regressionPenalty = [fairnessRegressionDetected, transliterationRegressionDetected, canonicalRegressionDetected, params.replay?.regressionDetected === true].filter(Boolean).length * 0.18;
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

    return { experimentConfidenceScore, replayValidated, fairnessRegressionDetected, transliterationRegressionDetected, canonicalRegressionDetected, rollbackRequired, guardrails: ['replay_backed_validation', 'fairness_regression_blocking', 'transliteration_regression_detection', 'canonical_regression_protection', 'rollback_on_quality_drop'], reasons };
}

export function evaluateRelevanceScience(params: { replay?: RankingReplayResult; satisfaction?: SearchSatisfactionScore; rankedItems?: Array<Record<string, unknown>>; query: string; searchFields: string[] }): RelevanceEvaluationScore {
    const rankedItems = params.rankedItems ?? [];
    const fairnessScores = rankedItems.slice(0, 10).map((item) => scoreFairnessAwareRanking(item, params.query, params.searchFields));
    const rankingQualityScore = clamp01(0.62 + Math.max(-0.25, Math.min(0.25, params.replay?.rankingQualityDelta ?? 0)) + ((params.satisfaction?.rankingQualityScore ?? 0.6) - 0.6) * 0.3, 0.62);
    const fairnessQualityScore = fairnessScores.length > 0 ? fairnessScores.reduce((sum, s) => sum + s.fairnessScore, 0) / fairnessScores.length : 0.6;
    const transliterationQualityScore = clamp01(params.replay?.transliterationQualityScore ?? 0.6, 0.6);
    const duplicateSuppressionQualityScore = params.replay?.duplicateSuppressionPassed === false ? 0.35 : 0.82;
    const autocompleteUsefulnessScore = clamp01(params.satisfaction?.autocompleteConfidenceScore ?? 0.6, 0.6);
    const satisfactionBenchmarkScore = clamp01(params.satisfaction?.searchSatisfactionScore ?? 0.6, 0.6);
    const reasons: string[] = [];

    if (rankingQualityScore < 0.5) reasons.push('ranking_quality_below_benchmark');
    if (fairnessQualityScore < 0.55) reasons.push('fairness_quality_below_benchmark');
    if (duplicateSuppressionQualityScore < 0.5) reasons.push('duplicate_suppression_quality_failed');
    if (transliterationQualityScore < 0.5) reasons.push('transliteration_quality_below_benchmark');

    return { rankingQualityScore, fairnessQualityScore, transliterationQualityScore, duplicateSuppressionQualityScore, autocompleteUsefulnessScore, satisfactionBenchmarkScore, reasons };
}

export function buildRankingIntelligenceInsights(params: { query: string; items: Array<Record<string, unknown>>; searchFields: string[]; behavioralAnomaly?: BehavioralAnomalyScore }): RankingIntelligenceInsight[] {
    const insights: RankingIntelligenceInsight[] = [];
    const seenLabels = new Map<string, string>();
    for (const item of params.items.slice(0, 20)) {
        const id = String(item._id ?? item.id ?? '');
        const label = normalizeCatalogSearchText(String(item.canonicalName ?? item.displayName ?? item.name ?? ''));
        const quality = scoreCatalogSearchQuality(item, params.query, params.searchFields);
        if (quality.resultConfidence < 0.42) {
            insights.push({ type: 'low_quality_result', severity: 'warning', confidence: clamp01(1 - quality.resultConfidence, 0.6), message: 'Result has low behavioral-quality confidence and should be reviewed before gaining ranking weight.', targetId: id });
        }
        if (quality.reasons.includes('weak_synonym_trust')) {
            insights.push({ type: 'synonym_quality_analysis', severity: 'warning', confidence: clamp01(1 - quality.synonymTrust, 0.6), message: 'Synonym match has weak approval confidence.', targetId: id });
        }
        if (quality.reasons.includes('low_transliteration_confidence')) {
            insights.push({ type: 'transliteration_quality_analysis', severity: 'warning', confidence: clamp01(1 - quality.transliterationConfidence, 0.6), message: 'Transliteration match needs review before stronger ranking influence.', targetId: id });
        }
        if (label) {
            const existingId = seenLabels.get(label);
            if (existingId && existingId !== id) {
                insights.push({ type: 'duplicate_ranking_warning', severity: 'critical', confidence: 0.86, message: 'Duplicate canonical labels appeared in the evaluated ranking set.', targetId: id });
            }
            seenLabels.set(label, id);
        }
    }
    if (params.behavioralAnomaly?.suspiciousRankingSuppression) {
        insights.push({ type: 'ranking_anomaly_suggestion', severity: 'critical', confidence: params.behavioralAnomaly.anomalyConfidence, message: 'Behavioral anomaly suggests suppressing popularity contribution for this query cohort.' });
    }
    return insights.slice(0, 10);
}

export { getTrustSignals, clamp01 };
