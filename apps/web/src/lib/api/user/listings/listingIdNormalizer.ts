// ─── Listing ID normalization (P4 extract-before-split from normalizer.ts) ─
// Single owner for listing identifier parsing/validation. Verbatim move.

export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const LISTING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_LISTING_IDENTIFIERS = new Set([
    '', 'undefined', 'null', 'nan', 'true', 'false', 'favicon.ico',
]);

export function normalizeListingIdentifier(value: string | number): string {
    const raw = String(value).trim();
    if (!raw) return '';
    try {
        return decodeURIComponent(raw).trim();
    } catch {
        return raw;
    }
}

export function isValidListingIdentifier(value: string | number): boolean {
    const identifier = normalizeListingIdentifier(value);
    if (!identifier || identifier.length > 200) return false;
    if (RESERVED_LISTING_IDENTIFIERS.has(identifier.toLowerCase())) return false;
    if (identifier.includes("/") || identifier.includes("\\")) return false;

    if (OBJECT_ID_PATTERN.test(identifier)) return true;
    if (identifier.length < 2) return false;
    return LISTING_SLUG_PATTERN.test(identifier.toLowerCase());
}

export function extractId(value: unknown): string | undefined {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return String(record.id || record._id || '');
    }
    return undefined;
}
