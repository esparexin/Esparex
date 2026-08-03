/**
 * AI Moderation Provider Abstraction Types (PR 2)
 */
import { ModerationSignalDTO } from '@esparex/contracts';

export interface ImageModerationRequest {
    imageUrl?: string;
    imageBuffer?: Buffer;
    mimeType?: string;
}

export interface TextModerationRequest {
    text: string;
}

export interface OCRResult {
    rawText: string;
    detectedPhones: string[];
    detectedEmails: string[];
    detectedUrls: string[];
    detectedQRCodes: string[];
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
    ocr?: OCRResult;
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

export interface TextModerationProvider {
    readonly providerName: string;
    moderateText(
        request: TextModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<ModerationSignalDTO[]>;
}

export interface OCRProvider {
    readonly providerName: string;
    extractText(
        request: ImageModerationRequest,
        options?: ModerationProviderOptions
    ): Promise<OCRResult>;
}
