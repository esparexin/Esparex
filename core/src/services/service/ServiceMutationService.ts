import mongoose from 'mongoose';
import { LISTING_TYPE } from '../../constants/enums/listingType';
import { LISTING_STATUS } from "../../constants/enums/listingStatus";
import { SERVICE_STATUS } from '../../constants/enums/serviceStatus';
import { ACTOR_TYPE } from '../../constants/enums/actor';
import { resolveCategoryId } from "@esparex/shared";
import type { IBusiness } from '../../models/Business';
import type { IAuthUser } from '../../types/auth';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import { isBusinessPublishedStatus } from '../../utils/businessStatus';
import { resolveMasterDataIds } from '../../utils/masterDataResolver';
import { resolveServiceTypes } from '../../utils/serviceTypeResolver';
import { calculateServiceQuality } from '../../utils/serviceQuality';
import { collectImmutableFieldErrors } from '../../utils/immutableFieldErrors';
import { mutateStatus } from '../StatusMutationService';
import { ListingMutationService } from '../ListingMutationService';
import * as AdOrchestrator from '../AdOrchestrator';
import {
    findServiceForUpdate,
    updateServiceByOwner,
} from './ServiceMutationRepository';
import {
    getCategorySelectionMode,
    validateBrandBelongsToCategory,
    validateServiceCategoryCapability,
} from '../catalog/CatalogValidationService';

const SERVICE_ALLOWED_FIELDS = [
    'title',
    'description',
    // NOTE: `price` is normalized into `priceMin` before field picking.
    'images',
    'serviceTypeIds',
    'deviceType',
    'priceMin',
] as const;

const SERVICE_EDIT_LOCK_MESSAGES: Record<string, string> = {
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

type ServiceMutationBody = Record<string, unknown>;

export type ServiceBusinessContext = Pick<IBusiness, '_id' | 'status' | 'locationId' | 'location'> & Record<string, unknown>;

const pickAllowedFields = (
    body: ServiceMutationBody,
    allowedFields: readonly string[],
    options: { allowUndefined?: boolean } = {}
): Record<string, unknown> => {
    const picked: Record<string, unknown> = {};
    const allowUndefined = options.allowUndefined !== false;
    allowedFields.forEach((key) => {
        if (
            Object.prototype.hasOwnProperty.call(body, key)
            && (allowUndefined || body[key] !== undefined)
        ) {
            picked[key] = body[key];
        }
    });
    return picked;
};

const buildFieldDetails = (field: string, message: string) => [{ field, message }];

const throwFieldValidationError = (
    message: string,
    field: string,
    code = 'VALIDATION_ERROR'
): never => {
    throw new AppError(message, 400, code, buildFieldDetails(field, message));
};

const rejectLegacyServiceTypesAlias = (body: ServiceMutationBody): void => {
    if (Object.prototype.hasOwnProperty.call(body, 'serviceTypes')) {
        throwFieldValidationError(
            'serviceTypes is no longer supported; use serviceTypeIds instead',
            'serviceTypes',
            'LEGACY_SERVICE_TYPES_ALIAS'
        );
    }
};

const toIdString = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof (value as { toString?: () => string }).toString === 'function') {
        const asString = (value as { toString: () => string }).toString();
        return asString.length > 0 ? asString : undefined;
    }
    return undefined;
};

const normalizeObjectId = (value: unknown): mongoose.Types.ObjectId | undefined => {
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) return undefined;
    return new mongoose.Types.ObjectId(value);
};

const extractBusinessLocationId = (business: ServiceBusinessContext): mongoose.Types.ObjectId | undefined => {
    const rawBusinessLocationId =
        business.locationId
        || (typeof business.location === 'object' && business.location
            ? (business.location as { locationId?: unknown }).locationId
            : undefined);

    return normalizeObjectId(rawBusinessLocationId);
};

