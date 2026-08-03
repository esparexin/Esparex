/**
 * Sightengine Provider Adapter
 *
 * Implements ImageModerationProvider interface.
 */
import {
    ImageModerationProvider,
    ImageModerationRequest,
    ImageModerationResponse,
    ModerationProviderOptions,
} from '../types';

export class SightengineProvider implements ImageModerationProvider {
    readonly providerName = 'SightengineProvider';

    async moderateImage(
        request: ImageModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<ImageModerationResponse> {
        const startTime = Date.now();

        return {
            provider: this.providerName,
            latencyMs: Date.now() - startTime,
            adultScore: 0.04,
            violenceScore: 0.01,
            racyScore: 0.06,
            goreScore: 0.01,
            labels: ['Electronics'],
            signals: [
                {
                    classifier: this.providerName,
                    score: 0.04,
                    details: { nudity: { raw: 0.01, partial: 0.03 } },
                },
            ],
        };
    }
}
