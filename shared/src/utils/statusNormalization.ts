/**
 * Centralized Domain-Specific Status Normalization (SSOT)
 * Standardizes lifecycle, approval, and activation state semantics across monorepo domains.
 */

export type DomainStatus = 'pending' | 'live' | 'active' | 'rejected' | 'suspended' | 'expired' | 'deactivated' | 'sold' | 'deleted' | 'closed';

export type UserStatusDomain = 'active' | 'inactive' | 'suspended' | 'banned' | 'deleted' | 'live';
export type BusinessStatusDomain = 'pending' | 'active' | 'rejected' | 'suspended' | 'deleted' | 'closed' | 'live' | 'deactivated' | 'expired';
export type ListingStatusDomain = 'draft' | 'pending' | 'live' | 'sold' | 'expired' | 'rejected' | 'deactivated';

/**
 * Base status string cleaner.
 */
export function cleanStatusString(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Specific normalizer for User Account status.
 */
export function normalizeUserStatus(value: unknown, fallback: UserStatusDomain = 'active'): UserStatusDomain {
    const raw = cleanStatusString(value);
    if (!raw) return fallback;

    if (raw === 'live' || raw === 'active') return 'active';
    if (raw === 'suspended') return 'suspended';
    if (raw === 'banned') return 'banned';
    if (raw === 'inactive') return 'inactive';
    if (raw === 'deleted') return 'deleted';

    return fallback;
}

/**
 * Specific normalizer for Business Account status.
 */
export function normalizeBusinessStatus(value: unknown, fallback: BusinessStatusDomain = 'pending'): BusinessStatusDomain {
    const raw = cleanStatusString(value);
    if (!raw) return fallback;

    if (raw === 'approved' || raw === 'active' || raw === 'live') return 'active';
    if (raw === 'pending') return 'pending';
    if (raw === 'rejected') return 'rejected';
    if (raw === 'suspended') return 'suspended';
    if (raw === 'deleted') return 'deleted';
    if (raw === 'closed') return 'closed';

    return fallback;
}

/**
 * Specific normalizer for Listing / Ad status.
 * Canonical for marketplace items (Ads, Spare Parts, Services as published listings).
 */
export function normalizeAdStatus(value: unknown, fallback: ListingStatusDomain = 'pending'): ListingStatusDomain {
    const raw = cleanStatusString(value);
    if (!raw) return fallback;

    if (raw === 'live' || raw === 'active' || raw === 'approved') return 'live';
    if (raw === 'pending') return 'pending';
    if (raw === 'draft') return 'draft';
    if (raw === 'sold') return 'sold';
    if (raw === 'expired') return 'expired';
    if (raw === 'rejected') return 'rejected';
    if (raw === 'deactivated') return 'deactivated';

    return fallback;
}

/** Alias for normalizeAdStatus */
export const normalizeListingStatus = normalizeAdStatus;

/**
 * Specific normalizer for Service status.
 */
export function normalizeServiceStatus(value: unknown, fallback: ListingStatusDomain = 'pending'): ListingStatusDomain {
    return normalizeAdStatus(value, fallback);
}

/**
 * Normalizer for Catalog Entity state (Category, Brand, Model, Screen Size, Spare Part).
 * Resolves to SSOT properties: `isActive: boolean` and `approvalStatus`.
 */
export function normalizeCatalogStatus(entity: { isActive?: boolean; approvalStatus?: string; status?: string } | null | undefined): {
    isActive: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
} {
    if (!entity) {
        return { isActive: true, approvalStatus: 'approved' };
    }

    const rawApproval = cleanStatusString(entity.approvalStatus);
    const approvalStatus: 'pending' | 'approved' | 'rejected' =
        rawApproval === 'pending' ? 'pending' : rawApproval === 'rejected' ? 'rejected' : 'approved';

    const isActive = typeof entity.isActive === 'boolean' ? entity.isActive : entity.status !== 'inactive';

    return { isActive, approvalStatus };
}

/**
 * Base normalization logic for generic domain status.
 * @deprecated Use domain-specific normalizers (normalizeUserStatus, normalizeBusinessStatus, normalizeAdStatus) instead.
 */
export function normalizeStatus(value: unknown, fallback: DomainStatus = 'pending'): DomainStatus {
    const raw = cleanStatusString(value);
    if (!raw) return fallback;

    if (raw === 'approved' || raw === 'active' || raw === 'live') {
        return 'live';
    }

    const validStatuses: DomainStatus[] = ['pending', 'rejected', 'suspended', 'expired', 'deactivated', 'sold', 'deleted', 'closed'];
    if (validStatuses.includes(raw as DomainStatus)) {
        return raw as DomainStatus;
    }

    return fallback;
}

