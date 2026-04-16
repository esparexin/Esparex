import mongoose from 'mongoose';
import Business from '../../models/Business';
import User from '../../models/User';
import Ad from '../../models/Ad';
import { normalizeAdImagesForResponse } from '../adQuery/AdQueryHelpers';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { AppError } from '../../utils/AppError';
import { getUserConnection } from '../../config/db';
import logger from '../../utils/logger';
import { normalizeLocation } from '../location/LocationNormalizer';
import { BUSINESS_STATUS } from '../../../../shared/enums/businessStatus';
import { processImages } from '../../utils/imageProcessor';

import {
    asBusinessDocView,
    getUniquenessConditions,
    toStringArray,
    toImageUrls,
    normalizeDocuments,
    buildBusinessLocationPayload,
    BusinessPayload,
    BusinessLocationInput,
    DEFAULT_BUSINESS_TYPES,
    cleanupRemovedS3Objects
} from './BusinessUtils';

export const registerBusiness = async (data: BusinessPayload, userId: string) => {
    let business = await Business.findOne({ userId });
    const businessView = asBusinessDocView(business);

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
        locationId: incomingLocation.locationId,
        city: incomingLocation.city,
        state: incomingLocation.state,
        country: incomingLocation.country,
        display: incomingLocation.display,
        coordinates: incomingLocation.coordinates,
        address: incomingLocation.address,
        pincode: incomingLocation.pincode
    }, {
        requireLocationId: false,
        defaultCountry: 'India',
    });

    const allowed = [
        'name', 'description', 'businessTypes',
        'email', 'website', 'gstNumber', 'registrationNumber',
        'workingHours', 'branding'
    ];
    const safePayload: Record<string, unknown> = { userId };
    allowed.forEach(k => { if (data[k] !== undefined) safePayload[k] = data[k]; });

    safePayload.mobile = data.mobile || data.phone || businessView.mobile;
    if (normalizedEmail) safePayload.email = normalizedEmail;
    if (normalizedGst) safePayload.gstNumber = normalizedGst;
    if (normalizedRegistration) safePayload.registrationNumber = normalizedRegistration;
    
    if (!Array.isArray(safePayload.businessTypes) || safePayload.businessTypes.length === 0) {
        safePayload.businessTypes =
            Array.isArray(businessView.businessTypes) && businessView.businessTypes.length > 0
                ? businessView.businessTypes
                : [...DEFAULT_BUSINESS_TYPES];
    }

    safePayload.images = resolvedShopImages;
    safePayload.documents = documents;

    const resolvedLocationPayload = buildBusinessLocationPayload({
        currentLocation: businessView.location,
        incomingLocation,
        normalizedLocation,
        fallbackLocationId: businessView.locationId,
    });

    safePayload.locationId = resolvedLocationPayload.locationId;
    safePayload.location = resolvedLocationPayload.location;
    safePayload.status = BUSINESS_STATUS.PENDING;
    safePayload.isVerified = false;
    safePayload.isDeleted = false;

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

    await User.findByIdAndUpdate(userId, { businessId: business?._id });
    return business;
};

export const getBusinessByUserId = async (userId: string) => {
    return await Business.findOne({ userId, isDeleted: false });
};

export const getBusinessById = async (id: string) => {
    return await Business.findById(id);
};

