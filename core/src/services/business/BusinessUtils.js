"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniquenessConditions = exports.normalizeDocuments = exports.cleanupRemovedS3Objects = exports.buildBusinessLocationPayload = exports.joinLocationParts = exports.extractPincodeFromAddress = exports.asOptionalString = exports.toImageUrls = exports.toStringArray = exports.asBusinessDocView = exports.ADDRESS_PINCODE_PATTERN = exports.DEFAULT_BUSINESS_TYPES = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const AppError_1 = require("@core/utils/AppError");
const imageProcessor_1 = require("@core/utils/imageProcessor");
const s3_1 = require("@core/utils/s3");
const _shared_1 = require("@shared");
exports.DEFAULT_BUSINESS_TYPES = ['Repair services', 'Spare parts'];
exports.ADDRESS_PINCODE_PATTERN = /\b\d{6}\b/;
const asBusinessDocView = (value) => value || {};
exports.asBusinessDocView = asBusinessDocView;
const toStringArray = (value) => Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.length > 0)
    : [];
exports.toStringArray = toStringArray;
const toImageUrls = (value) => (0, s3_1.sanitizeStoredImageUrls)(value.map((item) => item.url));
exports.toImageUrls = toImageUrls;
const asOptionalString = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};
exports.asOptionalString = asOptionalString;
const extractPincodeFromAddress = (value) => {
    const address = (0, exports.asOptionalString)(value);
    if (!address)
        return undefined;
    return address.match(exports.ADDRESS_PINCODE_PATTERN)?.[0];
};
exports.extractPincodeFromAddress = extractPincodeFromAddress;
const joinLocationParts = (...parts) => {
    const normalizedParts = parts
        .map((part) => (0, exports.asOptionalString)(part))
        .filter((part) => Boolean(part));
    return normalizedParts.length > 0 ? normalizedParts.join(', ') : undefined;
};
exports.joinLocationParts = joinLocationParts;
const buildBusinessLocationPayload = ({ currentLocation, incomingLocation, normalizedLocation, fallbackLocationId, }) => {
    const incomingAddress = (0, exports.asOptionalString)(incomingLocation.address);
    const resolvedShopNo = (0, exports.asOptionalString)(incomingLocation.shopNo) ?? currentLocation?.shopNo;
    const resolvedStreet = (0, exports.asOptionalString)(incomingLocation.street) ?? currentLocation?.street;
    const resolvedLandmark = (0, exports.asOptionalString)(incomingLocation.landmark) ?? currentLocation?.landmark;
    const resolvedCity = (0, exports.asOptionalString)(incomingLocation.city) || normalizedLocation?.city || currentLocation?.city;
    const resolvedState = (0, exports.asOptionalString)(incomingLocation.state) || normalizedLocation?.state || currentLocation?.state;
    const resolvedCountry = (0, exports.asOptionalString)(incomingLocation.country) || normalizedLocation?.country || currentLocation?.country;
    const resolvedPincode = (0, exports.asOptionalString)(incomingLocation.pincode)
        || normalizedLocation?.pincode
        || (0, exports.extractPincodeFromAddress)(incomingAddress)
        || currentLocation?.pincode;
    const computedAddress = (0, exports.joinLocationParts)(resolvedShopNo, resolvedStreet, resolvedLandmark, resolvedCity, resolvedState, resolvedPincode)
        || (0, exports.joinLocationParts)(resolvedCity, resolvedState, resolvedPincode);
    const resolvedAddress = incomingAddress
        || currentLocation?.address
        || computedAddress
        || 'Location TBD';
    const resolvedDisplay = (0, exports.asOptionalString)(incomingLocation.display)
        || normalizedLocation?.display
        || currentLocation?.display
        || (0, exports.joinLocationParts)(resolvedCity, resolvedState)
        || resolvedAddress;
    return {
        locationId: normalizedLocation?.locationId || fallbackLocationId,
        location: {
            ...currentLocation,
            address: resolvedAddress,
            display: resolvedDisplay,
            shopNo: resolvedShopNo,
            street: resolvedStreet,
            landmark: resolvedLandmark,
            city: resolvedCity,
            state: resolvedState,
            country: resolvedCountry,
            pincode: resolvedPincode,
            coordinates: (0, _shared_1.toGeoPoint)(incomingLocation.coordinates)
                || (0, _shared_1.toGeoPoint)(normalizedLocation?.coordinates)
                || currentLocation?.coordinates
        }
    };
};
exports.buildBusinessLocationPayload = buildBusinessLocationPayload;
const cleanupRemovedS3Objects = async (previous, next) => {
    const previousUrls = Array.isArray(previous)
        ? previous
            .map(p => typeof p === 'string' ? p : p.url)
            .filter((url) => typeof url === 'string' && url.length > 0)
        : [];
    const nextUrls = new Set(Array.isArray(next)
        ? next
            .map(n => typeof n === 'string' ? n : n.url)
            .filter((url) => typeof url === 'string' && url.length > 0)
        : []);
    const removed = previousUrls.filter((url) => !nextUrls.has(url));
    if (removed.length === 0)
        return;
    await Promise.all(removed.map(async (url) => {
        try {
            await (0, s3_1.deleteFromS3Url)(url);
        }
        catch (cleanupError) {
            logger_1.default.warn('[Business Media Cleanup] Failed to delete old object', {
                url,
                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
            });
        }
    }));
};
exports.cleanupRemovedS3Objects = cleanupRemovedS3Objects;
const normalizeDocuments = async (input, businessId, existingDocs = []) => {
    if (!input)
        return existingDocs;
    if (Array.isArray(input)) {
        return input.map(doc => ({
            ...doc,
            uploadedAt: new Date(),
            expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
            version: doc.version || 1
        }));
    }
    const idProofType = typeof input.idProofType === 'string' && input.idProofType.trim().length > 0
        ? input.idProofType.trim()
        : undefined;
    const newDocs = existingDocs.map((doc) => ({
        ...doc,
        ...(doc.type === 'id_proof' && idProofType ? { idProofType } : {})
    }));
    const upload = async (urls, type) => {
        if (!urls || urls.length === 0)
            return;
        const processed = (0, exports.toImageUrls)(await (0, imageProcessor_1.processImages)((0, exports.toStringArray)(urls), `businesses/${businessId}`));
        if (processed.length === 0) {
            throw new AppError_1.AppError(`Failed to upload ${type.replace(/_/g, ' ')}. Please retry.`, 502);
        }
        processed.forEach(url => {
            newDocs.push({
                type,
                url,
                uploadedAt: new Date(),
                version: 1,
                ...(type === 'id_proof' && idProofType ? { idProofType } : {})
            });
        });
    };
    await upload(input.idProof, 'id_proof');
    await upload(input.businessProof, 'business_proof');
    await upload(input.certificates, 'certificate');
    return newDocs;
};
exports.normalizeDocuments = normalizeDocuments;
const getUniquenessConditions = (data) => {
    const conditions = [];
    const normalizedMobile = String(data.mobile || '').trim();
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const normalizedGst = String(data.gstNumber || '').trim().toUpperCase();
    const normalizedRegistration = String(data.registrationNumber || '').trim().toUpperCase();
    if (normalizedMobile)
        conditions.push({ mobile: normalizedMobile });
    if (normalizedEmail)
        conditions.push({ email: normalizedEmail });
    if (normalizedGst)
        conditions.push({ gstNumber: normalizedGst });
    if (normalizedRegistration)
        conditions.push({ registrationNumber: normalizedRegistration });
    return {
        conditions,
        normalizedMobile,
        normalizedEmail,
        normalizedGst,
        normalizedRegistration
    };
};
exports.getUniquenessConditions = getUniquenessConditions;
//# sourceMappingURL=BusinessUtils.js.map