const resolveTaxonomyIds = async (
    body: ServiceMutationBody,
    opts: { includeDeviceModel?: boolean } = {}
) => {
    const resolvedCategory = resolveCategoryId(body.categoryId || body.category);
    const modelField = opts.includeDeviceModel
        ? (body.modelId || body.model || body.deviceModel) as string
        : (body.modelId || body.model) as string;
    const resIds = await resolveMasterDataIds({
        category: resolvedCategory,
        brand: (body.brandId || body.brand) as string,
        model: modelField,
    });

    const categoryId = normalizeObjectId(body.categoryId) || resIds.categoryId;
    const brandId = normalizeObjectId(body.brandId) || resIds.brandId;
    const modelId = normalizeObjectId(body.modelId) || resIds.modelId;

    return { categoryId, brandId, modelId };
};

const resolveRequiredServiceTypes = async ({
    rawServiceTypes,
    categoryId,
    route,
    serviceId,
    useTypedFieldErrors,
}: {
    rawServiceTypes: unknown;
    categoryId: unknown;
    route: 'createService' | 'updateService';
    serviceId?: string;
    useTypedFieldErrors: boolean;
}) => {
    const resolvedServiceTypes = await resolveServiceTypes(rawServiceTypes, categoryId);
    const selectionMode = await getCategorySelectionMode(categoryId);

    if (selectionMode === 'single' && resolvedServiceTypes.serviceTypeIds.length > 1) {
        logger.warn('Selection mode violation in service mutation', {
            route,
            serviceId,
            categoryId,
            selectionMode,
            selectedCount: resolvedServiceTypes.serviceTypeIds.length,
        });

        if (useTypedFieldErrors) {
            throwFieldValidationError(
                'This category only allows selecting a single service type',
                'serviceTypeIds',
                'SERVICE_TYPE_SELECTION_MODE'
            );
        }

        throw new AppError('This category only allows selecting a single service type', 400);
    }

    if (resolvedServiceTypes.serviceTypeIds.length === 0) {
        logger.warn('No service types resolved in service mutation', {
            route,
            serviceId,
            categoryId,
            rawTypes: rawServiceTypes,
        });

        if (useTypedFieldErrors) {
            throwFieldValidationError(
                'At least one valid service type is required for this category',
                'serviceTypeIds',
                'SERVICE_TYPE_REQUIRED'
            );
        }

        throw new AppError('At least one valid service type is required for this category', 400);
    }

    return resolvedServiceTypes;
};

const validateServiceBrandCategoryIntegrity = async (
    categoryId: mongoose.Types.ObjectId,
    brandId?: mongoose.Types.ObjectId
) => {
    if (!brandId || brandId.toString() === 'all') return;

    const validation = await validateBrandBelongsToCategory(
        brandId.toString(),
        categoryId.toString()
    );

    if (!validation.ok) {
        const message = validation.reason || 'Brand does not belong to the selected category';
        throw new AppError(message, 400, 'INVALID_BRAND_CATEGORY_COMBO', buildFieldDetails('brandId', message));
    }
};

const processServiceImages = async (images: unknown, folderTarget: string) =>
    ListingMutationService.processIncomingImages({
        images,
        s3FolderTarget: folderTarget,
    });