export const updateBusinessById = async (id: string, data: BusinessPayload) => {
    const business = await Business.findById(id);
    if (!business) return null;
    const businessView = asBusinessDocView(business);

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

    const allowed = [
        'name', 'description', 'businessTypes',
        'email', 'website', 'gstNumber', 'registrationNumber',
        'workingHours', 'branding'
    ];
    const safeUpdate: Record<string, unknown> = {};
    allowed.forEach(k => { if (data[k] !== undefined) safeUpdate[k] = data[k]; });

    if (typeof data.email === 'string') safeUpdate.email = data.email.trim().toLowerCase();
    if (typeof data.gstNumber === 'string') safeUpdate.gstNumber = data.gstNumber.trim().toUpperCase();
    if (typeof data.registrationNumber === 'string') safeUpdate.registrationNumber = data.registrationNumber.trim().toUpperCase();

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

    if (data.mobile || data.phone) {
        safeUpdate.mobile = data.mobile || data.phone;
    }

    const criticalFields = ['name', 'mobile', 'phone', 'location', 'gstNumber', 'registrationNumber', 'documents'];
    const hasCriticalUpdates = criticalFields.some(f => data[f] !== undefined);

    if (hasCriticalUpdates) {
        safeUpdate.status = BUSINESS_STATUS.PENDING;
        safeUpdate.isVerified = false;
    }

    if (data.location) {
        const currentLoc = businessView.location || {};
        const normalizedLocation = await normalizeLocation({
            locationId: data.location.locationId || businessView.locationId,
            city: data.location.city || currentLoc.city,
            state: data.location.state || currentLoc.state,
            country: data.location.country || currentLoc.country || 'India',
            display: data.location.display || currentLoc.display,
            coordinates: data.location.coordinates,
            address: data.location.address,
            pincode: data.location.pincode || currentLoc.pincode
        }, {
            requireLocationId: false,
            defaultCountry: currentLoc.country || 'India',
        });
        const resolvedLocationPayload = buildBusinessLocationPayload({
            currentLocation: currentLoc,
            incomingLocation: data.location,
            normalizedLocation,
            fallbackLocationId: businessView.locationId,
        });

        safeUpdate.location = resolvedLocationPayload.location;
        if (resolvedLocationPayload.locationId) {
            safeUpdate.locationId = resolvedLocationPayload.locationId;
        }
    }

    const session = await getUserConnection().startSession();
    let updatedBusiness: Awaited<ReturnType<typeof Business.findByIdAndUpdate>> = null;
    try {
        await session.withTransaction(async () => {
            updatedBusiness = await Business.findByIdAndUpdate(id, safeUpdate, { new: true, session });
        });
    } finally {
        await session.endSession();
    }

    setImmediate(() => {
        const cleanupTasks: Promise<unknown>[] = [];
        if (safeUpdate.images) cleanupTasks.push(cleanupRemovedS3Objects(businessView.images, safeUpdate.images));
        if (safeUpdate.documents) cleanupTasks.push(cleanupRemovedS3Objects(businessView.documents, safeUpdate.documents));
        Promise.all(cleanupTasks).catch((err: unknown) => {
            logger.error('Business update: S3 cleanup failed', { error: String(err) });
        });
    });

    return updatedBusiness;
};

export const getBusinessListings = async (sellerId: string, listingType: string) => {
    const listings = await Ad.find({
        sellerId,
        listingType,
        status: AD_STATUS.LIVE,
        isDeleted: { $ne: true },
    }).sort({ createdAt: -1 }).lean();
    return listings.map((l) => normalizeAdImagesForResponse(l as unknown as Record<string, unknown>));
};

export const getBusinessStats = async (userId: string) => {
    const [totalServices, approvedServices, pendingServices] = await Promise.all([
        Ad.countDocuments({ sellerId: userId, listingType: 'service' }),
        Ad.countDocuments({ sellerId: userId, listingType: 'service', status: AD_STATUS.LIVE }),
        Ad.countDocuments({ sellerId: userId, listingType: 'service', status: AD_STATUS.PENDING }),
    ]);
    return { totalServices, approvedServices, pendingServices, views: 0 };
};

const NOT_DELETED = { isDeleted: { $ne: true } } as const;

export const findBusinessByIdentifier = async (identifier: string) => {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        return Business.findOne({ _id: identifier, ...NOT_DELETED });
    }

    const bySlug = await Business.findOne({ slug: identifier, ...NOT_DELETED });
    if (bySlug) return bySlug;

    const suffixMatch = identifier.match(/-([0-9a-fA-F]{24})$/);
    const extractedId = suffixMatch?.[1];
    if (extractedId && mongoose.Types.ObjectId.isValid(extractedId)) {
        return Business.findOne({ _id: extractedId, ...NOT_DELETED });
    }

    return null;
};

export const getBusinessByUserIdLean = async (userId: string) => {
    return Business.findOne({ userId }).lean();
};

export const softDeleteBusinessesByUserId = async (userId: string) => {
    return Business.updateMany(
        { userId, isDeleted: { $ne: true } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
    );
};
