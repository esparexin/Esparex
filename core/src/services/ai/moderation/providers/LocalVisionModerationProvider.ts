/**
 * Local Vision Moderation Provider (PR 2)
 *
 * Implements ImageModerationProvider by delegating safety & object detection inference
 * to local model adapters registered inside ModerationModelRegistry.
 */
import { ImageModerationProvider, ImageModerationRequest, ImageModerationResponse, ModerationProviderOptions } from '../types';
import { ModerationModelRegistry } from '../registry/ModerationModelRegistry';
import logger from '../../../../utils/logger';

interface SafetyPredictionResult {
    adultScore?: number;
    violenceScore?: number;
    racyScore?: number;
    goreScore?: number;
}

interface ObjectDetectionPredictionResult {
    labels?: string[];
}

export class LocalVisionModerationProvider implements ImageModerationProvider {
    readonly providerName = 'LocalVisionModerationProvider';
    private registry: ModerationModelRegistry;

    constructor(registry: ModerationModelRegistry = new ModerationModelRegistry()) {
        this.registry = registry;
    }

    async moderateImage(
        request: ImageModerationRequest,
        _options?: ModerationProviderOptions
    ): Promise<ImageModerationResponse> {
        const startTime = Date.now();
        let adultScore = 0;
        let violenceScore = 0;
        let racyScore = 0;
        let goreScore = 0;
        const labels: string[] = [];

        try {
            // Resolve registered safety model adapters
            const safetyAdapters = this.registry.getAdaptersByType<ImageModerationRequest, SafetyPredictionResult>('safety');
            for (const adapter of safetyAdapters) {
                if (adapter.isLoaded()) {
                    const result = await adapter.predict(request);
                    if (typeof result?.adultScore === 'number') adultScore = Math.max(adultScore, result.adultScore);
                    if (typeof result?.violenceScore === 'number') violenceScore = Math.max(violenceScore, result.violenceScore);
                    if (typeof result?.racyScore === 'number') racyScore = Math.max(racyScore, result.racyScore);
                    if (typeof result?.goreScore === 'number') goreScore = Math.max(goreScore, result.goreScore);
                }
            }

            // Resolve registered object detection model adapters
            const objectAdapters = this.registry.getAdaptersByType<ImageModerationRequest, ObjectDetectionPredictionResult>('object_detection');
            for (const adapter of objectAdapters) {
                if (adapter.isLoaded()) {
                    const result = await adapter.predict(request);
                    if (Array.isArray(result?.labels)) {
                        labels.push(...result.labels);
                    }
                }
            }
        } catch (error) {
            logger.warn(`[LocalVisionModerationProvider] Inference warning during moderation execution`, { error });
        }

        const latencyMs = Date.now() - startTime;

        return {
            provider: this.providerName,
            latencyMs,
            adultScore,
            violenceScore,
            racyScore,
            goreScore,
            labels: Array.from(new Set(labels)),
            signals: [
                {
                    classifier: this.providerName,
                    score: Math.max(adultScore, violenceScore, racyScore, goreScore),
                    details: {
                        registeredModelsCount: this.registry.listRegisteredModels().length,
                    },
                },
            ],
        };
    }
}
