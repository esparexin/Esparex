"use strict";
/**
 * Ad Validation Service
 * Handles cross-cutting validation rules and utility helpers.
 * Note: Duplicate detection logic has been moved to AdDuplicateService.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSellerTypeThreshold = exports.logDuplicateEvent = exports.assessCrossUserDuplicateRisk = exports.findExistingSelfDuplicate = exports.buildDuplicateFingerprint = exports.isSeoSlugConflict = exports.isDuplicateFingerprintConflict = exports.extractDocumentVersion = exports.createBadRequestError = exports.createVersionConflictError = exports.createDuplicateError = void 0;
const AdDuplicateService_1 = require("./AdDuplicateService");
Object.defineProperty(exports, "buildDuplicateFingerprint", { enumerable: true, get: function () { return AdDuplicateService_1.buildDuplicateFingerprint; } });
Object.defineProperty(exports, "findExistingSelfDuplicate", { enumerable: true, get: function () { return AdDuplicateService_1.findExistingSelfDuplicate; } });
Object.defineProperty(exports, "assessCrossUserDuplicateRisk", { enumerable: true, get: function () { return AdDuplicateService_1.assessCrossUserDuplicateRisk; } });
Object.defineProperty(exports, "logDuplicateEvent", { enumerable: true, get: function () { return AdDuplicateService_1.logDuplicateEvent; } });
const AdPolicyService_1 = require("./ad/AdPolicyService");
Object.defineProperty(exports, "validateSellerTypeThreshold", { enumerable: true, get: function () { return AdPolicyService_1.validateSellerTypeThreshold; } });
const DUPLICATE_AD_MESSAGE = 'You already have an active listing for this device at this location.';
// ─────────────────────────────────────────────────
// ERROR CREATORS
// ─────────────────────────────────────────────────
const createDuplicateError = (message = DUPLICATE_AD_MESSAGE) => {
    const err = new Error(message);
    err.isDuplicate = true;
    return err;
};
exports.createDuplicateError = createDuplicateError;
const createVersionConflictError = () => {
    const err = new Error('Version conflict: Ad was modified by another process');
    err.code = 'VERSION_CONFLICT';
    return err;
};
exports.createVersionConflictError = createVersionConflictError;
const createBadRequestError = (message, code) => {
    const err = new Error(message);
    err.code = code;
    return err;
};
exports.createBadRequestError = createBadRequestError;
// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────
const extractDocumentVersion = (value) => {
    if (typeof value === 'number' && value >= 0)
        return value;
    return undefined;
};
exports.extractDocumentVersion = extractDocumentVersion;
const isDuplicateFingerprintConflict = (error) => {
    const err = error;
    return err?.code === 11000 && (!!err?.keyPattern?.duplicateFingerprint || !!err?.keyValue?.duplicateFingerprint || (typeof err?.message === 'string' && err.message.includes('duplicateFingerprint')));
};
exports.isDuplicateFingerprintConflict = isDuplicateFingerprintConflict;
const isSeoSlugConflict = (error) => {
    const err = error;
    return err?.code === 11000 && (!!err?.keyPattern?.seoSlug || !!err?.keyValue?.seoSlug || (typeof err?.message === 'string' && err.message.includes('seoSlug')));
};
exports.isSeoSlugConflict = isSeoSlugConflict;
//# sourceMappingURL=AdValidationService.js.map