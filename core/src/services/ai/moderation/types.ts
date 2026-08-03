/**
 * AI Moderation Provider Abstraction Types (PR 2)
 */

export interface ModerationSignalDTO {
    classifier: string;
    score: number;
    details?: Record<string, unknown>;
}

export interface ImageModerationRequest {
    imageUrl?: string;
    imageBuffer?: Buffer;
    mimeType?: string;
}

export interface ImageModerationResponse {
    provider: string;
    latencyMs: number;
    adultScore: number;
    violenceScore: number;
    racyScore: number;
    goreScore: number;
    labels: string[];
    signals: ModerationSignalDTO[];
}

export interface ModerationProviderOptions {
    timeoutMs?: number;
}

export interface ImageModerationProvider {
    readonly providerName: string;
    moderateImage(
        request: ImageModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<ImageModerationResponse>;
}
