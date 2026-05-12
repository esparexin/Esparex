import { executeAiRequest } from '../AiService';
import { TaxonomyAiPromptBuilder, TAXONOMY_AI_PROMPT_VERSIONS } from './taxonomyAiPromptBuilder';
import { ITaxonomyAiAnalysis, ITaxonomyAiResult } from '../../types/catalogAi';
import logger from '../../utils/logger';
import { env } from '../../config/env';

export class TaxonomyAiService {
    static async analyzeBrand(name: string): Promise<ITaxonomyAiResult | null> {
        try {
            const prompt = TaxonomyAiPromptBuilder.buildBrandPrompt(name);
            const result = await executeAiRequest({
                type: 'taxonomy',
                context: {},
                contextText: prompt
            });

            if (!result.ok) {
                logger.error('[TaxonomyAiService] Brand analysis failed', { error: result.error });
                return null;
            }

            const data = result.data as any;
            const analysis: ITaxonomyAiAnalysis = {
                categorySuggestion: data.categorySuggestion,
                brandSuggestion: data.brandSuggestion,
                confidence: data.confidence,
                explanation: data.explanation,
                provider: env.AI_PROVIDER || 'gemini',
                model: env.AI_MODEL || 'gemini-flash-latest',
                analyzedAt: new Date(),
                promptVersion: TAXONOMY_AI_PROMPT_VERSIONS.BRAND
            };

            return {
                analysis,
                decision: this.deriveDecision(analysis.confidence)
            };
        } catch (error) {
            logger.error('[TaxonomyAiService] Unexpected error in analyzeBrand', { error });
            return null;
        }
    }

    static async analyzeModel(name: string, brandContext?: string): Promise<ITaxonomyAiResult | null> {
        try {
            const prompt = TaxonomyAiPromptBuilder.buildModelPrompt(name, brandContext);
            const result = await executeAiRequest({
                type: 'taxonomy',
                context: {},
                contextText: prompt
            });

            if (!result.ok) {
                logger.error('[TaxonomyAiService] Model analysis failed', { error: result.error });
                return null;
            }

            const data = result.data as any;
            const analysis: ITaxonomyAiAnalysis = {
                categorySuggestion: data.categorySuggestion,
                brandSuggestion: data.brandSuggestion,
                modelSuggestion: data.modelSuggestion,
                variantSuggestion: data.variantSuggestion,
                variantAttributes: data.variantAttributes,
                confidence: data.confidence,
                explanation: data.explanation,
                provider: env.AI_PROVIDER || 'gemini',
                model: env.AI_MODEL || 'gemini-flash-latest',
                analyzedAt: new Date(),
                promptVersion: TAXONOMY_AI_PROMPT_VERSIONS.MODEL
            };

            return {
                analysis,
                decision: this.deriveDecision(analysis.confidence)
            };
        } catch (error) {
            logger.error('[TaxonomyAiService] Unexpected error in analyzeModel', { error });
            return null;
        }
    }

    private static deriveDecision(confidence: number) {
        return {
            autoAccepted: confidence >= 0.95,
            requiresReview: confidence < 0.95,
        };
    }
}
