/**
 * Ad Validation Service
 * Handles cross-cutting validation rules and utility helpers.
 * Note: Duplicate detection logic has been moved to AdDuplicateService.ts
 */

import { 
    DuplicatePayload, 
    DuplicateLookupResult, 
    CrossUserDuplicateRisk, 
    buildDuplicateFingerprint,
    findExistingSelfDuplicate,
    assessCrossUserDuplicateRisk,
    logDuplicateEvent
} from './AdDuplicateService';
import { validateSellerTypeThreshold } from './ad/AdPolicyService';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

type DuplicateAwareError = Error & {
    isDuplicate?: boolean;
    code?: string;
};

const DUPLICATE_AD_MESSAGE = 'You already have an active listing for this device at this location.';

// ─────────────────────────────────────────────────
// ERROR CREATORS
// ─────────────────────────────────────────────────

export const createDuplicateError = (
    message = DUPLICATE_AD_MESSAGE
): DuplicateAwareError => {
    const err = new Error(message) as DuplicateAwareError;
    err.isDuplicate = true;
    return err;
};

export const createVersionConflictError = (): DuplicateAwareError => {
    const err = new Error('Version conflict: Ad was modified by another process') as DuplicateAwareError;
    err.code = 'VERSION_CONFLICT';
    return err;
};

export const createBadRequestError = (
    message: string,
    code?: string
): DuplicateAwareError => {
    const err = new Error(message) as DuplicateAwareError;
    err.code = code;
    return err;
};

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

export const extractDocumentVersion = (value: unknown): number | undefined => {
    if (typeof value === 'number' && value >= 0) return value;
    return undefined;
};

export const isDuplicateFingerprintConflict = (error: unknown): boolean => {
    const err = error as { code?: number; keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown>; message?: string };
    return err?.code === 11000 && (!!err?.keyPattern?.duplicateFingerprint || !!err?.keyValue?.duplicateFingerprint || (typeof err?.message === 'string' && err.message.includes('duplicateFingerprint')));
};

export const isSeoSlugConflict = (error: unknown): boolean => {
    const err = error as { code?: number; keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown>; message?: string };
    return err?.code === 11000 && (!!err?.keyPattern?.seoSlug || !!err?.keyValue?.seoSlug || (typeof err?.message === 'string' && err.message.includes('seoSlug')));
};

// ─────────────────────────────────────────────────
// RE-EXPORTS (Backward Compatibility)
// ─────────────────────────────────────────────────

export {
    type DuplicatePayload,
    type DuplicateLookupResult,
    type CrossUserDuplicateRisk,
    type DuplicateAwareError,
    buildDuplicateFingerprint,
    findExistingSelfDuplicate,
    assessCrossUserDuplicateRisk,
    logDuplicateEvent,
    validateSellerTypeThreshold
};
