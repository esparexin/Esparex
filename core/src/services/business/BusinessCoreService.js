"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteBusinessesByUserId = exports.getBusinessByUserIdLean = exports.findBusinessByIdentifier = exports.getBusinessStats = exports.getBusinessListings = exports.updateBusinessById = exports.getBusinessById = exports.getBusinessByUserId = exports.registerBusiness = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Business_1 = __importDefault(require("@core/models/Business"));
const User_1 = __importDefault(require("@core/models/User"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const AdQueryHelpers_1 = require("@core/services/adQuery/AdQueryHelpers");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const AppError_1 = require("@core/utils/AppError");
const db_1 = require("@core/config/db");
const logger_1 = __importDefault(require("@core/utils/logger"));
const LocationNormalizer_1 = require("@core/services/location/LocationNormalizer");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
const imageProcessor_1 = require("@core/utils/imageProcessor");
const BusinessUtils_1 = require("./BusinessUtils");
const registerBusiness = async (data, userId) => {
    let business = await Business_1.default.findOne({ userId });
    const businessView = (0, BusinessUtils_1.asBusinessDocView)(business);
    const { conditions: uniquenessConditions, normalizedMobile, normalizedEmail, normalizedGst, normalizedRegistration } = (0, BusinessUtils_1.getUniquenessConditions)(data);
    const existingChecks = uniquenessConditions.length > 0
        ? await Business_1.default.findOne({
            _id: { $ne: business?._id },
            $or: uniquenessConditions
        })
        : null;
    if (existingChecks) {
        let field = 'business details';
        if (existingChecks.mobile === normalizedMobile)
            field = 'Phone number';
        else if (existingChecks.email === normalizedEmail)
            field = 'Email';
        else if (existingChecks.gstNumber === normalizedGst)
            field = 'GST number';
        else if (existingChecks.registrationNumber === normalizedRegistration)
            field = 'Registration number';
        throw new AppError_1.AppError(`${field} is already registered with another business account.`, 409, 'BUSINESS_ALREADY_EXISTS');
    }
    const bId = business?._id?.toString() || new mongoose_1.default.Types.ObjectId().toString();
    const shopImagesInput = (0, BusinessUtils_1.toStringArray)(data.images);
    const resolvedShopImages = shopImagesInput.length > 0
        ? (0, BusinessUtils_1.toImageUrls)(await (0, imageProcessor_1.processImages)(shopImagesInput, `businesses/${bId}`))
        : (0, BusinessUtils_1.toStringArray)(businessView.images);
    if (shopImagesInput.length > 0 && resolvedShopImages.length === 0) {
        throw new AppError_1.AppError('Business image upload failed. Please retry.', 502);
    }
    const documents = await (0, BusinessUtils_1.normalizeDocuments)(data.documents, bId, businessView.documents);
    const incomingLocation = data.location && typeof data.location === 'object' ? data.location : {};
    const normalizedLocation = await (0, LocationNormalizer_1.normalizeLocation)({
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
    const safePayload = { userId };
    allowed.forEach(k => { if (data[k] !== undefined)
        safePayload[k] = data[k]; });
    safePayload.mobile = data.mobile || businessView.mobile;
    if (normalizedEmail)
        safePayload.email = normalizedEmail;
    if (normalizedGst)
        safePayload.gstNumber = normalizedGst;
    if (normalizedRegistration)
        safePayload.registrationNumber = normalizedRegistration;
    if (!Array.isArray(safePayload.businessTypes) || safePayload.businessTypes.length === 0) {
        safePayload.businessTypes =
            Array.isArray(businessView.businessTypes) && businessView.businessTypes.length > 0
                ? businessView.businessTypes
                : [...BusinessUtils_1.DEFAULT_BUSINESS_TYPES];
    }
    safePayload.images = resolvedShopImages;
    safePayload.documents = documents;
    const resolvedLocationPayload = (0, BusinessUtils_1.buildBusinessLocationPayload)({
        currentLocation: businessView.location,
        incomingLocation,
        normalizedLocation,
        fallbackLocationId: businessView.locationId,
    });
    safePayload.locationId = resolvedLocationPayload.locationId;
    safePayload.location = resolvedLocationPayload.location;
    safePayload.status = businessStatus_1.BUSINESS_STATUS.PENDING;
    safePayload.isVerified = false;
    safePayload.isDeleted = false;
    if (business) {
        await Promise.all([
            (0, BusinessUtils_1.cleanupRemovedS3Objects)(businessView.images, resolvedShopImages),
            (0, BusinessUtils_1.cleanupRemovedS3Objects)(businessView.documents, documents),
        ]);
    }
    if (business) {
        business = await Business_1.default.findByIdAndUpdate(business._id, safePayload, { new: true });
    }
    else {
        business = await Business_1.default.create(safePayload);
    }
    await User_1.default.findByIdAndUpdate(userId, { businessId: business?._id });
    return business;
};
exports.registerBusiness = registerBusiness;
const getBusinessByUserId = async (userId) => {
    return await Business_1.default.findOne({ userId, isDeleted: false });
};
exports.getBusinessByUserId = getBusinessByUserId;
const getBusinessById = async (id) => {
    return await Business_1.default.findById(id);
};
exports.getBusinessById = getBusinessById;
const updateBusinessById = async (id, data) => {
    const business = await Business_1.default.findById(id);
    if (!business)
        return null;
    const businessView = (0, BusinessUtils_1.asBusinessDocView)(business);
    const { conditions: uniquenessConditions, normalizedMobile, normalizedEmail, normalizedGst, normalizedRegistration } = (0, BusinessUtils_1.getUniquenessConditions)(data);
    if (uniquenessConditions.length > 0) {
        const existingChecks = await Business_1.default.findOne({
            _id: { $ne: business._id },
            $or: uniquenessConditions
        });
        if (existingChecks) {
            let field = 'business details';
            if (existingChecks.mobile === normalizedMobile)
                field = 'Phone number';
            else if (existingChecks.email === normalizedEmail)
                field = 'Email';
            else if (existingChecks.gstNumber === normalizedGst)
                field = 'GST number';
            else if (existingChecks.registrationNumber === normalizedRegistration)
                field = 'Registration number';
            throw new AppError_1.AppError(`${field} is already registered with another business account.`, 409, 'BUSINESS_ALREADY_EXISTS');
        }
    }
    const allowed = [
        'name', 'description', 'businessTypes',
        'email', 'website', 'gstNumber', 'registrationNumber',
        'workingHours', 'branding'
    ];
    const safeUpdate = {};
    allowed.forEach(k => { if (data[k] !== undefined)
        safeUpdate[k] = data[k]; });
    if (typeof data.email === 'string')
        safeUpdate.email = data.email.trim().toLowerCase();
    if (typeof data.gstNumber === 'string')
        safeUpdate.gstNumber = data.gstNumber.trim().toUpperCase();
    if (typeof data.registrationNumber === 'string')
        safeUpdate.registrationNumber = data.registrationNumber.trim().toUpperCase();
    if (data.images !== undefined) {
        const incomingImages = (0, BusinessUtils_1.toStringArray)(data.images);
        safeUpdate.images = (0, BusinessUtils_1.toImageUrls)(await (0, imageProcessor_1.processImages)(incomingImages, `businesses/${id}`));
        if (incomingImages.length > 0 && (!Array.isArray(safeUpdate.images) || safeUpdate.images.length === 0)) {
            throw new AppError_1.AppError('Business image upload failed. Please retry.', 502);
        }
    }
    if (data.documents !== undefined) {
        safeUpdate.documents = await (0, BusinessUtils_1.normalizeDocuments)(data.documents, id, businessView.documents);
    }
    if (data.mobile) {
        safeUpdate.mobile = data.mobile;
    }
    const criticalFields = ['name', 'mobile', 'location', 'gstNumber', 'registrationNumber', 'documents'];
    const hasCriticalUpdates = criticalFields.some(f => data[f] !== undefined);
    if (hasCriticalUpdates) {
        safeUpdate.status = businessStatus_1.BUSINESS_STATUS.PENDING;
        safeUpdate.isVerified = false;
    }
    if (data.location) {
        const currentLoc = businessView.location || {};
        const normalizedLocation = await (0, LocationNormalizer_1.normalizeLocation)({
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
        const resolvedLocationPayload = (0, BusinessUtils_1.buildBusinessLocationPayload)({
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
    const session = await (0, db_1.getUserConnection)().startSession();
    let updatedBusiness = null;
    try {
        await session.withTransaction(async () => {
            updatedBusiness = await Business_1.default.findByIdAndUpdate(id, safeUpdate, { new: true, session });
        });
    }
    finally {
        await session.endSession();
    }
    setImmediate(() => {
        const cleanupTasks = [];
        if (safeUpdate.images)
            cleanupTasks.push((0, BusinessUtils_1.cleanupRemovedS3Objects)(businessView.images, safeUpdate.images));
        if (safeUpdate.documents)
            cleanupTasks.push((0, BusinessUtils_1.cleanupRemovedS3Objects)(businessView.documents, safeUpdate.documents));
        Promise.all(cleanupTasks).catch((err) => {
            logger_1.default.error('Business update: S3 cleanup failed', { error: String(err) });
        });
    });
    return updatedBusiness;
};
exports.updateBusinessById = updateBusinessById;
const getBusinessListings = async (sellerId, listingType) => {
    const listings = await Ad_1.default.find({
        sellerId: sellerId,
        listingType: listingType,
        status: listingStatus_1.LISTING_STATUS.LIVE,
        isDeleted: { $ne: true },
    }).sort({ createdAt: -1 }).lean();
    return listings.map((l) => (0, AdQueryHelpers_1.normalizeAdImagesForResponse)(l));
};
exports.getBusinessListings = getBusinessListings;
const getBusinessStats = async (userId) => {
    const [totalServices, approvedServices, pendingServices] = await Promise.all([
        Ad_1.default.countDocuments({ sellerId: userId, listingType: 'service' }),
        Ad_1.default.countDocuments({ sellerId: userId, listingType: 'service', status: listingStatus_1.LISTING_STATUS.LIVE }),
        Ad_1.default.countDocuments({ sellerId: userId, listingType: 'service', status: listingStatus_1.LISTING_STATUS.PENDING }),
    ]);
    return { totalServices, approvedServices, pendingServices, views: 0 };
};
exports.getBusinessStats = getBusinessStats;
const NOT_DELETED = { isDeleted: { $ne: true } };
const findBusinessByIdentifier = async (identifier) => {
    if (mongoose_1.default.Types.ObjectId.isValid(identifier)) {
        return Business_1.default.findOne({ _id: identifier, ...NOT_DELETED });
    }
    const bySlug = await Business_1.default.findOne({ slug: identifier, ...NOT_DELETED });
    if (bySlug)
        return bySlug;
    const suffixMatch = identifier.match(/-([0-9a-fA-F]{24})$/);
    const extractedId = suffixMatch?.[1];
    if (extractedId && mongoose_1.default.Types.ObjectId.isValid(extractedId)) {
        return Business_1.default.findOne({ _id: extractedId, ...NOT_DELETED });
    }
    return null;
};
exports.findBusinessByIdentifier = findBusinessByIdentifier;
const getBusinessByUserIdLean = async (userId) => {
    return Business_1.default.findOne({ userId }).lean();
};
exports.getBusinessByUserIdLean = getBusinessByUserIdLean;
const softDeleteBusinessesByUserId = async (userId) => {
    return Business_1.default.updateMany({ userId, isDeleted: { $ne: true } }, { $set: { isDeleted: true, deletedAt: new Date() } });
};
exports.softDeleteBusinessesByUserId = softDeleteBusinessesByUserId;
//# sourceMappingURL=BusinessCoreService.js.map