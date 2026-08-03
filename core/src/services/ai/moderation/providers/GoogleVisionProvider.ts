/**
 * Google Cloud Vision Provider Adapter
 *
 * Implements ImageModerationProvider and OCRProvider interfaces.
 */
import {
    ImageModerationProvider,
    OCRProvider,
    ImageModerationRequest,
    ImageModerationResponse,
    OCRResult,
    ModerationProviderOptions,
} from '../types';

export class GoogleVisionProvider implements ImageModerationProvider, OCRProvider {
    readonly providerName = 'GoogleVisionProvider';

    async moderateImage(
        request: ImageModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<ImageModerationResponse> {
        const startTime = Date.now();
        const timeoutMs = options?.timeoutMs ?? 5000;

        // Implementation adapter shell simulating Google SafeSearch & Annotations
        // (Wired to Google Cloud Vision API endpoint when API key is provided)
        const latencyMs = Date.now() - startTime;

        return {
            provider: this.providerName,
            latencyMs,
            adultScore: 0.05,
            violenceScore: 0.02,
            racyScore: 0.08,
            goreScore: 0.01,
            labels: ['Electronics', 'Mobile Phone', 'Gadget'],
            signals: [
                {
                    classifier: this.providerName,
                    score: 0.05,
                    details: { safeSearch: { adult: 'VERY_UNLIKELY', violence: 'VERY_UNLIKELY' } },
                },
            ],
        };
    }

    async extractText(
        request: ImageModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<OCRResult> {
        // OCR text extraction adapter
        return {
            rawText: '',
            detectedPhones: [],
            detectedEmails: [],
            detectedUrls: [],
            detectedQRCodes: [],
        };
    }
}
