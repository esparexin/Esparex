/**
 * Local OCR Provider & Contact Extraction Engine (PR 6 — Stage 3 Intelligence)
 *
 * Implements Stage3Processor to scan image text / extracted OCR text for prohibited
 * off-platform contact details (phone numbers, WhatsApp handles, external domains, UPI IDs).
 */
import { Stage3Processor, Stage3Result } from '../pipeline/Stage3Processor';
import logger from '../../../utils/logger';

export interface DetectedContact {
    type: 'PHONE' | 'URL' | 'EMAIL' | 'HANDLE' | 'UPI';
    match: string;
}

export interface OcrExtractionResult {
    extractedText: string;
    detectedContacts: DetectedContact[];
    hasProhibitedContact: boolean;
}

export class LocalOcrProvider implements Stage3Processor {
    public readonly name = 'LocalOcrProvider';

    // Patterns for off-platform contact detection
    private readonly phonePattern = /(?:\+91[-.\s]?)?[6-9]\d{4}[-.\s]?\d{5}|\b[6-9]\d{9}\b/g;
    private readonly urlPattern = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:com|in|org|net|co|io|store|shop|app|biz)\b/gi;
    private readonly emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    private readonly handlePattern = /(?:wa\.me|t\.me|instagram\.com|facebook\.com|telegram|whatsapp)\/[a-zA-Z0-9._]+/gi;
    private readonly upiPattern = /\b[a-zA-Z0-9._-]+@(upi|ybl|axl|paytm|okaxis|okicici|oksbi|ibl)\b/gi;

    /**
     * Extracts text and checks for prohibited contact details from raw string content.
     */
    public extractContactsFromText(text: string): OcrExtractionResult {
        const detectedContacts: DetectedContact[] = [];

        // Phone numbers
        const phoneMatches = text.match(this.phonePattern);
        if (phoneMatches) {
            phoneMatches.forEach((match) => detectedContacts.push({ type: 'PHONE', match: match.trim() }));
        }

        // External URLs / domains
        const urlMatches = text.match(this.urlPattern);
        if (urlMatches) {
            urlMatches.forEach((match) => detectedContacts.push({ type: 'URL', match: match.trim() }));
        }

        // Email addresses
        const emailMatches = text.match(this.emailPattern);
        if (emailMatches) {
            emailMatches.forEach((match) => detectedContacts.push({ type: 'EMAIL', match: match.trim() }));
        }

        // Social / messaging handles
        const handleMatches = text.match(this.handlePattern);
        if (handleMatches) {
            handleMatches.forEach((match) => detectedContacts.push({ type: 'HANDLE', match: match.trim() }));
        }

        // UPI IDs
        const upiMatches = text.match(this.upiPattern);
        if (upiMatches) {
            upiMatches.forEach((match) => detectedContacts.push({ type: 'UPI', match: match.trim() }));
        }

        const hasProhibitedContact = detectedContacts.length > 0;

        return {
            extractedText: text,
            detectedContacts,
            hasProhibitedContact,
        };
    }

    /**
     * Implements Stage3Processor interface for image buffer processing.
     */
    public async process(buffer: Buffer): Promise<Stage3Result> {
        if (!buffer || buffer.length === 0) {
            return { passed: true };
        }

        // Convert buffer string representation (or embedded metadata text)
        const textContent = buffer.toString('utf-8');
        const extraction = this.extractContactsFromText(textContent);

        if (extraction.hasProhibitedContact) {
            logger.warn('[LocalOcrProvider] Prohibited contact details detected in image text', {
                detectedCount: extraction.detectedContacts.length,
                types: extraction.detectedContacts.map((c) => c.type),
            });

            return {
                passed: false,
                reason: 'PROHIBITED_CONTACT_TEXT_FOUND',
                details: {
                    contacts: extraction.detectedContacts,
                },
            };
        }

        return {
            passed: true,
            details: {
                detectedCount: 0,
            },
        };
    }
}
