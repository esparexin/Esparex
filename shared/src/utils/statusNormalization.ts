/**
 * Centralized Status Normalization
 * Standardizes naming drift across Ad, Business, and Service entities.
 */

export type DomainStatus = 'pending' | 'live' | 'rejected' | 'suspended' | 'expired' | 'deactivated' | 'sold' | 'deleted' | 'closed';

/**
 * Base normalization logic for any domain status.
 * Coerces legacy/UI aliases ('approved', 'active') to canonical 'live'.
 */
export function normalizeStatus(value: unknown, fallback: DomainStatus = 'pending'): DomainStatus {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();

    if (normalized === 'approved' || normalized === 'active' || normalized === 'live') {
        return 'live';
    }

    const validStatuses: DomainStatus[] = ['pending', 'rejected', 'suspended', 'expired', 'deactivated', 'sold', 'deleted', 'closed'];
    if (validStatuses.includes(normalized as DomainStatus)) {
        return normalized as DomainStatus;
    }

    return fallback;
}

/**
 * Specific normalizer for Business status.
 */
export function normalizeBusinessStatus(value: unknown, fallback: 'pending' = 'pending'): 'live' | 'pending' | 'rejected' | 'suspended' | 'deleted' | 'expired' | 'deactivated' | 'closed' {
    const status = normalizeStatus(value, fallback);
    if (status === 'sold') return 'closed';
    return status as 'live' | 'pending' | 'rejected' | 'suspended' | 'deleted' | 'expired' | 'deactivated' | 'closed';
}

/**
 * Specific normalizer for Ad status.
 */
export function normalizeAdStatus(value: unknown, fallback: 'pending' = 'pending'): 'live' | 'pending' | 'sold' | 'expired' | 'rejected' | 'deactivated' {
    const status = normalizeStatus(value, fallback);
    if (status === 'suspended') return 'pending'; // Ad doesn't have 'suspended' in current schema
    return status as 'live' | 'pending' | 'sold' | 'expired' | 'rejected' | 'deactivated';
}

/**
 * Specific normalizer for Service status.
 */
export function normalizeServiceStatus(value: unknown, fallback: 'pending' = 'pending'): 'live' | 'pending' | 'expired' | 'rejected' | 'deactivated' {
    const status = normalizeStatus(value, fallback);
    if (status === 'suspended' || status === 'sold') return 'pending'; 
    return status as 'live' | 'pending' | 'expired' | 'rejected' | 'deactivated';
}
