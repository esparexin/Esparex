import { sanitizePersistedImageUrls } from '../../utils/s3';

export { findBusinessByIdentifier } from '../../services/business/BusinessCoreService';
import { serializeDoc } from '../../utils/serialize';

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

const deriveOwnerAliases = (business: Record<string, unknown>) => {
    const ownerSource = asRecord(business.userId);
    const ownerId =
        asOptionalString(ownerSource.id) ||
        asOptionalString(ownerSource._id) ||
        asOptionalString(business.ownerId) ||
        asOptionalString(business.userId);
    const ownerName =
        asOptionalString(ownerSource.name) ||
        [asOptionalString(ownerSource.firstName), asOptionalString(ownerSource.lastName)].filter(Boolean).join(' ').trim() ||
        asOptionalString(business.ownerName);

    const ownerRef = ownerId
        ? {
            id: ownerId,
            _id: ownerId,
            ...(ownerName ? { name: ownerName } : {}),
            ...(asOptionalString(ownerSource.email) ? { email: asOptionalString(ownerSource.email) } : {}),
            ...(asOptionalString(ownerSource.mobile) ? { mobile: asOptionalString(ownerSource.mobile) } : {}),
        }
        : undefined;

    return {
        ownerId,
        ownerName: ownerName || undefined,
        ownerRef,
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
        serialized.phone = mobile;
        serialized.contactNumber = mobile;
    }

    serialized.businessName = asOptionalString(serialized.businessName) || asOptionalString(serialized.name);
    serialized.businessType =
        asOptionalString(serialized.businessType) ||
        (Array.isArray(serialized.businessTypes) && typeof serialized.businessTypes[0] === 'string'
            ? serialized.businessTypes[0]
            : undefined);
    serialized.isVerified = Boolean(serialized.isVerified ?? serialized.verified);
    serialized.verified = Boolean(serialized.isVerified);
    serialized.location = normalizeBusinessLocation(serialized.location, serialized.locationId);

    const { ownerId, ownerName, ownerRef } = deriveOwnerAliases(serialized);
    if (ownerId) {
        serialized.userId = ownerId;
        serialized.ownerId = ownerId;
    }
    if (ownerName) {
        serialized.ownerName = ownerName;
    }
    if (ownerRef) {
        serialized.sellerId = ownerRef;
    } else if (ownerId) {
        serialized.sellerId = ownerId;
    }

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
