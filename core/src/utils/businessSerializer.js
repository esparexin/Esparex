"use strict";
/**
 * businessSerializer.ts
 * Pure serializer for Business documents — no Express dependency.
 * Shared between services and controllers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeBusinessForAdmin = exports.serializeBusinessForOwner = exports.sanitizeBusinessForPublic = exports.serializeBusiness = void 0;
const s3_1 = require("./s3");
const serialize_1 = require("./serialize");
const asRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
const asOptionalString = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};
const toSafeImageArray = (value) => (0, s3_1.sanitizePersistedImageUrls)(Array.isArray(value) ? value.filter((image) => typeof image === 'string') : [], { fallbackToPlaceholder: false, allowPlaceholder: false });
const sanitizeImageField = (candidate) => (0, s3_1.sanitizePersistedImageUrls)(typeof candidate === 'string' ? [candidate] : [], { fallbackToPlaceholder: false, allowPlaceholder: false })[0];
const normalizeBusinessDocuments = (value) => {
    if (!Array.isArray(value)) {
        return value;
    }
    const documents = value.map((doc) => asRecord(doc));
    return Object.assign(documents, {
        idProof: documents.filter((doc) => doc.type === 'id_proof').map((doc) => doc.url).filter((url) => typeof url === 'string'),
        idProofType: documents.find((doc) => doc.type === 'id_proof')?.idProofType,
        businessProof: documents.filter((doc) => doc.type === 'business_proof').map((doc) => doc.url).filter((url) => typeof url === 'string'),
        certificates: documents.filter((doc) => doc.type === 'certificate').map((doc) => doc.url).filter((url) => typeof url === 'string'),
    });
};
const deriveSellerIdentity = (business) => {
    const sellerSource = asRecord(business.sellerId);
    const ownerSource = asRecord(business.userId);
    const sellerId = asOptionalString(sellerSource.id) ||
        asOptionalString(sellerSource._id) ||
        asOptionalString(business.sellerId) ||
        asOptionalString(ownerSource.id) ||
        asOptionalString(ownerSource._id) ||
        asOptionalString(business.ownerId) ||
        asOptionalString(business.userId);
    const ownerName = asOptionalString(sellerSource.name) ||
        asOptionalString(ownerSource.name) ||
        [asOptionalString(ownerSource.firstName), asOptionalString(ownerSource.lastName)].filter(Boolean).join(' ').trim() ||
        asOptionalString(business.ownerName);
    const sellerRef = sellerId
        ? {
            id: sellerId,
            _id: sellerId,
            ...(ownerName ? { name: ownerName } : {}),
            ...(asOptionalString(sellerSource.email) || asOptionalString(ownerSource.email)
                ? { email: asOptionalString(sellerSource.email) || asOptionalString(ownerSource.email) }
                : {}),
            ...(asOptionalString(sellerSource.mobile) || asOptionalString(ownerSource.mobile)
                ? { mobile: asOptionalString(sellerSource.mobile) || asOptionalString(ownerSource.mobile) }
                : {}),
        }
        : undefined;
    return {
        sellerId,
        ownerName: ownerName || undefined,
        sellerRef,
    };
};
const normalizeBusinessLocation = (value, topLevelLocationId) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }
    return {
        ...value,
        locationId: asOptionalString(value.locationId) || asOptionalString(topLevelLocationId),
    };
};
const serializeBusiness = (value, options = {}) => {
    const audience = options.audience || 'owner';
    const serialized = { ...asRecord((0, serialize_1.serializeDoc)(value)) };
    const safeImages = toSafeImageArray(serialized.images);
    serialized.images = safeImages;
    serialized.shopImages = toSafeImageArray(serialized.shopImages).length > 0
        ? toSafeImageArray(serialized.shopImages)
        : safeImages;
    serialized.gallery = toSafeImageArray(serialized.gallery).length > 0
        ? toSafeImageArray(serialized.gallery)
        : safeImages;
    const safeLogo = sanitizeImageField(serialized.logo);
    const safeCoverImage = sanitizeImageField(serialized.coverImage);
    if (safeLogo)
        serialized.logo = safeLogo;
    else
        delete serialized.logo;
    if (safeCoverImage)
        serialized.coverImage = safeCoverImage;
    else
        delete serialized.coverImage;
    const mobile = asOptionalString(serialized.mobile) ||
        asOptionalString(serialized.phone) ||
        asOptionalString(serialized.contactNumber) ||
        '';
    if (mobile) {
        serialized.mobile = mobile;
        serialized.contactNumber = mobile;
    }
    delete serialized.phone;
    serialized.businessName = asOptionalString(serialized.businessName) || asOptionalString(serialized.name);
    serialized.businessType =
        asOptionalString(serialized.businessType) ||
            (Array.isArray(serialized.businessTypes) && typeof serialized.businessTypes[0] === 'string'
                ? serialized.businessTypes[0]
                : undefined);
    serialized.isVerified = Boolean(serialized.isVerified ?? serialized.verified);
    serialized.verified = Boolean(serialized.isVerified);
    serialized.location = normalizeBusinessLocation(serialized.location, serialized.locationId);
    const { sellerId, ownerName, sellerRef } = deriveSellerIdentity(serialized);
    if (ownerName) {
        serialized.ownerName = ownerName;
    }
    if (sellerRef) {
        serialized.sellerId = sellerRef;
    }
    else if (sellerId) {
        serialized.sellerId = sellerId;
    }
    delete serialized.userId;
    delete serialized.ownerId;
    if (audience === 'public') {
        delete serialized.documents;
        return serialized;
    }
    serialized.documents = normalizeBusinessDocuments(serialized.documents);
    return serialized;
};
exports.serializeBusiness = serializeBusiness;
const sanitizeBusinessForPublic = (value) => (0, exports.serializeBusiness)(value, { audience: 'public' });
exports.sanitizeBusinessForPublic = sanitizeBusinessForPublic;
const serializeBusinessForOwner = (value) => (0, exports.serializeBusiness)(value, { audience: 'owner' });
exports.serializeBusinessForOwner = serializeBusinessForOwner;
const serializeBusinessForAdmin = (value) => (0, exports.serializeBusiness)(value, { audience: 'admin' });
exports.serializeBusinessForAdmin = serializeBusinessForAdmin;
//# sourceMappingURL=businessSerializer.js.map