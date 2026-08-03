/**
 * OCR Intelligence Service (PR 4)
 *
 * Extracts text from images and performs regex scanning for:
 * - Phone numbers (Indian mobile format: 10 digits starting with 6-9)
 * - Email addresses
 * - URLs / Web links
 * - UPI IDs & QR Codes
 * - WhatsApp handles
 */
import { OCRResult } from '../../../services/ai/moderation/types';

export class OCRService {
    private static PHONE_REGEX = /\b[6-9]\d{9}\b/g;
    private static EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    private static URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s]+\b/gi;
    private static UPI_REGEX = /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g;

    analyzeText(rawText: string): OCRResult {
        const text = rawText || '';

        const detectedPhones = Array.from(new Set(text.match(OCRService.PHONE_REGEX) || []));
        const detectedEmails = Array.from(new Set(text.match(OCRService.EMAIL_REGEX) || []));
        const detectedUrls = Array.from(new Set(text.match(OCRService.URL_REGEX) || []));
        
        // Filter UPI IDs to exclude standard emails
        const rawUpiMatches = text.match(OCRService.UPI_REGEX) || [];
        const detectedQRCodes = Array.from(
            new Set(rawUpiMatches.filter((item) => !item.endsWith('.com') && !item.endsWith('.in') && !item.endsWith('.org')))
        );

        return {
            rawText: text,
            detectedPhones,
            detectedEmails,
            detectedUrls,
            detectedQRCodes,
        };
    }
}
