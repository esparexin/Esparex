import type {
    RankingExplanation,
    RankingReplayInput,
    RankingReplayResult,
    RankingExperimentDecision,
    RankingIntelligenceInsight,
    ModerationIntelligenceHint,
    DuplicateCandidate,
    MarketplaceIntentScore,
} from './types';
import {
    normalizeCatalogSearchText,
    compact,
    getTransliterationConfidence,
    isSuspiciousQueryPattern,
} from './transliteration';
import { telemetry } from './telemetry';
import {
    scoreCatalogSearchQuality,
    scoreFairnessAwareRanking,
    classifyMarketplaceIntent,
    getTrustSignals,
    clamp01,
} from './scoring';

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
        item.variantOfModelId ?? item.parentModelId ?? item.canonicalId ??
        item.modelId ?? item.brandId ?? item.canonicalName ?? item.displayName ??
        item.name ?? item.slug ?? ''
    )));

const isLongTailCatalogItem = (item: Record<string, unknown>, query: string): boolean => {
    const usageCount = Number(item.usageCount ?? item.searchUsageCount ?? item.popularityCount ?? 0) || 0;
    const normalizedQuery = normalizeCatalogSearchText(query);
    const queryIsSparse = normalizedQuery.split(' ').filter(Boolean).length >= 3 || normalizedQuery.length >= 18;
    const emerging = item.emergingBrand === true || item.longTailEligible === true || item.lowFrequency === true;
    return emerging || usageCount <= 12 || queryIsSparse;
};

const MAX_POPULARITY_RANKING_CONTRIBUTION = 12;
const MAX_NON_CANONICAL_POPULARITY_CONTRIBUTION = 4;

const fieldWeights: Record<string, number> = {
    canonicalName: 1000, slug: 900, hierarchyPath: 850,
    displayName: 760, name: 740, aliases: 520, synonyms: 420,
};

export function explainRankingDecision(item: Record<string, unknown>, query: string, searchFields: string[], options: { duplicateSuppressed?: boolean; variantGrouped?: boolean } = {}): RankingExplanation {
    const quality = scoreCatalogSearchQuality(item, query, searchFields);
    const fairness = scoreFairnessAwareRanking(item, query, searchFields);
    const id = String(item._id ?? item.id ?? '');
    const reasons = [...new Set([...quality.reasons, ...fairness.reasons])];

    return {
        id, reasons,
        confidenceSummary: { resultConfidence: quality.resultConfidence, canonicalCertainty: quality.canonicalCertainty, transliterationConfidence: quality.transliterationConfidence, duplicateConfidence: quality.duplicateConfidence, popularityConfidence: quality.popularityConfidence, fairnessConfidence: fairness.fairnessScore },
        canonicalOverrideExplanation: quality.reasons.includes('canonical_match') ? 'Canonical lineage match received protected relevance priority.' : undefined,
        transliterationExplanation: quality.transliterationConfidence > 0 ? `Transliteration confidence bucket: ${quality.transliterationConfidence >= 0.78 ? 'high' : quality.transliterationConfidence >= 0.62 ? 'medium' : 'review'}` : undefined,
        duplicateSuppressionExplanation: options.duplicateSuppressed || quality.duplicateConfidence > 0.72 ? 'Duplicate confidence is high enough to require suppression or moderator review.' : undefined,
        variantGroupingExplanation: options.variantGrouped ? 'Variant result was grouped under its canonical parent to avoid lineage flooding.' : undefined,
    };
}

