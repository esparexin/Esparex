import { Role } from '@esparex/contracts';

/**
 * Normalizes legacy role strings to canonical Role enum values.
 * This provides a temporary compatibility layer during the migration phase.
 * 
 * @param role - The raw role string from database or JWT
 * @returns The canonical Role value
 */
export const normalizeRole = (role: string | null | undefined): Role => {
    if (!role) return Role.USER;

    const normalized = role.toLowerCase().trim();

    // 1. Super Admin variants
    if (normalized === 'super_admin' || normalized === 'superadmin' || normalized === 'superAdmin') {
        return Role.SUPER_ADMIN;
    }

    // 2. Business variants
    if (normalized === 'business' || normalized === 'seller_pro') {
        return Role.BUSINESS;
    }

    // 3. Moderator variants
    if (
        normalized === 'moderator' || 
        normalized === 'support' || 
        normalized === 'finance' || 
        normalized === 'finance_manager' || 
        normalized === 'user_manager' ||
        normalized === 'content_moderator' ||
        normalized === 'editor' ||
        normalized === 'viewer'
    ) {
        return Role.MODERATOR;
    }

    // 4. Admin variants
    if (normalized === 'admin') {
        return Role.ADMIN;
    }

    // Default to USER
    return Role.USER;
};

/**
 * Checks if a role string is legacy and needs normalization.
 */
export const isLegacyRole = (role: string): boolean => {
    const canonicalValues = Object.values(Role) as string[];
    return !canonicalValues.includes(role);
};
