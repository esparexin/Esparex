/**
 * Stage 3 Intelligence Extension Interface (PR 5 — Pipeline Extension Point)
 *
 * Defines the contract for Stage 3 processing (OCR text extraction, QR scanning, watermark detection)
 * allowing PR 6 (OCRService) to plug seamlessly into the pipeline.
 */

export interface Stage3Result {
    passed: boolean;
    reason?: string;
    details?: Record<string, unknown>;
}

export interface Stage3Processor {
    readonly name: string;
    process(buffer: Buffer): Promise<Stage3Result>;
}