export const createServiceMutation = async ({
    user,
    business,
    body,
}: {
    user?: IAuthUser;
    business?: ServiceBusinessContext;
    body: ServiceMutationBody;
}) => {
    if (typeof body.price === 'number' && body.priceMin === undefined) {
        body.priceMin = body.price;
    }
    rejectLegacyServiceTypesAlias(body);

    const safeBody = pickAllowedFields(body, SERVICE_ALLOWED_FIELDS, { allowUndefined: true });
    const createServiceTypeTokens = safeBody.serviceTypeIds;

    const { categoryId: resolvedCategoryId, brandId, modelId } = await resolveTaxonomyIds(body, { includeDeviceModel: true });

    if (!user?._id || !business || !isBusinessPublishedStatus(business.status)) {
        throw new AppError('Approved Business Account Required', 403, 'BUSINESS_APPROVAL_REQUIRED');
    }

    if (!resolvedCategoryId) {
        throwFieldValidationError('Valid category is required', 'categoryId', 'CATEGORY_REQUIRED');
    }

    const categoryId = resolvedCategoryId!;

    const catCapability = await validateServiceCategoryCapability(categoryId.toString());
    if (!catCapability.ok) {
        throwFieldValidationError(
            catCapability.reason || 'Category does not support services',
            'categoryId',
            'SERVICE_CATEGORY_UNSUPPORTED'
        );
    }

    const resolvedServiceTypes = await resolveRequiredServiceTypes({
        rawServiceTypes: createServiceTypeTokens,
        categoryId,
        route: 'createService',
        useTypedFieldErrors: true,
    });

    const locId = extractBusinessLocationId(business);
    if (!locId) {
        throwFieldValidationError(
            'Complete your business profile location before posting a service.',
            'location',
            'BUSINESS_LOCATION_REQUIRED'
        );
    }

    await validateServiceBrandCategoryIntegrity(categoryId, brandId);

    return AdOrchestrator.createAd(
        {
            ...body,
            listingType: LISTING_TYPE.SERVICE,
            serviceTypeIds: resolvedServiceTypes.serviceTypeIds,
            categoryId,
            brandId,
            modelId,
            location: {
                locationId: locId,
            },
            sellerType: 'business' as const,
            businessId: business._id,
            price: (safeBody.priceMin) || 0,
            title: safeBody.title,
            description: safeBody.description,
            images: safeBody.images,
            attributes: {
                ...safeBody,
            },
            business, // Pass business for quality scoring in preparePayload
        },
        {
            actor: user.role === 'admin' ? 'ADMIN' : 'USER',
            authUserId: user._id.toString(),
            sellerId: user._id.toString(),
            // Note: ip and deviceFingerprint are not available in this service, 
            // but can be added to context if passed from controller.
        }
    );
};

export const updateServiceMutation = async ({
    serviceId,
    user,
    business,
    body,
}: {
    serviceId: string;
    user?: IAuthUser;
    business?: ServiceBusinessContext;
    body: ServiceMutationBody;
}) => {
    if (!user?._id) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new AppError('Invalid Service ID', 400, 'INVALID_SERVICE_ID');
    }

    const existingService = await findServiceForUpdate(
        serviceId,
        user._id,
        business?._id,
        LISTING_TYPE.SERVICE
    );

    if (!existingService) {
        throw new AppError('Service not found or unauthorized', 404, 'SERVICE_NOT_FOUND');
    }

    const lockErrors = collectImmutableFieldErrors(body, SERVICE_EDIT_LOCK_MESSAGES);
    if (lockErrors.length > 0) {
        throw new AppError('Validation failed', 400, 'LOCKED_FIELDS', lockErrors);
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
        const capValidation = await validateServiceCategoryCapability(finalCategoryId);
        if (!capValidation.ok) {
            throw new AppError(capValidation.reason || 'Category does not support services', 400);
        }

        const validation = await validateBrandBelongsToCategory(finalBrandId, finalCategoryId);
        if (!validation.ok) {
            const message = validation.reason || 'Brand does not belong to the selected category';
            throw new AppError(message, 400, 'INVALID_BRAND_CATEGORY_COMBO', buildFieldDetails('brandId', message));
        }
    }

    if (updates.images !== undefined) {
        updates.images = await processServiceImages(updates.images, `services/${serviceId}`);
    }

    const mergedForQuality = { ...existingService, ...updates };
    updates.listingQualityScore = calculateServiceQuality(
        mergedForQuality,
        business
    );

    if (updates.priceMin !== undefined) {
        updates.price = updates.priceMin;
    }

    const service = await updateServiceByOwner(
        serviceId,
        user._id,
        business?._id,
        LISTING_TYPE.SERVICE,
        updates
    );

    if (!service) {
        throw new AppError('Service not found or unauthorized', 404, 'SERVICE_NOT_FOUND');
    }

    await ListingMutationService.cleanupRemovedImages(
        existingService.images,
        updates.images,
        serviceId
    );

    const prevStatus = existingService.status;
    if (prevStatus === LISTING_STATUS.LIVE || prevStatus === SERVICE_STATUS.REJECTED) {
        try {
            return await mutateStatus({
                domain: 'service',
                entityId: serviceId,
                toStatus: SERVICE_STATUS.PENDING,
                actor: { type: ACTOR_TYPE.USER, id: user._id.toString() },
                reason: 'Seller edited service — re-review required',
            });
        } catch (statusError) {
            logger.error('Service status transition failed after update', {
                serviceId,
                error: statusError instanceof Error ? statusError.message : String(statusError),
            });
        }
    }

    return service;
};
