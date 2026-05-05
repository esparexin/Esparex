/**
 * Centralized Status Normalization
 * Standardizes naming drift across Ad, Business, and Service entities.
 */
export type DomainStatus = 'pending' | 'live' | 'rejected' | 'suspended' | 'expired' | 'deactivated' | 'sold' | 'deleted';
/**
 * Base normalization logic for any domain status.
 * Coerces legacy/UI aliases ('approved', 'active') to canonical 'live'.
 */
export declare function normalizeStatus(value: unknown, fallback?: DomainStatus): DomainStatus;
/**
 * Specific normalizer for Business status.
 */
export declare function normalizeBusinessStatus(value: unknown, fallback?: 'pending'): 'live' | 'pending' | 'rejected' | 'suspended' | 'deleted';
/**
 * Specific normalizer for Ad status.
 */
export declare function normalizeAdStatus(value: unknown, fallback?: 'pending'): 'live' | 'pending' | 'sold' | 'expired' | 'rejected' | 'deactivated';
/**
 * Specific normalizer for Service status.
 */
export declare function normalizeServiceStatus(value: unknown, fallback?: 'pending'): 'live' | 'pending' | 'expired' | 'rejected' | 'deactivated';
//# sourceMappingURL=statusNormalization.d.ts.map