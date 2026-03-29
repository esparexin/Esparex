import logger from '../utils/logger';
import { AppError } from '../utils/AppError';
import Business from '../models/Business';
import Ad from '../models/Ad';
import mongoose from 'mongoose';
import User from '../models/User';
import { getUserConnection } from '../config/db';

import { processImages } from '../utils/imageProcessor';
import { deleteFromS3Url, sanitizeStoredImageUrls } from '../utils/s3';
import { normalizeLocation, normalizeLocationResponse, toGeoPoint } from './LocationService';
import { serializeDoc } from '../utils/serialize';
import { publishedBusinessStatusQuery } from '../utils/businessStatus';
import { mutateStatus, mutateStatuses } from './StatusMutationService';
import { BUSINESS_STATUS } from '../../../shared/enums/businessStatus';
import { ACTOR_TYPE } from '../../../shared/enums/actor';
import { SERVICE_STATUS } from '../../../shared/enums/serviceStatus';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../shared/enums/listingType';

import { IBusinessDocument, IBusiness } from '../models/Business';

type BusinessDocumentInput = {
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    expiryDate?: string | Date;
    version?: number;
};

type BusinessDocuments = BusinessDocumentInput[] | {
    idProof?: string[];
    idProofType?: string;
    businessProof?: string[];
    certificates?: string[];
};

type BusinessLocationInput = {
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

type BusinessPayload = {
    [key: string]: unknown;

    mobile?: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
    registrationNumber?: string;
    images?: unknown;
    documents?: BusinessDocuments;
    location?: BusinessLocationInput;
    locationId?: unknown;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
};

type BusinessDocView = {
    _id?: unknown;
    userId?: unknown;
    name?: string;
    mobile?: string;
    images?: unknown;
    locationId?: unknown;
    documents?: IBusinessDocument[];
    location?: {
        address?: string;
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

const asBusinessDocView = (value: unknown): BusinessDocView =>
    (value as BusinessDocView) || {};

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : [];

const toImageUrls = (value: Array<{ url: string; hash: string }>): string[] =>
    sanitizeStoredImageUrls(value.map((item) => item.url));

const cleanupRemovedS3Objects = async (previous: unknown, next: unknown) => {
    const previousUrls = Array.isArray(previous)
        ? previous.map(p => typeof p === 'string' ? p : (p as any).url).filter(Boolean)
        : [];
    const nextUrls = new Set(
        Array.isArray(next)
            ? next.map(n => typeof n === 'string' ? n : (n as any).url).filter(Boolean)
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

const normalizeDocuments = async (
    input: BusinessDocuments | undefined,
    businessId: string,
    existingDocs: IBusinessDocument[] = []
): Promise<IBusinessDocument[]> => {
    if (!input) return existingDocs;

    if (Array.isArray(input)) {
        // Map to Date objects if needed
        return input.map(doc => ({
            ...doc,
            uploadedAt: new Date(),
            expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
            version: doc.version || 1
        })) as IBusinessDocument[];
    }

    // Handle old format
    const newDocs: IBusinessDocument[] = [...existingDocs];
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
                version: 1
            });
        });
    };

    await upload(input.idProof, 'id_proof');
    await upload(input.businessProof, 'business_proof');
    await upload(input.certificates, 'certificate');

    return newDocs;
};

