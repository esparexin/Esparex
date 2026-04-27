"use strict";
/**
 * Centralized Status Normalization
 * Standardizes naming drift across Ad, Business, and Service entities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeStatus = normalizeStatus;
exports.normalizeBusinessStatus = normalizeBusinessStatus;
exports.normalizeAdStatus = normalizeAdStatus;
exports.normalizeServiceStatus = normalizeServiceStatus;
/**
 * Base normalization logic for any domain status.
 * Coerces legacy/UI aliases ('approved', 'active') to canonical 'live'.
 */
function normalizeStatus(value, fallback = 'pending') {
    if (typeof value !== 'string')
        return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'approved' || normalized === 'active' || normalized === 'live') {
        return 'live';
    }
    const validStatuses = ['pending', 'rejected', 'suspended', 'expired', 'deactivated', 'sold'];
    if (validStatuses.includes(normalized)) {
        return normalized;
    }
    return fallback;
}
/**
 * Specific normalizer for Business status.
 */
function normalizeBusinessStatus(value, fallback = 'pending') {
    const status = normalizeStatus(value, fallback);
    if (status === 'sold' || status === 'expired' || status === 'deactivated')
        return 'pending';
    return status;
}
/**
 * Specific normalizer for Ad status.
 */
function normalizeAdStatus(value, fallback = 'pending') {
    const status = normalizeStatus(value, fallback);
    if (status === 'suspended')
        return 'pending'; // Ad doesn't have 'suspended' in current schema
    return status;
}
/**
 * Specific normalizer for Service status.
 */
function normalizeServiceStatus(value, fallback = 'pending') {
    const status = normalizeStatus(value, fallback);
    if (status === 'suspended' || status === 'sold')
        return 'pending';
    return status;
}
//# sourceMappingURL=statusNormalization.js.map