/**
 * businessSerializer.ts
 * Pure serializer for Business documents — no Express dependency.
 * Shared between services and controllers.
 */

import { sanitizePersistedImageUrls } from './s3';
import { serializeDoc } from './serialize';

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};

const asOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

const toSafeImageArray = (value: unknown): string[] =>
    sanitizePersistedImageUrls(
        Array.isArray(value) ? value.filter((image): image is string => typeof image === 'string') : [],
        { fallbackToPlaceholder: false, allowPlaceholder: false }
    );

const sanitizeImageField = (candidate: unknown): string | undefined =>
    sanitizePersistedImageUrls(
        typeof candidate === 'string' ? [candidate] : [],
        { fallbackToPlaceholder: false, allowPlaceholder: false }
    )[0];

const normalizeBusinessDocuments = (value: unknown) => {
    if (!Array.isArray(value)) {
        return value;
    }

    const documents = value.map((doc) => asRecord(doc));
    return Object.assign(documents, {
        idProof: documents.filter((doc) => doc.type === 'id_proof').map((doc) => doc.url).filter((url): url is string => typeof url === 'string'),
        idProofType: documents.find((doc) => doc.type === 'id_proof')?.idProofType,
        businessProof: documents.filter((doc) => doc.type === 'business_proof').map((doc) => doc.url).filter((url): url is string => typeof url === 'string'),
        certificates: documents.filter((doc) => doc.type === 'certificate').map((doc) => doc.url).filter((url): url is string => typeof url === 'string'),
    });
};

const deriveSellerIdentity = (business: Record<string, unknown>) => {
    const sellerSource = asRecord(business.sellerId);
    const ownerSource = asRecord(business.userId);
    const sellerId =
        asOptionalString(sellerSource.id) ||
        asOptionalString(sellerSource._id) ||
        asOptionalString(business.sellerId) ||
        asOptionalString(ownerSource.id) ||
        asOptionalString(ownerSource._id) ||
        asOptionalString(business.ownerId) ||
        asOptionalString(business.userId);
    const ownerName =
        asOptionalString(sellerSource.name) ||
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

const normalizeBusinessLocation = (value: unknown, topLevelLocationId: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }

    return {
        ...value,
        locationId: asOptionalString((value as Record<string, unknown>).locationId) || asOptionalString(topLevelLocationId),
    };
};

export const serializeBusiness = (
    value: unknown,
    options: { audience?: 'public' | 'owner' | 'admin' } = {},
): Record<string, unknown> => {
    const audience = options.audience || 'owner';
    const serialized = { ...asRecord(serializeDoc(value)) };

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
    if (safeLogo) serialized.logo = safeLogo;
    else delete serialized.logo;
    if (safeCoverImage) serialized.coverImage = safeCoverImage;
    else delete serialized.coverImage;

    const mobile =
        asOptionalString(serialized.mobile) ||
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
    } else if (sellerId) {
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

export const sanitizeBusinessForPublic = (value: unknown): Record<string, unknown> =>
    serializeBusiness(value, { audience: 'public' });

export const serializeBusinessForOwner = (value: unknown): Record<string, unknown> =>
    serializeBusiness(value, { audience: 'owner' });

export const serializeBusinessForAdmin = (value: unknown): Record<string, unknown> =>
    serializeBusiness(value, { audience: 'admin' });