export function rankCatalogSearchResults<T>(items: T[], search: string, searchFields: string[], atlasScores?: Map<string, number>, options: { autocomplete?: boolean; collapseVariants?: boolean } = {}): T[] {
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
            const trustAdjustedWeight = field === 'aliases' ? Math.floor(weight * Math.max(0.2, quality.aliasTrust))
                : field === 'synonyms' ? Math.floor(weight * Math.max(0.2, quality.synonymTrust)) : weight;
            if (normalizedValue === normalizedQuery) score += 100 + weight;
            else if (field === 'slug' && valueCompact === queryCompact) score += 96 + trustAdjustedWeight;
            else if (normalizedValue.startsWith(normalizedQuery)) score += 55 + Math.floor(trustAdjustedWeight / 2);
            else if (normalizedValue.includes(normalizedQuery)) score += 28 + Math.floor(trustAdjustedWeight / 4);
            else if (transliterationConfidence >= 0.78) score += Math.floor(35 * transliterationConfidence) + Math.floor(trustAdjustedWeight / 6);
            else if (transliterationConfidence > 0 && transliterationConfidence < 0.62) telemetry.transliterationLowConfidenceMatches++;
            if (queryCompact && valueCompact.includes(queryCompact)) score += 12;
        });
        const isVariant = Boolean((plain as { variantOfModelId?: unknown }).variantOfModelId || (plain as { parentModelId?: unknown }).parentModelId);
        const canonicalMatch = normalizeCatalogSearchText(String(plain.canonicalName ?? '')) === normalizedQuery || compact(String(plain.slug ?? '')) === queryCompact;
        if (isVariant && !canonicalMatch) score -= options.autocomplete ? 30 : 8;
        if (!isVariant && canonicalMatch) { score += 80; telemetry.canonicalOverrides++; }
        const usageCount = Number((plain as { usageCount?: unknown }).usageCount ?? 0) || 0;
        const popularityCap = canonicalMatch ? MAX_POPULARITY_RANKING_CONTRIBUTION : MAX_NON_CANONICAL_POPULARITY_CONTRIBUTION;
        score += (Math.min(Math.max(usageCount, 0), 100) / (100 / popularityCap)) * quality.popularityConfidence;
        score += Math.round(quality.score * 90) + Math.round(fairness.explorationScore * 35);
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
        if (options.autocomplete && quality.resultConfidence < 0.38) { telemetry.weakAliasSuppressions++; continue; }
        if (labelKey && seenLabels.has(labelKey)) { telemetry.duplicateSuppressions++; continue; }
        const ownerId = String(plain.variantOfModelId ?? plain.parentModelId ?? '');
        if (ownerId) { const c = variantsByOwner.get(ownerId) ?? 0; if (c >= 2) { telemetry.variantSuppressions++; continue; } variantsByOwner.set(ownerId, c + 1); }
        if (labelKey) seenLabels.add(labelKey);
        governed.push(item);
    }
    if (options.autocomplete) return mixDiversityAwareAutocomplete(governed, search, searchFields, options);
    return governed;
}

export function mixDiversityAwareAutocomplete<T>(items: T[], query: string, searchFields: string[], options: { limit?: number; autocomplete?: boolean; collapseVariants?: boolean } = {}): T[] {
    const limit = Math.min(Math.max(options.limit ?? items.length, 1), 50);
    const selected: T[] = [];
    const deferred: T[] = [];
    const lineageCounts = new Map<string, number>();
    let longTailCount = 0, transliterationCount = 0;

    for (const item of items) {
        const record = toPlainRecord(item);
        const lineageKey = lineageKeyFor(record);
        const lineageCount = lineageCounts.get(lineageKey) ?? 0;
        const quality = scoreCatalogSearchQuality(record, query, searchFields);
        const longTail = isLongTailCatalogItem(record, query);
        const transliteration = quality.transliterationConfidence >= 0.62 && !quality.reasons.includes('canonical_match');
        const shouldDefer = (lineageKey && lineageCount >= 1) || (selected.length >= 3 && longTailCount === 0 && !longTail) || (selected.length >= 4 && transliterationCount === 0 && !transliteration && query.length >= 3);
        if (shouldDefer) { deferred.push(item); continue; }
        selected.push(item);
        if (lineageKey) lineageCounts.set(lineageKey, lineageCount + 1);
        if (longTail) longTailCount++;
        if (transliteration) transliterationCount++;
        if (selected.length >= limit) break;
    }
    for (const item of deferred) {
        if (selected.length >= limit) break;
        const lineageKey = lineageKeyFor(toPlainRecord(item));
        if (options.autocomplete && lineageKey && (lineageCounts.get(lineageKey) ?? 0) >= 1 && selected.length >= Math.min(2, limit)) continue;
        selected.push(item);
        if (lineageKey) lineageCounts.set(lineageKey, (lineageCounts.get(lineageKey) ?? 0) + 1);
    }
    const uniqueLineages = new Set(selected.map((item) => lineageKeyFor(toPlainRecord(item))).filter(Boolean)).size;
    const diversityScore = selected.length > 0 ? uniqueLineages / selected.length : 1;
    telemetry.autocompleteDiversityScoreTotal += diversityScore;
    if (diversityScore < 0.8 || longTailCount > 0 || transliterationCount > 0) telemetry.diversityMixAdjustments++;
    return selected;
}

