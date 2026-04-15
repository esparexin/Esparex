import logger from '../../utils/logger';
import { AppError } from '../../utils/AppError';
import { processImages } from '../../utils/imageProcessor';
import { deleteFromS3Url, sanitizeStoredImageUrls } from '../../utils/s3';
import { normalizeLocation } from '../location/LocationNormalizer';
import { toGeoPoint } from '../../../../shared/utils/geoUtils';
import { IBusinessDocument } from '../../models/Business';
import { type IdProofTypeValue } from '../../../../shared/enums/idProofType';

export const DEFAULT_BUSINESS_TYPES = ['Repair services', 'Spare parts'] as const;
export const ADDRESS_PINCODE_PATTERN = /\b\d{6}\b/;

export type BusinessDocumentInput = {
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    expiryDate?: string | Date;
    version?: number;
    idProofType?: IdProofTypeValue;
};

export type BusinessDocuments = BusinessDocumentInput[] | {
    idProof?: string[];
    idProofType?: string;
    businessProof?: string[];
    certificates?: string[];
};

export type BusinessLocationInput = {
    [key: string]: unknown;
    locationId?: unknown;
    city?: string;
    state?: string;
    country?: string;
    display?: string;
    coordinates?: unknown;
    address?: string;
    pincode?: string;
    shopNo?: string;
    street?: string;
    landmark?: string;
};

export type BusinessPayload = {
    [key: string]: unknown;
    mobile?: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
    registrationNumber?: string;
    images?: unknown;
    documents?: BusinessDocuments;
    location?: BusinessLocationInput;
};

export type BusinessDocView = {
    _id?: unknown;
    userId?: unknown;
    name?: string;
    mobile?: string;
    businessTypes?: string[];
    images?: unknown;
    locationId?: unknown;
    documents?: IBusinessDocument[];
    location?: {
        address?: string;
        display?: string;
        shopNo?: string;
        street?: string;
        landmark?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
        coordinates?: unknown;
    };
};

export const asBusinessDocView = (value: unknown): BusinessDocView =>
    (value as BusinessDocView) || {};

export const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : [];

export const toImageUrls = (value: Array<{ url: string; hash: string }>): string[] =>
    sanitizeStoredImageUrls(value.map((item) => item.url));

export const asOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

export const extractPincodeFromAddress = (value: unknown): string | undefined => {
    const address = asOptionalString(value);
    if (!address) return undefined;
    return address.match(ADDRESS_PINCODE_PATTERN)?.[0];
};

export const joinLocationParts = (...parts: unknown[]): string | undefined => {
    const normalizedParts = parts
        .map((part) => asOptionalString(part))
        .filter((part): part is string => Boolean(part));

    return normalizedParts.length > 0 ? normalizedParts.join(', ') : undefined;
};

export type ResolvedBusinessLocation = Awaited<ReturnType<typeof normalizeLocation>>;

export const buildBusinessLocationPayload = ({
    currentLocation,
    incomingLocation,
    normalizedLocation,
    fallbackLocationId,
}: {
    currentLocation?: BusinessDocView['location'];
    incomingLocation: BusinessLocationInput;
    normalizedLocation: ResolvedBusinessLocation;
    fallbackLocationId?: unknown;
}) => {
    const incomingAddress = asOptionalString(incomingLocation.address);
    const resolvedShopNo = asOptionalString(incomingLocation.shopNo) ?? currentLocation?.shopNo;
    const resolvedStreet = asOptionalString(incomingLocation.street) ?? currentLocation?.street;
    const resolvedLandmark = asOptionalString(incomingLocation.landmark) ?? currentLocation?.landmark;
    const resolvedCity = asOptionalString(incomingLocation.city) || normalizedLocation?.city || currentLocation?.city;
    const resolvedState = asOptionalString(incomingLocation.state) || normalizedLocation?.state || currentLocation?.state;
    const resolvedCountry = asOptionalString(incomingLocation.country) || normalizedLocation?.country || currentLocation?.country;
    const resolvedPincode =
        asOptionalString(incomingLocation.pincode)
        || normalizedLocation?.pincode
        || extractPincodeFromAddress(incomingAddress)
        || currentLocation?.pincode;

    const computedAddress =
        joinLocationParts(resolvedShopNo, resolvedStreet, resolvedLandmark, resolvedCity, resolvedState, resolvedPincode)
        || joinLocationParts(resolvedCity, resolvedState, resolvedPincode);

    const resolvedAddress =
        incomingAddress
        || currentLocation?.address
        || computedAddress
        || 'Location TBD';

    const resolvedDisplay =
        asOptionalString(incomingLocation.display)
        || normalizedLocation?.display
        || currentLocation?.display
        || joinLocationParts(resolvedCity, resolvedState)
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
            coordinates:
                toGeoPoint(incomingLocation.coordinates)
                || toGeoPoint(normalizedLocation?.coordinates)
                || currentLocation?.coordinates
        }
    };
};

