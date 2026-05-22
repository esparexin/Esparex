import {
    applyTrustAgingGovernance,
    buildAdaptiveAutocompleteSuggestions,
    buildModerationIntelligenceHints,
    buildRankingExperimentDecision,
    buildRankingIntelligenceInsights,
    evaluateExperimentQuality,
    evaluateRelevanceScience,
    classifyMarketplaceIntent,
    detectBehavioralAnomaly,
    detectDuplicateCandidates,
    evaluateSeoCrawlDecision,
    explainRankingDecision,
    getCatalogSearchTelemetrySnapshot,
    rankCatalogSearchResults,
    recordBehavioralSearchTelemetry,
    replayRankingEvaluation,
    scoreCatalogSearchQuality,
    scoreFairnessAwareRanking,
    scoreMetricIntegrity,
    scoreSearchSatisfaction,
    scorePopularityConfidence,
    shouldSuppressAutocomplete,
} from '@esparex/core/services/catalog/CatalogSearchGovernanceService';

describe('CatalogSearchGovernanceService', () => {
    it('prefers trusted canonical lineage over weak alias matches', () => {
        const items = [
            {
                _id: 'weak-alias',
                canonicalName: 'Galaxy Case',
                displayName: 'Galaxy Case',
                slug: 'galaxy-case',
                aliases: ['iphone'],
                marketplaceTrust: {
                    catalogTrustScore: 0.42,
                    aliasTrustScore: 0.1,
                    aliasApprovalConfidence: 0.1,
                    canonicalCertaintyScore: 0.4,
                    popularityConfidenceScore: 0.2,
                },
                usageCount: 5000,
            },
            {
                _id: 'canonical',
                canonicalName: 'iPhone',
                displayName: 'iPhone',
                slug: 'iphone',
                aliases: [],
                marketplaceTrust: {
                    catalogTrustScore: 0.88,
                    aliasTrustScore: 0.8,
                    aliasApprovalConfidence: 0.8,
                    canonicalCertaintyScore: 0.92,
                    popularityConfidenceScore: 0.72,
                },
                usageCount: 1,
            },
        ];

        const ranked = rankCatalogSearchResults(items, 'iphone', ['canonicalName', 'slug', 'aliases'], undefined, {
            autocomplete: true,
            collapseVariants: true,
        });

        expect(ranked[0]._id).toBe('canonical');
        expect(ranked).toHaveLength(1);
    });

    it('returns search quality confidence components for catalog intelligence', () => {
        const quality = scoreCatalogSearchQuality(
            {
                canonicalName: 'Samsung',
                slug: 'samsung',
                marketplaceTrust: {
                    catalogTrustScore: 0.9,
                    canonicalCertaintyScore: 0.9,
                    duplicateConfidenceScore: 0.1,
                    popularityConfidenceScore: 0.7,
                },
            },
            'samsung',
            ['canonicalName', 'slug', 'aliases', 'synonyms']
        );

        expect(quality.canonicalCertainty).toBeGreaterThan(0.9);
        expect(quality.resultConfidence).toBeGreaterThan(0.65);
        expect(quality.reasons).toContain('canonical_match');
    });

    it('suppresses thin or over-deep SEO pages', () => {
        const decision = evaluateSeoCrawlDecision({
            categorySlug: 'mobiles',
            brandSlug: 'apple',
            parentSlug: 'iphone',
            slug: 'iphone-15-blue-128gb-spam-copy',
            canonicalName: 'iphone 15 blue 128gb spam copy',
            displayName: 'iphone 15 blue 128gb spam copy',
            description: '',
            marketplaceTrust: {
                seoQualityScore: 0.45,
                duplicateConfidenceScore: 0.85,
                crawlDepthLimit: 3,
            },
        });

        expect(decision.indexable).toBe(false);
        expect(decision.reasons).toEqual(expect.arrayContaining(['thin_content', 'duplicate_seo_risk', 'crawl_depth_exceeded']));
    });

    it('adds duplicate confidence and moderation intelligence hints without auto-merging', () => {
        const candidates = [
            { _id: 'brand-1', displayName: 'Samsung', canonicalName: 'samsung', slug: 'samsung' },
        ];

        const duplicates = detectDuplicateCandidates('samsung', candidates);
        const hints = buildModerationIntelligenceHints({
            input: 'samsung',
            candidates,
            proposedAliases: ['ssssssssssssamsung whatsapp'],
            proposedSynonyms: ['సామ్సంగ్'],
        });

        expect(duplicates[0].confidence).toBeGreaterThan(0.6);
        expect(hints.map((hint) => hint.type)).toEqual(expect.arrayContaining(['canonical_merge_suggestion', 'suspicious_alias']));
    });

    it('bounds popularity confidence and autocomplete abuse windows', () => {
        const lowConfidence = scorePopularityConfidence({
            usageCount: 1000,
            uniqueUsers: 1,
            windowCount: 1000,
            repeatedQueryCount: 900,
            moderatorTrustScore: 0.2,
        });

        expect(lowConfidence).toBeLessThan(0.4);

        let suppressed = false;
        for (let i = 0; i < 30; i += 1) {
            suppressed = shouldSuppressAutocomplete({
                key: 'test-client',
                search: 'casinooooooo',
                limit: 10,
            });
        }

        expect(suppressed).toBe(true);
    });

    it('records behavioral telemetry and scores search satisfaction safely', () => {
        recordBehavioralSearchTelemetry({
            type: 'search_click',
            query: 'iphone screen',
            sessionKey: 'session-1',
            resultId: 'screen-1',
            resultPosition: 1,
        });
        recordBehavioralSearchTelemetry({
            type: 'duplicate_frustration',
            query: 'iphone screen',
            sessionKey: 'session-1',
            duplicateVisibleCount: 3,
        });

        const satisfaction = scoreSearchSatisfaction({
            impressions: 10,
            clicks: 4,
            autocompleteSelections: 3,
            abandonments: 1,
            refinements: 2,
            zeroResults: 1,
            zeroResultRecoveries: 1,
            duplicateFrustrations: 1,
            transliterationCorrections: 1,
        });
        const snapshot = getCatalogSearchTelemetrySnapshot();

        expect(satisfaction.searchSatisfactionScore).toBeGreaterThan(0.5);
        expect(satisfaction.queryFrustrationScore).toBeLessThan(0.4);
        expect(snapshot.behavioralEvents).toBeGreaterThanOrEqual(2);
        expect(snapshot.searchClicks).toBeGreaterThanOrEqual(1);
    });

    it('classifies marketplace intent without personalization', () => {
        const intent = classifyMarketplaceIntent({
            query: 'iphone screen replacement compatible spare part',
            categorySlug: 'mobiles',
            listingType: 'spare_part',
            pathSegments: ['mobiles', 'apple', 'iphone'],
        });

        expect(intent.intent).toBe('spare_part_compatibility');
        expect(intent.confidence).toBeGreaterThan(0.7);
        expect(intent.signals).toEqual(expect.arrayContaining(['compatibility_terms', 'hierarchy_signal']));
    });

    it('applies trust aging and moderator decay for stale governance signals', () => {
        const now = new Date('2026-05-21T00:00:00.000Z');
        const decision = applyTrustAgingGovernance({
            trustScore: 0.9,
            aliasLastReviewedAt: '2025-01-01T00:00:00.000Z',
            synonymLastReviewedAt: '2025-02-01T00:00:00.000Z',
            transliterationLastReviewedAt: '2025-03-01T00:00:00.000Z',
            moderatorLastActiveAt: '2025-11-01T00:00:00.000Z',
            now,
        });

        expect(decision.reviewRequired).toBe(true);
        expect(decision.adjustedTrustScore).toBeLessThan(0.9);
        expect(decision.reasons).toEqual(expect.arrayContaining(['stale_alias_review', 'inactive_moderator_decay']));
    });

    it('detects behavioral anomalies and recommends bounded suppression', () => {
        const anomaly = detectBehavioralAnomaly({
            query: 'free casinooooo display',
            impressions: 100,
            clicks: 50,
            uniqueUsers: 2,
            autocompleteSelections: 90,
            repeatedQueryCount: 70,
            transliterationCorrections: 40,
        });

        expect(anomaly.anomalyConfidence).toBeGreaterThan(0.6);
        expect(anomaly.suspiciousRankingSuppression).toBe(true);
        expect(anomaly.reasons).toEqual(expect.arrayContaining(['suspicious_query_pattern', 'low_quality_click_concentration']));
    });

    it('replays rankings offline using the existing ranking authority', () => {
        const baselineItems = [
            { _id: 'old-1', canonicalName: 'iPhone Cover', slug: 'iphone-cover', aliases: ['iphone screen'] },
            { _id: 'canonical-screen', canonicalName: 'iPhone Screen', slug: 'iphone-screen', aliases: [] },
        ];
        const candidateItems = [
            {
                _id: 'canonical-screen',
                canonicalName: 'iPhone Screen',
                slug: 'iphone-screen',
                aliases: [],
                marketplaceTrust: { catalogTrustScore: 0.9, canonicalCertaintyScore: 0.95 },
            },
            {
                _id: 'old-1',
                canonicalName: 'iPhone Cover',
                slug: 'iphone-cover',
                aliases: ['iphone screen'],
                marketplaceTrust: { aliasTrustScore: 0.1, aliasApprovalConfidence: 0.1 },
            },
        ];

        const replay = replayRankingEvaluation({
            query: 'iphone screen',
            searchFields: ['canonicalName', 'slug', 'aliases'],
            baselineItems,
            candidateItems,
            expectedClickedIds: ['canonical-screen'],
            expectedCanonicalIds: ['canonical-screen'],
            autocomplete: true,
        });

        expect(replay.candidateTopIds[0]).toBe('canonical-screen');
        expect(replay.duplicateSuppressionPassed).toBe(true);
        expect(replay.regressionDetected).toBe(false);
    });

    it('builds adaptive autocomplete suggestions with intent and behavior weights', () => {
        const suggestions = buildAdaptiveAutocompleteSuggestions({
            query: 'screen replacement',
            searchFields: ['canonicalName', 'slug', 'aliases'],
            intent: { intent: 'repair', confidence: 0.8, signals: ['repair_terms'] },
            behaviorWeights: { repair: 0.95 },
            items: [
                { _id: 'case', canonicalName: 'Phone Case', slug: 'phone-case', aliases: ['screen replacement'] },
                { _id: 'repair', canonicalName: 'Screen Replacement', slug: 'screen-replacement-repair', aliases: [] },
            ],
            limit: 2,
        });

        expect(suggestions[0]._id).toBe('repair');
    });

    it('adds explainable ranking reasons without exposing raw scoring formulas', () => {
        const explanation = explainRankingDecision(
            {
                _id: 'screen-1',
                canonicalName: 'iPhone Screen',
                slug: 'iphone-screen',
                aliases: ['ఐఫోన్ screen'],
                usageCount: 3,
                marketplaceTrust: {
                    catalogTrustScore: 0.86,
                    canonicalCertaintyScore: 0.92,
                    transliterationTrustScore: 0.72,
                    duplicateConfidenceScore: 0.1,
                },
            },
            'iphone screen',
            ['canonicalName', 'slug', 'aliases'],
            { variantGrouped: true }
        );

        expect(explanation.reasons).toContain('canonical_match');
        expect(explanation.confidenceSummary.resultConfidence).toBeGreaterThan(0.6);
        expect(explanation.canonicalOverrideExplanation).toContain('Canonical lineage');
        expect(explanation.variantGroupingExplanation).toContain('canonical parent');
    });

    it('supports long-tail fairness scoring while bounding popularity influence', () => {
        const niche = scoreFairnessAwareRanking(
            {
                _id: 'rare-part',
                canonicalName: 'OnePlus 7T Pro McLaren charging flex cable',
                slug: 'oneplus-7t-pro-mclaren-charging-flex-cable',
                usageCount: 1,
                longTailEligible: true,
                marketplaceTrust: { catalogTrustScore: 0.82, canonicalCertaintyScore: 0.9, popularityConfidenceScore: 0.2 },
            },
            'oneplus 7t pro mclaren flex cable',
            ['canonicalName', 'slug']
        );
        const dominant = scoreFairnessAwareRanking(
            {
                _id: 'dominant',
                canonicalName: 'iPhone',
                slug: 'iphone',
                usageCount: 50_000,
                marketplaceTrust: { catalogTrustScore: 0.9, canonicalCertaintyScore: 0.92, popularityConfidenceScore: 0.95 },
            },
            'iphone',
            ['canonicalName', 'slug']
        );

        expect(niche.reasons).toContain('long_tail_exposure_supported');
        expect(niche.explorationScore).toBeGreaterThan(0.1);
        expect(dominant.reasons).toContain('popularity_influence_bounded');
        expect(dominant.popularityBoundedScore).toBeLessThan(0.95);
    });

    it('mixes autocomplete suggestions to avoid lineage homogenization', () => {
        const suggestions = buildAdaptiveAutocompleteSuggestions({
            query: 'iphone screen',
            searchFields: ['canonicalName', 'slug', 'aliases'],
            items: [
                { _id: 'v1', canonicalName: 'iPhone Screen Black', slug: 'iphone-screen-black', parentModelId: 'iphone', usageCount: 500 },
                { _id: 'v2', canonicalName: 'iPhone Screen Blue', slug: 'iphone-screen-blue', parentModelId: 'iphone', usageCount: 450 },
                { _id: 'v3', canonicalName: 'iPhone Screen Gold', slug: 'iphone-screen-gold', parentModelId: 'iphone', usageCount: 430 },
                { _id: 'repair', canonicalName: 'iPhone Screen Repair Kit', slug: 'iphone-screen-repair-kit', parentModelId: 'repair-kit', usageCount: 2, longTailEligible: true },
            ],
            limit: 3,
        });

        expect(suggestions.map((item) => item._id)).toContain('repair');
        expect(suggestions.filter((item) => item.parentModelId === 'iphone')).toHaveLength(1);
    });

    it('scores metric integrity with anomaly-adjusted and trust-weighted engagement', () => {
        const anomaly = detectBehavioralAnomaly({
            query: 'iphone screen',
            impressions: 100,
            clicks: 80,
            uniqueUsers: 2,
            repeatedQueryCount: 70,
        });
        const integrity = scoreMetricIntegrity({
            impressions: 100,
            clicks: 80,
            uniqueUsers: 2,
            repeatedQueryCount: 70,
            anomaly,
            moderatorTrustScore: 0.6,
            satisfactionScore: 0.7,
        });

        expect(integrity.manipulationRisk).toBeGreaterThan(0.4);
        expect(integrity.reasons).toEqual(expect.arrayContaining(['low_user_diversity_clicks', 'query_spam_loop_risk']));
        expect(integrity.anomalyAdjustedEngagement).toBeLessThan(integrity.trustWeightedCtr);
    });

    it('guards ranking experiments with deterministic buckets and canonical guardrails', () => {
        const decision = buildRankingExperimentDecision({
            experimentKey: 'trust-weight-tuning',
            subjectKey: 'query:iphone',
            enabled: true,
            treatmentWeight: 0.5,
        });

        expect(['control', 'treatment']).toContain(decision.bucket);
        expect(decision.guardrails).toEqual(expect.arrayContaining([
            'canonical_lineage_authority_required',
            'moderator_trust_must_not_be_overridden',
            'fairness_regression_blocking',
        ]));
    });

    it('evaluates experiment quality with replay and fairness rollback guardrails', () => {
        const replay = replayRankingEvaluation({
            query: 'iphone screen',
            searchFields: ['canonicalName', 'slug'],
            baselineItems: [{ _id: 'canonical', canonicalName: 'iPhone Screen', slug: 'iphone-screen' }],
            candidateItems: [{ _id: 'off', canonicalName: 'Phone Case', slug: 'phone-case' }],
            expectedCanonicalIds: ['canonical'],
        });
        const quality = evaluateExperimentQuality({
            replay,
            baselineFairnessQualityScore: 0.82,
            fairnessQualityScore: 0.6,
            sampleSize: 80,
        });

        expect(quality.rollbackRequired).toBe(true);
        expect(quality.reasons).toEqual(expect.arrayContaining(['fairness_regression_detected']));
        expect(quality.guardrails).toContain('rollback_on_quality_drop');
    });

    it('produces offline relevance science metrics without changing live ranking', () => {
        const satisfaction = scoreSearchSatisfaction({
            impressions: 20,
            clicks: 8,
            autocompleteSelections: 5,
            abandonments: 1,
        });
        const evaluation = evaluateRelevanceScience({
            query: 'iphone screen',
            searchFields: ['canonicalName', 'slug'],
            satisfaction,
            rankedItems: [
                { _id: 'canonical', canonicalName: 'iPhone Screen', slug: 'iphone-screen', usageCount: 10 },
                { _id: 'long-tail', canonicalName: 'iPhone XS Max OLED Screen', slug: 'iphone-xs-max-oled-screen', usageCount: 1 },
            ],
        });

        expect(evaluation.rankingQualityScore).toBeGreaterThan(0.6);
        expect(evaluation.fairnessQualityScore).toBeGreaterThan(0.55);
        expect(evaluation.duplicateSuppressionQualityScore).toBeGreaterThan(0.8);
    });

    it('generates AI-ready ranking insights without mutating rank output', () => {
        const anomaly = detectBehavioralAnomaly({
            query: 'casinooooo iphone',
            impressions: 100,
            clicks: 30,
            uniqueUsers: 1,
            repeatedQueryCount: 80,
            autocompleteSelections: 90,
        });
        const insights = buildRankingIntelligenceInsights({
            query: 'iphone',
            searchFields: ['canonicalName', 'slug', 'aliases', 'synonyms'],
            behavioralAnomaly: anomaly,
            items: [
                { _id: 'a', canonicalName: 'iPhone', slug: 'iphone', aliases: [], marketplaceTrust: { catalogTrustScore: 0.9 } },
                { _id: 'b', canonicalName: 'iPhone', slug: 'iphone-copy', aliases: ['iphone'], marketplaceTrust: { aliasTrustScore: 0.1, aliasApprovalConfidence: 0.1 } },
            ],
        });

        expect(insights.map((insight) => insight.type)).toEqual(expect.arrayContaining([
            'duplicate_ranking_warning',
            'ranking_anomaly_suggestion',
        ]));
    });
});