export function buildAdaptiveAutocompleteSuggestions<T>(params: { items: T[]; query: string; searchFields: string[]; intent?: MarketplaceIntentScore; behaviorWeights?: Record<string, number>; limit?: number }): T[] {
    const ranked = rankCatalogSearchResults(params.items, params.query, params.searchFields, undefined, { autocomplete: true, collapseVariants: true });
    const intent = params.intent ?? classifyMarketplaceIntent({ query: params.query });
    const behaviorWeights = params.behaviorWeights ?? {};
    const itemId = (item: unknown): string => { const r = toPlainRecord(item); return String(r._id ?? r.id ?? ''); };
    const scoreItem = (item: T): number => {
        const record = toPlainRecord(item);
        const id = itemId(record);
        const quality = scoreCatalogSearchQuality(record, params.query, params.searchFields);
        const behaviorWeight = clamp01(behaviorWeights[id], 0.5);
        const intentBoost = intent.intent !== 'unknown' && (String(record.listingType ?? '').includes(intent.intent) || String(record.slug ?? '').includes(intent.intent.replace(/_/g, '-')) || String(record.canonicalName ?? '').includes(intent.intent.replace(/_/g, ' '))) ? 0.08 : 0;
        return quality.score + (behaviorWeight * 0.16) + intentBoost;
    };
    const scored = [...ranked].sort((a, b) => scoreItem(b) - scoreItem(a)).slice(0, Math.min(Math.max((params.limit ?? 10) * 2, 1), 50));
    return mixDiversityAwareAutocomplete(scored, params.query, params.searchFields, { autocomplete: true, collapseVariants: true, limit: params.limit ?? 10 });
}

export function replayRankingEvaluation<T>(input: RankingReplayInput<T>): RankingReplayResult {
    telemetry.replayEvaluations++;
    const baselineRanked = rankCatalogSearchResults(input.baselineItems, input.query, input.searchFields, undefined, { autocomplete: input.autocomplete, collapseVariants: true });
    const candidateRanked = rankCatalogSearchResults(input.candidateItems ?? input.baselineItems, input.query, input.searchFields, undefined, { autocomplete: input.autocomplete, collapseVariants: true });
    const toId = (item: unknown): string => { const r = toPlainRecord(item); return String(r._id ?? r.id ?? ''); };
    const baselineTopIds = baselineRanked.map(toId).filter(Boolean).slice(0, 10);
    const candidateTopIds = candidateRanked.map(toId).filter(Boolean).slice(0, 10);
    const overlapScore = (expected: string[] = [], actual: string[] = []): number => { if (expected.length === 0) return 1; const s = new Set(actual); return expected.filter((id) => s.has(id)).length / expected.length; };
    const clickedBaseline = overlapScore(input.expectedClickedIds, baselineTopIds.slice(0, 5));
    const clickedCandidate = overlapScore(input.expectedClickedIds, candidateTopIds.slice(0, 5));
    const canonicalBaseline = overlapScore(input.expectedCanonicalIds, baselineTopIds.slice(0, 5));
    const canonicalCandidate = overlapScore(input.expectedCanonicalIds, candidateTopIds.slice(0, 5));
    const duplicateSuppressionPassed = new Set(candidateTopIds).size === candidateTopIds.length;
    const transliterationQualityScore = candidateRanked.length > 0 ? Math.max(...candidateRanked.slice(0, 5).map((item) => { const r = toPlainRecord(item); return getTransliterationConfidence(input.query, String(r.canonicalName ?? r.displayName ?? r.name ?? '')); })) : 0;
    const canonicalOverrideScore = (canonicalCandidate + transliterationQualityScore) / 2;
    const rankingQualityDelta = ((clickedCandidate + canonicalCandidate) / 2) - ((clickedBaseline + canonicalBaseline) / 2);
    const reasons: string[] = [];
    if (!duplicateSuppressionPassed) reasons.push('duplicate_suppression_regression');
    if (rankingQualityDelta < -0.15) reasons.push('ranking_quality_regression');
    if (transliterationQualityScore < 0.4) reasons.push('transliteration_replay_low_confidence');
    if (canonicalOverrideScore < 0.45) reasons.push('canonical_override_replay_low_confidence');
    const regressionDetected = reasons.length > 0;
    if (regressionDetected) telemetry.replayRegressions++;
    return { query: input.query, baselineTopIds, candidateTopIds, rankingQualityDelta, duplicateSuppressionPassed, transliterationQualityScore, canonicalOverrideScore, regressionDetected, reasons };
}