const getUniquenessConditions = (data: BusinessPayload) => {
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

export const registerBusiness = async (data: BusinessPayload, userId: string) => {
    // 1. Check existing business for this user
    let business = await Business.findOne({ userId });
    const businessView = asBusinessDocView(business);



    // 4. Pre-registration uniqueness checks (for NEW accounts or updated sensitive fields)
    const { 
        conditions: uniquenessConditions, 
        normalizedMobile, 
        normalizedEmail, 
        normalizedGst, 
        normalizedRegistration 
    } = getUniquenessConditions(data);

    const existingChecks = uniquenessConditions.length > 0
        ? await Business.findOne({
            _id: { $ne: business?._id },
            $or: uniquenessConditions
        })
        : null;

    if (existingChecks) {
        let field = 'business details';
        if (existingChecks.mobile === normalizedMobile) field = 'Phone number';
        else if (existingChecks.email === normalizedEmail) field = 'Email';
        else if (existingChecks.gstNumber === normalizedGst) field = 'GST number';
        else if (existingChecks.registrationNumber === normalizedRegistration) field = 'Registration number';

        throw new AppError(`${field} is already registered with another business account.`, 409, 'BUSINESS_ALREADY_EXISTS');
    }

    // 5. Image & Doc Processing
    const bId = business?._id?.toString() || new mongoose.Types.ObjectId().toString();
    const shopImagesInput = toStringArray(data.images);
    const resolvedShopImages =
        shopImagesInput.length > 0
            ? toImageUrls(await processImages(shopImagesInput, `businesses/${bId}`))
            : toStringArray(businessView.images);
    if (shopImagesInput.length > 0 && resolvedShopImages.length === 0) {
        throw new AppError('Business image upload failed. Please retry.', 502);
    }

    const documents = await normalizeDocuments(data.documents, bId, businessView.documents);



    const incomingLocation: BusinessLocationInput =
        data.location && typeof data.location === 'object' ? data.location : {};
    const normalizedLocation = await normalizeLocation({
        locationId: incomingLocation.locationId || data.locationId,
        city: incomingLocation.city || data.city,
        state: incomingLocation.state || data.state,
        country: incomingLocation.country || data.country,
        display: incomingLocation.display || incomingLocation.address,
        coordinates: incomingLocation.coordinates,
        address: incomingLocation.address,
        pincode: incomingLocation.pincode || data.pincode
    });

    // 7. Surgical Field Extraction
    const allowed = [
        'name', 'description', 'businessTypes',
        'email', 'website', 'gstNumber', 'registrationNumber',
        'workingHours'
    ];
    const safePayload: Record<string, unknown> = { userId };
    allowed.forEach(k => { if (data[k] !== undefined) safePayload[k] = data[k]; });

    // Handle Phone/Mobile consolidation
    safePayload.mobile = data.mobile || data.phone || businessView.mobile;
    if (normalizedEmail) {
        safePayload.email = normalizedEmail;
    }
    if (normalizedGst) {
        safePayload.gstNumber = normalizedGst;
    }
    if (normalizedRegistration) {
        safePayload.registrationNumber = normalizedRegistration;
    }

    // 6. Image & Doc Processing
    safePayload.images = resolvedShopImages;
    safePayload.documents = documents;

    // 7. Taxonomy & Location IDs
    safePayload.locationId = normalizedLocation?.locationId || businessView.locationId;
    const computedAddress = `${incomingLocation.shopNo || ''} ${incomingLocation.street || ''} ${normalizedLocation?.city || incomingLocation.city || ''}`.trim();
    
    safePayload.location = {
        address: incomingLocation.address || computedAddress || `${normalizedLocation?.city || incomingLocation.city || 'N/A'}, ${normalizedLocation?.state || incomingLocation.state || 'N/A'}` || businessView.location?.address || 'Location TBD',
        shopNo: incomingLocation.shopNo ?? businessView.location?.shopNo,
        street: incomingLocation.street ?? businessView.location?.street,
        landmark: incomingLocation.landmark ?? businessView.location?.landmark,
        city: normalizedLocation?.city || incomingLocation.city || businessView.location?.city,
        state: normalizedLocation?.state || incomingLocation.state || businessView.location?.state,
        pincode: normalizedLocation?.pincode || incomingLocation.pincode || businessView.location?.pincode,
        coordinates:
            toGeoPoint(normalizedLocation?.coordinates) ||
            businessView.location?.coordinates
    };

    safePayload.status = BUSINESS_STATUS.PENDING;
    safePayload.isVerified = false;
    safePayload.isDeleted = false;  // Ensure re-registration always un-deletes the record

    if (business) {
        await Promise.all([
            cleanupRemovedS3Objects(businessView.images, resolvedShopImages),
            cleanupRemovedS3Objects(businessView.documents, documents),
        ]);
    }

    if (business) {
        business = await Business.findByIdAndUpdate(business._id, safePayload, { new: true });
    } else {
        business = await Business.create(safePayload);
    }

    // 7. Sync User (Reference ONLY)
    await User.findByIdAndUpdate(userId, {
        businessId: business?._id
    });

    return business;
};

export const getBusinessByUserId = async (userId: string) => {
    return await Business.findOne({ userId });
};

// countBusinessesByUserId removed as it was unused

export const getBusinessById = async (id: string) => {
    return await Business.findById(id);
};

export const updateBusinessById = async (id: string, data: BusinessPayload) => {
    const business = await Business.findById(id);
    if (!business) return null;
    const businessView = asBusinessDocView(business);

    // 1. Pre-update uniqueness checks
    const { 
        conditions: uniquenessConditions, 
        normalizedMobile, 
        normalizedEmail, 
        normalizedGst, 
        normalizedRegistration 
    } = getUniquenessConditions(data);

    if (uniquenessConditions.length > 0) {
        const existingChecks = await Business.findOne({
            _id: { $ne: business._id },
            $or: uniquenessConditions
        });

        if (existingChecks) {
            let field = 'business details';
            if (existingChecks.mobile === normalizedMobile) field = 'Phone number';
            else if (existingChecks.email === normalizedEmail) field = 'Email';
            else if (existingChecks.gstNumber === normalizedGst) field = 'GST number';
            else if (existingChecks.registrationNumber === normalizedRegistration) field = 'Registration number';

            throw new AppError(`${field} is already registered with another business account.`, 409, 'BUSINESS_ALREADY_EXISTS');
        }
    }

    const flatLocationFields = ['address', 'shopNo', 'street', 'landmark', 'city', 'state', 'pincode', 'coordinates'];
    if (!data.location) {
        const flatLocation: Record<string, unknown> = {};
        for (const field of flatLocationFields) {
            if (data[field] !== undefined) {
                flatLocation[field] = data[field];
            }
        }
        if (Object.keys(flatLocation).length > 0) {
            data.location = flatLocation;
        }
    }

    // Surgical update payload
    const allowed = [
        'name', 'description', 'businessTypes',
        'email', 'website', 'gstNumber', 'registrationNumber',
        'workingHours'
    ];
    const safeUpdate: Record<string, unknown> = {};
    allowed.forEach(k => { if (data[k] !== undefined) safeUpdate[k] = data[k]; });

    if (typeof data.email === 'string') {
        safeUpdate.email = data.email.trim().toLowerCase();
    }
    if (typeof data.gstNumber === 'string') {
        safeUpdate.gstNumber = data.gstNumber.trim().toUpperCase();
    }
    if (typeof data.registrationNumber === 'string') {
        safeUpdate.registrationNumber = data.registrationNumber.trim().toUpperCase();
    }

    if (data.images !== undefined) {
        const incomingImages = toStringArray(data.images);
        safeUpdate.images = toImageUrls(await processImages(incomingImages, `businesses/${id}`));
        if (incomingImages.length > 0 && (!Array.isArray(safeUpdate.images) || safeUpdate.images.length === 0)) {
            throw new AppError('Business image upload failed. Please retry.', 502);
        }
    }

    if (data.documents !== undefined) {
        safeUpdate.documents = await normalizeDocuments(data.documents, id, businessView.documents);
    }

    // Handle Phone/Mobile consolidation
    if (data.mobile || data.phone) {
        safeUpdate.mobile = data.mobile || data.phone;
    }

    const criticalFields = ['name', 'mobile', 'phone', 'location', 'gstNumber', 'registrationNumber', 'documents'];
    const hasCriticalUpdates = criticalFields.some(f => data[f] !== undefined);

    if (hasCriticalUpdates) {
        safeUpdate.status = BUSINESS_STATUS.PENDING;
        safeUpdate.isVerified = false;
    }

    // Process nested location update if present (using data.location built from flat fields above)
    if (data.location) {
        const currentLoc = businessView.location || {};
        const normalizedLocation = await normalizeLocation({
            locationId: data.location.locationId || data.locationId || businessView.locationId,
            city: data.location.city || currentLoc.city,
            state: data.location.state || currentLoc.state,
            country: data.location.country || currentLoc.country || 'Unknown',
            display: data.location.display || data.location.address,
            coordinates: data.location.coordinates,
            address: data.location.address,
            pincode: data.location.pincode || currentLoc.pincode
        });
        const computedAddress = `${data.location.shopNo || currentLoc.shopNo || ''} ${data.location.street || currentLoc.street || ''} ${normalizedLocation?.city || data.location.city || currentLoc.city || ''}`.trim();

        safeUpdate.location = {
            ...currentLoc,
            address: data.location.address || computedAddress,
            shopNo: data.location.shopNo ?? currentLoc.shopNo,
            street: data.location.street ?? currentLoc.street,
            landmark: data.location.landmark ?? currentLoc.landmark,
            city: normalizedLocation?.city || data.location.city || currentLoc.city,
            state: normalizedLocation?.state || data.location.state || currentLoc.state,
            pincode: normalizedLocation?.pincode || data.location.pincode || currentLoc.pincode,
            coordinates: toGeoPoint(normalizedLocation?.coordinates) || currentLoc.coordinates
        };
        if (normalizedLocation?.locationId) {
            safeUpdate.locationId = normalizedLocation.locationId;
        }
    }

    // Wrap the two Mongoose writes in a transaction so Business + User stay consistent.
    const session = await getUserConnection().startSession();
    let updatedBusiness: Awaited<ReturnType<typeof Business.findByIdAndUpdate>> = null;
    try {
        await session.withTransaction(async () => {
            updatedBusiness = await Business.findByIdAndUpdate(id, safeUpdate, { new: true, session });
            // No status sync to User — Business is SSOT
        });
    } finally {
        await session.endSession();
    }

    // S3 cleanup runs post-commit (best-effort — not critical path)
    setImmediate(() => {
        const cleanupTasks: Promise<unknown>[] = [];

        if (safeUpdate.images) {
            cleanupTasks.push(cleanupRemovedS3Objects(businessView.images, safeUpdate.images));
        }

        if (safeUpdate.documents) {
            cleanupTasks.push(cleanupRemovedS3Objects(businessView.documents, safeUpdate.documents));
        }

        Promise.all(cleanupTasks).catch((err: unknown) => {
            logger.error('Business update: S3 cleanup failed', { error: String(err) });
        });
    });

    return updatedBusiness;
};
export const getBusinesses = async (filters: Record<string, unknown>) => {
    const normalizedCity = typeof filters.city === 'string' ? filters.city.trim() : '';
    const normalizedCategory = typeof filters.category === 'string' ? filters.category.trim() : '';
    const normalizedLocationId =
        typeof filters.locationId === 'string' && mongoose.Types.ObjectId.isValid(filters.locationId)
            ? new mongoose.Types.ObjectId(filters.locationId)
            : null;
    const normalizedListingCategoryId =
        typeof filters.listingCategoryId === 'string' && mongoose.Types.ObjectId.isValid(filters.listingCategoryId)
            ? new mongoose.Types.ObjectId(filters.listingCategoryId)
            : null;
    const normalizedBrandId =
        typeof filters.brandId === 'string' && mongoose.Types.ObjectId.isValid(filters.brandId)
            ? new mongoose.Types.ObjectId(filters.brandId)
            : null;
    const excludedBusinessId =
        typeof filters.excludeBusinessId === 'string' && mongoose.Types.ObjectId.isValid(filters.excludeBusinessId)
            ? new mongoose.Types.ObjectId(filters.excludeBusinessId)
            : null;
    const latitude = typeof filters.latitude === 'number' ? filters.latitude : Number(filters.latitude);
    const longitude = typeof filters.longitude === 'number' ? filters.longitude : Number(filters.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const radiusKmRaw = typeof filters.radiusKm === 'number' ? filters.radiusKm : Number(filters.radiusKm);
    const radiusKm = Number.isFinite(radiusKmRaw) ? Math.min(Math.max(radiusKmRaw, 1), 100) : 35;
    const serviceOnly =
        filters.serviceOnly === true ||
        filters.serviceOnly === 'true' ||
        Boolean(normalizedListingCategoryId);
    const query: Record<string, unknown> = {
        status: publishedBusinessStatusQuery,
        isDeleted: { $ne: true }  // always exclude soft-deleted businesses from public list
    };

    if (excludedBusinessId) {
        query._id = { $ne: excludedBusinessId };
    }

    if (normalizedLocationId && !hasCoordinates) {
        query.locationId = normalizedLocationId;
    } else if (normalizedCity && !hasCoordinates) {
        query['location.city'] = normalizedCity;
    }

    if (normalizedCategory) {
        query.businessTypes = normalizedCategory;
    }

    const parsedLimit = typeof filters.limit === 'number' ? filters.limit : Number(filters.limit || 20);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;
    const candidateLimit = Math.min(Math.max(safeLimit * 5, safeLimit), 60);

    let candidates: Array<Record<string, any>> = [];

    if (hasCoordinates) {
        candidates = await Business.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    distanceField: 'distanceMeters',
                    spherical: true,
                    maxDistance: radiusKm * 1000,
                    query,
                    key: 'location.coordinates'
                }
            },
            { $limit: candidateLimit }
        ]);
    } else {
        let finder = Business.find(query)
            .limit(candidateLimit)
            .sort({ createdAt: -1 });

        if (normalizedCity) {
            finder = finder.collation({ locale: 'en', strength: 2 });
        }

        candidates = await finder.lean();
    }

    if (candidates.length === 0) {
        return [];
    }

    const candidateIds = candidates
        .map((business) => business._id)
        .filter((value): value is mongoose.Types.ObjectId => value instanceof mongoose.Types.ObjectId);

    const baseServiceMatch: Record<string, unknown> = {
        businessId: { $in: candidateIds },
        listingType: LISTING_TYPE.SERVICE,
        status: AD_STATUS.LIVE,
        isDeleted: { $ne: true }
    };

    const matchingServiceMatch: Record<string, unknown> = { ...baseServiceMatch };
    if (normalizedListingCategoryId) {
        matchingServiceMatch.categoryId = normalizedListingCategoryId;
    }
    const brandMatchedServiceMatch: Record<string, unknown> =
        normalizedBrandId && normalizedListingCategoryId
            ? {
                ...baseServiceMatch,
                categoryId: normalizedListingCategoryId,
                brandId: normalizedBrandId
            }
            : {};

    const [activeServiceCounts, matchingServiceCounts, brandMatchedServiceCounts] = await Promise.all([
        Ad.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
            { $match: baseServiceMatch },
            { $group: { _id: '$businessId', count: { $sum: 1 } } }
        ]),
        normalizedListingCategoryId || normalizedBrandId || serviceOnly
            ? Ad.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
                { $match: matchingServiceMatch },
                { $group: { _id: '$businessId', count: { $sum: 1 } } }
            ])
            : Promise.resolve([]),
        normalizedBrandId && normalizedListingCategoryId
            ? Ad.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
                { $match: brandMatchedServiceMatch },
                { $group: { _id: '$businessId', count: { $sum: 1 } } }
            ])
            : Promise.resolve([])
    ]);

    const activeServiceCountMap = new Map(
        activeServiceCounts.map((entry) => [String(entry._id), entry.count])
    );
    const matchingServiceCountMap = new Map(
        matchingServiceCounts.map((entry) => [String(entry._id), entry.count])
    );
    const brandMatchedServiceCountMap = new Map(
        brandMatchedServiceCounts.map((entry) => [String(entry._id), entry.count])
    );

    const filteredCandidates = candidates.filter((candidate) => {
        const businessId = String(candidate._id);
        const activeServicesCount = activeServiceCountMap.get(businessId) || 0;
        const matchingServicesCount = matchingServiceCountMap.get(businessId) || 0;

        if (!serviceOnly) {
            return true;
        }

        if (normalizedListingCategoryId || normalizedBrandId) {
            return matchingServicesCount > 0;
        }

        return activeServicesCount > 0;
    });

    const enriched = (filteredCandidates
        .map((biz) => {
            const serialized = serializeDoc(biz) as Record<string, any>;
            if (serialized.location) {
                serialized.location = normalizeLocationResponse(serialized.location);
            }

            const businessId = String(serialized._id || serialized.id);
            const activeServicesCount = activeServiceCountMap.get(businessId) || 0;
            const matchingServicesCount = matchingServiceCountMap.get(businessId) || 0;
            const brandMatchedServicesCount = brandMatchedServiceCountMap.get(businessId) || 0;
            const distanceKm =
                typeof biz.distanceMeters === 'number'
                    ? Number((biz.distanceMeters / 1000).toFixed(1))
                    : undefined;

            return {
                ...serialized,
                activeServicesCount,
                matchingServicesCount,
                brandMatchedServicesCount,
                ...(typeof distanceKm === 'number' ? { distanceKm } : {})
            };
        }) as Array<Record<string, any>>)
        .sort((left, right) => {
            const brandMatchedDiff = (right.brandMatchedServicesCount || 0) - (left.brandMatchedServicesCount || 0);
            if (brandMatchedDiff !== 0) return brandMatchedDiff;

            const matchingDiff = (right.matchingServicesCount || 0) - (left.matchingServicesCount || 0);
            if (matchingDiff !== 0) return matchingDiff;

            const activeDiff = (right.activeServicesCount || 0) - (left.activeServicesCount || 0);
            if (activeDiff !== 0) return activeDiff;

            const leftDistance = typeof left.distanceKm === 'number' ? left.distanceKm : Number.POSITIVE_INFINITY;
            const rightDistance = typeof right.distanceKm === 'number' ? right.distanceKm : Number.POSITIVE_INFINITY;
            if (leftDistance !== rightDistance) return leftDistance - rightDistance;

            const verifiedDiff = Number(Boolean(right.isVerified)) - Number(Boolean(left.isVerified));
            if (verifiedDiff !== 0) return verifiedDiff;

            const trustDiff = Number(right.trustScore || 0) - Number(left.trustScore || 0);
            if (trustDiff !== 0) return trustDiff;

            return new Date(String(right.createdAt || 0)).getTime() - new Date(String(left.createdAt || 0)).getTime();
        });

    return enriched.slice(0, safeLimit);
};

