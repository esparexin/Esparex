/**
 * Provider Failover Manager (PR 2)
 *
 * Orchestrates primary vs secondary fallback vision providers (e.g. GoogleVision -> AWSRekognition)
 * ensuring vision provider timeouts or network glitches do not block user uploads.
 */
import logger from '../../../utils/logger';
import {
    ImageModerationProvider,
    ImageModerationRequest,
    ImageModerationResponse,
    ModerationProviderOptions,
} from './types';

export class ProviderFailoverManager {
    private primaryProvider: ImageModerationProvider;
    private fallbackProviders: ImageModerationProvider[];

    constructor(
        primaryProvider: ImageModerationProvider,
        fallbackProviders: ImageModerationProvider[] = []
    ) {
        this.primaryProvider = primaryProvider;
        this.fallbackProviders = fallbackProviders;
    }

    async moderateImageWithFailover(
        request: ImageModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<ImageModerationResponse> {
        const providers = [this.primaryProvider, ...this.fallbackProviders];
        let lastError: unknown;

        for (const provider of providers) {
            try {
                logger.info(`[ProviderFailoverManager] Executing image moderation via ${provider.providerName}`);
                return await provider.moderateImage(request, options);
            } catch (error) {
                lastError = error;
                logger.warn(
                    `[ProviderFailoverManager] Provider ${provider.providerName} failed/timed out. Failing over...`,
                    { error }
                );
            }
        }

        // Return fallback response indicating provider timeout/failure
        logger.error('[ProviderFailoverManager] All image moderation providers failed', { lastError });
        return {
            provider: 'FallbackError',
            latencyMs: 0,
            adultScore: 0,
            violenceScore: 0,
            racyScore: 0,
            goreScore: 0,
            labels: [],
            signals: [
                {
                    classifier: 'ProviderFailoverManager',
                    score: 1.0,
                    details: { error: lastError instanceof Error ? lastError.message : String(lastError) },
                },
            ],
        };
    }
}