export function buildRankingExperimentDecision(params: { experimentKey: string; subjectKey: string; enabled?: boolean; treatmentWeight?: number; experimentConfidenceScore?: number; guardrails?: string[] }): RankingExperimentDecision {
    const treatmentWeight = clamp01(params.treatmentWeight, 0.1);
    const confidence = clamp01(params.experimentConfidenceScore, 0.7);
    const hash = Array.from(`${params.experimentKey}:${params.subjectKey}`).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const enabled = params.enabled === true && confidence >= 0.52;
    if (enabled) telemetry.experimentAssignments++;
    return { experimentKey: params.experimentKey, enabled, bucket: enabled && (hash % 10_000) / 10_000 < treatmentWeight ? 'treatment' : 'control', weight: treatmentWeight, guardrails: ['canonical_lineage_authority_required', 'moderator_trust_must_not_be_overridden', 'popularity_influence_bounded', 'fairness_regression_blocking', 'replay_validation_required', ...(params.guardrails ?? [])] };
}

export function buildModerationIntelligenceHints(params: { input: string; candidates: Array<Record<string, unknown>>; proposedAliases?: string[]; proposedSynonyms?: string[] }): ModerationIntelligenceHint[] {
    const hints: ModerationIntelligenceHint[] = [];
    const normalizedInput = normalizeCatalogSearchText(params.input);
    for (const duplicate of detectDuplicateCandidates(params.input, params.candidates).filter((d) => d.confidence >= 0.55).slice(0, 3)) {
        hints.push({ type: duplicate.confidence > 0.8 ? 'canonical_merge_suggestion' : 'duplicate_suggestion', severity: duplicate.confidence > 0.8 ? 'critical' : 'warning', confidence: duplicate.confidence, message: `Potential canonical overlap with ${duplicate.label}`, targetId: duplicate.id });
    }
    for (const alias of params.proposedAliases ?? []) {
        const aliasConfidence = getTransliterationConfidence(alias, normalizedInput);
        if (isSuspiciousQueryPattern(alias) || alias.length > 80 || aliasConfidence < 0.2) {
            telemetry.aliasPollutionSignals++;
            hints.push({ type: 'suspicious_alias', severity: 'warning', confidence: clamp01(1 - aliasConfidence, 0.7), message: `Alias requires moderator review before it can influence search: ${alias}` });
        }
    }
    for (const synonym of params.proposedSynonyms ?? []) {
        const synonymConfidence = getTransliterationConfidence(synonym, normalizedInput);
        if (synonymConfidence > 0 && synonymConfidence < 0.62) {
            hints.push({ type: 'transliteration_conflict', severity: 'warning', confidence: clamp01(1 - synonymConfidence, 0.6), message: `Synonym may conflict with canonical transliteration: ${synonym}` });
        }
    }
    if (detectDuplicateCandidates.length === 0 && normalizedInput.split(' ').length <= 1) {
        hints.push({ type: 'low_confidence_lineage', severity: 'info', confidence: 0.52, message: 'Canonical lineage has limited context; verify category and parent before approval.' });
    }
    return hints;
}

export function detectDuplicateCandidates(input: string, items: Array<Record<string, unknown>>, fields: string[] = ['name', 'displayName', 'canonicalName', 'slug', 'aliases', 'synonyms']): DuplicateCandidate[] {
    const normalizedInput = normalizeCatalogSearchText(input);
    const inputCompact = compact(normalizedInput);
    if (inputCompact.length < 3) return [];
    return items.flatMap((item) => {
        let score = 0; const reasons: string[] = [];
        for (const field of fields) {
            const normalizedValue = normalizeCatalogSearchText(getDocValue(item, field));
            const valueCompact = compact(normalizedValue);
            if (!valueCompact) continue;
            if (valueCompact === inputCompact) { score += 100; reasons.push(`${field}:exact-normalized`); }
            else if (valueCompact.includes(inputCompact) || inputCompact.includes(valueCompact)) { score += 45; reasons.push(`${field}:contains-normalized`); }
        }
        if (score < 45) return [];
        return [{ id: String(item._id ?? item.id ?? ''), label: String(item.displayName ?? item.name ?? item.canonicalName ?? ''), score, confidence: clamp01(score / 145, 0.45), reasons }];
    }).sort((a, b) => b.score - a.score).slice(0, 5);
}

export { getDocValue, toPlainRecord, lineageKeyFor, isLongTailCatalogItem };
