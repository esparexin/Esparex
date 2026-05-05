export { findBusinessByIdentifier } from '@esparex/core/services/business/BusinessCoreService';
export { 
    serializeBusiness, 
    serializeBusinessForAdmin, 
    serializeBusinessForOwner, 
    sanitizeBusinessForPublic 
} from '@esparex/core/utils/businessSerializer';

type DuplicateError = {
    code?: number;
    keyPattern?: Record<string, unknown>;
};

export type BusinessStatsPayload = {
    totalServices: number;
    approvedServices: number;
    pendingServices: number;
    views: number;
};

export const resolveDuplicateBusinessMessage = (error: unknown): string | null => {
    const duplicateError = error as DuplicateError;

    if (duplicateError?.code !== 11000) return null;

    const duplicateField = Object.keys(duplicateError.keyPattern || {})[0];

    if (duplicateField === 'userId') {
        return 'You already have a business profile. Please update your existing profile instead.';
    }
    if (duplicateField === 'gstNumber') {
        return 'GST number is already registered with another business profile.';
    }
    if (duplicateField === 'registrationNumber') {
        return 'Registration number is already registered with another business profile.';
    }
    if (duplicateField === 'email') {
        return 'Business email is already registered with another business profile.';
    }
    if (duplicateField === 'mobile') {
        return 'Business mobile number is already registered with another business profile.';
    }

    return 'Duplicate business details detected. Please review and try again.';
};
