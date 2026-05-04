"use strict";
/**
 * Phone Number Utilities (SSOT)
 * ---------------------------------------------------------
 * Centralized logic for mobile number normalization and
 * canonicalization to ensure consistency across Validator,
 * Controller, and Service layers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMobileVariants = exports.canonicalizeToIndian = exports.normalizeTo10Digits = exports.INDIA_COUNTRY_PREFIX = void 0;
exports.INDIA_COUNTRY_PREFIX = '+91';
/**
 * Extracts the last 10 digits from any potentially formatted string
 * e.g., "+91-98765-43210" -> "9876543210"
 * e.g., "09876543210" -> "9876543210"
 */
const normalizeTo10Digits = (phone) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10)
        return digits;
    if (digits.length === 12 && digits.startsWith('91'))
        return digits.slice(2);
    // Fallback: take last 10 digits if longer than 10
    return digits.slice(-10);
};
exports.normalizeTo10Digits = normalizeTo10Digits;
/**
 * Returns the canonical Indian format (+91 prefix)
 * e.g., "9876543210" -> "+919876543210"
 */
const canonicalizeToIndian = (phone) => {
    const digits10 = (0, exports.normalizeTo10Digits)(phone);
    if (!digits10)
        return '';
    return `${exports.INDIA_COUNTRY_PREFIX}${digits10}`;
};
exports.canonicalizeToIndian = canonicalizeToIndian;
/**
 * Generates variants to support legacy DB records
 * e.g., "9876543210" -> ["+919876543210", "919876543210", "9876543210"]
 */
const getMobileVariants = (phone) => {
    const digits10 = (0, exports.normalizeTo10Digits)(phone);
    if (!digits10)
        return [];
    return [
        `${exports.INDIA_COUNTRY_PREFIX}${digits10}`,
        `91${digits10}`,
        digits10
    ];
};
exports.getMobileVariants = getMobileVariants;
//# sourceMappingURL=phoneUtils.js.map