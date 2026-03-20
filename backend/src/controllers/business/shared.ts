import mongoose from 'mongoose';
import BusinessModel from '../../models/Business';

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

/** Shared soft-delete filter — never expose deleted businesses to any query path. */
const NOT_DELETED = { isDeleted: { $ne: true } } as const;

export const findBusinessByIdentifier = async (identifier: string) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        return BusinessModel.findOne({ _id: identifier, ...NOT_DELETED });
    }

    const bySlug = await BusinessModel.findOne({ slug: identifier, ...NOT_DELETED });
    if (bySlug) return bySlug;

    // Legacy/canonical compatibility: support "slug-objectId" URLs.
    const suffixMatch = identifier.match(/-([0-9a-fA-F]{24})$/);
    const extractedId = suffixMatch?.[1];
    if (extractedId && mongoose.Types.ObjectId.isValid(extractedId)) {
        return BusinessModel.findOne({ _id: extractedId, ...NOT_DELETED });
    }

    return null;
};

export const sanitizeBusinessForPublic = (value: unknown): Record<string, unknown> => {
    const asObject =
        value && typeof value === 'object' && 'toObject' in value && typeof (value as { toObject?: () => unknown }).toObject === 'function'
            ? (value as { toObject: () => Record<string, unknown> }).toObject()
            : (value as Record<string, unknown>);

    const sanitized = { ...asObject };
    delete sanitized.documents;
    return sanitized;
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
