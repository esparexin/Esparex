"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceMutation = exports.createServiceMutation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const listingType_1 = require("@core/constants/enums/listingType");
const adStatus_1 = require("@core/constants/enums/adStatus");
const serviceStatus_1 = require("@core/constants/enums/serviceStatus");
const actor_1 = require("@core/constants/enums/actor");
const resolveCategoryId_1 = require("@shared/utils/resolveCategoryId");
const AppError_1 = require("@core/utils/AppError");
const logger_1 = __importDefault(require("@core/utils/logger"));
const businessStatus_1 = require("@core/utils/businessStatus");
const masterDataResolver_1 = require("@core/utils/masterDataResolver");
const serviceTypeResolver_1 = require("@core/utils/serviceTypeResolver");
const serviceQuality_1 = require("@core/utils/serviceQuality");
const immutableFieldErrors_1 = require("@core/utils/immutableFieldErrors");
const StatusMutationService_1 = require("../StatusMutationService");
const ListingMutationService_1 = require("../ListingMutationService");
const AdOrchestrator = __importStar(require("@core/services/AdOrchestrator"));
const ServiceMutationRepository_1 = require("./ServiceMutationRepository");
const CatalogValidationService_1 = require("../catalog/CatalogValidationService");
const SERVICE_ALLOWED_FIELDS = [
    'title',
    'description',
    // NOTE: `price` is normalized into `priceMin` before field picking.
    'images',
    'serviceTypeIds',
    'deviceType',
    'priceMin',
];
const SERVICE_EDIT_LOCK_MESSAGES = {
    categoryId: 'Category cannot be changed while editing a service.',
    brandId: 'Brand cannot be changed while editing a service.',
    modelId: 'Model cannot be changed while editing a service.',
    deviceType: 'Device type cannot be changed while editing a service.',
    deviceModel: 'Device model cannot be changed while editing a service.',
    location: 'Location is fixed to the business profile for services.',
    locationId: 'Location is fixed to the business profile for services.',
    listingType: 'Listing type cannot be changed while editing a service.',
    sellerId: 'Seller cannot be changed while editing a service.',
    businessId: 'Business cannot be changed while editing a service.',
    status: 'Status cannot be changed while editing a service.',
    moderationStatus: 'Moderation status cannot be changed while editing a service.',
    approvedAt: 'Approval metadata cannot be changed while editing a service.',
    approvedBy: 'Approval metadata cannot be changed while editing a service.',
    isDeleted: 'Deletion state cannot be changed while editing a service.',
    deletedAt: 'Deletion state cannot be changed while editing a service.',
    expiresAt: 'Expiry cannot be changed while editing a service.',
};
const pickAllowedFields = (body, allowedFields, options = {}) => {
    const picked = {};
    const allowUndefined = options.allowUndefined !== false;
    allowedFields.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(body, key)
            && (allowUndefined || body[key] !== undefined)) {
            picked[key] = body[key];
        }
    });
    return picked;
};
const buildFieldDetails = (field, message) => [{ field, message }];
const throwFieldValidationError = (message, field, code = 'VALIDATION_ERROR') => {
    throw new AppError_1.AppError(message, 400, code, buildFieldDetails(field, message));
};
const rejectLegacyServiceTypesAlias = (body) => {
    if (Object.prototype.hasOwnProperty.call(body, 'serviceTypes')) {
        throwFieldValidationError('serviceTypes is no longer supported; use serviceTypeIds instead', 'serviceTypes', 'LEGACY_SERVICE_TYPES_ALIAS');
    }
};
const toIdString = (value) => {
    if (!value)
        return undefined;
    if (typeof value === 'string')
        return value;
    if (typeof value.toString === 'function') {
        const asString = value.toString();
        return asString.length > 0 ? asString : undefined;
    }
    return undefined;
};
const normalizeObjectId = (value) => {
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value;
    if (typeof value !== 'string' || !mongoose_1.default.Types.ObjectId.isValid(value))
        return undefined;
    return new mongoose_1.default.Types.ObjectId(value);
};
const extractBusinessLocationId = (business) => {
    const rawBusinessLocationId = business.locationId
        || (typeof business.location === 'object' && business.location
            ? business.location.locationId
            : undefined);
    return normalizeObjectId(rawBusinessLocationId);
};
const resolveTaxonomyIds = async (body, opts = {}) => {
    const resolvedCategory = (0, resolveCategoryId_1.resolveCategoryId)(body.categoryId || body.category);
    const modelField = opts.includeDeviceModel
        ? (body.modelId || body.model || body.deviceModel)
        : (body.modelId || body.model);
    const resIds = await (0, masterDataResolver_1.resolveMasterDataIds)({
        category: resolvedCategory,
        brand: (body.brandId || body.brand),
        model: modelField,
    });
    const categoryId = normalizeObjectId(body.categoryId) || resIds.categoryId;
    const brandId = normalizeObjectId(body.brandId) || resIds.brandId;
    const modelId = normalizeObjectId(body.modelId) || resIds.modelId;
    return { categoryId, brandId, modelId };
};
const resolveRequiredServiceTypes = async ({ rawServiceTypes, categoryId, route, serviceId, useTypedFieldErrors, }) => {
    const resolvedServiceTypes = await (0, serviceTypeResolver_1.resolveServiceTypes)(rawServiceTypes, categoryId);
    const selectionMode = await (0, CatalogValidationService_1.getCategorySelectionMode)(categoryId);
    if (selectionMode === 'single' && resolvedServiceTypes.serviceTypeIds.length > 1) {
        logger_1.default.warn('Selection mode violation in service mutation', {
            route,
            serviceId,
            categoryId,
            selectionMode,
            selectedCount: resolvedServiceTypes.serviceTypeIds.length,
        });
        if (useTypedFieldErrors) {
            throwFieldValidationError('This category only allows selecting a single service type', 'serviceTypeIds', 'SERVICE_TYPE_SELECTION_MODE');
        }
        throw new AppError_1.AppError('This category only allows selecting a single service type', 400);
    }
    if (resolvedServiceTypes.serviceTypeIds.length === 0) {
        logger_1.default.warn('No service types resolved in service mutation', {
            route,
            serviceId,
            categoryId,
            rawTypes: rawServiceTypes,
        });
        if (useTypedFieldErrors) {
            throwFieldValidationError('At least one valid service type is required for this category', 'serviceTypeIds', 'SERVICE_TYPE_REQUIRED');
        }
        throw new AppError_1.AppError('At least one valid service type is required for this category', 400);
    }
    return resolvedServiceTypes;
};
const validateServiceBrandCategoryIntegrity = async (categoryId, brandId) => {
    if (!brandId || brandId.toString() === 'all')
        return;
    const validation = await (0, CatalogValidationService_1.validateBrandBelongsToCategory)(brandId.toString(), categoryId.toString());
    if (!validation.ok) {
        const message = validation.reason || 'Brand does not belong to the selected category';
        throw new AppError_1.AppError(message, 400, 'INVALID_BRAND_CATEGORY_COMBO', buildFieldDetails('brandId', message));
    }
};
const processServiceImages = async (images, folderTarget) => ListingMutationService_1.ListingMutationService.processIncomingImages({
    images,
    s3FolderTarget: folderTarget,
});
const createServiceMutation = async ({ user, business, body, }) => {
    if (typeof body.price === 'number' && body.priceMin === undefined) {
        body.priceMin = body.price;
    }
    rejectLegacyServiceTypesAlias(body);
    const safeBody = pickAllowedFields(body, SERVICE_ALLOWED_FIELDS, { allowUndefined: true });
    const createServiceTypeTokens = safeBody.serviceTypeIds;
    const { categoryId: resolvedCategoryId, brandId, modelId } = await resolveTaxonomyIds(body, { includeDeviceModel: true });
    if (!user?._id || !business || !(0, businessStatus_1.isBusinessPublishedStatus)(business.status)) {
        throw new AppError_1.AppError('Approved Business Account Required', 403, 'BUSINESS_APPROVAL_REQUIRED');
    }
    if (!resolvedCategoryId) {
        throwFieldValidationError('Valid category is required', 'categoryId', 'CATEGORY_REQUIRED');
    }
    const categoryId = resolvedCategoryId;
    const catCapability = await (0, CatalogValidationService_1.validateServiceCategoryCapability)(categoryId.toString());
    if (!catCapability.ok) {
        throwFieldValidationError(catCapability.reason || 'Category does not support services', 'categoryId', 'SERVICE_CATEGORY_UNSUPPORTED');
    }
    const resolvedServiceTypes = await resolveRequiredServiceTypes({
        rawServiceTypes: createServiceTypeTokens,
        categoryId,
        route: 'createService',
        useTypedFieldErrors: true,
    });
    const locId = extractBusinessLocationId(business);
    if (!locId) {
        throwFieldValidationError('Complete your business profile location before posting a service.', 'location', 'BUSINESS_LOCATION_REQUIRED');
    }
    await validateServiceBrandCategoryIntegrity(categoryId, brandId);
    return AdOrchestrator.createAd({
        ...body,
        listingType: listingType_1.LISTING_TYPE.SERVICE,
        serviceTypeIds: resolvedServiceTypes.serviceTypeIds,
        categoryId,
        brandId,
        modelId,
        location: {
            locationId: locId,
        },
        sellerType: 'business',
        businessId: business._id,
        price: safeBody.priceMin || 0,
        title: safeBody.title,
        description: safeBody.description,
        images: safeBody.images,
        attributes: {
            ...safeBody,
        },
        business, // Pass business for quality scoring in preparePayload
    }, {
        actor: user.role === 'admin' ? 'ADMIN' : 'USER',
        authUserId: user._id.toString(),
        sellerId: user._id.toString(),
        // Note: ip and deviceFingerprint are not available in this service, 
        // but can be added to context if passed from controller.
    });
};
exports.createServiceMutation = createServiceMutation;
const updateServiceMutation = async ({ serviceId, user, business, body, }) => {
    if (!user?._id) {
        throw new AppError_1.AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(serviceId)) {
        throw new AppError_1.AppError('Invalid Service ID', 400, 'INVALID_SERVICE_ID');
    }
    const existingService = await (0, ServiceMutationRepository_1.findServiceForUpdate)(serviceId, user._id, business?._id, listingType_1.LISTING_TYPE.SERVICE);
    if (!existingService) {
        throw new AppError_1.AppError('Service not found or unauthorized', 404, 'SERVICE_NOT_FOUND');
    }
    const lockErrors = (0, immutableFieldErrors_1.collectImmutableFieldErrors)(body, SERVICE_EDIT_LOCK_MESSAGES);
    if (lockErrors.length > 0) {
        throw new AppError_1.AppError('Validation failed', 400, 'LOCKED_FIELDS', lockErrors);
    }
    if (typeof body.price === 'number' && body.priceMin === undefined) {
        body.priceMin = body.price;
    }
    rejectLegacyServiceTypesAlias(body);
    const updates = pickAllowedFields(body, [...SERVICE_ALLOWED_FIELDS, 'deviceModel'], { allowUndefined: false });
    if (updates.serviceTypeIds !== undefined) {
        const updateServiceTypeTokens = body.serviceTypeIds;
        const resolvedServiceTypes = await resolveRequiredServiceTypes({
            rawServiceTypes: updateServiceTypeTokens,
            categoryId: existingService.categoryId,
            route: 'updateService',
            serviceId,
            useTypedFieldErrors: false,
        });
        updates.serviceTypeIds = resolvedServiceTypes.serviceTypeIds;
    }
    const finalCategoryId = toIdString(existingService.categoryId);
    const finalBrandId = toIdString(existingService.brandId);
    if (finalCategoryId && finalBrandId && finalBrandId !== 'all') {
        const capValidation = await (0, CatalogValidationService_1.validateServiceCategoryCapability)(finalCategoryId);
        if (!capValidation.ok) {
            throw new AppError_1.AppError(capValidation.reason || 'Category does not support services', 400);
        }
        const validation = await (0, CatalogValidationService_1.validateBrandBelongsToCategory)(finalBrandId, finalCategoryId);
        if (!validation.ok) {
            const message = validation.reason || 'Brand does not belong to the selected category';
            throw new AppError_1.AppError(message, 400, 'INVALID_BRAND_CATEGORY_COMBO', buildFieldDetails('brandId', message));
        }
    }
    if (updates.images !== undefined) {
        updates.images = await processServiceImages(updates.images, `services/${serviceId}`);
    }
    const mergedForQuality = { ...existingService, ...updates };
    updates.listingQualityScore = (0, serviceQuality_1.calculateServiceQuality)(mergedForQuality, business);
    if (updates.priceMin !== undefined) {
        updates.price = updates.priceMin;
    }
    const service = await (0, ServiceMutationRepository_1.updateServiceByOwner)(serviceId, user._id, business?._id, listingType_1.LISTING_TYPE.SERVICE, updates);
    if (!service) {
        throw new AppError_1.AppError('Service not found or unauthorized', 404, 'SERVICE_NOT_FOUND');
    }
    await ListingMutationService_1.ListingMutationService.cleanupRemovedImages(existingService.images, updates.images, serviceId);
    const prevStatus = existingService.status;
    if (prevStatus === adStatus_1.AD_STATUS.LIVE || prevStatus === serviceStatus_1.SERVICE_STATUS.REJECTED) {
        try {
            return await (0, StatusMutationService_1.mutateStatus)({
                domain: 'service',
                entityId: serviceId,
                toStatus: serviceStatus_1.SERVICE_STATUS.PENDING,
                actor: { type: actor_1.ACTOR_TYPE.USER, id: user._id.toString() },
                reason: 'Seller edited service — re-review required',
            });
        }
        catch (statusError) {
            logger_1.default.error('Service status transition failed after update', {
                serviceId,
                error: statusError instanceof Error ? statusError.message : String(statusError),
            });
        }
    }
    return service;
};
exports.updateServiceMutation = updateServiceMutation;
//# sourceMappingURL=ServiceMutationService.js.map