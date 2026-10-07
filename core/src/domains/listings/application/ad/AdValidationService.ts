/**
 * Ad Validation Service
 * Handles cross-cutting validation rules and utility helpers.
 * Note: Duplicate detection logic has been moved to AdDuplicateService.ts
 */

import { AppError } from '../../../../shared-kernel/errors/AppError';
import { BusinessErrorCode } from '@esparex/contracts';
import { 
    DuplicatePayload, 
    DuplicateLookupResult, 
    CrossUserDuplicateRisk,
    SelfDuplicateQuery, 
    buildDuplicateFingerprint,
    findExistingSelfDuplicate,
    assessCrossUserDuplicateRisk,
    logDuplicateEvent
} from './AdDuplicateService';
import { validateSellerTypeThreshold } from './AdPolicyService';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

type DuplicateAwareError = AppError & {
    isDuplicate?: boolean;
    code?: string;
};

const DUPLICATE_AD_MESSAGE = 'You already have an active listing for this device at this location.';

// ─────────────────────────────────────────────────
// ERROR CREATORS
// ─────────────────────────────────────────────────

export const createDuplicateError = (
    message = DUPLICATE_AD_MESSAGE,
    matchedAdId?: string
): DuplicateAwareError => {
    const err = new AppError(message, 409, BusinessErrorCode.DUPLICATE_AD) as DuplicateAwareError;
    err.isDuplicate = true;
    if (matchedAdId) {
        err.details = { matchedAdId };
    }
    return err;
};



// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────




// ─────────────────────────────────────────────────
// RE-EXPORTS (Backward Compatibility)
// ─────────────────────────────────────────────────

export {
    type DuplicatePayload,
    type DuplicateLookupResult,
    type CrossUserDuplicateRisk,
    type SelfDuplicateQuery,
    type DuplicateAwareError,
    buildDuplicateFingerprint,
    findExistingSelfDuplicate,
    assessCrossUserDuplicateRisk,
    logDuplicateEvent,
    validateSellerTypeThreshold
};
