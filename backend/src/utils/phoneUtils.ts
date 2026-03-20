/**
 * Phone Number Utilities (SSOT)
 * ---------------------------------------------------------
 * Centralized logic for mobile number normalization and 
 * canonicalization to ensure consistency across Validator, 
 * Controller, and Service layers.
 */

export const INDIA_COUNTRY_PREFIX = '+91';

/**
 * Extracts the last 10 digits from any potentially formatted string
 * e.g., "+91-98765-43210" -> "9876543210"
 * e.g., "09876543210" -> "9876543210"
 */
export const normalizeTo10Digits = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    // Fallback: take last 10 digits if longer than 10
    return digits.slice(-10);
};

/**
 * Returns the canonical Indian format (+91 prefix)
 * e.g., "9876543210" -> "+919876543210"
 */
export const canonicalizeToIndian = (phone: string): string => {
    const digits10 = normalizeTo10Digits(phone);
    if (!digits10) return '';
    return `${INDIA_COUNTRY_PREFIX}${digits10}`;
};

/**
 * Generates variants to support legacy DB records
 * e.g., "9876543210" -> ["+919876543210", "919876543210", "9876543210"]
 */
export const getMobileVariants = (phone: string): string[] => {
    const digits10 = normalizeTo10Digits(phone);
    if (!digits10) return [];
    return [
        `${INDIA_COUNTRY_PREFIX}${digits10}`,
        `91${digits10}`,
        digits10
    ];
};
