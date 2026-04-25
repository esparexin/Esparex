import { sanitizeStoredImageUrls } from './s3';

/**
 * Normalizes an array of image tokens (strings).
 */
export const normalizeImageTokens = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry) => entry.length > 0);
};

/**
 * Converts image objects (with url/hash) to an array of sanitized URLs.
 */
export const toImageUrls = (value: Array<{ url: string; hash: string }>): string[] =>
    sanitizeStoredImageUrls(value.map((item) => item.url));