export const cleanupRemovedS3Objects = async (previous: unknown, next: unknown) => {
    const previousUrls = Array.isArray(previous)
        ? previous
            .map(p => typeof p === 'string' ? p : (p as { url?: string }).url)
            .filter((url): url is string => typeof url === 'string' && url.length > 0)
        : [];
    const nextUrls = new Set(
        Array.isArray(next)
            ? next
                .map(n => typeof n === 'string' ? n : (n as { url?: string }).url)
                .filter((url): url is string => typeof url === 'string' && url.length > 0)
            : []
    );
    const removed = previousUrls.filter((url) => !nextUrls.has(url));

    if (removed.length === 0) return;

    await Promise.all(
        removed.map(async (url) => {
            try {
                await deleteFromS3Url(url);
            } catch (cleanupError) {
                logger.warn('[Business Media Cleanup] Failed to delete old object', {
                    url,
                    error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
                });
            }
        })
    );
};

export const normalizeDocuments = async (
    input: BusinessDocuments | undefined,
    businessId: string,
    existingDocs: IBusinessDocument[] = []
): Promise<IBusinessDocument[]> => {
    if (!input) return existingDocs;

    if (Array.isArray(input)) {
        return input.map(doc => ({
            ...doc,
            uploadedAt: new Date(),
            expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
            version: doc.version || 1
        })) as IBusinessDocument[];
    }

    const idProofType =
        typeof input.idProofType === 'string' && input.idProofType.trim().length > 0
            ? (input.idProofType.trim() as IdProofTypeValue)
            : undefined;

    const newDocs: IBusinessDocument[] = existingDocs.map((doc) => ({
        ...doc,
        ...(doc.type === 'id_proof' && idProofType ? { idProofType } : {})
    }));

    const upload = async (urls: string[] | undefined, type: IBusinessDocument['type']) => {
        if (!urls || urls.length === 0) return;
        const processed = toImageUrls(await processImages(toStringArray(urls), `businesses/${businessId}`));
        if (processed.length === 0) {
            throw new AppError(`Failed to upload ${type.replace(/_/g, ' ')}. Please retry.`, 502);
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

export const getUniquenessConditions = (data: BusinessPayload) => {
    const conditions: Array<Record<string, string>> = [];
    const normalizedMobile = String(data.mobile || data.phone || '').trim();
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const normalizedGst = String(data.gstNumber || '').trim().toUpperCase();
    const normalizedRegistration = String(data.registrationNumber || '').trim().toUpperCase();

    if (normalizedMobile) conditions.push({ mobile: normalizedMobile });
    if (normalizedEmail) conditions.push({ email: normalizedEmail });
    if (normalizedGst) conditions.push({ gstNumber: normalizedGst });
    if (normalizedRegistration) conditions.push({ registrationNumber: normalizedRegistration });

    return {
        conditions,
        normalizedMobile,
        normalizedEmail,
        normalizedGst,
        normalizedRegistration
    };
};