export const getBusinessStats = async (id: string) => { return {}; };
export const getBusinessServices = async (id: string) => { return []; };

export const approveBusiness = async (id: string, moderatorId: string = 'SYSTEM') => {
    // Idempotency guard: skip mutateStatus if already live to avoid live→live transition error
    const existing = await Business.findById(id).lean();
    if (!existing) return null;
    if (existing.status === BUSINESS_STATUS.LIVE) {
        await User.findByIdAndUpdate(existing.userId, { role: 'business' });
        return existing;
    }

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year approx

    const isSystem = moderatorId === 'SYSTEM' || !mongoose.Types.ObjectId.isValid(moderatorId);

    const business = await mutateStatus({
        domain: 'business',
        entityId: id,
        toStatus: BUSINESS_STATUS.LIVE,
        actor: {
            type: isSystem ? ACTOR_TYPE.SYSTEM : ACTOR_TYPE.ADMIN,
            id: isSystem ? undefined : moderatorId
        },
        reason: 'Business profile approval',
        patch: {
            approvedAt: new Date(),
            expiresAt,
            isVerified: true
        }
    });

    if (!business) return null;

    await User.findByIdAndUpdate(business.userId, {
        role: 'business'
    });

    return business;
};

export const rejectBusiness = async (id: string, reason: string, moderatorId: string = 'SYSTEM') => {
    // Capture userId before mutation for post-reject user sync
    const existing = await Business.findById(id).select('userId').lean();

    const isSystem = moderatorId === 'SYSTEM' || !mongoose.Types.ObjectId.isValid(moderatorId);

    const business = await mutateStatus({
        domain: 'business',
        entityId: id,
        toStatus: BUSINESS_STATUS.REJECTED,
        actor: {
            type: isSystem ? ACTOR_TYPE.SYSTEM : ACTOR_TYPE.ADMIN,
            id: isSystem ? undefined : moderatorId
        },
        reason,
        patch: {
            rejectionReason: reason,
            isVerified: false
        }
    });

    // Revoke the business role — rejected owners revert to regular users
    if (existing?.userId) {
        await User.findByIdAndUpdate(existing.userId, { role: 'user' });
    }

    return business;
};

/**
 * Withdraw/cancel a pending business application.
 * Only allowed when status is 'pending'.
 */
export const withdrawBusiness = async (userId: string) => {
    const business = await Business.findOne({ userId, status: BUSINESS_STATUS.PENDING });
    if (!business) return null;

    // Soft delete the business
    await business.softDelete();

    // Reset user's business reference
    await User.findByIdAndUpdate(userId, {
        $unset: { businessId: 1 }
    });

    return business;
};

/**
 * Admin soft-delete a business (any status).
 * Cascades to expire all services and parts.
 */
export const softDeleteBusiness = async (id: string) => {
    const business = await Business.findById(id);
    if (!business) return null;

    // Soft delete the business
    await business.softDelete();

    // Reset user's role and business reference
    await User.findByIdAndUpdate(business.userId, {
        $unset: { businessId: 1 },
        role: 'user'
    });

    return business;
};
